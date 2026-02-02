import { describe, it, expect, vi, beforeEach } from "vitest";

// Create hoisted mock that can be used in vi.mock factory
const { mockPrisma, resetPrismaMocks, createMockCategory } = vi.hoisted(() => {
  const mockPrisma = {
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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

  const createMockCategory = (overrides = {}) => ({
    id: "cat-123",
    name: "IT・テクノロジー",
    slug: "technology",
    description: "コンピュータ、プログラミング、最新技術",
    icon: "💻",
    order: 1,
    createdAt: new Date("2024-01-01"),
    _count: { quizzes: 5 },
    ...overrides,
  });

  return { mockPrisma, resetPrismaMocks, createMockCategory };
});

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { GET } from "./route";

describe("GET /api/categories", () => {
  beforeEach(() => {
    resetPrismaMocks();
  });

  it("should return categories with quiz counts", async () => {
    const mockCategories = [
      createMockCategory({ id: "cat-1", name: "IT", slug: "it", order: 1 }),
      createMockCategory({ id: "cat-2", name: "Science", slug: "science", order: 2 }),
    ];

    mockPrisma.category.findMany.mockResolvedValue(mockCategories);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.categories).toHaveLength(2);
    expect(data.categories[0]).toHaveProperty("id");
    expect(data.categories[0]).toHaveProperty("name");
    expect(data.categories[0]).toHaveProperty("slug");
    expect(data.categories[0]).toHaveProperty("quizCount");
  });

  it("should return categories ordered by order field", async () => {
    const mockCategories = [
      createMockCategory({ id: "cat-1", order: 1 }),
      createMockCategory({ id: "cat-2", order: 2 }),
    ];

    mockPrisma.category.findMany.mockResolvedValue(mockCategories);

    await GET();

    expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { order: "asc" },
      })
    );
  });

  it("should return empty array when no categories exist", async () => {
    mockPrisma.category.findMany.mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.categories).toHaveLength(0);
  });

  it("should handle database errors gracefully", async () => {
    mockPrisma.category.findMany.mockRejectedValue(new Error("Database error"));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch categories");
  });

  it("should not include internal fields in response", async () => {
    const mockCategories = [createMockCategory()];
    mockPrisma.category.findMany.mockResolvedValue(mockCategories);

    const response = await GET();
    const data = await response.json();

    // Should include these fields
    expect(data.categories[0]).toHaveProperty("id");
    expect(data.categories[0]).toHaveProperty("name");
    expect(data.categories[0]).toHaveProperty("slug");
    expect(data.categories[0]).toHaveProperty("description");
    expect(data.categories[0]).toHaveProperty("icon");
    expect(data.categories[0]).toHaveProperty("quizCount");

    // Should not include internal fields
    expect(data.categories[0]).not.toHaveProperty("order");
    expect(data.categories[0]).not.toHaveProperty("createdAt");
    expect(data.categories[0]).not.toHaveProperty("_count");
  });
});
