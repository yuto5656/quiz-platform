import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  siteConfig,
  generateDefaultMetadata,
  generateQuizMetadata,
  generateCategoryMetadata,
  generateSearchMetadata,
  generateUserMetadata,
  generateQuizJsonLd,
  generateWebsiteJsonLd,
  generateOrganizationJsonLd,
  truncateDescription,
  urlHelpers,
} from "./seo";

describe("seo", () => {
  describe("siteConfig", () => {
    it("should have required properties", () => {
      expect(siteConfig.name).toBe("Quiz Platform");
      expect(siteConfig.title).toBeDefined();
      expect(siteConfig.description).toBeDefined();
      expect(siteConfig.url).toBeDefined();
      expect(siteConfig.locale).toBe("ja_JP");
      expect(siteConfig.keywords).toBeInstanceOf(Array);
      expect(siteConfig.keywords.length).toBeGreaterThan(0);
    });

    it("should contain SEO-relevant keywords", () => {
      expect(siteConfig.keywords).toContain("クイズ");
      expect(siteConfig.keywords).toContain("基本情報技術者試験");
      expect(siteConfig.keywords).toContain("IT資格");
    });
  });

  describe("truncateDescription", () => {
    it("should not truncate short descriptions", () => {
      const shortDesc = "短い説明文です。";
      const result = truncateDescription(shortDesc);

      expect(result).toBe(shortDesc);
    });

    it("should truncate long descriptions to 160 characters", () => {
      const longDesc = "a".repeat(200);
      const result = truncateDescription(longDesc);

      expect(result.length).toBe(160);
      expect(result.endsWith("...")).toBe(true);
    });

    it("should truncate to custom length", () => {
      const desc = "This is a test description that is quite long";
      const result = truncateDescription(desc, 20);

      expect(result.length).toBe(20);
      expect(result.endsWith("...")).toBe(true);
    });

    it("should handle exactly max length", () => {
      const exactDesc = "a".repeat(160);
      const result = truncateDescription(exactDesc);

      expect(result).toBe(exactDesc);
      expect(result.length).toBe(160);
    });

    it("should handle empty string", () => {
      const result = truncateDescription("");

      expect(result).toBe("");
    });
  });

  describe("urlHelpers", () => {
    it("should generate quiz URL", () => {
      const url = urlHelpers.quiz("test-123");

      expect(url).toContain("/quiz/test-123");
      expect(url).toContain(siteConfig.url);
    });

    it("should generate category URL", () => {
      const url = urlHelpers.category("programming");

      expect(url).toContain("/quiz/category/programming");
      expect(url).toContain(siteConfig.url);
    });

    it("should generate profile URL", () => {
      const url = urlHelpers.profile("user-456");

      expect(url).toContain("/profile/user-456");
      expect(url).toContain(siteConfig.url);
    });

    it("should generate search URL without query", () => {
      const url = urlHelpers.search();

      expect(url).toBe(`${siteConfig.url}/search`);
    });

    it("should generate search URL with query", () => {
      const url = urlHelpers.search("JavaScript");

      expect(url).toContain("/search?q=");
      expect(url).toContain("JavaScript");
    });

    it("should encode special characters in search query", () => {
      const url = urlHelpers.search("C++ プログラミング");

      expect(url).toContain(encodeURIComponent("C++ プログラミング"));
    });
  });

  describe("generateDefaultMetadata", () => {
    it("should generate metadata with title template", () => {
      const metadata = generateDefaultMetadata();

      expect(metadata.title).toBeDefined();
      expect(typeof metadata.title).toBe("object");
      expect((metadata.title as { default: string }).default).toBe(
        siteConfig.title
      );
    });

    it("should include description", () => {
      const metadata = generateDefaultMetadata();

      expect(metadata.description).toBe(siteConfig.description);
    });

    it("should include keywords", () => {
      const metadata = generateDefaultMetadata();

      expect(metadata.keywords).toEqual(siteConfig.keywords);
    });

    it("should configure robots for indexing", () => {
      const metadata = generateDefaultMetadata();

      expect(metadata.robots).toBeDefined();
      expect((metadata.robots as { index: boolean }).index).toBe(true);
      expect((metadata.robots as { follow: boolean }).follow).toBe(true);
    });

    it("should include Open Graph settings", () => {
      const metadata = generateDefaultMetadata();

      expect(metadata.openGraph).toBeDefined();
      expect(metadata.openGraph?.type).toBe("website");
      expect(metadata.openGraph?.locale).toBe(siteConfig.locale);
    });

    it("should include Twitter card settings", () => {
      const metadata = generateDefaultMetadata();

      expect(metadata.twitter).toBeDefined();
      expect(metadata.twitter?.card).toBe("summary_large_image");
    });
  });

  describe("generateQuizMetadata", () => {
    const mockQuiz = {
      id: "quiz-123",
      title: "基本情報技術者試験 過去問",
      description: "2024年版の基本情報技術者試験の過去問集です。",
      category: { name: "IT資格" },
      questionCount: 50,
      playCount: 1000,
    };

    it("should generate title from quiz", () => {
      const metadata = generateQuizMetadata(mockQuiz);

      expect(metadata.title).toBe(mockQuiz.title);
    });

    it("should use quiz description when available", () => {
      const metadata = generateQuizMetadata(mockQuiz);

      expect(metadata.description).toBe(mockQuiz.description);
    });

    it("should generate description when not provided", () => {
      const quizWithoutDesc = { ...mockQuiz, description: null };
      const metadata = generateQuizMetadata(quizWithoutDesc);

      expect(metadata.description).toContain(mockQuiz.category.name);
      expect(metadata.description).toContain(mockQuiz.title);
      expect(metadata.description).toContain(
        mockQuiz.questionCount.toString()
      );
    });

    it("should include quiz-specific keywords", () => {
      const metadata = generateQuizMetadata(mockQuiz);

      expect(metadata.keywords).toContain(mockQuiz.title);
      expect(metadata.keywords).toContain(mockQuiz.category.name);
      expect(metadata.keywords).toContain("クイズ");
    });

    it("should set canonical URL", () => {
      const metadata = generateQuizMetadata(mockQuiz);

      expect(metadata.alternates?.canonical).toContain(`/quiz/${mockQuiz.id}`);
    });

    it("should configure Open Graph for article", () => {
      const metadata = generateQuizMetadata(mockQuiz);

      expect(metadata.openGraph?.type).toBe("article");
    });

    it("should truncate very long descriptions", () => {
      const quizWithLongDesc = {
        ...mockQuiz,
        description: "a".repeat(300),
      };
      const metadata = generateQuizMetadata(quizWithLongDesc);

      expect(metadata.description?.length).toBeLessThanOrEqual(160);
    });
  });

  describe("generateCategoryMetadata", () => {
    const mockCategory = {
      name: "プログラミング",
      slug: "programming",
      description: "プログラミングに関するクイズ集",
      quizCount: 25,
    };

    it("should generate title with category name", () => {
      const metadata = generateCategoryMetadata(mockCategory);

      expect(metadata.title).toContain(mockCategory.name);
    });

    it("should use category description when available", () => {
      const metadata = generateCategoryMetadata(mockCategory);

      expect(metadata.description).toBe(mockCategory.description);
    });

    it("should generate description when not provided", () => {
      const categoryWithoutDesc = { ...mockCategory, description: null };
      const metadata = generateCategoryMetadata(categoryWithoutDesc);

      expect(metadata.description).toContain(mockCategory.name);
      expect(metadata.description).toContain(
        mockCategory.quizCount.toString()
      );
    });

    it("should set canonical URL with slug", () => {
      const metadata = generateCategoryMetadata(mockCategory);

      expect(metadata.alternates?.canonical).toContain(
        `/quiz/category/${mockCategory.slug}`
      );
    });
  });

  describe("generateSearchMetadata", () => {
    it("should generate default search page metadata", () => {
      const metadata = generateSearchMetadata();

      expect(metadata.title).toBe("クイズを検索");
      expect(metadata.description).toContain("キーワード");
    });

    it("should include query in title when provided", () => {
      const query = "Python";
      const metadata = generateSearchMetadata(query);

      expect(metadata.title).toContain(query);
    });

    it("should not index search result pages", () => {
      const metadata = generateSearchMetadata("test");

      expect((metadata.robots as { index: boolean }).index).toBe(false);
    });

    it("should index main search page", () => {
      const metadata = generateSearchMetadata();

      expect((metadata.robots as { index: boolean }).index).toBe(true);
    });
  });

  describe("generateUserMetadata", () => {
    const mockUser = {
      id: "user-123",
      name: "田中太郎",
      bio: "ITエンジニア。クイズ好き。",
      quizCount: 10,
    };

    it("should generate title with user name", () => {
      const metadata = generateUserMetadata(mockUser);

      expect(metadata.title).toContain(mockUser.name);
    });

    it("should use bio as description when available", () => {
      const metadata = generateUserMetadata(mockUser);

      expect(metadata.description).toBe(mockUser.bio);
    });

    it("should generate description when bio is null", () => {
      const userWithoutBio = { ...mockUser, bio: null };
      const metadata = generateUserMetadata(userWithoutBio);

      expect(metadata.description).toContain(mockUser.name);
      expect(metadata.description).toContain(mockUser.quizCount.toString());
    });

    it("should handle user with null name", () => {
      const userWithoutName = { ...mockUser, name: null };
      const metadata = generateUserMetadata(userWithoutName);

      expect(metadata.title).toContain("ユーザー");
    });

    it("should set canonical URL with user id", () => {
      const metadata = generateUserMetadata(mockUser);

      expect(metadata.alternates?.canonical).toContain(
        `/profile/${mockUser.id}`
      );
    });

    it("should configure Open Graph for profile", () => {
      const metadata = generateUserMetadata(mockUser);

      expect(metadata.openGraph?.type).toBe("profile");
    });
  });

  describe("generateQuizJsonLd", () => {
    const mockQuiz = {
      id: "quiz-456",
      title: "JavaScript基礎",
      description: "JavaScriptの基礎を学ぶクイズ",
      category: { name: "プログラミング" },
      author: { name: "開発者A" },
      questionCount: 20,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-06-01"),
    };

    it("should return valid JSON-LD structure", () => {
      const jsonLd = generateQuizJsonLd(mockQuiz);

      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(jsonLd["@type"]).toBe("Quiz");
    });

    it("should include quiz details", () => {
      const jsonLd = generateQuizJsonLd(mockQuiz);

      expect(jsonLd.name).toBe(mockQuiz.title);
      expect(jsonLd.description).toBe(mockQuiz.description);
      expect(jsonLd.numberOfQuestions).toBe(mockQuiz.questionCount);
    });

    it("should include author information", () => {
      const jsonLd = generateQuizJsonLd(mockQuiz);

      expect(jsonLd.author["@type"]).toBe("Person");
      expect(jsonLd.author.name).toBe(mockQuiz.author.name);
    });

    it("should handle null author name", () => {
      const quizWithNullAuthor = { ...mockQuiz, author: { name: null } };
      const jsonLd = generateQuizJsonLd(quizWithNullAuthor);

      expect(jsonLd.author.name).toBe("匿名");
    });

    it("should include category as about", () => {
      const jsonLd = generateQuizJsonLd(mockQuiz);

      expect(jsonLd.about["@type"]).toBe("Thing");
      expect(jsonLd.about.name).toBe(mockQuiz.category.name);
    });

    it("should include dates in ISO format", () => {
      const jsonLd = generateQuizJsonLd(mockQuiz);

      expect(jsonLd.dateCreated).toBe(mockQuiz.createdAt.toISOString());
      expect(jsonLd.dateModified).toBe(mockQuiz.updatedAt.toISOString());
    });

    it("should generate description from category when null", () => {
      const quizWithNullDesc = { ...mockQuiz, description: null };
      const jsonLd = generateQuizJsonLd(quizWithNullDesc);

      expect(jsonLd.description).toContain(mockQuiz.category.name);
    });
  });

  describe("generateWebsiteJsonLd", () => {
    it("should return valid JSON-LD structure", () => {
      const jsonLd = generateWebsiteJsonLd();

      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(jsonLd["@type"]).toBe("WebSite");
    });

    it("should include site information", () => {
      const jsonLd = generateWebsiteJsonLd();

      expect(jsonLd.name).toBe(siteConfig.name);
      expect(jsonLd.description).toBe(siteConfig.description);
      expect(jsonLd.url).toBe(siteConfig.url);
    });

    it("should include search action", () => {
      const jsonLd = generateWebsiteJsonLd();

      expect(jsonLd.potentialAction["@type"]).toBe("SearchAction");
      expect(jsonLd.potentialAction.target.urlTemplate).toContain("/search");
    });
  });

  describe("generateOrganizationJsonLd", () => {
    it("should return valid JSON-LD structure", () => {
      const jsonLd = generateOrganizationJsonLd();

      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(jsonLd["@type"]).toBe("Organization");
    });

    it("should include organization information", () => {
      const jsonLd = generateOrganizationJsonLd();

      expect(jsonLd.name).toBe(siteConfig.name);
      expect(jsonLd.url).toBe(siteConfig.url);
    });

    it("should include logo URL", () => {
      const jsonLd = generateOrganizationJsonLd();

      expect(jsonLd.logo).toContain(siteConfig.url);
      expect(jsonLd.logo).toContain("logo.png");
    });
  });
});
