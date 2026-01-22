/**
 * MCP Server Endpoint Handler
 *
 * This endpoint serves MCP prompts via signed URL tokens, implementing the MCP protocol.
 * URL: /annote/mcp/{token}
 *
 * GET - Returns MCP server manifest
 * POST - Handles MCP JSON-RPC requests (initialize, prompts/list, prompts/get)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMcpPromptByAccessToken, incrementAccessCount } from '@/lib/db/queries/mcpPrompts';
import { checkRateLimit } from '@/lib/rateLimit';

interface RouteParams {
  params: Promise<{ token: string }>;
}

// MCP Protocol version
const MCP_PROTOCOL_VERSION = '2024-11-05';
const MCP_SERVER_VERSION = '1.0.0';

/**
 * CORS headers for cross-origin requests
 */
function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

/**
 * GET /annote/mcp/[token] - Returns MCP server manifest
 *
 * Looks up mcp_prompts by access_token where deployment_status = 'deployed' and is_deleted = false
 * Returns JSON manifest with server info and capabilities
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { token } = await params;

    // Validate token format (64 character hex string)
    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Rate limiting
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor?.split(',')[0]?.trim() || 'unknown';
    const rateLimitKey = `mcp:${clientIp}:${token}`;

    const rateLimit = checkRateLimit(rateLimitKey, { windowMs: 60000, maxRequests: 100 });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: {
            ...corsHeaders(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimit.resetTime),
            'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
          }
        }
      );
    }

    // Look up the MCP prompt by access token
    const mcpPrompt = await getMcpPromptByAccessToken(token);

    if (!mcpPrompt) {
      return NextResponse.json(
        { error: 'MCP prompt not found or not deployed' },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Return MCP server manifest
    const manifest = {
      name: mcpPrompt.namespace,
      version: MCP_SERVER_VERSION,
      description: mcpPrompt.description || `MCP prompt: ${mcpPrompt.title}`,
      protocol_version: MCP_PROTOCOL_VERSION,
      capabilities: {
        prompts: {
          listChanged: false,
        },
      },
    };

    return NextResponse.json(manifest, {
      headers: {
        ...corsHeaders(),
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-RateLimit-Reset': String(rateLimit.resetTime),
      }
    });
  } catch (error) {
    console.error('[MCP] GET /annote/mcp/[token] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

/**
 * JSON-RPC error codes (per MCP protocol)
 */
const JSON_RPC_ERRORS = {
  PARSE_ERROR: { code: -32700, message: 'Parse error' },
  INVALID_REQUEST: { code: -32600, message: 'Invalid Request' },
  METHOD_NOT_FOUND: { code: -32601, message: 'Method not found' },
  INVALID_PARAMS: { code: -32602, message: 'Invalid params' },
  INTERNAL_ERROR: { code: -32603, message: 'Internal error' },
};

/**
 * Create a JSON-RPC error response
 */
function jsonRpcError(
  id: string | number | null,
  error: { code: number; message: string; data?: unknown },
  rateLimit?: { remaining: number; resetTime: number } | null
): NextResponse {
  const headers: HeadersInit = rateLimit
    ? {
        ...corsHeaders(),
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-RateLimit-Reset': String(rateLimit.resetTime),
      }
    : corsHeaders();

  return NextResponse.json({
    jsonrpc: '2.0',
    id,
    error,
  }, { headers });
}

/**
 * Create a JSON-RPC success response
 */
function jsonRpcSuccess(
  id: string | number | null,
  result: unknown,
  rateLimit?: { remaining: number; resetTime: number } | null
): NextResponse {
  const headers: HeadersInit = rateLimit
    ? {
        ...corsHeaders(),
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-RateLimit-Reset': String(rateLimit.resetTime),
      }
    : corsHeaders();

  return NextResponse.json({
    jsonrpc: '2.0',
    id,
    result,
  }, { headers });
}

