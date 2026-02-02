import { vi } from "vitest";

// Mock session data
export const mockSession = {
  user: {
    id: "user-123",
    name: "Test User",
    email: "test@example.com",
    image: "https://example.com/avatar.jpg",
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// Mock auth function
export const mockAuth = vi.fn();

// Helper to set authenticated state
export function setAuthenticated(session = mockSession) {
  mockAuth.mockResolvedValue(session);
}

// Helper to set unauthenticated state
export function setUnauthenticated() {
  mockAuth.mockResolvedValue(null);
}

// Reset auth mock
export function resetAuthMock() {
  mockAuth.mockReset();
  setUnauthenticated();
}
