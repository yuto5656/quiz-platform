import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

// Get admin emails list
function getAdminEmails(): string[] {
  return env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) || [];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "users"; // users, quizzes
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const period = searchParams.get("period") || "all"; // all, month, week

    // Get admin emails to exclude from rankings
    const adminEmails = getAdminEmails();

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
      // User rankings by total score (exclude admins)
      const users = await prisma.user.findMany({
        where: {
          // Exclude admin users from rankings
          ...(adminEmails.length > 0 ? { email: { notIn: adminEmails } } : {}),
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
        orderBy: { totalScore: "desc" },
        take: limit,
        select: {
          id: true,
          name: true,
          image: true,
          displayName: true,
          customAvatar: true,
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
            image: user.customAvatar || user.image,
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
          author: { select: { id: true, name: true, displayName: true, image: true, customAvatar: true } },
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
            author: {
              id: quiz.author?.id,
              name: quiz.author?.displayName || quiz.author?.name,
              image: quiz.author?.customAvatar || quiz.author?.image,
            },
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
      // Creator rankings by quizzes created (exclude admins)
      const creators = await prisma.user.findMany({
        where: {
          quizzesCreated: { gt: 0 },
          // Exclude admin users from rankings
          ...(adminEmails.length > 0 ? { email: { notIn: adminEmails } } : {}),
        },
        orderBy: { quizzesCreated: "desc" },
        take: limit,
        select: {
          id: true,
          name: true,
          image: true,
          displayName: true,
          customAvatar: true,
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
            image: creator.customAvatar || creator.image,
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
