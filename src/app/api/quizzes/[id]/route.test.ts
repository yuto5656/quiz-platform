import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Create hoisted mocks that can be used in vi.mock factory
const {
  mockPrisma,
  resetPrismaMocks,
  createMockQuiz,
  mockAuth,
  setAuthenticated,
  setUnauthenticated,
  resetAuthMock,
} = vi.hoisted(() => {
  const mockPrisma = {
    quiz: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      update: vi.fn(),
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

  const createMockQuiz = (overrides = {}) => ({
    id: "quiz-123",
    title: "JavaScript基礎クイズ",
    description: "JavaScriptの基本的な知識をテストします",
    authorId: "user-123",
    categoryId: "cat-123",
    isPublic: true,
    timeLimit: 600,
    passingScore: 60,
    playCount: 100,
    avgScore: 75.5,
    likeCount: 10,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-15"),
    author: {
      id: "user-123",
      name: "Test User",
      image: "https://example.com/avatar.jpg",
      bio: "Test bio",
    },
    category: {
      id: "cat-123",
      name: "IT・テクノロジー",
      slug: "technology",
    },
    tags: [
      { tag: { id: "tag-1", name: "JavaScript", slug: "javascript" } },
    ],
    _count: { questions: 10 },
    ...overrides,
  });

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
    createMockQuiz,
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

import { GET, PUT, DELETE } from "./route";

function createRequest(url: string, options?: RequestInit) {
  return new NextRequest(new URL(url, "http://localhost:3000"), options);
}

function createParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/quizzes/[id]", () => {
  beforeEach(() => {
    resetPrismaMocks();
    resetAuthMock();
  });

  it("should return quiz details for public quiz", async () => {
    const mockQuiz = createMockQuiz();
    mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);

    const request = createRequest("/api/quizzes/quiz-123");
    const response = await GET(request, createParams("quiz-123"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe("quiz-123");
    expect(data.title).toBe(mockQuiz.title);
    expect(data.questionCount).toBe(10);
    expect(data.author).toBeDefined();
    expect(data.category).toBeDefined();
  });

  it("should return 404 for non-existent quiz", async () => {
    mockPrisma.quiz.findUnique.mockResolvedValue(null);

    const request = createRequest("/api/quizzes/nonexistent");
    const response = await GET(request, createParams("nonexistent"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Quiz not found");
  });

  it("should return 404 for private quiz when not authenticated", async () => {
    const mockQuiz = createMockQuiz({ isPublic: false });
    mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);
    setUnauthenticated();

    const request = createRequest("/api/quizzes/quiz-123");
    const response = await GET(request, createParams("quiz-123"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Quiz not found");
  });

  it("should return private quiz for author", async () => {
    const mockQuiz = createMockQuiz({ isPublic: false, authorId: "user-123" });
    mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);
    setAuthenticated();

    const request = createRequest("/api/quizzes/quiz-123");
    const response = await GET(request, createParams("quiz-123"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe("quiz-123");
  });

  it("should return 404 for private quiz when authenticated as different user", async () => {
    const mockQuiz = createMockQuiz({ isPublic: false, authorId: "other-user" });
    mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);
    setAuthenticated();

    const request = createRequest("/api/quizzes/quiz-123");
    const response = await GET(request, createParams("quiz-123"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Quiz not found");
  });

  it("should handle database errors gracefully", async () => {
    mockPrisma.quiz.findUnique.mockRejectedValue(new Error("Database error"));

    const request = createRequest("/api/quizzes/quiz-123");
    const response = await GET(request, createParams("quiz-123"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch quiz");
  });
});

describe("PUT /api/quizzes/[id]", () => {
  beforeEach(() => {
    resetPrismaMocks();
    resetAuthMock();
  });

  it("should require authentication", async () => {
    setUnauthenticated();

    const request = createRequest("/api/quizzes/quiz-123", {
      method: "PUT",
      body: JSON.stringify({ title: "Updated Title" }),
    });
    const response = await PUT(request, createParams("quiz-123"));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 404 for non-existent quiz", async () => {
    setAuthenticated();
    mockPrisma.quiz.findUnique.mockResolvedValue(null);

    const request = createRequest("/api/quizzes/nonexistent", {
      method: "PUT",
      body: JSON.stringify({ title: "Updated Title" }),
    });
    const response = await PUT(request, createParams("nonexistent"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Quiz not found");
  });

  it("should return 403 when user is not the author", async () => {
    setAuthenticated();
    mockPrisma.quiz.findUnique.mockResolvedValue({ authorId: "other-user" });

    const request = createRequest("/api/quizzes/quiz-123", {
      method: "PUT",
      body: JSON.stringify({ title: "Updated Title" }),
    });
    const response = await PUT(request, createParams("quiz-123"));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Forbidden");
  });

  it("should update quiz when user is the author", async () => {
    setAuthenticated();
    mockPrisma.quiz.findUnique.mockResolvedValue({ authorId: "user-123" });
    mockPrisma.quiz.update.mockResolvedValue(
      createMockQuiz({ title: "Updated Title" })
    );

    const request = createRequest("/api/quizzes/quiz-123", {
      method: "PUT",
      body: JSON.stringify({ title: "Updated Title" }),
    });
    const response = await PUT(request, createParams("quiz-123"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe("Updated Title");
  });

  it("should validate update data", async () => {
    setAuthenticated();
    mockPrisma.quiz.findUnique.mockResolvedValue({ authorId: "user-123" });

    const request = createRequest("/api/quizzes/quiz-123", {
      method: "PUT",
      body: JSON.stringify({ title: "ab" }), // Too short
    });
    const response = await PUT(request, createParams("quiz-123"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation error");
  });

  it("should handle database errors gracefully", async () => {
    setAuthenticated();
    mockPrisma.quiz.findUnique.mockResolvedValue({ authorId: "user-123" });
    mockPrisma.quiz.update.mockRejectedValue(new Error("Database error"));

    const request = createRequest("/api/quizzes/quiz-123", {
      method: "PUT",
      body: JSON.stringify({ title: "Updated Title" }),
    });
    const response = await PUT(request, createParams("quiz-123"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to update quiz");
  });
});

describe("DELETE /api/quizzes/[id]", () => {
  beforeEach(() => {
    resetPrismaMocks();
    resetAuthMock();
  });

  it("should require authentication", async () => {
    setUnauthenticated();

    const request = createRequest("/api/quizzes/quiz-123", { method: "DELETE" });
    const response = await DELETE(request, createParams("quiz-123"));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 404 for non-existent quiz", async () => {
    setAuthenticated();
    mockPrisma.quiz.findUnique.mockResolvedValue(null);

    const request = createRequest("/api/quizzes/nonexistent", { method: "DELETE" });
    const response = await DELETE(request, createParams("nonexistent"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Quiz not found");
  });

  it("should return 403 when user is not the author", async () => {
    setAuthenticated();
    mockPrisma.quiz.findUnique.mockResolvedValue({ authorId: "other-user" });

    const request = createRequest("/api/quizzes/quiz-123", { method: "DELETE" });
    const response = await DELETE(request, createParams("quiz-123"));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Forbidden");
  });

  it("should delete quiz and decrement user's quizzesCreated", async () => {
    setAuthenticated();
    mockPrisma.quiz.findUnique.mockResolvedValue({ authorId: "user-123" });
    mockPrisma.quiz.delete.mockResolvedValue({});
    mockPrisma.user.update.mockResolvedValue({});

    const request = createRequest("/api/quizzes/quiz-123", { method: "DELETE" });
    const response = await DELETE(request, createParams("quiz-123"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockPrisma.quiz.delete).toHaveBeenCalledWith({
      where: { id: "quiz-123" },
    });
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-123" },
        data: { quizzesCreated: { decrement: 1 } },
      })
    );
  });

  it("should handle database errors gracefully", async () => {
    setAuthenticated();
    mockPrisma.quiz.findUnique.mockResolvedValue({ authorId: "user-123" });
    mockPrisma.quiz.delete.mockRejectedValue(new Error("Database error"));

    const request = createRequest("/api/quizzes/quiz-123", { method: "DELETE" });
    const response = await DELETE(request, createParams("quiz-123"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to delete quiz");
  });
});
