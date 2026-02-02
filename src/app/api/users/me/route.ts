import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
        category: q.category.name,
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
