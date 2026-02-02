import { vi } from "vitest";

// Mock Prisma client for testing
export const mockPrisma = {
  category: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
  },
  quiz: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  question: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  user: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  score: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  answerHistory: {
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
  },
  $transaction: vi.fn((callback) => callback(mockPrisma)),
};

// Reset all mocks
export function resetPrismaMocks() {
  Object.values(mockPrisma).forEach((model) => {
    if (typeof model === "object" && model !== null) {
      Object.values(model).forEach((method) => {
        if (typeof method === "function" && "mockReset" in method) {
          (method as ReturnType<typeof vi.fn>).mockReset();
        }
      });
    }
  });
}

// Helper to create mock category
export function createMockCategory(overrides = {}) {
  return {
    id: "cat-123",
    name: "IT・テクノロジー",
    slug: "technology",
    description: "コンピュータ、プログラミング、最新技術",
    icon: "💻",
    order: 1,
    createdAt: new Date("2024-01-01"),
    _count: { quizzes: 5 },
    ...overrides,
  };
}

// Helper to create mock quiz
export function createMockQuiz(overrides = {}) {
  return {
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
  };
}

// Helper to create mock question
export function createMockQuestion(overrides = {}) {
  return {
    id: "question-123",
    quizId: "quiz-123",
    content: "JavaScriptで変数を宣言するキーワードはどれですか？",
    options: ["var", "let", "const", "すべて正解"],
    correctIndex: 3,
    explanation: "var、let、constすべて変数を宣言できます",
    imageUrl: null,
    points: 10,
    order: 0,
    createdAt: new Date("2024-01-01"),
    ...overrides,
  };
}

// Helper to create mock user
export function createMockUser(overrides = {}) {
  return {
    id: "user-123",
    name: "Test User",
    email: "test@example.com",
    emailVerified: null,
    image: "https://example.com/avatar.jpg",
    displayName: "テストユーザー",
    bio: "テストユーザーです",
    totalScore: 1000,
    quizzesTaken: 50,
    quizzesCreated: 5,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-15"),
    ...overrides,
  };
}

// Helper to create mock score
export function createMockScore(overrides = {}) {
  return {
    id: "score-123",
    userId: "user-123",
    quizId: "quiz-123",
    score: 80,
    maxScore: 100,
    percentage: 80,
    correctCount: 8,
    totalCount: 10,
    timeSpent: 300,
    createdAt: new Date("2024-01-01"),
    ...overrides,
  };
}
