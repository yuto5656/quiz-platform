import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/settings/",
          "/create/",
          "/edit/",
          "/profile/", // 自分のプロフィール編集ページ
          "/quiz/*/play/", // プレイ中のページ
          "/result/", // 結果ページ（個人情報）
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
