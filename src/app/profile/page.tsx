"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
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
import { AdminAvatar } from "@/components/common/admin-avatar";
import { Loader2, Save, ArrowLeft, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  displayName: string | null;
  bio: string | null;
  customAvatar: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [customAvatar, setCustomAvatar] = useState("");
  const [avatarError, setAvatarError] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/profile");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/users/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setDisplayName(data.user.displayName || "");
          setBio(data.user.bio || "");
          setCustomAvatar(data.user.customAvatar || "");
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setIsLoading(false);
      }
    }

    async function checkAdmin() {
      try {
        const res = await fetch("/api/admin/check");
        if (res.ok) {
          const data = await res.json();
          setIsAdmin(data.isAdmin);
        }
      } catch {
        // Ignore errors
      }
    }

    if (status === "authenticated") {
      fetchUser();
      checkAdmin();
    }
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName || undefined,
          bio: bio || undefined,
          customAvatar: customAvatar || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update profile");
      }

      const updatedUser = await res.json();
      setUser((prev) => (prev ? { ...prev, ...updatedUser } : null));
      toast.success("プロフィールを更新しました");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "プロフィールの更新に失敗しました"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">ユーザー情報が見つかりません</p>
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

          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>プロフィール編集</CardTitle>
                <CardDescription>
                  公開プロフィール情報を編集できます
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Avatar Preview */}
                  <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                    <AdminAvatar
                      isAdmin={isAdmin}
                      customAvatar={customAvatar && !avatarError ? customAvatar : undefined}
                      image={user.image}
                      name={user.name}
                      size="md"
                    />
                    <div>
                      <p className="font-medium">{displayName || user.name || "ユーザー"}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        上記はクイズカード等に表示されるプレビューです
                      </p>
                    </div>
                  </div>

                  {/* Custom Avatar URL */}
                  <div className="space-y-2">
                    <Label htmlFor="customAvatar">カスタムアバター</Label>
                    <div className="flex gap-2">
                      <Input
                        id="customAvatar"
                        type="url"
                        placeholder="https://example.com/avatar.png"
                        value={customAvatar}
                        onChange={(e) => {
                          setCustomAvatar(e.target.value);
                          setAvatarError(false);
                        }}
                        maxLength={500}
                        className="flex-1"
                      />
                      {customAvatar && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setCustomAvatar("");
                            setAvatarError(false);
                          }}
                          title="クリア"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {customAvatar && !avatarError && (
                      <div className="flex items-center gap-2 mt-2">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">プレビュー:</span>
                        {/* Hidden img to detect load errors */}
                        <img
                          src={customAvatar}
                          alt="Avatar preview"
                          className="h-8 w-8 rounded-full object-cover"
                          onError={() => setAvatarError(true)}
                        />
                      </div>
                    )}
                    {avatarError && (
                      <p className="text-xs text-destructive">
                        画像の読み込みに失敗しました。URLを確認してください。
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      設定するとGoogleアバターの代わりにこの画像が表示されます。未設定の場合はデフォルトアイコンが表示されます。
                    </p>
                  </div>

                  {/* Display Name */}
                  <div className="space-y-2">
                    <Label htmlFor="displayName">表示名</Label>
                    <Input
                      id="displayName"
                      placeholder="公開される名前を入力"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      maxLength={50}
                    />
                    <p className="text-xs text-muted-foreground">
                      空欄の場合はアカウント名が表示されます
                    </p>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio">自己紹介</Label>
                    <Textarea
                      id="bio"
                      placeholder="自己紹介を入力..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      maxLength={500}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      {bio.length}/500文字
                    </p>
                  </div>

                  {/* Submit */}
                  <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" asChild>
                      <Link href="/dashboard">キャンセル</Link>
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      保存する
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
