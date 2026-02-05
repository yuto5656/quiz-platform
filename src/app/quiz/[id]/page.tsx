import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/env";
import { generateQuizMetadata, generateQuizJsonLd, generateBreadcrumbJsonLd, breadcrumbHelpers } from "@/lib/seo";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminAvatar } from "@/components/common/admin-avatar";
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
} from "lucide-react";
import { SidebarAd, InFeedAd } from "@/components/ads";
import { ShareButton } from "@/components/common/share-button";
import { CommentSection } from "@/components/quiz/comment-section";
import { QuizCard } from "@/components/quiz/quiz-card";
import { LikeButton } from "@/components/quiz/like-button";

interface Props {
  params: Promise<{ id: string }>;
}

// 動的メタデータを生成
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
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
  } catch (error) {
    console.error("Failed to generate quiz metadata:", error);
    return { title: "クイズ" };
  }
}

async function getQuiz(id: string) {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, displayName: true, image: true, bio: true, email: true, customAvatar: true },
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
  } catch (error) {
    console.error("Failed to fetch quiz:", error);
    return null;
  }
}

async function getUserLike(userId: string | undefined, quizId: string) {
  if (!userId) return null;

  try {
    const like = await prisma.like.findUnique({
      where: {
        userId_quizId: {
          userId,
          quizId,
        },
      },
    });
    return like;
  } catch (error) {
    console.error("Failed to fetch user like:", error);
    return null;
  }
}

async function getCurrentUser(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, displayName: true, image: true, email: true, customAvatar: true },
    });
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      displayName: user.displayName,
      image: user.image,
      customAvatar: user.customAvatar,
      isAdmin: isAdminEmail(user.email),
    };
  } catch (error) {
    console.error("Failed to fetch current user:", error);
    return null;
  }
}

async function getRelatedQuizzes(quizId: string, categoryId: string | null) {
  try {
    const quizzes = await prisma.quiz.findMany({
      where: {
        isPublic: true,
        id: { not: quizId },
        ...(categoryId ? { categoryId } : {}),
      },
      orderBy: { playCount: "desc" },
      take: 3,
      include: {
        author: {
          select: { id: true, name: true, displayName: true, image: true, email: true, customAvatar: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { questions: true },
        },
      },
    });

    return quizzes.map((q) => ({
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
    }));
  } catch (error) {
    console.error("Failed to fetch related quizzes:", error);
    return [];
  }
}

export default async function QuizDetailPage({ params }: Props) {
  const { id } = await params;
  const [quiz, session] = await Promise.all([getQuiz(id), auth()]);

  if (!quiz) {
    notFound();
  }

  if (!quiz.isPublic) {
    if (!session?.user || session.user.id !== quiz.authorId) {
      notFound();
    }
  }

  // コメント用にcurrentUser情報を取得、関連クイズを取得、お気に入り状態を取得
  const [currentUser, relatedQuizzes, userLike] = await Promise.all([
    session?.user?.id ? getCurrentUser(session.user.id) : Promise.resolve(null),
    getRelatedQuizzes(quiz.id, quiz.category?.id || null),
    getUserLike(session?.user?.id, quiz.id),
  ]);

  const authorDisplayName = quiz.author.displayName || quiz.author.name;
  const isAuthorAdmin = isAdminEmail(quiz.author.email);

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
                  {quiz.category && <Badge variant="secondary">{quiz.category.name}</Badge>}
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

              {/* In-content Ad */}
              <InFeedAd />

              {/* Author */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">作成者</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <AdminAvatar
                      isAdmin={isAuthorAdmin}
                      customAvatar={quiz.author.customAvatar}
                      image={quiz.author.image}
                      name={authorDisplayName}
                      size="sm"
                    />
                    <div>
                      <p className="font-medium">{authorDisplayName}</p>
                      {quiz.author.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {quiz.author.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comment Section */}
              <CommentSection quizId={quiz.id} quizAuthorId={quiz.authorId} currentUser={currentUser} />

              {/* Related Quizzes */}
              {relatedQuizzes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">関連クイズ</CardTitle>
                    <CardDescription>
                      {quiz.category ? `${quiz.category.name}の他のクイズ` : "人気のクイズ"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {relatedQuizzes.map((relatedQuiz) => (
                        <QuizCard key={relatedQuiz.id} quiz={relatedQuiz} showAuthor={false} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
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
                  <div className="flex gap-2">
                    <LikeButton
                      quizId={quiz.id}
                      initialLiked={!!userLike}
                      initialCount={quiz.likeCount}
                      className="flex-1"
                    />
                    <ShareButton
                      url={`/quiz/${quiz.id}`}
                      title={quiz.title}
                      description={quiz.description || `${quiz._count.questions}問のクイズに挑戦しよう！`}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    />
                  </div>
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

              {/* Sidebar Ad */}
              <SidebarAd />
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
      {/* JSON-LD structured data for breadcrumb */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateBreadcrumbJsonLd(
              breadcrumbHelpers.quiz({
                id: quiz.id,
                title: quiz.title,
                category: quiz.category,
              })
            )
          ),
        }}
      />
    </div>
  );
}
