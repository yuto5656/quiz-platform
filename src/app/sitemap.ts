import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/seo";

// Force dynamic rendering to avoid build-time DB connection
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;

  // 静的ページ
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  // カテゴリページ
  const categories = await prisma.category.findMany({
    select: { slug: true, createdAt: true },
  });

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/quiz/category/${category.slug}`,
    lastModified: category.createdAt,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  // 公開クイズページ
  const quizzes = await prisma.quiz.findMany({
    where: { isPublic: true },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 5000, // 最大5000件（サイトマップの推奨上限）
  });

  const quizPages: MetadataRoute.Sitemap = quizzes.map((quiz) => ({
    url: `${baseUrl}/quiz/${quiz.id}`,
    lastModified: quiz.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // ユーザープロフィールページ（公開クイズを持つユーザーのみ）
  const usersWithQuizzes = await prisma.user.findMany({
    where: {
      quizzes: {
        some: { isPublic: true },
      },
    },
    select: { id: true, updatedAt: true },
    take: 1000,
  });

  const userPages: MetadataRoute.Sitemap = usersWithQuizzes.map((user) => ({
    url: `${baseUrl}/profile/${user.id}`,
    lastModified: user.updatedAt,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticPages, ...categoryPages, ...quizPages, ...userPages];
}
