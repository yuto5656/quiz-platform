import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { QuizCard } from "@/components/quiz/quiz-card";
import { CategoryList } from "@/components/quiz/category-list";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Trophy, Users } from "lucide-react";
import { HeaderAd, InFeedAd } from "@/components/ads";

async function getCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: {
      _count: { select: { quizzes: true } },
    },
  });
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    icon: c.icon,
    quizCount: c._count.quizzes,
  }));
}

async function getPopularQuizzes() {
  const quizzes = await prisma.quiz.findMany({
    where: { isPublic: true },
    orderBy: { playCount: "desc" },
    take: 6,
    include: {
      author: { select: { id: true, name: true, image: true } },
      category: { select: { id: true, name: true, slug: true } },
      _count: { select: { questions: true } },
    },
  });
  return quizzes.map((q) => ({
    id: q.id,
    title: q.title,
    description: q.description,
    author: q.author,
    category: q.category,
    questionCount: q._count.questions,
    playCount: q.playCount,
    avgScore: q.avgScore,
    timeLimit: q.timeLimit,
  }));
}

async function getNewestQuizzes() {
  const quizzes = await prisma.quiz.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      author: { select: { id: true, name: true, image: true } },
      category: { select: { id: true, name: true, slug: true } },
      _count: { select: { questions: true } },
    },
  });
  return quizzes.map((q) => ({
    id: q.id,
    title: q.title,
    description: q.description,
    author: q.author,
    category: q.category,
    questionCount: q._count.questions,
    playCount: q.playCount,
    avgScore: q.avgScore,
    timeLimit: q.timeLimit,
  }));
}

export default async function HomePage() {
  const [categories, popularQuizzes, newestQuizzes] = await Promise.all([
    getCategories(),
    getPopularQuizzes(),
    getNewestQuizzes(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b bg-gradient-to-b from-background to-muted/30 py-12 md:py-20">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                クイズを作って、
                <br className="sm:hidden" />
                みんなで楽しもう
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                誰でも無料でクイズを作成・公開できるプラットフォーム。
                <br className="hidden sm:inline" />
                様々なカテゴリのクイズに挑戦して知識を試そう。
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" asChild>
                  <Link href="/create">
                    <Sparkles className="mr-2 h-5 w-5" />
                    クイズを作成する
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#categories">
                    クイズを探す
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold md:text-3xl">
                  {categories.reduce((sum, c) => sum + c.quizCount, 0)}+
                </div>
                <div className="text-sm text-muted-foreground">クイズ数</div>
              </div>
              <div>
                <div className="text-2xl font-bold md:text-3xl">
                  {categories.length}
                </div>
                <div className="text-sm text-muted-foreground">カテゴリ</div>
              </div>
              <div>
                <div className="text-2xl font-bold md:text-3xl">無料</div>
                <div className="text-sm text-muted-foreground">利用料金</div>
              </div>
            </div>
          </div>
        </section>

        {/* Header Ad */}
        <HeaderAd className="border-b" />

        {/* Categories */}
        <section id="categories" className="py-12">
          <div className="container">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">カテゴリから探す</h2>
            </div>
            <CategoryList categories={categories} />
          </div>
        </section>

        {/* Popular Quizzes */}
        {popularQuizzes.length > 0 && (
          <section className="border-t py-12">
            <div className="container">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <h2 className="text-2xl font-bold">人気のクイズ</h2>
                </div>
                <Button variant="ghost" asChild>
                  <Link href="/search?sortBy=popular">
                    もっと見る
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {popularQuizzes.map((quiz) => (
                  <QuizCard key={quiz.id} quiz={quiz} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* In-feed Ad between sections */}
        <div className="container">
          <InFeedAd />
        </div>

        {/* Newest Quizzes */}
        {newestQuizzes.length > 0 && (
          <section className="border-t py-12">
            <div className="container">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  <h2 className="text-2xl font-bold">新着クイズ</h2>
                </div>
                <Button variant="ghost" asChild>
                  <Link href="/search?sortBy=newest">
                    もっと見る
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {newestQuizzes.map((quiz) => (
                  <QuizCard key={quiz.id} quiz={quiz} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="border-t bg-muted/30 py-12">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-2xl font-bold">
                あなたもクイズを作成しませんか？
              </h2>
              <p className="mt-2 text-muted-foreground">
                簡単な操作でオリジナルクイズを作成できます。
                友達や同僚とシェアして楽しもう。
              </p>
              <Button size="lg" className="mt-6" asChild>
                <Link href="/create">今すぐ作成する</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
