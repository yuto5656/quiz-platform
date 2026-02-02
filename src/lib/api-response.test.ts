import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import {
  successResponse,
  errorResponse,
  ApiErrors,
  handleApiError,
  sanitizeInput,
  checkRateLimit,
  resetRateLimit,
  clearAllRateLimits,
  HttpStatus,
} from "./api-response";

// Mock NextResponse.json
vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({ body, status: init?.status || 200 })),
  },
}));

describe("api-response", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("successResponse", () => {
    it("should return data with default status 200", () => {
      const data = { id: 1, name: "Test" };
      successResponse(data);

      expect(NextResponse.json).toHaveBeenCalledWith(data, { status: 200 });
    });

    it("should return data with custom status", () => {
      const data = { id: 1 };
      successResponse(data, 201);

      expect(NextResponse.json).toHaveBeenCalledWith(data, { status: 201 });
    });

    it("should handle empty object", () => {
      successResponse({});

      expect(NextResponse.json).toHaveBeenCalledWith({}, { status: 200 });
    });

    it("should handle null data", () => {
      successResponse(null);

      expect(NextResponse.json).toHaveBeenCalledWith(null, { status: 200 });
    });

    it("should handle array data", () => {
      const data = [1, 2, 3];
      successResponse(data);

      expect(NextResponse.json).toHaveBeenCalledWith(data, { status: 200 });
    });
  });

  describe("errorResponse", () => {
    it("should return error with default status 500", () => {
      errorResponse("Something went wrong");

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Something went wrong" },
        { status: 500 }
      );
    });

    it("should return error with custom status", () => {
      errorResponse("Not found", 404);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Not found" },
        { status: 404 }
      );
    });

    it("should include details when provided", () => {
      const details = { field: "email", message: "Invalid format" };
      errorResponse("Validation error", 400, details);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Validation error", details },
        { status: 400 }
      );
    });

    it("should not include details when undefined", () => {
      errorResponse("Error", 500, undefined);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Error" },
        { status: 500 }
      );
    });

    it("should handle empty string message", () => {
      errorResponse("");

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "" },
        { status: 500 }
      );
    });
  });

  describe("ApiErrors", () => {
    it("unauthorized should return 401", () => {
      ApiErrors.unauthorized();

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Unauthorized" },
        { status: 401 }
      );
    });

    it("forbidden should return 403", () => {
      ApiErrors.forbidden();

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Forbidden" },
        { status: 403 }
      );
    });

    it("notFound should return 404 with default message", () => {
      ApiErrors.notFound();

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Resource not found" },
        { status: 404 }
      );
    });

    it("notFound should return 404 with custom resource name", () => {
      ApiErrors.notFound("User");

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "User not found" },
        { status: 404 }
      );
    });

    it("badRequest should return 400 with default message", () => {
      ApiErrors.badRequest();

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Bad request" },
        { status: 400 }
      );
    });

    it("badRequest should return 400 with custom message", () => {
      ApiErrors.badRequest("Invalid input");

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Invalid input" },
        { status: 400 }
      );
    });

    it("validationError should return 400 with Zod issues", () => {
      const schema = z.object({ email: z.string().email() });
      try {
        schema.parse({ email: "invalid" });
      } catch (error) {
        if (error instanceof ZodError) {
          ApiErrors.validationError(error);

          expect(NextResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({
              error: "Validation error",
              details: expect.any(Array),
            }),
            { status: 400 }
          );
        }
      }
    });

    it("internalError should return 500 with default message", () => {
      ApiErrors.internalError();

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Internal server error" },
        { status: 500 }
      );
    });

    it("internalError should return 500 with custom message", () => {
      ApiErrors.internalError("Database connection failed");

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Database connection failed" },
        { status: 500 }
      );
    });

    it("methodNotAllowed should return 405", () => {
      ApiErrors.methodNotAllowed();

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Method not allowed" },
        { status: 405 }
      );
    });

    it("tooManyRequests should return 429", () => {
      ApiErrors.tooManyRequests();

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Too many requests" },
        { status: 429 }
      );
    });
  });

  describe("handleApiError", () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it("should handle ZodError", () => {
      const schema = z.object({ name: z.string().min(1) });
      try {
        schema.parse({ name: "" });
      } catch (error) {
        handleApiError(error);

        expect(NextResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: "Validation error",
            details: expect.any(Array),
          }),
          { status: 400 }
        );
      }
    });

    it("should handle Error in development", () => {
      process.env.NODE_ENV = "development";
      const error = new Error("Test error message");

      handleApiError(error);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Test error message" },
        { status: 500 }
      );
    });

    it("should hide error details in production", () => {
      process.env.NODE_ENV = "production";
      const error = new Error("Sensitive error details");

      handleApiError(error);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Internal server error" },
        { status: 500 }
      );
    });

    it("should handle unknown error types", () => {
      handleApiError("string error");

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Internal server error" },
        { status: 500 }
      );
    });

    it("should handle null error", () => {
      handleApiError(null);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Internal server error" },
        { status: 500 }
      );
    });

    it("should handle undefined error", () => {
      handleApiError(undefined);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Internal server error" },
        { status: 500 }
      );
    });
  });

  describe("sanitizeInput", () => {
    it("should escape < and > characters", () => {
      const input = "<script>alert('xss')</script>";
      const result = sanitizeInput(input);

      expect(result).toBe("&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;");
      expect(result).not.toContain("<");
      expect(result).not.toContain(">");
    });

    it("should escape & character", () => {
      const input = "Tom & Jerry";
      const result = sanitizeInput(input);

      expect(result).toBe("Tom &amp; Jerry");
    });

    it("should escape & before other characters to avoid double-escaping", () => {
      const input = "A & B < C > D";
      const result = sanitizeInput(input);

      expect(result).toBe("A &amp; B &lt; C &gt; D");
      // Verify & is escaped correctly without double-escaping
      expect(result).not.toContain("&amp;amp;");
    });

    it("should escape double quotes", () => {
      const input = 'Hello "World"';
      const result = sanitizeInput(input);

      expect(result).toBe("Hello &quot;World&quot;");
    });

    it("should escape single quotes", () => {
      const input = "Hello 'World'";
      const result = sanitizeInput(input);

      expect(result).toBe("Hello &#x27;World&#x27;");
    });

    it("should trim whitespace", () => {
      const input = "  hello world  ";
      const result = sanitizeInput(input);

      expect(result).toBe("hello world");
    });

    it("should handle empty string", () => {
      const result = sanitizeInput("");

      expect(result).toBe("");
    });

    it("should handle string with only whitespace", () => {
      const result = sanitizeInput("   ");

      expect(result).toBe("");
    });

    it("should handle normal text without special characters", () => {
      const input = "Hello World 123";
      const result = sanitizeInput(input);

      expect(result).toBe("Hello World 123");
    });

    it("should handle multiple special characters", () => {
      const input = '<div class="test">\'content\'</div>';
      const result = sanitizeInput(input);

      expect(result).toBe(
        "&lt;div class=&quot;test&quot;&gt;&#x27;content&#x27;&lt;/div&gt;"
      );
    });

    it("should handle Japanese characters", () => {
      const input = "こんにちは世界";
      const result = sanitizeInput(input);

      expect(result).toBe("こんにちは世界");
    });
  });

  describe("HttpStatus", () => {
    it("should have correct status codes", () => {
      expect(HttpStatus.OK).toBe(200);
      expect(HttpStatus.CREATED).toBe(201);
      expect(HttpStatus.BAD_REQUEST).toBe(400);
      expect(HttpStatus.UNAUTHORIZED).toBe(401);
      expect(HttpStatus.FORBIDDEN).toBe(403);
      expect(HttpStatus.NOT_FOUND).toBe(404);
      expect(HttpStatus.METHOD_NOT_ALLOWED).toBe(405);
      expect(HttpStatus.TOO_MANY_REQUESTS).toBe(429);
      expect(HttpStatus.INTERNAL_SERVER_ERROR).toBe(500);
    });
  });

  describe("checkRateLimit", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      clearAllRateLimits();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should allow first request", () => {
      const result = checkRateLimit("user-1");

      expect(result).toBe(true);
    });

    it("should allow requests within limit", () => {
      const identifier = "user-2";

      for (let i = 0; i < 100; i++) {
        expect(checkRateLimit(identifier, 100)).toBe(true);
      }
    });

    it("should block requests exceeding limit", () => {
      const identifier = "user-3";

      // Make 100 requests (at limit)
      for (let i = 0; i < 100; i++) {
        checkRateLimit(identifier, 100);
      }

      // 101st request should be blocked
      expect(checkRateLimit(identifier, 100)).toBe(false);
    });

    it("should reset after window expires", () => {
      const identifier = "user-4";

      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        checkRateLimit(identifier, 100, 60000);
      }

      // Should be blocked
      expect(checkRateLimit(identifier, 100, 60000)).toBe(false);

      // Advance time past window
      vi.advanceTimersByTime(60001);

      // Should be allowed again
      expect(checkRateLimit(identifier, 100, 60000)).toBe(true);
    });

    it("should handle custom limit", () => {
      const identifier = "user-5";

      // With limit of 5
      for (let i = 0; i < 5; i++) {
        expect(checkRateLimit(identifier, 5)).toBe(true);
      }

      expect(checkRateLimit(identifier, 5)).toBe(false);
    });

    it("should handle custom window", () => {
      const identifier = "user-6";

      checkRateLimit(identifier, 1, 1000);
      expect(checkRateLimit(identifier, 1, 1000)).toBe(false);

      // Advance 500ms - still blocked
      vi.advanceTimersByTime(500);
      expect(checkRateLimit(identifier, 1, 1000)).toBe(false);

      // Advance another 501ms - should be allowed
      vi.advanceTimersByTime(501);
      expect(checkRateLimit(identifier, 1, 1000)).toBe(true);
    });

    it("should track different identifiers separately", () => {
      checkRateLimit("user-a", 1);
      checkRateLimit("user-b", 1);

      // user-a is at limit
      expect(checkRateLimit("user-a", 1)).toBe(false);
      // user-b is at limit
      expect(checkRateLimit("user-b", 1)).toBe(false);
      // user-c is new
      expect(checkRateLimit("user-c", 1)).toBe(true);
    });
  });

  describe("resetRateLimit", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      clearAllRateLimits();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should reset rate limit for specific identifier", () => {
      const identifier = "user-reset-test";

      // Use up the limit
      checkRateLimit(identifier, 1);
      expect(checkRateLimit(identifier, 1)).toBe(false);

      // Reset and try again
      resetRateLimit(identifier);
      expect(checkRateLimit(identifier, 1)).toBe(true);
    });

    it("should not affect other identifiers", () => {
      checkRateLimit("user-x", 1);
      checkRateLimit("user-y", 1);

      resetRateLimit("user-x");

      // user-x should be reset
      expect(checkRateLimit("user-x", 1)).toBe(true);
      // user-y should still be blocked
      expect(checkRateLimit("user-y", 1)).toBe(false);
    });
  });

  describe("clearAllRateLimits", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should clear all rate limits", () => {
      checkRateLimit("user-1", 1);
      checkRateLimit("user-2", 1);

      expect(checkRateLimit("user-1", 1)).toBe(false);
      expect(checkRateLimit("user-2", 1)).toBe(false);

      clearAllRateLimits();

      expect(checkRateLimit("user-1", 1)).toBe(true);
      expect(checkRateLimit("user-2", 1)).toBe(true);
    });
  });

  describe("rate limit cleanup", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      clearAllRateLimits();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should clean up expired entries after cleanup interval", () => {
      // Create multiple entries with short window
      checkRateLimit("cleanup-user-1", 100, 1000);
      checkRateLimit("cleanup-user-2", 100, 1000);

      // Advance past both window and cleanup interval (60 seconds)
      vi.advanceTimersByTime(61000);

      // Trigger cleanup by making a new request
      checkRateLimit("cleanup-user-3", 100, 1000);

      // The expired entries should be cleaned up
      // and new requests should be allowed
      expect(checkRateLimit("cleanup-user-1", 100, 1000)).toBe(true);
      expect(checkRateLimit("cleanup-user-2", 100, 1000)).toBe(true);
    });

    it("should not clean up entries before cleanup interval", () => {
      checkRateLimit("no-cleanup-user", 1, 1000);

      // Advance past window but not cleanup interval
      vi.advanceTimersByTime(30000);

      // Entry should still exist (not cleaned up yet)
      // but should be reset due to window expiration
      expect(checkRateLimit("no-cleanup-user", 1, 1000)).toBe(true);
    });

    it("should delete expired entries during cleanup", () => {
      // Create entries that will expire
      checkRateLimit("expire-test-1", 1, 500);
      checkRateLimit("expire-test-2", 1, 500);

      // Block the entries
      expect(checkRateLimit("expire-test-1", 1, 500)).toBe(false);
      expect(checkRateLimit("expire-test-2", 1, 500)).toBe(false);

      // Advance past window AND cleanup interval
      vi.advanceTimersByTime(65000);

      // Make any request to trigger cleanup
      checkRateLimit("trigger-cleanup", 100);

      // Expired entries should now allow new requests
      expect(checkRateLimit("expire-test-1", 1, 500)).toBe(true);
      expect(checkRateLimit("expire-test-2", 1, 500)).toBe(true);
    });
  });
});
