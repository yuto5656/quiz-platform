import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const feedbackCategorySchema = z.enum([
  "inquiry",
  "feature_request",
  "bug_report",
  "other",
]);

const createFeedbackSchema = z.object({
  category: feedbackCategorySchema,
  content: z.string().min(10).max(5000),
  email: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const data = createFeedbackSchema.parse(body);

    // If not logged in, email is required
    if (!session?.user?.id && !data.email) {
      return NextResponse.json(
        { error: "Email is required for non-logged-in users" },
        { status: 400 }
      );
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId: session?.user?.id || null,
        category: data.category,
        content: data.content,
        email: data.email || session?.user?.email || null,
        status: "open",
      },
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to create feedback:", error);
    return NextResponse.json(
      { error: "Failed to create feedback" },
      { status: 500 }
    );
  }
}

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  status: z.enum(["open", "in_progress", "resolved", "closed", "all"]).optional(),
  category: feedbackCategorySchema.optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // Only allow viewing own feedback or admin view (for future)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = querySchema.parse({
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
      status: searchParams.get("status") || undefined,
      category: searchParams.get("category") || undefined,
    });

    const where = {
      userId: session.user.id,
      ...(params.status && params.status !== "all" && { status: params.status }),
      ...(params.category && { category: params.category }),
    };

    const [feedbacks, totalCount] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.feedback.count({ where }),
    ]);

    return NextResponse.json({
      feedbacks: feedbacks.map((f) => ({
        id: f.id,
        category: f.category,
        content: f.content,
        status: f.status,
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
      })),
      total: totalCount,
      totalPages: Math.ceil(totalCount / params.limit),
    });
  } catch (error) {
    console.error("Failed to fetch feedback:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}
