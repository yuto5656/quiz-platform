import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockPrisma, resetPrismaMocks } = vi.hoisted(() => {
  const mockPrisma = {
    tag: {
      findMany: vi.fn(),
    },
  };

  const resetPrismaMocks = () => {
    mockPrisma.tag.findMany.mockReset();
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

describe("GET /api/tags", () => {
  beforeEach(() => {
    resetPrismaMocks();
  });

  it("should return all tags", async () => {
    const mockTags = [
      { id: "tag-1", name: "JavaScript", slug: "javascript", _count: { quizzes: 10 } },
      { id: "tag-2", name: "Python", slug: "python", _count: { quizzes: 5 } },
    ];
    mockPrisma.tag.findMany.mockResolvedValue(mockTags);

    const request = createRequest("/api/tags");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.tags).toHaveLength(2);
    expect(data.tags[0]).toEqual({
      id: "tag-1",
      name: "JavaScript",
      slug: "javascript",
      quizCount: 10,
    });
  });

  it("should filter tags by query", async () => {
    mockPrisma.tag.findMany.mockResolvedValue([]);

    const request = createRequest("/api/tags?q=java");
    await GET(request);

    expect(mockPrisma.tag.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { name: { contains: "java", mode: "insensitive" } },
            { slug: { contains: "java", mode: "insensitive" } },
          ],
        },
      })
    );
  });

  it("should limit results", async () => {
    mockPrisma.tag.findMany.mockResolvedValue([]);

    const request = createRequest("/api/tags?limit=10");
    await GET(request);

    expect(mockPrisma.tag.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
      })
    );
  });

  it("should cap limit at 100", async () => {
    mockPrisma.tag.findMany.mockResolvedValue([]);

    const request = createRequest("/api/tags?limit=500");
    await GET(request);

    expect(mockPrisma.tag.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 100,
      })
    );
  });

  it("should handle database errors gracefully", async () => {
    mockPrisma.tag.findMany.mockRejectedValue(new Error("Database error"));

    const request = createRequest("/api/tags");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch tags");
  });
});
