"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  BookOpen,
  PenTool,
  Star,
  Plus,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  displayName: string | null;
  bio: string | null;
  totalScore: number;
  quizzesTaken: number;
  quizzesCreated: number;
  createdAt: string;
}

interface RecentQuiz {
  id: string;
  title: string;
  category: string;
  questionCount: number;
  playCount: number;
  createdAt: string;
}

interface RecentScore {
  id: string;
  quiz: { id: string; title: string };
  score: number;
  maxScore: number;
  percentage: number;
  createdAt: string;
}

interface DashboardData {
  user: UserData;
  recentQuizzes: RecentQuiz[];
  recentScores: RecentScore[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/users/me");
        if (res.ok) {
          const dashboardData = await res.json();
          setData(dashboardData);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">データを読み込めませんでした</p>
        </div>
      </div>
    );
  }

  const { user, recentQuizzes, recentScores } = data;
  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container py-8">
          {/* User Profile Summary */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.image || ""} />
                  <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left flex-1">
                  <h1 className="text-2xl font-bold">
                    {user.displayName || user.name || "ユーザー"}
                  </h1>
                  <p className="text-muted-foreground">{user.email}</p>
                  {user.bio && (
                    <p className="mt-2 text-sm text-muted-foreground">{user.bio}</p>
                  )}
                </div>
                <Button asChild>
                  <Link href="/create">
                    <Plus className="mr-2 h-4 w-4" />
                    クイズを作成
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
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
                    <p className="text-sm text-muted-foreground">挑戦したクイズ</p>
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
                    <p className="text-sm text-muted-foreground">作成したクイズ</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                    <Star className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {recentScores.length > 0
                        ? `${(recentScores.reduce((sum, s) => sum + s.percentage, 0) / recentScores.length).toFixed(0)}%`
                        : "-"}
                    </p>
                    <p className="text-sm text-muted-foreground">平均スコア</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="scores">
            <TabsList>
              <TabsTrigger value="scores">挑戦履歴</TabsTrigger>
              <TabsTrigger value="quizzes">作成したクイズ</TabsTrigger>
            </TabsList>

            <TabsContent value="scores" className="mt-6">
              {recentScores.length > 0 ? (
                <div className="space-y-4">
                  {recentScores.map((score) => (
                    <Card key={score.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Link
                              href={`/quiz/${score.quiz.id}`}
                              className="font-medium hover:underline"
                            >
                              {score.quiz.title}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {new Date(score.createdAt).toLocaleDateString("ja-JP")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">
                              {score.percentage.toFixed(0)}%
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {score.score} / {score.maxScore}点
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground mb-4">
                      まだクイズに挑戦していません
                    </p>
                    <Button asChild>
                      <Link href="/">クイズを探す</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="quizzes" className="mt-6">
              {recentQuizzes.length > 0 ? (
                <div className="space-y-4">
                  {recentQuizzes.map((quiz) => (
                    <Card key={quiz.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Link
                              href={`/quiz/${quiz.id}`}
                              className="font-medium hover:underline"
                            >
                              {quiz.title}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {quiz.category} · {quiz.questionCount}問 · {quiz.playCount}回プレイ
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/quiz/${quiz.id}`}>
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground mb-4">
                      まだクイズを作成していません
                    </p>
                    <Button asChild>
                      <Link href="/create">
                        <Plus className="mr-2 h-4 w-4" />
                        クイズを作成
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
