import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
  categoryId: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["popular", "newest", "score"]).default("newest"),
  authorId: z.string().optional(),
  status: z.enum(["draft", "published", "all"]).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse({
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 12,
      categoryId: searchParams.get("categoryId") || searchParams.get("category") || undefined,
      search: searchParams.get("search") || searchParams.get("q") || undefined,
      sortBy: searchParams.get("sortBy") || "newest",
      authorId: searchParams.get("authorId") || undefined,
      status: searchParams.get("status") || undefined,
    });

    // Build where clause based on status and auth
    const statusFilter = params.status === "draft"
      ? { status: "draft" as const, authorId: session?.user?.id } // Drafts only for owner
      : params.status === "all" && session?.user?.id === params.authorId
        ? {} // All statuses for owner viewing their own
        : { status: "published" as const, isPublic: true }; // Default: published & public

    const where = {
      ...statusFilter,
      ...(params.categoryId && { categoryId: params.categoryId }),
      ...(params.authorId && { authorId: params.authorId }),
      ...(params.search && {
        OR: [
          { title: { contains: params.search, mode: "insensitive" as const } },
          { description: { contains: params.search, mode: "insensitive" as const } },
        ],
      }),
    };

    const orderBy = {
      popular: { playCount: "desc" as const },
      newest: { createdAt: "desc" as const },
      score: { avgScore: "desc" as const },
    }[params.sortBy];

    const [quizzes, totalCount] = await Promise.all([
      prisma.quiz.findMany({
        where,
        orderBy,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        include: {
          author: {
            select: { id: true, name: true, image: true },
          },
          category: {
            select: { id: true, name: true, slug: true },
          },
          _count: {
            select: { questions: true },
          },
        },
      }),
      prisma.quiz.count({ where }),
    ]);

    const result = quizzes.map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      author: quiz.author,
      category: quiz.category,
      status: quiz.status,
      questionCount: quiz._count.questions,
      playCount: quiz.playCount,
      avgScore: quiz.avgScore,
      timeLimit: quiz.timeLimit,
      createdAt: quiz.createdAt.toISOString(),
      publishedAt: quiz.publishedAt?.toISOString() || null,
    }));

    return NextResponse.json({
      quizzes: result,
      total: totalCount,
      totalPages: Math.ceil(totalCount / params.limit),
      pagination: {
        currentPage: params.page,
        totalPages: Math.ceil(totalCount / params.limit),
        totalItems: totalCount,
      },
    });
  } catch (error) {
    console.error("Failed to fetch quizzes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quizzes" },
      { status: 500 }
    );
  }
}

// Question schema for drafts (relaxed validation)
const draftQuestionSchema = z.object({
  content: z.string().max(1000).default(""),
  options: z.array(z.string()).default([]),
  correctIndices: z.array(z.number().int().min(0)).default([0]),
  isMultipleChoice: z.boolean().default(false),
  explanation: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  points: z.number().int().min(1).max(100).default(10),
});

// Question schema for published quizzes (strict validation)
const publishedQuestionSchema = z.object({
  content: z.string().min(1).max(1000),
  options: z.array(z.string().min(1)).min(2).max(6),
  correctIndices: z.array(z.number().int().min(0)).min(1),
  isMultipleChoice: z.boolean().default(false),
  explanation: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  points: z.number().int().min(1).max(100).default(10),
});

// Schema for creating/updating drafts
const draftQuizSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  categoryId: z.string().optional(),
  isPublic: z.boolean().default(true),
  timeLimit: z.number().int().min(30).max(7200).nullable().optional(),
  passingScore: z.number().int().min(0).max(100).default(60),
  questions: z.array(draftQuestionSchema).default([]),
  status: z.literal("draft"),
});

// Schema for publishing quizzes
const publishQuizSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  categoryId: z.string().min(1),
  isPublic: z.boolean().default(true),
  timeLimit: z.number().int().min(30).max(7200).nullable().optional(),
  passingScore: z.number().int().min(0).max(100).default(60),
  questions: z.array(publishedQuestionSchema).min(1),
  status: z.literal("published"),
});

const createQuizSchema = z.discriminatedUnion("status", [draftQuizSchema, publishQuizSchema]);

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createQuizSchema.parse(body);

    const isDraft = data.status === "draft";

    const quiz = await prisma.quiz.create({
      data: {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId || null,
        authorId: session.user.id,
        status: data.status,
        isPublic: data.isPublic,
        timeLimit: data.timeLimit,
        passingScore: data.passingScore,
        publishedAt: isDraft ? null : new Date(),
        questions: {
          create: data.questions.map((q, index) => ({
            content: q.content,
            options: q.options,
            correctIndices: q.correctIndices,
            isMultipleChoice: q.isMultipleChoice,
            explanation: q.explanation || null,
            imageUrl: q.imageUrl || null,
            points: q.points,
            order: index,
          })),
        },
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { questions: true } },
      },
    });

    // Only increment quizzesCreated for published quizzes
    if (!isDraft) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { quizzesCreated: { increment: 1 } },
      });
    }

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", JSON.stringify(error.issues, null, 2));
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to create quiz:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create quiz", message: errorMessage },
      { status: 500 }
    );
  }
}
