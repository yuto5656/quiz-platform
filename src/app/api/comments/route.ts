import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/env";
import { z } from "zod";

const createCommentSchema = z.object({
  quizId: z.string().min(1),
  questionId: z.string().optional(), // 問題ごとのコメント用（任意）
  content: z.string().min(1).max(2000),
  parentId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createCommentSchema.parse(body);

    // Verify quiz exists (status check removed - if user can access play page, they can comment)
    const quiz = await prisma.quiz.findUnique({
      where: { id: data.quizId },
      select: { id: true },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Verify question exists if provided
    if (data.questionId) {
      const question = await prisma.question.findFirst({
        where: { id: data.questionId, quizId: data.quizId },
        select: { id: true },
      });

      if (!question) {
        return NextResponse.json(
          { error: "Question not found" },
          { status: 404 }
        );
      }
    }

    // Verify parent comment exists if provided
    if (data.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: data.parentId },
        select: { quizId: true, questionId: true },
      });

      if (!parentComment || parentComment.quizId !== data.quizId) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }

      // If replying to a question comment, inherit the questionId
      if (parentComment.questionId && !data.questionId) {
        data.questionId = parentComment.questionId;
      }
    }

    const comment = await prisma.comment.create({
      data: {
        quizId: data.quizId,
        questionId: data.questionId || null,
        userId: session.user.id,
        content: data.content,
        parentId: data.parentId || null,
      },
      include: {
        user: {
          select: { id: true, name: true, displayName: true, image: true, email: true, customAvatar: true },
        },
      },
    });

    return NextResponse.json(
      {
        id: comment.id,
        content: comment.content,
        user: {
          id: comment.user.id,
          name: comment.user.name,
          displayName: comment.user.displayName,
          image: comment.user.image,
          customAvatar: comment.user.customAvatar,
          isAdmin: isAdminEmail(comment.user.email),
        },
        questionId: comment.questionId,
        parentId: comment.parentId,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        replies: [],
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to create comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

const querySchema = z.object({
  quizId: z.string().min(1),
  questionId: z.string().optional(), // 問題ごとのコメント取得用
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questionIdParam = searchParams.get("questionId");
    const params = querySchema.parse({
      quizId: searchParams.get("quizId") || "",
      questionId: questionIdParam && questionIdParam.length > 0 ? questionIdParam : undefined,
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
    });

    // Verify quiz exists (status check removed - if user can access play page, they can see comments)
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.quizId },
      select: { id: true },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Build where clause for filtering
    const whereClause = {
      quizId: params.quizId,
      parentId: null, // Only top-level comments
      // questionId filter: if provided, filter by questionId; if not, get quiz-level comments (questionId is null)
      questionId: params.questionId || null,
    };

    // Get top-level comments with replies
    const [comments, totalCount] = await Promise.all([
      prisma.comment.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        include: {
          user: {
            select: { id: true, name: true, displayName: true, image: true, email: true, customAvatar: true },
          },
          replies: {
            orderBy: { createdAt: "asc" },
            include: {
              user: {
                select: { id: true, name: true, displayName: true, image: true, email: true, customAvatar: true },
              },
            },
          },
        },
      }),
      prisma.comment.count({
        where: whereClause,
      }),
    ]);

    const formatUser = (user: { id: string; name: string | null; displayName: string | null; image: string | null; email: string | null; customAvatar: string | null }) => ({
      id: user.id,
      name: user.name,
      displayName: user.displayName,
      image: user.image,
      customAvatar: user.customAvatar,
      isAdmin: isAdminEmail(user.email),
    });

    const formattedComments = comments.map((c) => ({
      id: c.id,
      content: c.content,
      user: formatUser(c.user),
      questionId: c.questionId,
      parentId: c.parentId,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      replies: c.replies.map((r) => ({
        id: r.id,
        content: r.content,
        user: formatUser(r.user),
        questionId: r.questionId,
        parentId: r.parentId,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    }));

    return NextResponse.json({
      comments: formattedComments,
      total: totalCount,
      totalPages: Math.ceil(totalCount / params.limit),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to fetch comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}
