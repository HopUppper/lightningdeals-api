import { Request, Response } from 'express';

export interface StandardErrorPayload {
  error: {
    type: string;
    code: string;
    message: string;
    requestId?: string;
    details?: any;
  };
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly type: string;
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, statusCode: number = 500, type: string = 'api_error', code: string = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.type = type;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'The API key or credentials provided are invalid or missing.', code: string = 'INVALID_AUTHENTICATION') {
    super(message, 401, 'authentication_error', code);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'You do not have permission to perform this action or access this resource.', code: string = 'FORBIDDEN_ACCESS') {
    super(message, 403, 'permission_error', code);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Invalid request parameters provided.', details?: any) {
    super(message, 400, 'invalid_request_error', 'VALIDATION_FAILED', details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded. Please reduce request frequency.', code: string = 'RATE_LIMIT_EXCEEDED') {
    super(message, 429, 'rate_limit_error', code);
  }
}

export class QuotaExhaustedError extends AppError {
  constructor(message: string = '5-hour rolling token allowance exhausted (0 tokens remaining).', code: string = 'QUOTA_EXHAUSTED') {
    super(message, 429, 'quota_exceeded', code);
  }
}

export class UpstreamProviderError extends AppError {
  constructor(message: string = 'Upstream provider service experienced an error.', statusCode: number = 502, code: string = 'UPSTREAM_PROVIDER_ERROR') {
    super(message, statusCode, 'upstream_provider_error', code);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'A database transaction error occurred. No changes were committed.') {
    super(message, 500, 'api_error', 'DATABASE_TRANSACTION_FAILED');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'The requested resource or endpoint was not found.') {
    super(message, 404, 'invalid_request_error', 'RESOURCE_NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'A resource with the specified parameters already exists.') {
    super(message, 409, 'invalid_request_error', 'RESOURCE_CONFLICT');
  }
}

/**
 * Format a safe, standard JSON error response.
 * Strips out raw stack traces, SQL queries, environment variables, and master credentials.
 */
export function formatErrorResponse(err: any, requestId?: string): StandardErrorPayload {
  let type = 'api_error';
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected internal error occurred on the LightningDeals Gateway.';
  let details: any = undefined;

  if (err instanceof AppError) {
    type = err.type;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err && typeof err === 'object') {
    if (err.type && err.message) {
      type = err.type;
      message = err.message;
      code = err.code || 'API_ERROR';
    } else if (err.message) {
      // Sanitize standard Error instance
      const safeMsg = err.message.toString();
      if (!safeMsg.includes('prisma') && !safeMsg.includes('SELECT') && !safeMsg.includes('connect')) {
        message = safeMsg;
      }
    }
  }

  // Remove potential leaked secrets from safe user message
  message = message
    .replace(/ld_live_[a-zA-Z0-9]+/g, 'ld_live_••••••••')
    .replace(/ld_trial_[a-zA-Z0-9]+/g, 'ld_trial_••••••••')
    .replace(/sk-ant-api[a-zA-Z0-9_-]+/g, 'sk-ant-••••••••');

  return {
    error: {
      type,
      code,
      message,
      requestId,
      ...(details ? { details } : {}),
    },
  };
}

/**
 * Express error handler middleware
 */
export function globalErrorHandler(err: any, req: Request, res: Response, next: any) {
  const requestId = (req as any).requestId || req.headers['x-request-id']?.toString();
  const statusCode = err instanceof AppError ? err.statusCode : (err.status || err.statusCode || 500);

  // Log error silently on server
  console.error(`[EXPRESS ERROR] [${requestId || 'N/A'}] Status ${statusCode}:`, err.message || err);

  if (res.headersSent) {
    return next(err);
  }

  const payload = formatErrorResponse(err, requestId);
  res.status(statusCode).json(payload);
}
