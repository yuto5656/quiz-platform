import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const checkAnswerSchema = z.object({
  questionId: z.string().min(1),
  selectedIndices: z.array(z.number().int().min(0)),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quizId } = await params;
    const body = await request.json();
    const { questionId, selectedIndices } = checkAnswerSchema.parse(body);

    // Get the question with correct answer
    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        quizId: quizId,
      },
      select: {
        id: true,
        correctIndices: true,
        explanation: true,
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    const correctIndices = question.correctIndices as number[];

    // Check if answer is correct (exact match)
    const isCorrect =
      JSON.stringify([...selectedIndices].sort()) ===
      JSON.stringify([...correctIndices].sort());

    return NextResponse.json({
      isCorrect,
      correctIndices,
      explanation: question.explanation,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to check answer:", error);
    return NextResponse.json(
      { error: "Failed to check answer" },
      { status: 500 }
    );
  }
}
