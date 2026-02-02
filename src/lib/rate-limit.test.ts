import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import {
  rateLimitConfig,
  getClientId,
  checkRateLimit,
  rateLimitHeaders,
  withRateLimit,
  applyRateLimitHeaders,
} from "./rate-limit";
import { NextResponse } from "next/server";

function createRequest(
  url: string,
  headers?: Record<string, string>
): NextRequest {
  const reqHeaders = new Headers(headers);
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    headers: reqHeaders,
  });
}

describe("rateLimitConfig", () => {
  it("should have correct default configurations", () => {
    expect(rateLimitConfig.api).toEqual({ limit: 100, windowMs: 60000 });
    expect(rateLimitConfig.auth).toEqual({ limit: 10, windowMs: 60000 });
    expect(rateLimitConfig.create).toEqual({ limit: 20, windowMs: 60000 });
    expect(rateLimitConfig.score).toEqual({ limit: 30, windowMs: 60000 });
    expect(rateLimitConfig.search).toEqual({ limit: 60, windowMs: 60000 });
  });
});

describe("getClientId", () => {
  it("should extract IP from x-forwarded-for header", () => {
    const request = createRequest("/api/test", {
      "x-forwarded-for": "192.168.1.1, 10.0.0.1",
    });
    const clientId = getClientId(request);
    expect(clientId).toBe("192.168.1.1");
  });

  it("should extract IP from x-real-ip header", () => {
    const request = createRequest("/api/test", {
      "x-real-ip": "192.168.1.2",
    });
    const clientId = getClientId(request);
    expect(clientId).toBe("192.168.1.2");
  });

  it("should prefer x-forwarded-for over x-real-ip", () => {
    const request = createRequest("/api/test", {
      "x-forwarded-for": "192.168.1.1",
      "x-real-ip": "192.168.1.2",
    });
    const clientId = getClientId(request);
    expect(clientId).toBe("192.168.1.1");
  });

  it("should generate anonymous ID when no IP headers", () => {
    const request = createRequest("/api/test", {
      "user-agent": "Mozilla/5.0",
      "accept-language": "en-US",
    });
    const clientId = getClientId(request);
    expect(clientId).toMatch(/^anon-/);
  });

  it("should generate consistent anonymous ID for same headers", () => {
    const request1 = createRequest("/api/test", {
      "user-agent": "Mozilla/5.0",
      "accept-language": "en-US",
    });
    const request2 = createRequest("/api/test", {
      "user-agent": "Mozilla/5.0",
      "accept-language": "en-US",
    });
    expect(getClientId(request1)).toBe(getClientId(request2));
  });

  it("should generate different anonymous IDs for different headers", () => {
    const request1 = createRequest("/api/test", {
      "user-agent": "Mozilla/5.0",
    });
    const request2 = createRequest("/api/test", {
      "user-agent": "Chrome/120",
    });
    expect(getClientId(request1)).not.toBe(getClientId(request2));
  });
});

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should allow first request", () => {
    const result = checkRateLimit("test-client-1", "api");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(99); // 100 - 1
    expect(result.limit).toBe(100);
  });

  it("should track multiple requests", () => {
    const clientId = "test-client-2";

    const result1 = checkRateLimit(clientId, "api");
    expect(result1.allowed).toBe(true);
    expect(result1.remaining).toBe(99);

    const result2 = checkRateLimit(clientId, "api");
    expect(result2.allowed).toBe(true);
    expect(result2.remaining).toBe(98);
  });

  it("should block requests when limit exceeded", () => {
    const clientId = "test-client-3";

    // Use auth route with limit of 10
    for (let i = 0; i < 10; i++) {
      const result = checkRateLimit(clientId, "auth");
      expect(result.allowed).toBe(true);
    }

    // 11th request should be blocked
    const result = checkRateLimit(clientId, "auth");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should reset after window expires", () => {
    const clientId = "test-client-4";

    // Exhaust the limit
    for (let i = 0; i < 10; i++) {
      checkRateLimit(clientId, "auth");
    }

    // Verify blocked
    expect(checkRateLimit(clientId, "auth").allowed).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(60001);

    // Should be allowed again
    const result = checkRateLimit(clientId, "auth");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it("should use correct limits for different route types", () => {
    const result1 = checkRateLimit("client-a", "api");
    expect(result1.limit).toBe(100);

    const result2 = checkRateLimit("client-b", "auth");
    expect(result2.limit).toBe(10);

    const result3 = checkRateLimit("client-c", "create");
    expect(result3.limit).toBe(20);

    const result4 = checkRateLimit("client-d", "score");
    expect(result4.limit).toBe(30);

    const result5 = checkRateLimit("client-e", "search");
    expect(result5.limit).toBe(60);
  });

  it("should track different route types independently", () => {
    const clientId = "test-client-5";

    // Make requests to api route
    checkRateLimit(clientId, "api");
    checkRateLimit(clientId, "api");

    // Check auth route - should be independent
    const authResult = checkRateLimit(clientId, "auth");
    expect(authResult.remaining).toBe(9); // 10 - 1, not affected by api requests
  });
});

