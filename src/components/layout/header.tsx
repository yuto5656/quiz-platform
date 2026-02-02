"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/auth/user-menu";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { PlusCircle, Search } from "lucide-react";

export function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="text-xl font-bold">Quiz Platform</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/quiz/category/general"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              カテゴリ
            </Link>
            <Link
              href="/search"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              検索
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button variant="ghost" size="icon" className="md:hidden" asChild>
            <Link href="/search">
              <Search className="h-5 w-5" />
              <span className="sr-only">検索</span>
            </Link>
          </Button>
          <ThemeToggle />
          {status === "loading" ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : session ? (
            <>
              <Button variant="outline" size="sm" asChild className="hidden sm:flex">
                <Link href="/create">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  クイズ作成
                </Link>
              </Button>
              <UserMenu user={session.user} />
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">ログイン</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
