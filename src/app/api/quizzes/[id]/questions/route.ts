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

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        timeLimit: true,
        isPublic: true,
        authorId: true,
        questions: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            content: true,
            options: true,
            imageUrl: true,
            points: true,
            order: true,
            isMultipleChoice: true,
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    if (!quiz.isPublic && quiz.authorId !== session.user.id) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json({
      quizId: quiz.id,
      title: quiz.title,
      timeLimit: quiz.timeLimit,
      questions: quiz.questions,
    });
  } catch (error) {
    console.error("Failed to fetch questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}
