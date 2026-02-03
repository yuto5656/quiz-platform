import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        displayName: true,
        bio: true,
        totalScore: true,
        quizzesTaken: true,
        quizzesCreated: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const recentQuizzes = await prisma.quiz.findMany({
      where: { authorId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        category: { select: { name: true } },
        _count: { select: { questions: true } },
      },
    });

    const recentScores = await prisma.score.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        quiz: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({
      user,
      recentQuizzes: recentQuizzes.map((q) => ({
        id: q.id,
        title: q.title,
        category: q.category?.name ?? null,
        questionCount: q._count.questions,
        playCount: q.playCount,
        createdAt: q.createdAt.toISOString(),
      })),
      recentScores: recentScores.map((s) => ({
        id: s.id,
        quiz: s.quiz,
        score: s.score,
        maxScore: s.maxScore,
        percentage: s.percentage,
        createdAt: s.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

const updateUserSchema = z.object({
  displayName: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = updateUserSchema.parse(body);

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        displayName: data.displayName,
        bio: data.bio,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        displayName: true,
        bio: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to update user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
