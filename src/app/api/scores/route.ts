import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const submitAnswerSchema = z.object({
  quizId: z.string(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedIndices: z.array(z.number().int().min(0)),
      timeSpent: z.number().int().min(0).optional(),
    })
  ),
  totalTimeSpent: z.number().int().min(0).optional(),
});

// Helper function to check if two arrays have the same elements
function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort((x, y) => x - y);
  const sortedB = [...b].sort((x, y) => x - y);
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = submitAnswerSchema.parse(body);

    const quiz = await prisma.quiz.findUnique({
      where: { id: data.quizId },
      include: {
        questions: {
          select: {
            id: true,
            correctIndices: true,
            isMultipleChoice: true,
            points: true,
            explanation: true,
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    let score = 0;
    let maxScore = 0;
    let correctCount = 0;
    const results: Array<{
      questionId: string;
      isCorrect: boolean;
      selectedIndices: number[];
      correctIndices: number[];
      isMultipleChoice: boolean;
      explanation: string | null;
    }> = [];

    for (const question of quiz.questions) {
      maxScore += question.points;
      const answer = data.answers.find((a) => a.questionId === question.id);
      const correctIndices = question.correctIndices as number[];
      const selectedIndices = answer?.selectedIndices ?? [];
      const isCorrect = arraysEqual(selectedIndices, correctIndices);

      if (isCorrect) {
        score += question.points;
        correctCount++;
      }

      results.push({
        questionId: question.id,
        isCorrect,
        selectedIndices,
        correctIndices,
        isMultipleChoice: question.isMultipleChoice,
        explanation: question.explanation,
      });

      if (answer) {
        await prisma.answerHistory.create({
          data: {
            userId: session.user.id,
            questionId: question.id,
            selectedIndices: answer.selectedIndices,
            isCorrect,
            timeSpent: answer.timeSpent,
          },
        });
      }
    }

    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const passed = percentage >= quiz.passingScore;

    const scoreRecord = await prisma.score.create({
      data: {
        userId: session.user.id,
        quizId: quiz.id,
        score,
        maxScore,
        percentage,
        correctCount,
        totalCount: quiz.questions.length,
        timeSpent: data.totalTimeSpent,
      },
    });

    const allScores = await prisma.score.findMany({
      where: { quizId: quiz.id },
      select: { percentage: true },
    });
    const avgScore =
      allScores.reduce((sum, s) => sum + s.percentage, 0) / allScores.length;

    await prisma.quiz.update({
      where: { id: quiz.id },
      data: {
        playCount: { increment: 1 },
        avgScore,
      },
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        totalScore: { increment: score },
        quizzesTaken: { increment: 1 },
      },
    });

    return NextResponse.json({
      scoreId: scoreRecord.id,
      score,
      maxScore,
      percentage,
      correctCount,
      totalCount: quiz.questions.length,
      passed,
      results,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to submit answers:", error);
    return NextResponse.json(
      { error: "Failed to submit answers" },
      { status: 500 }
    );
  }
}
