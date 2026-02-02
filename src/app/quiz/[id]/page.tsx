import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateQuizMetadata, generateQuizJsonLd } from "@/lib/seo";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Clock,
  PlayCircle,
  Users,
  Trophy,
  ArrowLeft,
  Share2,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

// 動的メタデータを生成
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const quiz = await prisma.quiz.findUnique({
    where: { id, isPublic: true },
    include: {
      category: { select: { name: true } },
      _count: { select: { questions: true } },
    },
  });

  if (!quiz) {
    return { title: "クイズが見つかりません" };
  }

  return generateQuizMetadata({
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    category: quiz.category,
    questionCount: quiz._count.questions,
    playCount: quiz.playCount,
  });
}

async function getQuiz(id: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, name: true, image: true, bio: true },
      },
      category: {
        select: { id: true, name: true, slug: true },
      },
      _count: {
        select: { questions: true },
      },
    },
  });

  return quiz;
}

export default async function QuizDetailPage({ params }: Props) {
  const { id } = await params;
  const quiz = await getQuiz(id);

  if (!quiz) {
    notFound();
  }

  if (!quiz.isPublic) {
    const session = await auth();
    if (!session?.user || session.user.id !== quiz.authorId) {
      notFound();
    }
  }

  const initials =
    quiz.author.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            トップに戻る
          </Link>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary">{quiz.category.name}</Badge>
                  {!quiz.isPublic && <Badge variant="outline">非公開</Badge>}
                </div>
                <h1 className="text-3xl font-bold">{quiz.title}</h1>
                {quiz.description && (
                  <p className="mt-4 text-lg text-muted-foreground">
                    {quiz.description}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Card>
                  <CardContent className="flex flex-col items-center justify-center p-4">
                    <PlayCircle className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-2xl font-bold">
                      {quiz._count.questions}
                    </span>
                    <span className="text-xs text-muted-foreground">問題数</span>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex flex-col items-center justify-center p-4">
                    <Users className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-2xl font-bold">{quiz.playCount}</span>
                    <span className="text-xs text-muted-foreground">
                      プレイ数
                    </span>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex flex-col items-center justify-center p-4">
                    <Trophy className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-2xl font-bold">
                      {quiz.avgScore.toFixed(0)}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      平均スコア
                    </span>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex flex-col items-center justify-center p-4">
                    <Clock className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-2xl font-bold">
                      {quiz.timeLimit ? `${Math.floor(quiz.timeLimit / 60)}分` : "無制限"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      制限時間
                    </span>
                  </CardContent>
                </Card>
              </div>

              {/* Author */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">作成者</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={quiz.author.image || ""} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{quiz.author.name}</p>
                      {quiz.author.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {quiz.author.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>クイズに挑戦</CardTitle>
                  <CardDescription>
                    {quiz._count.questions}問のクイズに挑戦しましょう
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>
                      合格ライン: <strong>{quiz.passingScore}%</strong>
                    </p>
                    {quiz.timeLimit && (
                      <p>
                        制限時間:{" "}
                        <strong>{Math.floor(quiz.timeLimit / 60)}分</strong>
                      </p>
                    )}
                  </div>
                  <Button className="w-full" size="lg" asChild>
                    <Link href={`/quiz/${quiz.id}/play`}>
                      <PlayCircle className="mr-2 h-5 w-5" />
                      クイズを開始
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    <Share2 className="mr-2 h-4 w-4" />
                    シェア
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">クイズ情報</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>
                    作成日:{" "}
                    {new Date(quiz.createdAt).toLocaleDateString("ja-JP")}
                  </p>
                  <p>
                    更新日:{" "}
                    {new Date(quiz.updatedAt).toLocaleDateString("ja-JP")}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      {/* JSON-LD structured data for this quiz */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateQuizJsonLd({
              id: quiz.id,
              title: quiz.title,
              description: quiz.description,
              category: quiz.category,
              author: quiz.author,
              questionCount: quiz._count.questions,
              createdAt: quiz.createdAt,
              updatedAt: quiz.updatedAt,
            })
          ),
        }}
      />
    </div>
  );
}
