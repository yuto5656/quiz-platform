import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Create hoisted mocks
const {
  mockPrisma,
  resetPrismaMocks,
  mockAuth,
  setAuthenticated,
  setUnauthenticated,
  resetAuthMock,
} = vi.hoisted(() => {
  const mockPrisma = {
    like: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    quiz: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
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
    if (typeof mockPrisma.$transaction === "function") {
      mockPrisma.$transaction.mockReset();
    }
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

import { GET, POST, DELETE } from "./route";

function createRequest(url: string, options?: RequestInit) {
  return new NextRequest(new URL(url, "http://localhost:3000"), options);
}

describe("GET /api/likes", () => {
  beforeEach(() => {
    resetPrismaMocks();
    resetAuthMock();
  });

  it("should require authentication", async () => {
    setUnauthenticated();

    const request = createRequest("/api/likes");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return user's liked quizzes", async () => {
    setAuthenticated();
    const mockLikes = [
      {
        id: "like-1",
        quizId: "quiz-1",
        createdAt: new Date("2024-01-01"),
        quiz: {
          id: "quiz-1",
          title: "Test Quiz",
          description: "A test quiz",
          author: { id: "author-1", name: "Author", image: null },
          category: { id: "cat-1", name: "Category", slug: "category" },
          _count: { questions: 5 },
          playCount: 100,
          avgScore: 75.5,
        },
      },
    ];
    mockPrisma.like.findMany.mockResolvedValue(mockLikes);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.likes).toHaveLength(1);
    expect(data.likes[0].quizId).toBe("quiz-1");
    expect(data.likes[0].quiz.title).toBe("Test Quiz");
    expect(data.likes[0].quiz.questionCount).toBe(5);
  });

  it("should return empty array when no likes", async () => {
    setAuthenticated();
    mockPrisma.like.findMany.mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.likes).toEqual([]);
  });

  it("should handle database errors gracefully", async () => {
    setAuthenticated();
    mockPrisma.like.findMany.mockRejectedValue(new Error("Database error"));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch likes");
  });
});

describe("POST /api/likes", () => {
  beforeEach(() => {
    resetPrismaMocks();
    resetAuthMock();
  });

  it("should require authentication", async () => {
    setUnauthenticated();

    const request = createRequest("/api/likes", {
      method: "POST",
      body: JSON.stringify({ quizId: "quiz-1" }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should create a like for existing quiz", async () => {
    setAuthenticated();
    mockPrisma.quiz.findUnique.mockResolvedValue({ id: "quiz-1" });
    mockPrisma.like.findUnique.mockResolvedValue(null);
    mockPrisma.$transaction.mockResolvedValue([
      { id: "like-1", quizId: "quiz-1" },
      {},
    ]);

    const request = createRequest("/api/likes", {
      method: "POST",
      body: JSON.stringify({ quizId: "quiz-1" }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe("like-1");
    expect(data.quizId).toBe("quiz-1");
  });

  it("should return 404 for non-existent quiz", async () => {
    setAuthenticated();
    mockPrisma.quiz.findUnique.mockResolvedValue(null);

    const request = createRequest("/api/likes", {
      method: "POST",
      body: JSON.stringify({ quizId: "non-existent" }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Quiz not found");
  });

  it("should return 400 when already liked", async () => {
    setAuthenticated();
    mockPrisma.quiz.findUnique.mockResolvedValue({ id: "quiz-1" });
    mockPrisma.like.findUnique.mockResolvedValue({ id: "existing-like" });

    const request = createRequest("/api/likes", {
      method: "POST",
      body: JSON.stringify({ quizId: "quiz-1" }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Already liked");
  });

  it("should validate request body", async () => {
    setAuthenticated();

    const request = createRequest("/api/likes", {
      method: "POST",
      body: JSON.stringify({}), // Missing quizId
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation error");
  });

  it("should handle database errors gracefully", async () => {
    setAuthenticated();
    mockPrisma.quiz.findUnique.mockRejectedValue(new Error("Database error"));

    const request = createRequest("/api/likes", {
      method: "POST",
      body: JSON.stringify({ quizId: "quiz-1" }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to add like");
  });
});

describe("DELETE /api/likes", () => {
  beforeEach(() => {
    resetPrismaMocks();
    resetAuthMock();
  });

  it("should require authentication", async () => {
    setUnauthenticated();

    const request = createRequest("/api/likes?quizId=quiz-1", {
      method: "DELETE",
    });
    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should delete an existing like", async () => {
    setAuthenticated();
    mockPrisma.like.findUnique.mockResolvedValue({ id: "like-1" });
    mockPrisma.$transaction.mockResolvedValue([{}, {}]);

    const request = createRequest("/api/likes?quizId=quiz-1", {
      method: "DELETE",
    });
    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should return 400 when quizId is missing", async () => {
    setAuthenticated();

    const request = createRequest("/api/likes", {
      method: "DELETE",
    });
    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("quizId is required");
  });

  it("should return 404 when like not found", async () => {
    setAuthenticated();
    mockPrisma.like.findUnique.mockResolvedValue(null);

    const request = createRequest("/api/likes?quizId=quiz-1", {
      method: "DELETE",
    });
    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Like not found");
  });

  it("should handle database errors gracefully", async () => {
    setAuthenticated();
    mockPrisma.like.findUnique.mockRejectedValue(new Error("Database error"));

    const request = createRequest("/api/likes?quizId=quiz-1", {
      method: "DELETE",
    });
    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to remove like");
  });
});
