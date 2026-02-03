"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { CheckCircle, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

const categories = [
  { value: "inquiry", label: "お問い合わせ" },
  { value: "feature_request", label: "機能リクエスト" },
  { value: "bug_report", label: "バグ報告" },
  { value: "other", label: "その他" },
];

export default function FeedbackPage() {
  const { data: session } = useSession();

  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category) {
      toast.error("カテゴリを選択してください");
      return;
    }
    if (!content.trim()) {
      toast.error("内容を入力してください");
      return;
    }
    if (content.length < 10) {
      toast.error("内容は10文字以上で入力してください");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          content,
          email: email || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "送信に失敗しました");
      }

      setIsSubmitted(true);
      toast.success("フィードバックを送信しました");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "送信に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCategory("");
    setContent("");
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-muted/30">
          <div className="container py-12">
            <div className="max-w-xl mx-auto">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                    <h2 className="text-2xl font-bold mb-2">送信完了</h2>
                    <p className="text-muted-foreground mb-6">
                      フィードバックをお寄せいただきありがとうございます。
                      <br />
                      いただいた内容は今後のサービス改善に活用させていただきます。
                    </p>
                    <Button onClick={handleReset}>
                      別のフィードバックを送信
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container py-12">
          <div className="max-w-xl mx-auto">
            <div className="mb-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h1 className="text-3xl font-bold">フィードバック</h1>
              <p className="text-muted-foreground mt-2">
                ご意見・ご要望・バグ報告をお寄せください
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>フィードバックフォーム</CardTitle>
                <CardDescription>
                  お問い合わせ、機能リクエスト、バグ報告など、何でもお気軽にお送りください。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="category">カテゴリ *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="カテゴリを選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">内容 *</Label>
                    <Textarea
                      id="content"
                      placeholder="フィードバックの内容を詳しくお書きください..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      {content.length} / 5000 文字
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">メールアドレス（任意）</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="返信が必要な場合はメールアドレスをご入力ください"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      返信が必要な場合のみご入力ください
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        送信中...
                      </>
                    ) : (
                      "フィードバックを送信"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
