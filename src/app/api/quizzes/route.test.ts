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
  // Prisma mock
  const mockPrisma = {
    quiz: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    $transaction: vi.fn((callback: (prisma: typeof mockPrisma) => Promise<unknown>) => callback(mockPrisma)),
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
    },
    category: {
      id: "cat-123",
      name: "IT・テクノロジー",
      slug: "technology",
    },
    _count: { questions: 10 },
    ...overrides,
  });

  // Auth mock
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

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

import { GET, POST } from "./route";

// Helper to create NextRequest
function createRequest(url: string, options?: RequestInit) {
  return new NextRequest(new URL(url, "http://localhost:3000"), options);
}

describe("GET /api/quizzes", () => {
  beforeEach(() => {
    resetPrismaMocks();
    resetAuthMock();
  });

  it("should return paginated quizzes", async () => {
    const mockQuizzes = [
      createMockQuiz({ id: "quiz-1" }),
      createMockQuiz({ id: "quiz-2" }),
    ];

    mockPrisma.quiz.findMany.mockResolvedValue(mockQuizzes);
    mockPrisma.quiz.count.mockResolvedValue(2);

    const request = createRequest("/api/quizzes");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.quizzes).toHaveLength(2);
    expect(data.total).toBe(2);
    expect(data.totalPages).toBe(1);
  });

  it("should filter by category", async () => {
    mockPrisma.quiz.findMany.mockResolvedValue([]);
    mockPrisma.quiz.count.mockResolvedValue(0);

    const request = createRequest("/api/quizzes?categoryId=cat-123");
    await GET(request);

    expect(mockPrisma.quiz.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          categoryId: "cat-123",
        }),
      })
    );
  });

  it("should filter by search query", async () => {
    mockPrisma.quiz.findMany.mockResolvedValue([]);
    mockPrisma.quiz.count.mockResolvedValue(0);

    const request = createRequest("/api/quizzes?q=javascript");
    await GET(request);

    expect(mockPrisma.quiz.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ title: expect.any(Object) }),
            expect.objectContaining({ description: expect.any(Object) }),
          ]),
        }),
      })
    );
  });

  it("should sort by popular", async () => {
    mockPrisma.quiz.findMany.mockResolvedValue([]);
    mockPrisma.quiz.count.mockResolvedValue(0);

    const request = createRequest("/api/quizzes?sortBy=popular");
    await GET(request);

    expect(mockPrisma.quiz.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { playCount: "desc" },
      })
    );
  });

  it("should sort by newest by default", async () => {
    mockPrisma.quiz.findMany.mockResolvedValue([]);
    mockPrisma.quiz.count.mockResolvedValue(0);

    const request = createRequest("/api/quizzes");
    await GET(request);

    expect(mockPrisma.quiz.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: "desc" },
      })
    );
  });

  it("should handle pagination", async () => {
    mockPrisma.quiz.findMany.mockResolvedValue([]);
    mockPrisma.quiz.count.mockResolvedValue(100);

    const request = createRequest("/api/quizzes?page=2&limit=10");
    await GET(request);

    expect(mockPrisma.quiz.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10, // (page 2 - 1) * 10
        take: 10,
      })
    );
  });

  it("should handle database errors gracefully", async () => {
    mockPrisma.quiz.findMany.mockRejectedValue(new Error("Database error"));

    const request = createRequest("/api/quizzes");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch quizzes");
  });

  it("should only return public quizzes", async () => {
    mockPrisma.quiz.findMany.mockResolvedValue([]);
    mockPrisma.quiz.count.mockResolvedValue(0);

    const request = createRequest("/api/quizzes");
    await GET(request);

    expect(mockPrisma.quiz.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isPublic: true,
        }),
      })
    );
  });
});

describe("POST /api/quizzes", () => {
  beforeEach(() => {
    resetPrismaMocks();
    resetAuthMock();
  });

  const validQuizData = {
    title: "Test Quiz",
    description: "A test quiz",
    categoryId: "cat-123",
    isPublic: true,
    timeLimit: 600,
    passingScore: 60,
    questions: [
      {
        content: "What is 2 + 2?",
        options: ["3", "4", "5", "6"],
        correctIndices: [1],
        isMultipleChoice: false,
        explanation: "Basic math",
        points: 10,
      },
    ],
  };

  it("should require authentication", async () => {
    setUnauthenticated();

    const request = createRequest("/api/quizzes", {
      method: "POST",
      body: JSON.stringify(validQuizData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should create a quiz when authenticated", async () => {
    setAuthenticated();

    const createdQuiz = createMockQuiz({ id: "new-quiz-123" });
    mockPrisma.quiz.create.mockResolvedValue(createdQuiz);
    mockPrisma.user.update.mockResolvedValue({});

    const request = createRequest("/api/quizzes", {
      method: "POST",
      body: JSON.stringify(validQuizData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe("new-quiz-123");
  });

  it("should validate required fields", async () => {
    setAuthenticated();

    const invalidData = {
      title: "", // Too short
      categoryId: "cat-123",
      questions: [],
    };

    const request = createRequest("/api/quizzes", {
      method: "POST",
      body: JSON.stringify(invalidData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation error");
    expect(data.details).toBeDefined();
  });

  it("should validate question structure", async () => {
    setAuthenticated();

    const invalidData = {
      ...validQuizData,
      questions: [
        {
          content: "Question?",
          options: ["Only one option"], // Needs at least 2
          correctIndices: [0],
        },
      ],
    };

    const request = createRequest("/api/quizzes", {
      method: "POST",
      body: JSON.stringify(invalidData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation error");
  });

  it("should increment user's quizzesCreated count", async () => {
    setAuthenticated();

    mockPrisma.quiz.create.mockResolvedValue(createMockQuiz());
    mockPrisma.user.update.mockResolvedValue({});

    const request = createRequest("/api/quizzes", {
      method: "POST",
      body: JSON.stringify(validQuizData),
    });

    await POST(request);

    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-123" },
        data: { quizzesCreated: { increment: 1 } },
      })
    );
  });

  it("should handle database errors during creation", async () => {
    setAuthenticated();
    mockPrisma.quiz.create.mockRejectedValue(new Error("Database error"));

    const request = createRequest("/api/quizzes", {
      method: "POST",
      body: JSON.stringify(validQuizData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to create quiz");
  });
});
