import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Create hoisted mocks
const { mockPrisma, resetPrismaMocks } = vi.hoisted(() => {
  const mockPrisma = {
    user: {
      findMany: vi.fn(),
    },
    quiz: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
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

  return { mockPrisma, resetPrismaMocks };
});

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { GET } from "./route";

function createRequest(url: string) {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

describe("GET /api/rankings", () => {
  beforeEach(() => {
    resetPrismaMocks();
  });

  describe("type=users (default)", () => {
    it("should return user rankings by total score", async () => {
      const mockUsers = [
        {
          id: "user-1",
          name: "Top Player",
          image: "https://example.com/avatar1.jpg",
          displayName: "TopPlayer",
          totalScore: 1000,
          quizzesTaken: 50,
          quizzesCreated: 5,
        },
        {
          id: "user-2",
          name: "Second Player",
          image: null,
          displayName: null,
          totalScore: 800,
          quizzesTaken: 40,
          quizzesCreated: 3,
        },
      ];
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const request = createRequest("/api/rankings");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.type).toBe("users");
      expect(data.period).toBe("all");
      expect(data.rankings).toHaveLength(2);
      expect(data.rankings[0].rank).toBe(1);
      expect(data.rankings[0].user.name).toBe("TopPlayer");
      expect(data.rankings[0].user.totalScore).toBe(1000);
      expect(data.rankings[1].rank).toBe(2);
      expect(data.rankings[1].user.name).toBe("Second Player");
    });

    it("should use displayName when available", async () => {
      const mockUsers = [
        {
          id: "user-1",
          name: "Real Name",
          displayName: "Display Name",
          image: null,
          totalScore: 500,
          quizzesTaken: 10,
          quizzesCreated: 2,
        },
      ];
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const request = createRequest("/api/rankings?type=users");
      const response = await GET(request);
      const data = await response.json();

      expect(data.rankings[0].user.name).toBe("Display Name");
    });

    it("should respect limit parameter", async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const request = createRequest("/api/rankings?type=users&limit=5");
      await GET(request);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });

    it("should cap limit at 100", async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const request = createRequest("/api/rankings?type=users&limit=500");
      await GET(request);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });

    it("should filter by month period", async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const request = createRequest("/api/rankings?type=users&period=month");
      const response = await GET(request);
      const data = await response.json();

      expect(data.period).toBe("month");
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            scores: expect.objectContaining({
              some: expect.objectContaining({
                createdAt: expect.objectContaining({
                  gte: expect.any(Date),
                }),
              }),
            }),
          }),
        })
      );
    });

    it("should filter by week period", async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const request = createRequest("/api/rankings?type=users&period=week");
      const response = await GET(request);
      const data = await response.json();

      expect(data.period).toBe("week");
    });
  });

  describe("type=quizzes", () => {
    it("should return quiz rankings by play count", async () => {
      const mockQuizzes = [
        {
          id: "quiz-1",
          title: "Popular Quiz",
          author: { id: "author-1", name: "Author 1", image: null },
          category: { id: "cat-1", name: "Science", slug: "science" },
          _count: { questions: 10 },
          playCount: 500,
          avgScore: 72.5,
          likeCount: 50,
        },
        {
          id: "quiz-2",
          title: "Second Quiz",
          author: { id: "author-2", name: "Author 2", image: null },
          category: { id: "cat-2", name: "History", slug: "history" },
          _count: { questions: 5 },
          playCount: 300,
          avgScore: 65.0,
          likeCount: 30,
        },
      ];
      mockPrisma.quiz.findMany.mockResolvedValue(mockQuizzes);

      const request = createRequest("/api/rankings?type=quizzes");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.type).toBe("quizzes");
      expect(data.rankings).toHaveLength(2);
      expect(data.rankings[0].rank).toBe(1);
      expect(data.rankings[0].quiz.title).toBe("Popular Quiz");
      expect(data.rankings[0].quiz.playCount).toBe(500);
      expect(data.rankings[0].quiz.questionCount).toBe(10);
    });

    it("should only include public quizzes", async () => {
      mockPrisma.quiz.findMany.mockResolvedValue([]);

      const request = createRequest("/api/rankings?type=quizzes");
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

  describe("type=creators", () => {
    it("should return creator rankings by quizzes created", async () => {
      const mockCreators = [
        {
          id: "creator-1",
          name: "Top Creator",
          image: "https://example.com/avatar.jpg",
          displayName: "TopCreator",
          quizzesCreated: 20,
          _count: { quizzes: 18 },
        },
        {
          id: "creator-2",
          name: "Second Creator",
          image: null,
          displayName: null,
          quizzesCreated: 15,
          _count: { quizzes: 12 },
        },
      ];
      mockPrisma.user.findMany.mockResolvedValue(mockCreators);
      mockPrisma.quiz.aggregate
        .mockResolvedValueOnce({
          _sum: { playCount: 1000, likeCount: 100 },
        })
        .mockResolvedValueOnce({
          _sum: { playCount: 500, likeCount: 50 },
        });

      const request = createRequest("/api/rankings?type=creators");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.type).toBe("creators");
      expect(data.rankings).toHaveLength(2);
      expect(data.rankings[0].rank).toBe(1);
      expect(data.rankings[0].creator.name).toBe("TopCreator");
      expect(data.rankings[0].creator.quizzesCreated).toBe(20);
      expect(data.rankings[0].creator.totalPlays).toBe(1000);
      expect(data.rankings[0].creator.totalLikes).toBe(100);
    });

    it("should only include users with at least one quiz", async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const request = createRequest("/api/rankings?type=creators");
      await GET(request);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            quizzesCreated: { gt: 0 },
          }),
        })
      );
    });

    it("should handle null aggregate values", async () => {
      const mockCreators = [
        {
          id: "creator-1",
          name: "New Creator",
          image: null,
          displayName: null,
          quizzesCreated: 1,
          _count: { quizzes: 1 },
        },
      ];
      mockPrisma.user.findMany.mockResolvedValue(mockCreators);
      mockPrisma.quiz.aggregate.mockResolvedValue({
        _sum: { playCount: null, likeCount: null },
      });

      const request = createRequest("/api/rankings?type=creators");
      const response = await GET(request);
      const data = await response.json();

      expect(data.rankings[0].creator.totalPlays).toBe(0);
      expect(data.rankings[0].creator.totalLikes).toBe(0);
    });
  });

  describe("error handling", () => {
    it("should return 400 for invalid ranking type", async () => {
      const request = createRequest("/api/rankings?type=invalid");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid ranking type");
    });

    it("should handle database errors gracefully", async () => {
      mockPrisma.user.findMany.mockRejectedValue(new Error("Database error"));

      const request = createRequest("/api/rankings?type=users");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch rankings");
    });
  });
});
