import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const likeSchema = z.object({
  quizId: z.string(),
});

// Get user's liked quizzes
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const likes = await prisma.like.findMany({
      where: { userId: session.user.id },
      include: {
        quiz: {
          include: {
            author: { select: { id: true, name: true, image: true } },
            category: { select: { id: true, name: true, slug: true } },
            _count: { select: { questions: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      likes: likes.map((like) => ({
        id: like.id,
        quizId: like.quizId,
        createdAt: like.createdAt.toISOString(),
        quiz: {
          id: like.quiz.id,
          title: like.quiz.title,
          description: like.quiz.description,
          author: like.quiz.author,
          category: like.quiz.category,
          questionCount: like.quiz._count.questions,
          playCount: like.quiz.playCount,
          avgScore: like.quiz.avgScore,
        },
      })),
    });
  } catch (error) {
    console.error("Failed to fetch likes:", error);
    return NextResponse.json(
      { error: "Failed to fetch likes" },
      { status: 500 }
    );
  }
}

// Add like
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { quizId } = likeSchema.parse(body);

    // Check if quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_quizId: {
          userId: session.user.id,
          quizId,
        },
      },
    });

    if (existingLike) {
      return NextResponse.json({ error: "Already liked" }, { status: 400 });
    }

    // Create like and increment quiz likeCount
    const [like] = await prisma.$transaction([
      prisma.like.create({
        data: {
          userId: session.user.id,
          quizId,
        },
      }),
      prisma.quiz.update({
        where: { id: quizId },
        data: { likeCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ id: like.id, quizId: like.quizId }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to add like:", error);
    return NextResponse.json(
      { error: "Failed to add like" },
      { status: 500 }
    );
  }
}

// Remove like
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get("quizId");

    if (!quizId) {
      return NextResponse.json(
        { error: "quizId is required" },
        { status: 400 }
      );
    }

    // Check if like exists
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_quizId: {
          userId: session.user.id,
          quizId,
        },
      },
    });

    if (!existingLike) {
      return NextResponse.json({ error: "Like not found" }, { status: 404 });
    }

    // Delete like and decrement quiz likeCount
    await prisma.$transaction([
      prisma.like.delete({
        where: {
          userId_quizId: {
            userId: session.user.id,
            quizId,
          },
        },
      }),
      prisma.quiz.update({
        where: { id: quizId },
        data: { likeCount: { decrement: 1 } },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove like:", error);
    return NextResponse.json(
      { error: "Failed to remove like" },
      { status: 500 }
    );
  }
}
