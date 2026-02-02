import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "users"; // users, quizzes
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const period = searchParams.get("period") || "all"; // all, month, week

    // Calculate date filter
    let dateFilter: Date | undefined;
    if (period === "month") {
      dateFilter = new Date();
      dateFilter.setMonth(dateFilter.getMonth() - 1);
    } else if (period === "week") {
      dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - 7);
    }

    if (type === "users") {
      // User rankings by total score
      const users = await prisma.user.findMany({
        where: dateFilter
          ? {
              scores: {
                some: {
                  createdAt: { gte: dateFilter },
                },
              },
            }
          : undefined,
        orderBy: { totalScore: "desc" },
        take: limit,
        select: {
          id: true,
          name: true,
          image: true,
          displayName: true,
          totalScore: true,
          quizzesTaken: true,
          quizzesCreated: true,
        },
      });

      return NextResponse.json({
        rankings: users.map((user, index) => ({
          rank: index + 1,
          user: {
            id: user.id,
            name: user.displayName || user.name,
            image: user.image,
            totalScore: user.totalScore,
            quizzesTaken: user.quizzesTaken,
            quizzesCreated: user.quizzesCreated,
          },
        })),
        type: "users",
        period,
      });
    }

    if (type === "quizzes") {
      // Quiz rankings by play count
      const quizzes = await prisma.quiz.findMany({
        where: {
          isPublic: true,
          ...(dateFilter
            ? {
                scores: {
                  some: {
                    createdAt: { gte: dateFilter },
                  },
                },
              }
            : {}),
        },
        orderBy: { playCount: "desc" },
        take: limit,
        include: {
          author: { select: { id: true, name: true, image: true } },
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { questions: true } },
        },
      });

      return NextResponse.json({
        rankings: quizzes.map((quiz, index) => ({
          rank: index + 1,
          quiz: {
            id: quiz.id,
            title: quiz.title,
            author: quiz.author,
            category: quiz.category,
            questionCount: quiz._count.questions,
            playCount: quiz.playCount,
            avgScore: quiz.avgScore,
            likeCount: quiz.likeCount,
          },
        })),
        type: "quizzes",
        period,
      });
    }

    if (type === "creators") {
      // Creator rankings by quizzes created
      const creators = await prisma.user.findMany({
        where: {
          quizzesCreated: { gt: 0 },
        },
        orderBy: { quizzesCreated: "desc" },
        take: limit,
        select: {
          id: true,
          name: true,
          image: true,
          displayName: true,
          quizzesCreated: true,
          _count: {
            select: {
              quizzes: {
                where: { isPublic: true },
              },
            },
          },
        },
      });

      // Get total play count for each creator
      const creatorsWithStats = await Promise.all(
        creators.map(async (creator) => {
          const stats = await prisma.quiz.aggregate({
            where: {
              authorId: creator.id,
              isPublic: true,
            },
            _sum: {
              playCount: true,
              likeCount: true,
            },
          });

          return {
            id: creator.id,
            name: creator.displayName || creator.name,
            image: creator.image,
            quizzesCreated: creator.quizzesCreated,
            totalPlays: stats._sum.playCount || 0,
            totalLikes: stats._sum.likeCount || 0,
          };
        })
      );

      return NextResponse.json({
        rankings: creatorsWithStats.map((creator, index) => ({
          rank: index + 1,
          creator,
        })),
        type: "creators",
        period,
      });
    }

    return NextResponse.json(
      { error: "Invalid ranking type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Failed to fetch rankings:", error);
    return NextResponse.json(
      { error: "Failed to fetch rankings" },
      { status: 500 }
    );
  }
}
