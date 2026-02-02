import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
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
      where: { authorId: id, isPublic: true },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { questions: true } },
      },
    });

    return NextResponse.json({
      user,
      recentQuizzes: recentQuizzes.map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        category: q.category,
        questionCount: q._count.questions,
        playCount: q.playCount,
        avgScore: q.avgScore,
        timeLimit: q.timeLimit,
        createdAt: q.createdAt.toISOString(),
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
