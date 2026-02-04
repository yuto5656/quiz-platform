import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/env";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { QuizCard } from "@/components/quiz/quiz-card";
import { AdminAvatar } from "@/components/common/admin-avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Trophy,
  BookOpen,
  PenTool,
  Calendar,
  ArrowLeft,
  FolderOpen,
} from "lucide-react";

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

async function getUserProfile(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        displayName: true,
        bio: true,
        customAvatar: true,
        totalScore: true,
        quizzesTaken: true,
        quizzesCreated: true,
        createdAt: true,
      },
    });

    if (!user) return null;

    const quizzes = await prisma.quiz.findMany({
      where: { authorId: userId, isPublic: true },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        author: { select: { id: true, name: true, displayName: true, image: true, email: true, customAvatar: true } },
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { questions: true } },
      },
    });

    return {
      user,
      quizzes: quizzes.map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        author: {
          id: q.author.id,
          name: q.author.name,
          displayName: q.author.displayName,
          image: q.author.image,
          customAvatar: q.author.customAvatar,
          isAdmin: isAdminEmail(q.author.email),
        },
        category: q.category,
        questionCount: q._count.questions,
        playCount: q.playCount,
        avgScore: q.avgScore,
        timeLimit: q.timeLimit,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return null;
  }
}

export default async function UserProfilePage({ params }: ProfilePageProps) {
  const { userId } = await params;
  const data = await getUserProfile(userId);

  if (!data) {
    notFound();
  }

  const { user, quizzes } = data;

  const displayName = user.displayName || user.name || "ユーザー";
  const isAdmin = isAdminEmail(user.email);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                トップに戻る
              </Link>
            </Button>
          </div>

          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <AdminAvatar
                  isAdmin={isAdmin}
                  customAvatar={user.customAvatar}
                  image={user.image}
                  name={user.name}
                  size="lg"
                />
                <div className="text-center sm:text-left flex-1">
                  <h1 className="text-2xl font-bold">{displayName}</h1>
                  {user.bio && (
                    <p className="mt-2 text-muted-foreground">{user.bio}</p>
                  )}
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(user.createdAt).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long",
                      })}
                      に参加
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                    <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{user.totalScore}</p>
                    <p className="text-sm text-muted-foreground">総スコア</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{user.quizzesTaken}</p>
                    <p className="text-sm text-muted-foreground">挑戦数</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                    <PenTool className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{user.quizzesCreated}</p>
                    <p className="text-sm text-muted-foreground">作成数</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User's Quizzes */}
          <Card>
            <CardHeader>
              <CardTitle>{displayName}さんのクイズ</CardTitle>
            </CardHeader>
            <CardContent>
              {quizzes.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {quizzes.map((quiz) => (
                    <QuizCard key={quiz.id} quiz={quiz} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">
                    まだクイズを公開していません
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { userId } = await params;
  const data = await getUserProfile(userId);

  if (!data) {
    return { title: "ユーザーが見つかりません" };
  }

  const displayName = data.user.displayName || data.user.name || "ユーザー";

  return {
    title: `${displayName}のプロフィール | Quiz Platform`,
    description: data.user.bio || `${displayName}さんのプロフィールページ`,
  };
}
