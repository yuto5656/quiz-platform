import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Create hoisted mocks that can be used in vi.mock factory
const {
  mockPrisma,
  resetPrismaMocks,
  mockAuth,
  setAuthenticated,
  setUnauthenticated,
  resetAuthMock,
} = vi.hoisted(() => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    quiz: {
      findMany: vi.fn(),
    },
    score: {
      findMany: vi.fn(),
    },
  };

  const resetPrismaMocks = () => {
    Object.values(mockPrisma).forEach((model) => {
      if (typeof model === "object" && model !== null) {
        Object.values(model).forEach((method) => {
          if (typeof method === "function" && "mockReset" in method) {
            (method as ReturnType<typeof vi.fn>).mockReset();
          }
        });
      }
    });
  };

  const mockSession = {
    user: {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      image: "https://example.com/avatar.jpg",
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  const mockAuth = vi.fn();

  const setAuthenticated = (session = mockSession) => {
    mockAuth.mockResolvedValue(session);
  };

  const setUnauthenticated = () => {
    mockAuth.mockResolvedValue(null);
  };

  const resetAuthMock = () => {
    mockAuth.mockReset();
    setUnauthenticated();
  };

  return {
    mockPrisma,
    resetPrismaMocks,
    mockAuth,
    setAuthenticated,
    setUnauthenticated,
    resetAuthMock,
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

import { GET, PUT } from "./route";

function createRequest(url: string, options?: RequestInit) {
  return new NextRequest(new URL(url, "http://localhost:3000"), options);
}

describe("GET /api/users/me", () => {
  beforeEach(() => {
    resetPrismaMocks();
    resetAuthMock();
  });

  const mockUser = {
    id: "user-123",
    name: "Test User",
    email: "test@example.com",
    image: "https://example.com/avatar.jpg",
    displayName: "テストユーザー",
    bio: "テスト用ユーザーです",
    totalScore: 1000,
    quizzesTaken: 50,
    quizzesCreated: 5,
    createdAt: new Date("2024-01-01"),
  };

  const mockQuizzes = [
    {
      id: "quiz-1",
      title: "JavaScript基礎",
      category: { name: "プログラミング" },
      _count: { questions: 10 },
      playCount: 100,
      createdAt: new Date("2024-01-15"),
    },
  ];

  const mockScores = [
    {
      id: "score-1",
      quiz: { id: "quiz-2", title: "Python入門" },
      score: 80,
      maxScore: 100,
      percentage: 80,
      createdAt: new Date("2024-01-20"),
    },
  ];

  it("should require authentication", async () => {
    setUnauthenticated();

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return user profile with recent quizzes and scores", async () => {
    setAuthenticated();
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.quiz.findMany.mockResolvedValue(mockQuizzes);
    mockPrisma.score.findMany.mockResolvedValue(mockScores);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toBeDefined();
    expect(data.user.id).toBe("user-123");
    expect(data.user.displayName).toBe("テストユーザー");
    expect(data.recentQuizzes).toHaveLength(1);
    expect(data.recentScores).toHaveLength(1);
  });

  it("should return 404 if user not found", async () => {
    setAuthenticated();
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("User not found");
  });

  it("should format dates as ISO strings", async () => {
    setAuthenticated();
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.quiz.findMany.mockResolvedValue(mockQuizzes);
    mockPrisma.score.findMany.mockResolvedValue(mockScores);

    const response = await GET();
    const data = await response.json();

    expect(data.recentQuizzes[0].createdAt).toBe("2024-01-15T00:00:00.000Z");
    expect(data.recentScores[0].createdAt).toBe("2024-01-20T00:00:00.000Z");
  });

  it("should fetch recent quizzes and scores in descending order", async () => {
    setAuthenticated();
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.quiz.findMany.mockResolvedValue(mockQuizzes);
    mockPrisma.score.findMany.mockResolvedValue(mockScores);

    await GET();

    expect(mockPrisma.quiz.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: "desc" },
        take: 5,
      })
    );
    expect(mockPrisma.score.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: "desc" },
        take: 5,
      })
    );
  });

  it("should handle database errors gracefully", async () => {
    setAuthenticated();
    mockPrisma.user.findUnique.mockRejectedValue(new Error("Database error"));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch user");
  });
});

describe("PUT /api/users/me", () => {
  beforeEach(() => {
    resetPrismaMocks();
    resetAuthMock();
  });

  it("should require authentication", async () => {
    setUnauthenticated();

    const request = createRequest("/api/users/me", {
      method: "PUT",
      body: JSON.stringify({ displayName: "New Name" }),
    });
    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should update user profile", async () => {
    setAuthenticated();
    const updatedUser = {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      image: "https://example.com/avatar.jpg",
      displayName: "新しい表示名",
      bio: "新しい自己紹介",
    };
    mockPrisma.user.update.mockResolvedValue(updatedUser);

    const request = createRequest("/api/users/me", {
      method: "PUT",
      body: JSON.stringify({ displayName: "新しい表示名", bio: "新しい自己紹介" }),
    });
    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.displayName).toBe("新しい表示名");
    expect(data.bio).toBe("新しい自己紹介");
  });

  it("should validate displayName length", async () => {
    setAuthenticated();

    const request = createRequest("/api/users/me", {
      method: "PUT",
      body: JSON.stringify({ displayName: "a".repeat(51) }), // Too long
    });
    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation error");
  });

  it("should validate bio length", async () => {
    setAuthenticated();

    const request = createRequest("/api/users/me", {
      method: "PUT",
      body: JSON.stringify({ bio: "a".repeat(501) }), // Too long
    });
    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation error");
  });

  it("should allow partial updates", async () => {
    setAuthenticated();
    mockPrisma.user.update.mockResolvedValue({
      id: "user-123",
      displayName: "Only Display Name Updated",
    });

    const request = createRequest("/api/users/me", {
      method: "PUT",
      body: JSON.stringify({ displayName: "Only Display Name Updated" }),
    });
    const response = await PUT(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-123" },
        data: { displayName: "Only Display Name Updated", bio: undefined },
      })
    );
  });

  it("should handle database errors gracefully", async () => {
    setAuthenticated();
    mockPrisma.user.update.mockRejectedValue(new Error("Database error"));

    const request = createRequest("/api/users/me", {
      method: "PUT",
      body: JSON.stringify({ displayName: "New Name" }),
    });
    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to update user");
  });
});
