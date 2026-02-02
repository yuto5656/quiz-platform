import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Standard API response utilities
 * Provides consistent response format across all API endpoints
 */

// HTTP Status Code constants for consistency
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  error: string;
  details?: unknown;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Create a successful response
 */
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Create an error response
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: unknown
) {
  const body: { error: string; details?: unknown } = { error: message };
  if (details !== undefined) {
    body.details = details;
  }
  return NextResponse.json(body, { status });
}

/**
 * Common error responses
 */
export const ApiErrors = {
  unauthorized: () => errorResponse("Unauthorized", 401),

  forbidden: () => errorResponse("Forbidden", 403),

  notFound: (resource: string = "Resource") =>
    errorResponse(`${resource} not found`, 404),

  badRequest: (message: string = "Bad request") =>
    errorResponse(message, 400),

  validationError: (error: ZodError) =>
    errorResponse("Validation error", 400, error.issues),

  internalError: (message: string = "Internal server error") =>
    errorResponse(message, 500),

  methodNotAllowed: () => errorResponse("Method not allowed", 405),

  tooManyRequests: () => errorResponse("Too many requests", 429),
};

/**
 * Handle API errors consistently
 */
export function handleApiError(error: unknown) {
  console.error("API Error:", error);

  if (error instanceof ZodError) {
    return ApiErrors.validationError(error);
  }

  if (error instanceof Error) {
    // Don't expose internal error details in production
    if (process.env.NODE_ENV === "production") {
      return ApiErrors.internalError();
    }
    return ApiErrors.internalError(error.message);
  }

  return ApiErrors.internalError();
}

/**
 * Sanitize user input to prevent XSS
 * Escapes HTML special characters: & < > " '
 * Basic sanitization - consider using a library like DOMPurify for complex cases
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, "&amp;") // Must be first to avoid double-escaping
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}

/**
 * Rate limiting helper (simple in-memory implementation)
 * For production, consider using Redis or a dedicated rate limiting service
 */
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const CLEANUP_INTERVAL_MS = 60000; // Cleanup expired entries every minute
let lastCleanup = Date.now();

/**
 * Clean up expired rate limit entries to prevent memory leaks
 */
function cleanupExpiredEntries(now: number): void {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) {
    return;
  }

  for (const [key, record] of rateLimitMap) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
  lastCleanup = now;
}

/**
 * Check if a request is within rate limits
 * @param identifier - Unique identifier for the client (e.g., IP address, user ID)
 * @param limit - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();

  // Periodically clean up expired entries
  cleanupExpiredEntries(now);

  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Reset rate limit for a specific identifier (useful for testing)
 */
export function resetRateLimit(identifier: string): void {
  rateLimitMap.delete(identifier);
}

/**
 * Clear all rate limit records (useful for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitMap.clear();
  lastCleanup = Date.now();
}