/**
 * POST /annote/mcp/[token] - Handles MCP JSON-RPC requests
 *
 * Supported methods:
 * - initialize: Returns protocol info and capabilities
 * - prompts/list: Returns list with single prompt
 * - prompts/get: Returns prompt content as messages array
 * - notifications/initialized: Returns 204 (no content)
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  let rateLimit: { allowed: boolean; remaining: number; resetTime: number } | null = null;

  try {
    const { token } = await params;

    // Validate token format (64 character hex string)
    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Rate limiting
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor?.split(',')[0]?.trim() || 'unknown';
    const rateLimitKey = `mcp:${clientIp}:${token}`;

    rateLimit = checkRateLimit(rateLimitKey, { windowMs: 60000, maxRequests: 100 });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: {
            ...corsHeaders(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimit.resetTime),
            'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
          }
        }
      );
    }

    // Look up the MCP prompt by access token
    const mcpPrompt = await getMcpPromptByAccessToken(token);

    if (!mcpPrompt) {
      return NextResponse.json(
        { error: 'MCP prompt not found or not deployed' },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Track access (fire and forget)
    incrementAccessCount(mcpPrompt.id).catch(err =>
      console.error('[MCP] Failed to increment access count:', err)
    );

    // Parse JSON-RPC request body
    let body: {
      jsonrpc?: string;
      id?: string | number | null;
      method?: string;
      params?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return jsonRpcError(null, JSON_RPC_ERRORS.PARSE_ERROR, rateLimit);
    }

    // Validate JSON-RPC structure
    if (!body || body.jsonrpc !== '2.0' || typeof body.method !== 'string') {
      return jsonRpcError(body?.id ?? null, JSON_RPC_ERRORS.INVALID_REQUEST, rateLimit);
    }

    const { id, method } = body;

    // Handle different MCP methods
    switch (method) {
      case 'initialize':
        return jsonRpcSuccess(id ?? null, {
          protocolVersion: MCP_PROTOCOL_VERSION,
          serverInfo: {
            name: mcpPrompt.namespace,
            version: MCP_SERVER_VERSION,
          },
          capabilities: {
            prompts: {
              listChanged: false,
            },
          },
        }, rateLimit);

      case 'prompts/list':
        return jsonRpcSuccess(id ?? null, {
          prompts: [
            {
              name: mcpPrompt.namespace,
              description: mcpPrompt.description || `MCP prompt: ${mcpPrompt.title}`,
              arguments: [],
            },
          ],
        }, rateLimit);

      case 'prompts/get': {
        // Validate params - should have name matching the namespace
        const requestParams = body.params as { name?: string } | undefined;

        // If name is provided, validate it matches the namespace
        if (requestParams?.name && requestParams.name !== mcpPrompt.namespace) {
          return jsonRpcError(id ?? null, {
            ...JSON_RPC_ERRORS.INVALID_PARAMS,
            data: { message: `Prompt '${requestParams.name}' not found` },
          }, rateLimit);
        }

        return jsonRpcSuccess(id ?? null, {
          description: mcpPrompt.description || `MCP prompt: ${mcpPrompt.title}`,
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: mcpPrompt.content,
              },
            },
          ],
        }, rateLimit);
      }

      case 'notifications/initialized':
        // Notification - no response needed, return 204
        return new NextResponse(null, {
          status: 204,
          headers: rateLimit
            ? {
                ...corsHeaders(),
                'X-RateLimit-Remaining': String(rateLimit.remaining),
                'X-RateLimit-Reset': String(rateLimit.resetTime),
              }
            : corsHeaders(),
        });

      default:
        return jsonRpcError(id ?? null, JSON_RPC_ERRORS.METHOD_NOT_FOUND, rateLimit);
    }
  } catch (error) {
    console.error('[MCP] POST /annote/mcp/[token] error:', error);
    return jsonRpcError(null, JSON_RPC_ERRORS.INTERNAL_ERROR, rateLimit);
  }
}
