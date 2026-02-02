import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Standard API response utilities
 * Provides consistent response format across all API endpoints
 */

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
 * Basic sanitization - consider using a library like DOMPurify for complex cases
 */
export function sanitizeInput(input: string): string {
  return input
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
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
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
