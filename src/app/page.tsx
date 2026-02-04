import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/env";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { QuizCard } from "@/components/quiz/quiz-card";
import { CategoryList } from "@/components/quiz/category-list";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Trophy, Users } from "lucide-react";
import { HeaderAd, InFeedAd } from "@/components/ads";

async function getCategories() {
  try {
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
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

async function getPopularQuizzes() {
  try {
    const quizzes = await prisma.quiz.findMany({
      where: { isPublic: true },
      orderBy: { playCount: "desc" },
      take: 6,
      include: {
        author: { select: { id: true, name: true, displayName: true, image: true, email: true, customAvatar: true } },
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { questions: true } },
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
    console.error("Failed to fetch popular quizzes:", error);
    return [];
  }
}

async function getNewestQuizzes() {
  try {
    const quizzes = await prisma.quiz.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        author: { select: { id: true, name: true, displayName: true, image: true, email: true, customAvatar: true } },
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { questions: true } },
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
    console.error("Failed to fetch newest quizzes:", error);
    return [];
  }
}

export default async function HomePage() {
  const t = await getTranslations("home");
  const tCommon = await getTranslations("common");

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
                {t("hero.title")}
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                {t("hero.subtitle")}
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" asChild>
                  <Link href="/create">
                    <Sparkles className="mr-2 h-5 w-5" />
                    {t("hero.createButton")}
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#categories">
                    {t("hero.exploreButton")}
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
                <div className="text-sm text-muted-foreground">Quizzes</div>
              </div>
              <div>
                <div className="text-2xl font-bold md:text-3xl">
                  {categories.length}
                </div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </div>
              <div>
                <div className="text-2xl font-bold md:text-3xl">Free</div>
                <div className="text-sm text-muted-foreground">Price</div>
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
              <h2 className="text-2xl font-bold">{t("sections.categories")}</h2>
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
                  <h2 className="text-2xl font-bold">{t("sections.popular")}</h2>
                </div>
                <Button variant="ghost" asChild>
                  <Link href="/search?sortBy=popular">
                    {t("sections.viewAll")}
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
                  <h2 className="text-2xl font-bold">{t("sections.recent")}</h2>
                </div>
                <Button variant="ghost" asChild>
                  <Link href="/search?sortBy=newest">
                    {t("sections.viewAll")}
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
                {t("hero.createButton")}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {t("hero.subtitle")}
              </p>
              <Button size="lg" className="mt-6" asChild>
                <Link href="/create">{tCommon("create")}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
