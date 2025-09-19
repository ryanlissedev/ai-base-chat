/**
 * Standardized API error handling utilities
 * Provides consistent error responses and logging across all API routes
 */

import { NextResponse } from 'next/server';
import { createModuleLogger } from '@/lib/logger';

const logger = createModuleLogger('api:error-handler');

export enum ApiErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  ANONYMOUS_LIMIT_EXCEEDED = 'ANONYMOUS_LIMIT_EXCEEDED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}

export interface ApiErrorDetails {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
  correlationId?: string;
  timestamp?: string;
  statusCode: number;
}

export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly correlationId: string;
  public readonly timestamp: string;

  constructor(
    code: ApiErrorCode,
    message: string,
    statusCode: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.correlationId = generateCorrelationId();
    this.timestamp = new Date().toISOString();
  }

  toResponse(): NextResponse {
    const errorResponse: ApiErrorDetails = {
      code: this.code,
      message: this.message,
      details: this.details,
      correlationId: this.correlationId,
      timestamp: this.timestamp,
      statusCode: this.statusCode,
    };

    // Log the error with correlation ID
    logger.error(
      {
        correlationId: this.correlationId,
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        details: this.details,
        stack: this.stack,
      },
      `API Error: ${this.code}`
    );

    return NextResponse.json(errorResponse, { status: this.statusCode });
  }

  static fromError(error: unknown, fallbackCode = ApiErrorCode.INTERNAL_SERVER_ERROR): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (error instanceof Error) {
      // Map common error patterns to specific API error codes
      if (error.message.includes('timeout')) {
        return new ApiError(
          ApiErrorCode.TIMEOUT_ERROR,
          'Request timeout',
          408,
          { originalError: error.message }
        );
      }

      if (error.message.includes('Database') || error.message.includes('connection')) {
        return new ApiError(
          ApiErrorCode.DATABASE_ERROR,
          'Database operation failed',
          503,
          { originalError: error.message }
        );
      }

      if (error.message.includes('fetch') || error.message.includes('network')) {
        return new ApiError(
          ApiErrorCode.EXTERNAL_SERVICE_ERROR,
          'External service unavailable',
          502,
          { originalError: error.message }
        );
      }

      return new ApiError(
        fallbackCode,
        error.message,
        500,
        { originalError: error.message, stack: error.stack }
      );
    }

    return new ApiError(
      fallbackCode,
      'An unexpected error occurred',
      500,
      { originalError: String(error) }
    );
  }
}

/**
 * Common API error creators
 */
export const ApiErrors = {
  validation: (message: string, details?: Record<string, unknown>) =>
    new ApiError(ApiErrorCode.VALIDATION_ERROR, message, 400, details),

  authentication: (message = 'Authentication required') =>
    new ApiError(ApiErrorCode.AUTHENTICATION_ERROR, message, 401),

  authorization: (message = 'Insufficient permissions') =>
    new ApiError(ApiErrorCode.AUTHORIZATION_ERROR, message, 403),

  notFound: (resource = 'Resource') =>
    new ApiError(ApiErrorCode.NOT_FOUND, `${resource} not found`, 404),

  rateLimit: (message = 'Rate limit exceeded') =>
    new ApiError(ApiErrorCode.RATE_LIMIT_EXCEEDED, message, 429),

  anonymousLimit: (message = 'Anonymous user limit exceeded') =>
    new ApiError(ApiErrorCode.ANONYMOUS_LIMIT_EXCEEDED, message, 402),

  database: (message = 'Database operation failed', details?: Record<string, unknown>) =>
    new ApiError(ApiErrorCode.DATABASE_ERROR, message, 503, details),

  externalService: (service: string, details?: Record<string, unknown>) =>
    new ApiError(
      ApiErrorCode.EXTERNAL_SERVICE_ERROR,
      `${service} service unavailable`,
      502,
      details
    ),

  fileUpload: (message = 'File upload failed', details?: Record<string, unknown>) =>
    new ApiError(ApiErrorCode.FILE_UPLOAD_ERROR, message, 400, details),

  internal: (message = 'Internal server error', details?: Record<string, unknown>) =>
    new ApiError(ApiErrorCode.INTERNAL_SERVER_ERROR, message, 500, details),

  serviceUnavailable: (message = 'Service temporarily unavailable') =>
    new ApiError(ApiErrorCode.SERVICE_UNAVAILABLE, message, 503),

  timeout: (operation = 'Operation') =>
    new ApiError(ApiErrorCode.TIMEOUT_ERROR, `${operation} timeout`, 408),
};

/**
 * API response wrapper with consistent error handling
 */
export async function withApiErrorHandler<T>(
  handler: () => Promise<T>,
  context?: string
): Promise<NextResponse> {
  const correlationId = generateCorrelationId();
  
  try {
    logger.debug({ correlationId, context }, 'API request started');
    
    const result = await handler();
    
    logger.debug({ correlationId, context }, 'API request completed successfully');
    
    if (result instanceof NextResponse) {
      // Add correlation ID to response headers
      result.headers.set('X-Correlation-ID', correlationId);
      return result;
    }
    
    const response = NextResponse.json(result);
    response.headers.set('X-Correlation-ID', correlationId);
    return response;
  } catch (error) {
    logger.error(
      { correlationId, context, error },
      'API request failed with error'
    );
    
    const apiError = ApiError.fromError(error);
    const response = apiError.toResponse();
    response.headers.set('X-Correlation-ID', correlationId);
    return response;
  }
}

/**
 * AbortController wrapper with timeout
 */
export function createAbortController(timeoutMs = 30000): {
  controller: AbortController;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Operation timeout after ${timeoutMs}ms`));
  }, timeoutMs);

  return {
    controller,
    cleanup: () => clearTimeout(timeoutId),
  };
}

/**
 * Async operation wrapper with timeout and abort support
 */
export async function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs = 30000
): Promise<T> {
  const { controller, cleanup } = createAbortController(timeoutMs);
  
  try {
    const result = await operation(controller.signal);
    return result;
  } finally {
    cleanup();
  }
}

/**
 * Generate a correlation ID for request tracking
 */
function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate request method
 */
export function validateMethod(request: Request, allowedMethods: string[]): void {
  if (!allowedMethods.includes(request.method)) {
    throw ApiErrors.validation(
      `Method ${request.method} not allowed`,
      { allowedMethods }
    );
  }
}

/**
 * Parse and validate JSON body
 */
export async function parseJsonBody<T = Record<string, unknown>>(
  request: Request
): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch (error) {
    throw ApiErrors.validation('Invalid JSON body', {
      originalError: error instanceof Error ? error.message : String(error),
    });
  }
}