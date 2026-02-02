"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Moon, Sun, Monitor } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/settings");
    }
  }, [status, router]);

  if (status === "loading" || !mounted) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container py-8">
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                ダッシュボードに戻る
              </Link>
            </Button>
          </div>

          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold">設定</h1>
              <p className="text-muted-foreground mt-2">
                アプリケーションの設定を管理します
              </p>
            </div>

            {/* Theme Settings */}
            <Card>
              <CardHeader>
                <CardTitle>外観</CardTitle>
                <CardDescription>
                  アプリケーションの見た目をカスタマイズします
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>テーマ</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="w-full sm:w-64">
                      <SelectValue placeholder="テーマを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center">
                          <Sun className="mr-2 h-4 w-4" />
                          ライト
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center">
                          <Moon className="mr-2 h-4 w-4" />
                          ダーク
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center">
                          <Monitor className="mr-2 h-4 w-4" />
                          システム設定に従う
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    「システム設定に従う」を選択すると、OSの設定に合わせて自動的に切り替わります
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card>
              <CardHeader>
                <CardTitle>アカウント</CardTitle>
                <CardDescription>
                  アカウント情報を管理します
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">プロフィール編集</p>
                    <p className="text-sm text-muted-foreground">
                      表示名や自己紹介を変更します
                    </p>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href="/profile">編集</Link>
                  </Button>
                </div>
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">メールアドレス</p>
                      <p className="text-sm text-muted-foreground">
                        {session?.user?.email || "未設定"}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    メールアドレスはログインプロバイダから取得されます
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Data & Privacy */}
            <Card>
              <CardHeader>
                <CardTitle>データとプライバシー</CardTitle>
                <CardDescription>
                  プライバシー設定を管理します
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">利用規約</p>
                    <p className="text-sm text-muted-foreground">
                      サービスの利用規約を確認します
                    </p>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href="/terms">確認</Link>
                  </Button>
                </div>
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">プライバシーポリシー</p>
                      <p className="text-sm text-muted-foreground">
                        個人情報の取り扱いについて確認します
                      </p>
                    </div>
                    <Button variant="outline" asChild>
                      <Link href="/privacy">確認</Link>
                    </Button>
                  </div>
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
