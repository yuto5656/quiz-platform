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
    quiz: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    score: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    answerHistory: {
      create: vi.fn(),
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

import { POST } from "./route";

function createRequest(url: string, options?: RequestInit) {
  return new NextRequest(new URL(url, "http://localhost:3000"), options);
}

describe("POST /api/scores", () => {
  beforeEach(() => {
    resetPrismaMocks();
    resetAuthMock();
  });

  const validAnswerData = {
    quizId: "quiz-123",
    answers: [
      { questionId: "q1", selectedIndices: [1] },
      { questionId: "q2", selectedIndices: [2] },
    ],
    totalTimeSpent: 120,
  };

  const mockQuiz = {
    id: "quiz-123",
    passingScore: 50,
    questions: [
      { id: "q1", correctIndices: [1], isMultipleChoice: false, points: 10, explanation: "Explanation 1" },
      { id: "q2", correctIndices: [2], isMultipleChoice: false, points: 10, explanation: "Explanation 2" },
    ],
  };

  it("should require authentication", async () => {
    setUnauthenticated();

    const request = createRequest("/api/scores", {
      method: "POST",
      body: JSON.stringify(validAnswerData),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 404 for non-existent quiz", async () => {
    setAuthenticated();
    mockPrisma.quiz.findUnique.mockResolvedValue(null);

    const request = createRequest("/api/scores", {
      method: "POST",
      body: JSON.stringify(validAnswerData),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Quiz not found");
  });

  it("should calculate score correctly for all correct answers", async () => {
    setAuthenticated();
    mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);
    mockPrisma.answerHistory.create.mockResolvedValue({});
    mockPrisma.score.create.mockResolvedValue({ id: "score-123" });
    mockPrisma.score.findMany.mockResolvedValue([{ percentage: 100 }]);
    mockPrisma.quiz.update.mockResolvedValue({});
    mockPrisma.user.update.mockResolvedValue({});

    const request = createRequest("/api/scores", {
      method: "POST",
      body: JSON.stringify(validAnswerData),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.scoreId).toBe("score-123");
    expect(data.score).toBe(20);
    expect(data.maxScore).toBe(20);
    expect(data.percentage).toBe(100);
    expect(data.correctCount).toBe(2);
    expect(data.totalCount).toBe(2);
    expect(data.passed).toBe(true);
  });

  it("should calculate score correctly for partial correct answers", async () => {
    setAuthenticated();
    mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);
    mockPrisma.answerHistory.create.mockResolvedValue({});
    mockPrisma.score.create.mockResolvedValue({ id: "score-123" });
    mockPrisma.score.findMany.mockResolvedValue([{ percentage: 50 }]);
    mockPrisma.quiz.update.mockResolvedValue({});
    mockPrisma.user.update.mockResolvedValue({});

    const partialAnswerData = {
      quizId: "quiz-123",
      answers: [
        { questionId: "q1", selectedIndices: [1] }, // Correct
        { questionId: "q2", selectedIndices: [0] }, // Wrong
      ],
    };

    const request = createRequest("/api/scores", {
      method: "POST",
      body: JSON.stringify(partialAnswerData),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.score).toBe(10);
    expect(data.maxScore).toBe(20);
    expect(data.percentage).toBe(50);
    expect(data.correctCount).toBe(1);
    expect(data.passed).toBe(true); // 50% >= 50% passing score
  });

  it("should return passed=false when below passing score", async () => {
    setAuthenticated();
    const quizWithHighPassingScore = {
      ...mockQuiz,
      passingScore: 80,
    };
    mockPrisma.quiz.findUnique.mockResolvedValue(quizWithHighPassingScore);
    mockPrisma.answerHistory.create.mockResolvedValue({});
    mockPrisma.score.create.mockResolvedValue({ id: "score-123" });
    mockPrisma.score.findMany.mockResolvedValue([{ percentage: 50 }]);
    mockPrisma.quiz.update.mockResolvedValue({});
    mockPrisma.user.update.mockResolvedValue({});

    const partialAnswerData = {
      quizId: "quiz-123",
      answers: [
        { questionId: "q1", selectedIndices: [1] },
        { questionId: "q2", selectedIndices: [0] },
      ],
    };

    const request = createRequest("/api/scores", {
      method: "POST",
      body: JSON.stringify(partialAnswerData),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(data.passed).toBe(false);
  });

  it("should include results with correct answers and explanations", async () => {
    setAuthenticated();
    mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);
    mockPrisma.answerHistory.create.mockResolvedValue({});
    mockPrisma.score.create.mockResolvedValue({ id: "score-123" });
    mockPrisma.score.findMany.mockResolvedValue([{ percentage: 100 }]);
    mockPrisma.quiz.update.mockResolvedValue({});
    mockPrisma.user.update.mockResolvedValue({});

    const request = createRequest("/api/scores", {
      method: "POST",
      body: JSON.stringify(validAnswerData),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(data.results).toHaveLength(2);
    expect(data.results[0]).toEqual({
      questionId: "q1",
      isCorrect: true,
      selectedIndices: [1],
      correctIndices: [1],
      isMultipleChoice: false,
      explanation: "Explanation 1",
    });
  });

  it("should validate request body schema", async () => {
    setAuthenticated();

    const invalidData = {
      quizId: "quiz-123",
      // Missing answers field
    };

    const request = createRequest("/api/scores", {
      method: "POST",
      body: JSON.stringify(invalidData),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation error");
  });

  it("should update quiz playCount and avgScore", async () => {
    setAuthenticated();
    mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);
    mockPrisma.answerHistory.create.mockResolvedValue({});
    mockPrisma.score.create.mockResolvedValue({ id: "score-123" });
    mockPrisma.score.findMany.mockResolvedValue([
      { percentage: 80 },
      { percentage: 100 },
    ]);
    mockPrisma.quiz.update.mockResolvedValue({});
    mockPrisma.user.update.mockResolvedValue({});

    const request = createRequest("/api/scores", {
      method: "POST",
      body: JSON.stringify(validAnswerData),
    });
    await POST(request);

    expect(mockPrisma.quiz.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "quiz-123" },
        data: {
          playCount: { increment: 1 },
          avgScore: 90, // (80 + 100) / 2
        },
      })
    );
  });

  it("should update user totalScore and quizzesTaken", async () => {
    setAuthenticated();
    mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);
    mockPrisma.answerHistory.create.mockResolvedValue({});
    mockPrisma.score.create.mockResolvedValue({ id: "score-123" });
    mockPrisma.score.findMany.mockResolvedValue([{ percentage: 100 }]);
    mockPrisma.quiz.update.mockResolvedValue({});
    mockPrisma.user.update.mockResolvedValue({});

    const request = createRequest("/api/scores", {
      method: "POST",
      body: JSON.stringify(validAnswerData),
    });
    await POST(request);

    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-123" },
        data: {
          totalScore: { increment: 20 },
          quizzesTaken: { increment: 1 },
        },
      })
    );
  });

  it("should handle database errors gracefully", async () => {
    setAuthenticated();
    mockPrisma.quiz.findUnique.mockRejectedValue(new Error("Database error"));

    const request = createRequest("/api/scores", {
      method: "POST",
      body: JSON.stringify(validAnswerData),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to submit answers");
  });
});
