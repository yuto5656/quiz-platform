import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="container max-w-md text-center py-16">
          <div className="mb-8">
            <span className="text-8xl font-bold text-muted-foreground/30">
              404
            </span>
          </div>
          <h1 className="text-2xl font-bold mb-4">
            ページが見つかりません
          </h1>
          <p className="text-muted-foreground mb-8">
            お探しのページは存在しないか、移動した可能性があります。
            URLをご確認いただくか、以下のリンクからお探しください。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                トップページ
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/search">
                <Search className="mr-2 h-4 w-4" />
                クイズを探す
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
