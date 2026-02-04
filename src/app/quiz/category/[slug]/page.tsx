import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/env";
import { generateCategoryMetadata, generateBreadcrumbJsonLd, breadcrumbHelpers } from "@/lib/seo";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { QuizCard } from "@/components/quiz/quiz-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FolderOpen } from "lucide-react";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

async function getCategory(slug: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { slug },
    });
    return category;
  } catch (error) {
    console.error("Failed to fetch category:", error);
    return null;
  }
}

async function getQuizzes(categoryId: string, page: number = 1, perPage: number = 12) {
  try {
    const skip = (page - 1) * perPage;

    const [quizzes, total] = await Promise.all([
      prisma.quiz.findMany({
        where: { categoryId, isPublic: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage,
        include: {
          author: { select: { id: true, name: true, displayName: true, image: true, email: true, customAvatar: true } },
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { questions: true } },
        },
      }),
      prisma.quiz.count({
        where: { categoryId, isPublic: true },
      }),
    ]);

    return {
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
      total,
      totalPages: Math.ceil(total / perPage),
    };
  } catch (error) {
    console.error("Failed to fetch quizzes:", error);
    return { quizzes: [], total: 0, totalPages: 0 };
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || "1");

  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  const { quizzes, total, totalPages } = await getQuizzes(category.id, page);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container py-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                トップに戻る
              </Link>
            </Button>
          </div>

          {/* Category Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              {category.icon && (
                <span className="text-3xl">{category.icon}</span>
              )}
              <h1 className="text-3xl font-bold">{category.name}</h1>
            </div>
            {category.description && (
              <p className="text-muted-foreground">{category.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {total}件のクイズ
            </p>
          </div>

          {/* Quizzes Grid */}
          {quizzes.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {quizzes.map((quiz) => (
                  <QuizCard key={quiz.id} quiz={quiz} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  {page > 1 && (
                    <Button variant="outline" asChild>
                      <Link href={`/quiz/category/${slug}?page=${page - 1}`}>
                        前へ
                      </Link>
                    </Button>
                  )}
                  <span className="flex items-center px-4 text-sm text-muted-foreground">
                    {page} / {totalPages}
                  </span>
                  {page < totalPages && (
                    <Button variant="outline" asChild>
                      <Link href={`/quiz/category/${slug}?page=${page + 1}`}>
                        次へ
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">クイズがありません</h3>
              <p className="text-muted-foreground">
                このカテゴリにはまだクイズが投稿されていません
              </p>
              <Button className="mt-4" asChild>
                <Link href="/create">クイズを作成する</Link>
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
      {/* JSON-LD structured data for breadcrumb */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateBreadcrumbJsonLd(
              breadcrumbHelpers.category({
                name: category.name,
                slug: category.slug,
              })
            )
          ),
        }}
      />
    </div>
  );
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        _count: { select: { quizzes: { where: { isPublic: true } } } },
      },
    });

    if (!category) {
      return { title: "カテゴリが見つかりません" };
    }

    return generateCategoryMetadata({
      name: category.name,
      slug: category.slug,
      description: category.description,
      quizCount: category._count.quizzes,
    });
  } catch (error) {
    console.error("Failed to generate metadata:", error);
    return { title: "カテゴリ" };
  }
}
