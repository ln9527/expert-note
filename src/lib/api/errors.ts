/**
 * API error handling utilities
 */

import { NextResponse } from 'next/server';
import { OpenRouterError } from '@/lib/ai/openrouter';

interface ErrorResponse {
  success: false;
  error: string;
  errorCode?: string;
  errorType: string;
}

/**
 * Handle API errors and return appropriate NextResponse
 * Consolidates error handling across API routes
 */
export function handleApiError(error: unknown, context: string): NextResponse<ErrorResponse> {
  console.error(`[API] ${context} error:`, error);

  // Handle OpenRouter API errors
  if (error instanceof OpenRouterError) {
    console.error(`[API] OpenRouter error code: ${error.code}`);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        errorCode: error.code,
        errorType: 'ai_service_error',
      },
      { status: 502 }
    );
  }

  const errorMessage = error instanceof Error ? error.message : String(error);

  // Handle database errors
  if (errorMessage.includes('database')) {
    return NextResponse.json(
      {
        success: false,
        error: 'Database error: ' + errorMessage,
        errorType: 'database_error',
      },
      { status: 500 }
    );
  }

  // Handle template errors
  if (errorMessage.includes('template')) {
    return NextResponse.json(
      {
        success: false,
        error: 'Template error: ' + errorMessage,
        errorType: 'template_error',
      },
      { status: 404 }
    );
  }

  // Generic internal error
  return NextResponse.json(
    {
      success: false,
      error: `Failed to ${context}: ${errorMessage}`,
      errorType: 'internal_error',
    },
    { status: 500 }
  );
}
