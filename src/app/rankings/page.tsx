"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award, Users, Gamepad2, Sparkles } from "lucide-react";
import { SidebarAd, InFeedAd } from "@/components/ads";

interface UserRanking {
  rank: number;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    totalScore: number;
    quizzesTaken: number;
    quizzesCreated: number;
  };
}

interface QuizRanking {
  rank: number;
  quiz: {
    id: string;
    title: string;
    author: { id: string; name: string | null; image: string | null };
    category: { id: string; name: string; slug: string };
    questionCount: number;
    playCount: number;
    avgScore: number;
    likeCount: number;
  };
}

interface CreatorRanking {
  rank: number;
  creator: {
    id: string;
    name: string | null;
    image: string | null;
    quizzesCreated: number;
    totalPlays: number;
    totalLikes: number;
  };
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
  return <span className="text-lg font-bold text-muted-foreground">{rank}</span>;
}

function UserRankingList({ rankings }: { rankings: UserRanking[] }) {
  return (
    <div className="space-y-3">
      {rankings.map((item) => (
        <Link key={item.user.id} href={`/profile/${item.user.id}`}>
          <Card className="hover:bg-muted/50 transition-colors">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-8 flex justify-center">{getRankIcon(item.rank)}</div>
              <Avatar>
                <AvatarImage src={item.user.image || ""} />
                <AvatarFallback>
                  {item.user.name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {item.user.name || "匿名ユーザー"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {item.user.quizzesTaken}クイズ受験
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">
                  {item.user.totalScore.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">ポイント</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function QuizRankingList({ rankings }: { rankings: QuizRanking[] }) {
  return (
    <div className="space-y-3">
      {rankings.map((item) => (
        <Link key={item.quiz.id} href={`/quiz/${item.quiz.id}`}>
          <Card className="hover:bg-muted/50 transition-colors">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-8 flex justify-center">{getRankIcon(item.rank)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.quiz.title}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    {item.quiz.category.name}
                  </Badge>
                  <span>{item.quiz.questionCount}問</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">
                  {item.quiz.playCount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">プレイ</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function CreatorRankingList({ rankings }: { rankings: CreatorRanking[] }) {
  return (
    <div className="space-y-3">
      {rankings.map((item) => (
        <Link key={item.creator.id} href={`/profile/${item.creator.id}`}>
          <Card className="hover:bg-muted/50 transition-colors">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-8 flex justify-center">{getRankIcon(item.rank)}</div>
              <Avatar>
                <AvatarImage src={item.creator.image || ""} />
                <AvatarFallback>
                  {item.creator.name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {item.creator.name || "匿名ユーザー"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {item.creator.quizzesCreated}クイズ作成
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">
                  {item.creator.totalPlays.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">総プレイ数</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function RankingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(10)].map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-center gap-4 p-4">
            <Skeleton className="w-8 h-8" />
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function RankingsPage() {
  const [userRankings, setUserRankings] = useState<UserRanking[]>([]);
  const [quizRankings, setQuizRankings] = useState<QuizRanking[]>([]);
  const [creatorRankings, setCreatorRankings] = useState<CreatorRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRankings() {
      try {
        const [usersRes, quizzesRes, creatorsRes] = await Promise.all([
          fetch("/api/rankings?type=users&limit=10"),
          fetch("/api/rankings?type=quizzes&limit=10"),
          fetch("/api/rankings?type=creators&limit=10"),
        ]);

        if (usersRes.ok) {
          const data = await usersRes.json();
          setUserRankings(data.rankings);
        }
        if (quizzesRes.ok) {
          const data = await quizzesRes.json();
          setQuizRankings(data.rankings);
        }
        if (creatorsRes.ok) {
          const data = await creatorsRes.json();
          setCreatorRankings(data.rankings);
        }
      } catch (error) {
        console.error("Failed to fetch rankings:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRankings();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="h-8 w-8 text-yellow-500" />
              ランキング
            </h1>
            <p className="text-muted-foreground mt-2">
              トップユーザーと人気のクイズをチェックしよう
            </p>
          </div>

          <div className="flex gap-8">
            {/* Main Content */}
            <div className="flex-1 min-w-0">
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                ユーザー
              </TabsTrigger>
              <TabsTrigger value="quizzes" className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4" />
                クイズ
              </TabsTrigger>
              <TabsTrigger value="creators" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                クリエイター
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>スコアランキング</CardTitle>
                  <CardDescription>
                    総獲得ポイントが多いユーザーのランキング
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <RankingSkeleton />
                  ) : userRankings.length > 0 ? (
                    <UserRankingList rankings={userRankings} />
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      まだランキングデータがありません
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quizzes">
              <Card>
                <CardHeader>
                  <CardTitle>人気クイズランキング</CardTitle>
                  <CardDescription>
                    プレイ数が多いクイズのランキング
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <RankingSkeleton />
                  ) : quizRankings.length > 0 ? (
                    <QuizRankingList rankings={quizRankings} />
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      まだランキングデータがありません
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="creators">
              <Card>
                <CardHeader>
                  <CardTitle>クリエイターランキング</CardTitle>
                  <CardDescription>
                    人気のクイズ作成者ランキング
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <RankingSkeleton />
                  ) : creatorRankings.length > 0 ? (
                    <CreatorRankingList rankings={creatorRankings} />
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      まだランキングデータがありません
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
            </div>

            {/* Sidebar Ad */}
            <SidebarAd />
          </div>

          {/* Bottom Ad */}
          <InFeedAd className="mt-8" />

          {/* About Rankings Section */}
          <section className="mt-12 border-t pt-8">
            <h2 className="text-xl font-bold mb-4">ランキングについて</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-background rounded-lg border">
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-primary" />
                  ユーザーランキング
                </h3>
                <p className="text-sm text-muted-foreground">
                  クイズに挑戦して獲得したポイントの合計で順位が決まります。たくさんのクイズに挑戦して上位を目指しましょう。
                </p>
              </div>
              <div className="p-4 bg-background rounded-lg border">
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                  <Gamepad2 className="h-4 w-4 text-primary" />
                  クイズランキング
                </h3>
                <p className="text-sm text-muted-foreground">
                  プレイ回数が多いクイズのランキングです。人気のクイズをチェックして、トレンドを把握しましょう。
                </p>
              </div>
              <div className="p-4 bg-background rounded-lg border">
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  クリエイターランキング
                </h3>
                <p className="text-sm text-muted-foreground">
                  作成したクイズの総プレイ数でランキング。魅力的なクイズを作成して、トップクリエイターを目指しましょう。
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
