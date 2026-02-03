import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, image: true, bio: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
        tags: {
          include: {
            tag: { select: { id: true, name: true, slug: true } },
          },
        },
        questions: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            content: true,
            options: true,
            correctIndices: true,
            isMultipleChoice: true,
            explanation: true,
            points: true,
            order: true,
          },
        },
        _count: {
          select: { questions: true },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const isOwner = session?.user?.id === quiz.authorId;

    // Drafts are only visible to owner
    if (quiz.status === "draft" && !isOwner) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Private published quizzes are only visible to owner
    if (!quiz.isPublic && !isOwner) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      author: quiz.author,
      authorId: quiz.authorId,
      category: quiz.category,
      categoryId: quiz.categoryId,
      tags: quiz.tags.map((t) => t.tag),
      status: quiz.status,
      isPublic: quiz.isPublic,
      timeLimit: quiz.timeLimit,
      passingScore: quiz.passingScore,
      playCount: quiz.playCount,
      avgScore: quiz.avgScore,
      likeCount: quiz.likeCount,
      questionCount: quiz._count.questions,
      questions: isOwner ? quiz.questions : undefined,
      createdAt: quiz.createdAt.toISOString(),
      updatedAt: quiz.updatedAt.toISOString(),
      publishedAt: quiz.publishedAt?.toISOString() || null,
    });
  } catch (error) {
    console.error("Failed to fetch quiz:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz" },
      { status: 500 }
    );
  }
}

// Question schema for drafts (relaxed validation)
const draftQuestionSchema = z.object({
  id: z.string().optional(),
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
  id: z.string().optional(),
  content: z.string().min(1).max(1000),
  options: z.array(z.string().min(1)).min(2).max(6),
  correctIndices: z.array(z.number().int().min(0)).min(1),
  isMultipleChoice: z.boolean().default(false),
  explanation: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  points: z.number().int().min(1).max(100).default(10),
});

// Base schema for updates
const baseUpdateSchema = z.object({
  title: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  categoryId: z.string().nullable().optional(),
  isPublic: z.boolean().optional(),
  timeLimit: z.number().int().min(30).max(7200).nullable().optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
  status: z.enum(["draft", "published"]).optional(),
});

// For drafts, questions can be partial/empty
const updateDraftSchema = baseUpdateSchema.extend({
  questions: z.array(draftQuestionSchema).optional(),
});

// For publishing, validate strictly
const updatePublishSchema = baseUpdateSchema.extend({
  title: z.string().min(3).max(100),
  categoryId: z.string().min(1),
  questions: z.array(publishedQuestionSchema).min(1),
  status: z.literal("published"),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    if (quiz.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Get current quiz status
    const currentQuiz = await prisma.quiz.findUnique({
      where: { id },
      select: { status: true },
    });

    // If publishing, use strict validation
    const isPublishing = body.status === "published";
    const data = isPublishing
      ? updatePublishSchema.parse(body)
      : updateDraftSchema.parse(body);

    const { questions, status, ...quizData } = data;

    const updatedQuiz = await prisma.$transaction(async (tx) => {
      // Prepare update data
      const updateData: Record<string, unknown> = { ...quizData };

      // Handle status change
      if (status) {
        updateData.status = status;
        // Set publishedAt when first published
        if (status === "published" && currentQuiz?.status === "draft") {
          updateData.publishedAt = new Date();
        }
      }

      // Update quiz basic info
      const updated = await tx.quiz.update({
        where: { id },
        data: updateData,
        include: {
          author: { select: { id: true, name: true, image: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
      });

      // Update questions if provided
      if (questions) {
        // Delete all existing questions and recreate
        await tx.question.deleteMany({ where: { quizId: id } });
        if (questions.length > 0) {
          await tx.question.createMany({
            data: questions.map((q, index) => ({
              quizId: id,
              content: q.content,
              options: q.options,
              correctIndices: q.correctIndices,
              isMultipleChoice: q.isMultipleChoice,
              explanation: q.explanation || null,
              imageUrl: q.imageUrl || null,
              points: q.points,
              order: index,
            })),
          });
        }
      }

      // Increment quizzesCreated when first published
      if (status === "published" && currentQuiz?.status === "draft") {
        await tx.user.update({
          where: { id: session.user.id },
          data: { quizzesCreated: { increment: 1 } },
        });
      }

      return updated;
    });

    return NextResponse.json(updatedQuiz);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to update quiz:", error);
    return NextResponse.json(
      { error: "Failed to update quiz" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: { authorId: true, status: true },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    if (quiz.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.quiz.delete({ where: { id } });

    // Only decrement for published quizzes
    if (quiz.status === "published") {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { quizzesCreated: { decrement: 1 } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete quiz:", error);
    return NextResponse.json(
      { error: "Failed to delete quiz" },
      { status: 500 }
    );
  }
}
