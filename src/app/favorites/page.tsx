import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/env";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { QuizCard } from "@/components/quiz/quiz-card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "お気に入り | Quiz Platform",
  description: "お気に入り登録したクイズの一覧",
};

interface FavoriteQuiz {
  id: string;
  title: string;
  description: string | null;
  author: {
    id: string;
    name: string | null;
    displayName: string | null;
    image: string | null;
    customAvatar: string | null;
    isAdmin: boolean;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  questionCount: number;
  playCount: number;
  avgScore: number | null;
  timeLimit: number | null;
}

async function getFavorites(userId: string): Promise<FavoriteQuiz[]> {
  try {
    const likes = await prisma.like.findMany({
      where: { userId },
      include: {
        quiz: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                displayName: true,
                image: true,
                email: true,
                customAvatar: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            _count: {
              select: {
                questions: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return likes.map((like) => ({
      id: like.quiz.id,
      title: like.quiz.title,
      description: like.quiz.description,
      author: {
        id: like.quiz.author.id,
        name: like.quiz.author.name,
        displayName: like.quiz.author.displayName,
        image: like.quiz.author.image,
        customAvatar: like.quiz.author.customAvatar,
        isAdmin: isAdminEmail(like.quiz.author.email || ""),
      },
      category: like.quiz.category,
      questionCount: like.quiz._count.questions,
      playCount: like.quiz.playCount,
      avgScore: like.quiz.avgScore,
      timeLimit: like.quiz.timeLimit,
    }));
  } catch (error) {
    console.error("Failed to fetch favorites:", error);
    return [];
  }
}

export default async function FavoritesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const favorites = await getFavorites(session.user.id);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">お気に入り</h1>
            <p className="text-muted-foreground">
              お気に入り登録したクイズ一覧
            </p>
          </div>

          {favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="rounded-full bg-muted p-6 mb-4">
                <Heart className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                お気に入りがありません
              </h2>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                気になったクイズをお気に入り登録して、いつでも見返せるようにしましょう
              </p>
              <Button asChild>
                <Link href="/">クイズを探す</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-muted-foreground">
                {favorites.length}件のクイズ
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {favorites.map((favorite) => (
                  <QuizCard
                    key={favorite.id}
                    quiz={favorite}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