describe("rateLimitHeaders", () => {
  it("should generate correct headers", () => {
    const result = {
      allowed: true,
      remaining: 50,
      resetTime: 1704067260000, // 2024-01-01T00:01:00.000Z
      limit: 100,
    };

    const headers = rateLimitHeaders(result);

    expect(headers["X-RateLimit-Limit"]).toBe("100");
    expect(headers["X-RateLimit-Remaining"]).toBe("50");
    expect(headers["X-RateLimit-Reset"]).toBe("1704067260"); // Unix timestamp in seconds
  });
});

describe("withRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return null when request is allowed", () => {
    const request = createRequest("/api/test", {
      "x-forwarded-for": "192.168.1.100",
    });

    const result = withRateLimit(request, "api");
    expect(result).toBeNull();
  });

  it("should return 429 response when rate limited", async () => {
    const ip = "192.168.1.101";

    // Exhaust the auth limit
    for (let i = 0; i < 10; i++) {
      const request = createRequest("/api/auth", { "x-forwarded-for": ip });
      withRateLimit(request, "auth");
    }

    // Next request should be rate limited
    const request = createRequest("/api/auth", { "x-forwarded-for": ip });
    const response = withRateLimit(request, "auth");

    expect(response).not.toBeNull();
    expect(response?.status).toBe(429);

    const data = await response?.json();
    expect(data.error).toBe("Too many requests");
    expect(data.message).toBe("Rate limit exceeded. Please try again later.");
    expect(data.retryAfter).toBeGreaterThan(0);
  });

  it("should include rate limit headers in 429 response", async () => {
    const ip = "192.168.1.102";

    // Exhaust the limit
    for (let i = 0; i < 10; i++) {
      const request = createRequest("/api/auth", { "x-forwarded-for": ip });
      withRateLimit(request, "auth");
    }

    const request = createRequest("/api/auth", { "x-forwarded-for": ip });
    const response = withRateLimit(request, "auth");

    expect(response?.headers.get("X-RateLimit-Limit")).toBe("10");
    expect(response?.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(response?.headers.get("X-RateLimit-Reset")).toBeTruthy();
  });
});

describe("applyRateLimitHeaders", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should apply rate limit headers to response", () => {
    const response = NextResponse.json({ data: "test" });
    const request = createRequest("/api/test", {
      "x-forwarded-for": "192.168.1.200",
    });

    const modifiedResponse = applyRateLimitHeaders(response, request, "api");

    expect(modifiedResponse.headers.get("X-RateLimit-Limit")).toBe("100");
    expect(modifiedResponse.headers.get("X-RateLimit-Remaining")).toBe("99");
    expect(modifiedResponse.headers.get("X-RateLimit-Reset")).toBeTruthy();
  });

  it("should use default route type when not specified", () => {
    const response = NextResponse.json({ data: "test" });
    const request = createRequest("/api/test", {
      "x-forwarded-for": "192.168.1.201",
    });

    const modifiedResponse = applyRateLimitHeaders(response, request);

    expect(modifiedResponse.headers.get("X-RateLimit-Limit")).toBe("100"); // api default
  });
});

describe("cleanup behavior", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should clean up expired entries after cleanup interval", () => {
    const clientId = "cleanup-test-client";

    // Make a request
    checkRateLimit(clientId, "auth");

    // Advance time past the window
    vi.advanceTimersByTime(60001);

    // Advance time past cleanup interval (60000ms)
    vi.advanceTimersByTime(60001);

    // Next request should trigger cleanup and start fresh
    const result = checkRateLimit(clientId, "auth");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });
});
