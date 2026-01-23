/**
 * MCP Server Protocol Endpoint
 *
 * Implements the Model Context Protocol (MCP) JSON-RPC 2.0 server
 * for deployed MCP prompts. This endpoint is accessed via access token.
 *
 * Supported methods:
 * - initialize: Establish connection and exchange capabilities
 * - prompts/list: List available prompts from this MCP server
 * - prompts/get: Get a specific prompt by name
 *
 * Reference: https://modelcontextprotocol.io/specification/2025-06-18/server/prompts
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getMcpPromptByAccessToken,
  incrementAccessCount,
} from '@/lib/db/queries/mcpPrompts';

interface RouteParams {
  params: Promise<{ token: string }>;
}

// JSON-RPC 2.0 Types
interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// MCP Protocol Types
interface McpCapabilities {
  prompts?: {
    listChanged?: boolean;
  };
  resources?: Record<string, unknown>;
  tools?: Record<string, unknown>;
}

interface McpPromptDefinition {
  name: string;
  title?: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

interface McpMessage {
  role: 'user' | 'assistant';
  content: {
    type: 'text';
    text: string;
  };
}

// JSON-RPC Error Codes
const JSON_RPC_ERRORS = {
  PARSE_ERROR: { code: -32700, message: 'Parse error' },
  INVALID_REQUEST: { code: -32600, message: 'Invalid Request' },
  METHOD_NOT_FOUND: { code: -32601, message: 'Method not found' },
  INVALID_PARAMS: { code: -32602, message: 'Invalid params' },
  INTERNAL_ERROR: { code: -32603, message: 'Internal error' },
};

/**
 * Create a JSON-RPC success response
 */
function createResponse(id: string | number | null, result: unknown): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id,
    result,
  };
}

/**
 * Create a JSON-RPC error response
 */
function createErrorResponse(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown
): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id,
    error: { code, message, ...(data !== undefined && { data }) },
  };
}

/**
 * Handle initialize request
 * Establishes connection and exchanges capabilities
 */
function handleInitialize(
  id: string | number | null,
  params: Record<string, unknown> | undefined,
  mcpPrompt: { namespace: string; title: string }
): JsonRpcResponse {
  const clientProtocolVersion = params?.protocolVersion as string;

  // We support protocol version 2024-11-05 and later
  const serverCapabilities: McpCapabilities = {
    prompts: {
      listChanged: false, // We don't support dynamic prompt changes
    },
  };

  return createResponse(id, {
    protocolVersion: clientProtocolVersion || '2024-11-05',
    capabilities: serverCapabilities,
    serverInfo: {
      name: `expert-note-mcp-${mcpPrompt.namespace}`,
      version: '1.0.0',
    },
  });
}

/**
 * Handle prompts/list request
 * Returns the list of available prompts from this MCP server
 */
function handlePromptsList(
  id: string | number | null,
  mcpPrompt: { namespace: string; title: string; description: string | null; content: string }
): JsonRpcResponse {
  // Each MCP prompt in Expert Note represents a single prompt
  // The content is the prompt template
  const prompts: McpPromptDefinition[] = [
    {
      name: mcpPrompt.namespace,
      title: mcpPrompt.title,
      description: mcpPrompt.description || undefined,
      // No arguments for now - the prompt content is static
      arguments: [],
    },
  ];

  return createResponse(id, {
    prompts,
  });
}

/**
 * Handle prompts/get request
 * Returns the full prompt content for the requested prompt name
 */
function handlePromptsGet(
  id: string | number | null,
  params: Record<string, unknown> | undefined,
  mcpPrompt: { namespace: string; title: string; description: string | null; content: string }
): JsonRpcResponse {
  const promptName = params?.name as string;

  // Validate the prompt name matches our namespace
  if (promptName !== mcpPrompt.namespace) {
    return createErrorResponse(
      id,
      JSON_RPC_ERRORS.INVALID_PARAMS.code,
      `Prompt '${promptName}' not found`,
      { available: [mcpPrompt.namespace] }
    );
  }

  // Return the prompt content as a user message
  const messages: McpMessage[] = [
    {
      role: 'user',
      content: {
        type: 'text',
        text: mcpPrompt.content,
      },
    },
  ];

  return createResponse(id, {
    description: mcpPrompt.description || mcpPrompt.title,
    messages,
  });
}

/**
 * POST /api/mcp/server/[token]
 *
 * Main MCP server endpoint. Handles JSON-RPC 2.0 requests.
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { token } = await params;

  // Validate token and get MCP prompt
  const mcpPrompt = await getMcpPromptByAccessToken(token);
  if (!mcpPrompt) {
    return NextResponse.json(
      createErrorResponse(null, -32000, 'Invalid or inactive MCP server'),
      { status: 404 }
    );
  }

  // Track access
  await incrementAccessCount(mcpPrompt.id);

  // Parse JSON-RPC request
  let rpcRequest: JsonRpcRequest;
  try {
    const body = await request.text();
    rpcRequest = JSON.parse(body);
  } catch {
    return NextResponse.json(
      createErrorResponse(null, JSON_RPC_ERRORS.PARSE_ERROR.code, JSON_RPC_ERRORS.PARSE_ERROR.message),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Validate JSON-RPC structure
  if (rpcRequest.jsonrpc !== '2.0' || !rpcRequest.method) {
    return NextResponse.json(
      createErrorResponse(
        rpcRequest.id ?? null,
        JSON_RPC_ERRORS.INVALID_REQUEST.code,
        JSON_RPC_ERRORS.INVALID_REQUEST.message
      ),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const { id, method, params: rpcParams } = rpcRequest;
  const requestId = id ?? null;

  // Route to appropriate handler
  let response: JsonRpcResponse;
  switch (method) {
    case 'initialize':
      response = handleInitialize(requestId, rpcParams, mcpPrompt);
      break;

    case 'initialized':
      // This is a notification, no response needed but we'll acknowledge
      response = createResponse(requestId, {});
      break;

    case 'prompts/list':
      response = handlePromptsList(requestId, mcpPrompt);
      break;

    case 'prompts/get':
      response = handlePromptsGet(requestId, rpcParams, mcpPrompt);
      break;

    case 'ping':
      response = createResponse(requestId, {});
      break;

    default:
      response = createErrorResponse(
        requestId,
        JSON_RPC_ERRORS.METHOD_NOT_FOUND.code,
        `Method '${method}' not supported`,
        { supportedMethods: ['initialize', 'initialized', 'prompts/list', 'prompts/get', 'ping'] }
      );
  }

  return NextResponse.json(response, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * GET /api/mcp/server/[token]
 *
 * Optional: Server-Sent Events endpoint for server-initiated messages.
 * For now, we just return server info as a simple health check.
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { token } = await params;

  // Validate token and get MCP prompt
  const mcpPrompt = await getMcpPromptByAccessToken(token);
  if (!mcpPrompt) {
    return NextResponse.json(
      { error: 'Invalid or inactive MCP server' },
      { status: 404 }
    );
  }

  // Return server info for health check
  return NextResponse.json({
    status: 'ok',
    serverInfo: {
      name: `expert-note-mcp-${mcpPrompt.namespace}`,
      version: '1.0.0',
      protocol: 'mcp',
      protocolVersion: '2024-11-05',
    },
    prompt: {
      name: mcpPrompt.namespace,
      title: mcpPrompt.title,
      description: mcpPrompt.description,
    },
  });
}

/**
 * OPTIONS /api/mcp/server/[token]
 *
 * CORS preflight handler
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Mcp-Session-Id, Last-Event-ID',
      'Access-Control-Max-Age': '86400',
    },
  });
}
