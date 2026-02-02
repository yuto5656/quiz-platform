import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const score = await prisma.score.findUnique({
      where: { id },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            passingScore: true,
            questions: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                content: true,
                options: true,
                correctIndex: true,
                explanation: true,
                points: true,
              },
            },
          },
        },
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    if (!score) {
      return NextResponse.json({ error: "Score not found" }, { status: 404 });
    }

    if (score.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const answerHistories = await prisma.answerHistory.findMany({
      where: {
        userId: session.user.id,
        questionId: { in: score.quiz.questions.map((q) => q.id) },
      },
      orderBy: { createdAt: "desc" },
    });

    const answerMap = new Map<string, number>();
    for (const history of answerHistories) {
      if (!answerMap.has(history.questionId)) {
        answerMap.set(history.questionId, history.selectedIndex);
      }
    }

    const results = score.quiz.questions.map((q) => ({
      questionId: q.id,
      content: q.content,
      options: q.options,
      selectedIndex: answerMap.get(q.id) ?? -1,
      correctIndex: q.correctIndex,
      isCorrect: answerMap.get(q.id) === q.correctIndex,
      explanation: q.explanation,
      points: q.points,
    }));

    return NextResponse.json({
      id: score.id,
      quiz: {
        id: score.quiz.id,
        title: score.quiz.title,
        passingScore: score.quiz.passingScore,
      },
      user: score.user,
      score: score.score,
      maxScore: score.maxScore,
      percentage: score.percentage,
      correctCount: score.correctCount,
      totalCount: score.totalCount,
      timeSpent: score.timeSpent,
      passed: score.percentage >= score.quiz.passingScore,
      createdAt: score.createdAt.toISOString(),
      results,
    });
  } catch (error) {
    console.error("Failed to fetch score:", error);
    return NextResponse.json(
      { error: "Failed to fetch score" },
      { status: 500 }
    );
  }
}
