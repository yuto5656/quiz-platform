import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createCommentSchema = z.object({
  quizId: z.string().min(1),
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

    // Verify quiz exists and is published
    const quiz = await prisma.quiz.findUnique({
      where: { id: data.quizId },
      select: { status: true, isPublic: true },
    });

    if (!quiz || quiz.status !== "published") {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Verify parent comment exists if provided
    if (data.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: data.parentId },
        select: { quizId: true },
      });

      if (!parentComment || parentComment.quizId !== data.quizId) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }
    }

    const comment = await prisma.comment.create({
      data: {
        quizId: data.quizId,
        userId: session.user.id,
        content: data.content,
        parentId: data.parentId || null,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json(
      {
        id: comment.id,
        content: comment.content,
        user: comment.user,
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
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse({
      quizId: searchParams.get("quizId") || "",
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
    });

    // Verify quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.quizId },
      select: { status: true },
    });

    if (!quiz || quiz.status !== "published") {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Get top-level comments with replies
    const [comments, totalCount] = await Promise.all([
      prisma.comment.findMany({
        where: {
          quizId: params.quizId,
          parentId: null, // Only top-level comments
        },
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
          replies: {
            orderBy: { createdAt: "asc" },
            include: {
              user: {
                select: { id: true, name: true, image: true },
              },
            },
          },
        },
      }),
      prisma.comment.count({
        where: {
          quizId: params.quizId,
          parentId: null,
        },
      }),
    ]);

    const formattedComments = comments.map((c) => ({
      id: c.id,
      content: c.content,
      user: c.user,
      parentId: c.parentId,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      replies: c.replies.map((r) => ({
        id: r.id,
        content: r.content,
        user: r.user,
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
