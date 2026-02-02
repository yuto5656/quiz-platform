import { NextRequest, NextResponse } from "next/server";

/**
 * Rate limiting configuration per route type
 */
export const rateLimitConfig = {
  // General API endpoints
  api: { limit: 100, windowMs: 60000 }, // 100 requests per minute

  // Auth-related endpoints (more restrictive)
  auth: { limit: 10, windowMs: 60000 }, // 10 requests per minute

  // Quiz creation/submission (prevent spam)
  create: { limit: 20, windowMs: 60000 }, // 20 requests per minute

  // Score submission (one per quiz play)
  score: { limit: 30, windowMs: 60000 }, // 30 requests per minute

  // Search endpoints (can be resource-intensive)
  search: { limit: 60, windowMs: 60000 }, // 60 requests per minute
} as const;

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup interval
const CLEANUP_INTERVAL_MS = 60000;
let lastCleanup = Date.now();

function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  for (const [key, record] of rateLimitStore) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
  lastCleanup = now;
}

/**
 * Get client identifier from request
 */
export function getClientId(request: NextRequest): string {
  // Try to get real IP from headers (behind proxy)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (realIp) {
    return realIp;
  }

  // Fallback to a hash of user agent + accept-language
  const ua = request.headers.get("user-agent") || "unknown";
  const lang = request.headers.get("accept-language") || "unknown";
  return `anon-${hashString(ua + lang)}`;
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Check rate limit and return headers
 */
export function checkRateLimit(
  clientId: string,
  routeType: keyof typeof rateLimitConfig = "api"
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
} {
  const { limit, windowMs } = rateLimitConfig[routeType];
  const now = Date.now();
  const key = `${clientId}:${routeType}`;

  cleanup(now);

  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetTime: now + windowMs, limit };
  }

  if (record.count >= limit) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetTime: record.resetTime, limit };
  }

  // Increment counter
  record.count++;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetTime: record.resetTime,
    limit,
  };
}

/**
 * Create rate limit response headers
 */
export function rateLimitHeaders(result: ReturnType<typeof checkRateLimit>): HeadersInit {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetTime / 1000).toString(),
  };
}

/**
 * Rate limit middleware helper
 */
export function withRateLimit(
  request: NextRequest,
  routeType: keyof typeof rateLimitConfig = "api"
): NextResponse | null {
  const clientId = getClientId(request);
  const result = checkRateLimit(clientId, routeType);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: "Too many requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: rateLimitHeaders(result),
      }
    );
  }

  return null; // Request allowed, continue
}

/**
 * Apply rate limit headers to response
 */
export function applyRateLimitHeaders(
  response: NextResponse,
  request: NextRequest,
  routeType: keyof typeof rateLimitConfig = "api"
): NextResponse {
  const clientId = getClientId(request);
  const result = checkRateLimit(clientId, routeType);
  const headers = rateLimitHeaders(result);

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
