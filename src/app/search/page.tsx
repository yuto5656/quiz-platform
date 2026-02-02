"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { QuizCard } from "@/components/quiz/quiz-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2, FolderOpen } from "lucide-react";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  author: { id: string; name: string | null; image: string | null };
  category: { id: string; name: string; slug: string };
  questionCount: number;
  playCount: number;
  avgScore: number | null;
  timeLimit: number | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface SearchResult {
  quizzes: Quiz[];
  total: number;
  totalPages: number;
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [categoryId, setCategoryId] = useState(searchParams.get("category") || "all");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "newest");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));

  const [categories, setCategories] = useState<Category[]>([]);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    }
    fetchCategories();
  }, []);

  // Search function
  const search = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (categoryId && categoryId !== "all") params.set("category", categoryId);
      params.set("sortBy", sortBy);
      params.set("page", page.toString());

      const res = await fetch(`/api/quizzes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [query, categoryId, sortBy, page]);

  // Search on parameter change
  useEffect(() => {
    search();
  }, [search]);

  // Update URL
  const updateUrl = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`/search?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    updateUrl({ q: query, category: categoryId, sortBy, page: "1" });
  };

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    setPage(1);
    updateUrl({ q: query, category: value, sortBy, page: "1" });
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setPage(1);
    updateUrl({ q: query, category: categoryId, sortBy: value, page: "1" });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrl({ q: query, category: categoryId, sortBy, page: newPage.toString() });
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">クイズを検索</h1>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="キーワードで検索..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryId} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="カテゴリ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべてのカテゴリ</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="並び順" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">新着順</SelectItem>
              <SelectItem value="popular">人気順</SelectItem>
              <SelectItem value="score">高評価順</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit">
            <Search className="mr-2 h-4 w-4" />
            検索
          </Button>
        </div>
      </form>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : result ? (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {result.total}件のクイズが見つかりました
          </p>

          {result.quizzes.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {result.quizzes.map((quiz) => (
                  <QuizCard key={quiz.id} quiz={quiz} />
                ))}
              </div>

              {/* Pagination */}
              {result.totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  {page > 1 && (
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(page - 1)}
                    >
                      前へ
                    </Button>
                  )}
                  <span className="flex items-center px-4 text-sm text-muted-foreground">
                    {page} / {result.totalPages}
                  </span>
                  {page < result.totalPages && (
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(page + 1)}
                    >
                      次へ
                    </Button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">
                クイズが見つかりませんでした
              </h3>
              <p className="text-muted-foreground">
                検索条件を変更してお試しください
              </p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

function SearchFallback() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">クイズを検索</h1>
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <Suspense fallback={<SearchFallback />}>
          <SearchContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
