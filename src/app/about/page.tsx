import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Sparkles, Users, Trophy, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container py-8">
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                トップに戻る
              </Link>
            </Button>
          </div>

          <div className="max-w-3xl mx-auto">
            {/* Hero */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">Quiz Platformについて</h1>
              <p className="text-xl text-muted-foreground">
                誰でも無料でクイズを作成・共有できるプラットフォーム
              </p>
            </div>

            {/* Mission */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  私たちのミッション
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Quiz Platformは、学びをもっと楽しく、もっと身近にすることを目指しています。
                  クイズを通じて知識を共有し、学び合うコミュニティを作りたいと考えています。
                  教育機関、企業研修、趣味のサークルなど、様々な場面でご活用いただけます。
                </p>
              </CardContent>
            </Card>

            {/* Features */}
            <h2 className="text-2xl font-bold mb-6">主な機能</h2>
            <div className="grid gap-4 sm:grid-cols-2 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">簡単クイズ作成</h3>
                      <p className="text-sm text-muted-foreground">
                        直感的なエディタで、誰でも簡単にクイズを作成できます。
                        選択肢の数や配点も自由に設定可能です。
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">共有と挑戦</h3>
                      <p className="text-sm text-muted-foreground">
                        作成したクイズはURLで簡単に共有できます。
                        他のユーザーが作ったクイズにも挑戦できます。
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                      <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">スコア記録</h3>
                      <p className="text-sm text-muted-foreground">
                        挑戦したクイズのスコアは自動的に記録されます。
                        ダッシュボードで履歴を確認できます。
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <Heart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">完全無料</h3>
                      <p className="text-sm text-muted-foreground">
                        すべての機能を無料でご利用いただけます。
                        アカウント登録も簡単です。
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* CTA */}
            <Card>
              <CardContent className="py-8 text-center">
                <h3 className="text-xl font-bold mb-2">
                  さあ、始めましょう！
                </h3>
                <p className="text-muted-foreground mb-4">
                  今すぐ無料でアカウントを作成して、クイズを楽しみましょう。
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild>
                    <Link href="/create">クイズを作成する</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/">クイズを探す</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export const metadata = {
  title: "About | Quiz Platform",
  description: "Quiz Platformについて - 誰でも無料でクイズを作成・共有できるプラットフォーム",
};
