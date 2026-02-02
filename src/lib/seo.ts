import type { Metadata } from "next";

/**
 * SEO utilities for the quiz platform
 */

// Type definitions for JSON-LD
export interface QuizJsonLd {
  "@context": string;
  "@type": string;
  name: string;
  description: string;
  about: { "@type": string; name: string };
  author: { "@type": string; name: string };
  numberOfQuestions: number;
  dateCreated: string;
  dateModified: string;
  url: string;
  provider: { "@type": string; name: string; url: string };
}

export interface WebsiteJsonLd {
  "@context": string;
  "@type": string;
  name: string;
  description: string;
  url: string;
  potentialAction: {
    "@type": string;
    target: { "@type": string; urlTemplate: string };
    "query-input": string;
  };
}

export interface OrganizationJsonLd {
  "@context": string;
  "@type": string;
  name: string;
  url: string;
  logo: string;
  sameAs: string[];
}

// Input types for metadata generators
export interface QuizMetadataInput {
  id: string;
  title: string;
  description: string | null;
  category: { name: string };
  questionCount: number;
  playCount: number;
}

export interface CategoryMetadataInput {
  name: string;
  slug: string;
  description: string | null;
  quizCount: number;
}

export interface UserMetadataInput {
  id: string;
  name: string | null;
  bio: string | null;
  quizCount: number;
}

export interface QuizJsonLdInput {
  id: string;
  title: string;
  description: string | null;
  category: { name: string };
  author: { name: string | null };
  questionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Constants
const MAX_DESCRIPTION_LENGTH = 160; // SEO best practice for meta description

// サイトの基本情報
export const siteConfig = {
  name: "Quiz Platform",
  title: "Quiz Platform - クイズを作って解こう",
  description:
    "誰でも無料でクイズを作成・公開できるプラットフォーム。IT資格試験、基本情報技術者試験、プログラミング、一般常識など様々なカテゴリのクイズに挑戦しよう。",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://quiz-platform.example.com",
  locale: "ja_JP",
  keywords: [
    "クイズ",
    "問題集",
    "試験対策",
    "基本情報技術者試験",
    "IT資格",
    "プログラミング",
    "勉強",
    "学習",
    "無料",
    "オンライン",
  ] as string[],
};

/**
 * Truncate description to SEO-recommended length
 */
export function truncateDescription(
  description: string,
  maxLength: number = MAX_DESCRIPTION_LENGTH
): string {
  if (description.length <= maxLength) {
    return description;
  }
  return description.slice(0, maxLength - 3) + "...";
}

/**
 * URL helpers for consistent URL generation
 */
export const urlHelpers = {
  quiz: (id: string) => `${siteConfig.url}/quiz/${id}`,
  category: (slug: string) => `${siteConfig.url}/quiz/category/${slug}`,
  profile: (id: string) => `${siteConfig.url}/profile/${id}`,
  search: (query?: string) =>
    query ? `${siteConfig.url}/search?q=${encodeURIComponent(query)}` : `${siteConfig.url}/search`,
};

/**
 * デフォルトのメタデータを生成
 */
export function generateDefaultMetadata(): Metadata {
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: siteConfig.title,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    keywords: siteConfig.keywords,
    authors: [{ name: siteConfig.name }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url: siteConfig.url,
      title: siteConfig.title,
      description: siteConfig.description,
      siteName: siteConfig.name,
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.title,
      description: siteConfig.description,
    },
    alternates: {
      canonical: siteConfig.url,
    },
    verification: {
      // Google Search Console verification (set via environment variable)
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  };
}

/**
 * クイズ詳細ページ用のメタデータを生成
 */
export function generateQuizMetadata(quiz: QuizMetadataInput): Metadata {
  const title = quiz.title;
  const rawDescription =
    quiz.description ||
    `${quiz.category.name}の${quiz.title}に挑戦しよう！全${quiz.questionCount}問、${quiz.playCount}人がプレイ中。`;
  const description = truncateDescription(rawDescription);
  const url = urlHelpers.quiz(quiz.id);

  return {
    title,
    description,
    keywords: [
      quiz.title,
      quiz.category.name,
      "クイズ",
      "問題",
      "試験対策",
      ...siteConfig.keywords,
    ],
    openGraph: {
      type: "article",
      title: `${title} | ${siteConfig.name}`,
      description,
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteConfig.name}`,
      description,
    },
    alternates: {
      canonical: url,
    },
  };
}

/**
 * カテゴリページ用のメタデータを生成
 */
export function generateCategoryMetadata(category: CategoryMetadataInput): Metadata {
  const title = `${category.name}のクイズ一覧`;
  const rawDescription =
    category.description ||
    `${category.name}に関するクイズが${category.quizCount}件あります。無料でオンラインクイズに挑戦しよう。`;
  const description = truncateDescription(rawDescription);
  const url = urlHelpers.category(category.slug);

  return {
    title,
    description,
    keywords: [category.name, "クイズ", "問題集", ...siteConfig.keywords],
    openGraph: {
      type: "website",
      title: `${title} | ${siteConfig.name}`,
      description,
      url,
    },
    twitter: {
      card: "summary",
      title: `${title} | ${siteConfig.name}`,
      description,
    },
    alternates: {
      canonical: url,
    },
  };
}

/**
 * 検索ページ用のメタデータを生成
 */
export function generateSearchMetadata(query?: string): Metadata {
  const title = query ? `「${query}」の検索結果` : "クイズを検索";
  const description = query
    ? `「${query}」に関するクイズの検索結果。無料でオンラインクイズに挑戦しよう。`
    : "キーワードやカテゴリでクイズを検索。IT資格試験、プログラミング、一般常識など様々なクイズを探そう。";

  return {
    title,
    description,
    robots: {
      index: !query, // 検索結果ページはインデックスしない
      follow: true,
    },
  };
}

/**
 * ユーザープロフィールページ用のメタデータを生成
 */
export function generateUserMetadata(user: UserMetadataInput): Metadata {
  const displayName = user.name || "ユーザー";
  const title = `${displayName}のプロフィール`;
  const rawDescription =
    user.bio || `${displayName}さんの作成したクイズ（${user.quizCount}件）`;
  const description = truncateDescription(rawDescription);
  const url = urlHelpers.profile(user.id);

  return {
    title,
    description,
    openGraph: {
      type: "profile",
      title: `${title} | ${siteConfig.name}`,
      description,
      url,
    },
    alternates: {
      canonical: url,
    },
  };
}

/**
 * JSON-LD構造化データ: クイズ用
 */
export function generateQuizJsonLd(quiz: QuizJsonLdInput): QuizJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: quiz.title,
    description: quiz.description || `${quiz.category.name}のクイズ`,
    about: {
      "@type": "Thing",
      name: quiz.category.name,
    },
    author: {
      "@type": "Person",
      name: quiz.author.name || "匿名",
    },
    numberOfQuestions: quiz.questionCount,
    dateCreated: quiz.createdAt.toISOString(),
    dateModified: quiz.updatedAt.toISOString(),
    url: urlHelpers.quiz(quiz.id),
    provider: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };
}

/**
 * JSON-LD構造化データ: サイト全体用
 */
export function generateWebsiteJsonLd(): WebsiteJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * JSON-LD構造化データ: 組織用
 */
export function generateOrganizationJsonLd(): OrganizationJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    sameAs: [],
  };
}
