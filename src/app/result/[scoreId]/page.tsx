"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Trophy,
  Home,
  RotateCcw,
  Loader2,
  Clock,
} from "lucide-react";
import { ResultAd, InFeedAd } from "@/components/ads";
import { ShareButton } from "@/components/common/share-button";

interface QuestionResult {
  questionId: string;
  content: string;
  options: string[];
  selectedIndices: number[];
  correctIndices: number[];
  isMultipleChoice: boolean;
  isCorrect: boolean;
  explanation: string | null;
  points: number;
}

interface ScoreData {
  id: string;
  quiz: {
    id: string;
    title: string;
    passingScore: number;
  };
  score: number;
  maxScore: number;
  percentage: number;
  correctCount: number;
  totalCount: number;
  timeSpent: number | null;
  passed: boolean;
  createdAt: string;
  results: QuestionResult[];
}

export default function ResultPage() {
  const router = useRouter();
  const params = useParams();
  const scoreId = params.scoreId as string;

  const [data, setData] = useState<ScoreData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    async function fetchScore() {
      try {
        const res = await fetch(`/api/scores/${scoreId}`);
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch score");
        }
        const scoreData = await res.json();
        setData(scoreData);
      } catch (error) {
        console.error(error);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    }
    fetchScore();
  }, [scoreId, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">結果が見つかりません</p>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}分${s}秒`;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container py-8">
          {/* Result Summary */}
          <Card className="mb-8">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4">
                {data.passed ? (
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900">
                    <Trophy className="h-10 w-10 text-green-600 dark:text-green-400" />
                  </div>
                ) : (
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900">
                    <RotateCcw className="h-10 w-10 text-orange-600 dark:text-orange-400" />
                  </div>
                )}
              </div>
              <CardTitle className="text-2xl">
                {data.passed ? "合格おめでとう!" : "惜しい!"}
              </CardTitle>
              <CardDescription>{data.quiz.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="text-5xl font-bold mb-2">
                  {data.percentage.toFixed(0)}%
                </div>
                <p className="text-muted-foreground">
                  {data.score} / {data.maxScore} 点
                </p>
              </div>

              <div className="max-w-md mx-auto mb-6">
                <Progress
                  value={data.percentage}
                  className={`h-3 ${data.passed ? "[&>div]:bg-green-500" : "[&>div]:bg-orange-500"}`}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0%</span>
                  <span className="font-medium">
                    合格ライン: {data.quiz.passingScore}%
                  </span>
                  <span>100%</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {data.correctCount}
                  </div>
                  <div className="text-xs text-muted-foreground">正解</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {data.totalCount - data.correctCount}
                  </div>
                  <div className="text-xs text-muted-foreground">不正解</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {data.timeSpent ? formatTime(data.timeSpent) : "-"}
                  </div>
                  <div className="text-xs text-muted-foreground">所要時間</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <Button asChild>
                  <Link href={`/quiz/${data.quiz.id}/play`}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    もう一度挑戦
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    トップへ戻る
                  </Link>
                </Button>
                <ShareButton
                  url={`/quiz/${data.quiz.id}`}
                  title={`「${data.quiz.title}」で${data.percentage.toFixed(0)}%を獲得しました！`}
                  description={`${data.correctCount}/${data.totalCount}問正解 - Quiz Platformで挑戦しよう`}
                />
              </div>
            </CardContent>
          </Card>

          {/* Ad placement */}
          <ResultAd className="mb-8" />

          {/* Details Toggle */}
          <div className="text-center mb-6">
            <Button
              variant="ghost"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? "詳細を隠す" : "詳細を見る"}
            </Button>
          </div>

          {/* Question Results */}
          {showDetails && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">回答詳細</h2>
              {data.results.map((result, index) => (
                <Fragment key={result.questionId}>
                {/* Show ad after every 5 questions */}
                {index > 0 && index % 5 === 0 && (
                  <InFeedAd className="my-4" />
                )}
                <Card
                  className={
                    result.isCorrect
                      ? "border-green-200 dark:border-green-800"
                      : "border-red-200 dark:border-red-800"
                  }
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      {result.isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          Q{index + 1}. {result.content}
                        </CardTitle>
                        <Badge
                          variant={result.isCorrect ? "default" : "destructive"}
                          className="mt-2"
                        >
                          {result.isCorrect
                            ? `+${result.points}点`
                            : "0点"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {result.isMultipleChoice && (
                      <Badge variant="secondary" className="mb-3">
                        複数選択問題
                      </Badge>
                    )}
                    <div className="space-y-2 mb-4">
                      {(result.options as string[]).map((option, optIndex) => {
                        const isCorrectOption = result.correctIndices.includes(optIndex);
                        const isSelected = result.selectedIndices.includes(optIndex);
                        const isWrongSelection = isSelected && !isCorrectOption;
                        return (
                          <div
                            key={optIndex}
                            className={`p-3 rounded-lg border ${
                              isCorrectOption
                                ? "bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-700"
                                : isWrongSelection
                                  ? "bg-red-50 border-red-300 dark:bg-red-950 dark:border-red-700"
                                  : "bg-muted/30"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{option}</span>
                              <div className="flex gap-2">
                                {isSelected && (
                                  <Badge variant="outline">あなたの回答</Badge>
                                )}
                                {isCorrectOption && (
                                  <Badge variant="default">正解</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {result.explanation && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">解説</p>
                        <p className="text-sm text-muted-foreground">
                          {result.explanation}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                </Fragment>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
