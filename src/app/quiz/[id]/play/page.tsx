"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/layout/header";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Loader2,
  ListOrdered,
  PlayCircle,
  XCircle,
} from "lucide-react";

interface Question {
  id: string;
  content: string;
  options: string[];
  imageUrl: string | null;
  points: number;
  order: number;
  isMultipleChoice: boolean;
  correctIndices?: number[];
  explanation?: string;
}

interface QuizData {
  quizId: string;
  title: string;
  timeLimit: number | null;
  questions: Question[];
}

type PlayMode = "select" | "standard" | "one-by-one";

interface AnswerResult {
  isCorrect: boolean;
  correctIndices: number[];
  explanation?: string;
}

export default function QuizPlayPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.id as string;

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number[]>>(new Map());
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  // One-by-one mode states
  const [playMode, setPlayMode] = useState<PlayMode>("select");
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentResult, setCurrentResult] = useState<AnswerResult | null>(null);
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);
  const [oneByOneResults, setOneByOneResults] = useState<Map<string, AnswerResult>>(new Map());

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch(`/api/quizzes/${quizId}/questions`);
        if (!res.ok) {
          if (res.status === 401) {
            router.push(`/login?callbackUrl=/quiz/${quizId}/play`);
            return;
          }
          throw new Error("Failed to fetch questions");
        }
        const data = await res.json();
        setQuizData(data);
        if (data.timeLimit) {
          setRemainingTime(data.timeLimit);
        }
      } catch (error) {
        console.error(error);
        router.push(`/quiz/${quizId}`);
      } finally {
        setIsLoading(false);
      }
    }
    fetchQuestions();
  }, [quizId, router]);

  useEffect(() => {
    // Only run timer in standard mode
    if (playMode !== "standard" || remainingTime === null || remainingTime <= 0) return;

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingTime, playMode]);

  const handleSelectAnswer = (questionId: string, optionIndex: number, isMultipleChoice: boolean) => {
    // In one-by-one mode, don't allow changing answer after checking
    if (playMode === "one-by-one" && showAnswer) return;

    setAnswers((prev) => {
      const newAnswers = new Map(prev);
      if (isMultipleChoice) {
        const current = newAnswers.get(questionId) ?? [];
        if (current.includes(optionIndex)) {
          const filtered = current.filter((i) => i !== optionIndex);
          if (filtered.length > 0) {
            newAnswers.set(questionId, filtered);
          } else {
            newAnswers.delete(questionId);
          }
        } else {
          newAnswers.set(questionId, [...current, optionIndex].sort((a, b) => a - b));
        }
      } else {
        newAnswers.set(questionId, [optionIndex]);
      }
      return newAnswers;
    });
  };

  const handleCheckAnswer = async () => {
    if (!quizData || isCheckingAnswer) return;
    const currentQuestion = quizData.questions[currentIndex];
    const selectedIndices = answers.get(currentQuestion.id) ?? [];

    if (selectedIndices.length === 0) return;

    setIsCheckingAnswer(true);
    try {
      const res = await fetch(`/api/quizzes/${quizId}/check-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          selectedIndices,
        }),
      });

      if (!res.ok) throw new Error("Failed to check answer");

      const result: AnswerResult = await res.json();
      setCurrentResult(result);
      setShowAnswer(true);

      // Store result for this question
      setOneByOneResults((prev) => {
        const newResults = new Map(prev);
        newResults.set(currentQuestion.id, result);
        return newResults;
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsCheckingAnswer(false);
    }
  };

  const handleNextQuestion = () => {
    if (!quizData) return;
    if (currentIndex < quizData.questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setShowAnswer(false);
      setCurrentResult(null);
    }
  };

  const handleFinishOneByOne = async () => {
    if (!quizData || isSubmitting) return;

    setIsSubmitting(true);
    const totalTimeSpent = Math.floor((Date.now() - startTime) / 1000);

    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: quizData.quizId,
          answers: quizData.questions.map((q) => ({
            questionId: q.id,
            selectedIndices: answers.get(q.id) ?? [],
          })),
          totalTimeSpent,
          mode: "one-by-one",
        }),
      });

      if (!res.ok) throw new Error("Failed to submit");

      const result = await res.json();
      router.push(`/result/${result.scoreId}`);
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!quizData || isSubmitting) return;

    setIsSubmitting(true);
    const totalTimeSpent = Math.floor((Date.now() - startTime) / 1000);

    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: quizData.quizId,
          answers: quizData.questions.map((q) => ({
            questionId: q.id,
            selectedIndices: answers.get(q.id) ?? [],
          })),
          totalTimeSpent,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit");

      const result = await res.json();
      router.push(`/result/${result.scoreId}`);
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

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

  if (!quizData || quizData.questions.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">問題が見つかりません</p>
        </div>
      </div>
    );
  }

  // Mode selection screen
  if (playMode === "select") {
    return (
      <div className="flex min-h-screen flex-col bg-muted/30">
        <Header />
        <main className="flex-1 container py-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-2">{quizData.title}</h1>
            <p className="text-muted-foreground mb-8">
              {quizData.questions.length}問 {quizData.timeLimit ? `/ 制限時間: ${Math.floor(quizData.timeLimit / 60)}分` : ""}
            </p>

            <h2 className="text-lg font-semibold mb-4">プレイモードを選択</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <Card
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setPlayMode("standard")}
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ListOrdered className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">試験モード</CardTitle>
                  </div>
                  <CardDescription>
                    すべての問題に回答してから提出します。問題間を自由に移動できます。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 問題の行き来が可能</li>
                    <li>• 最後に一括採点</li>
                    {quizData.timeLimit && <li>• 制限時間あり</li>}
                  </ul>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setPlayMode("one-by-one")}
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <PlayCircle className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">一問一答モード</CardTitle>
                  </div>
                  <CardDescription>
                    1問ずつ回答し、すぐに正解が確認できます。前の問題には戻れません。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 即時に正解/解説を表示</li>
                    <li>• 前の問題には戻れない</li>
                    <li>• 制限時間なし</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Button
              variant="outline"
              className="mt-6"
              onClick={() => router.push(`/quiz/${quizId}`)}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              クイズ詳細に戻る
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const currentQuestion = quizData.questions[currentIndex];
  const progress = ((currentIndex + 1) / quizData.questions.length) * 100;
  const answeredCount = answers.size;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // One-by-one mode
  if (playMode === "one-by-one") {
    const selectedIndices = answers.get(currentQuestion.id) ?? [];
    const isLastQuestion = currentIndex === quizData.questions.length - 1;

    return (
      <div className="flex min-h-screen flex-col bg-muted/30">
        <Header />
        <main className="flex-1 container py-6">
          {/* Progress Bar */}
          <div className="mb-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">一問一答モード</Badge>
                <span className="font-medium">{quizData.title}</span>
              </div>
              <span className="text-muted-foreground">
                {currentIndex + 1} / {quizData.questions.length}
              </span>
            </div>
            <Progress value={progress} />
          </div>

          {/* Question Card */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">
                  Q{currentIndex + 1}. {currentQuestion.content}
                </CardTitle>
                <span className="text-sm text-muted-foreground shrink-0 ml-4">
                  {currentQuestion.points}点
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {currentQuestion.imageUrl && (
                <img
                  src={currentQuestion.imageUrl}
                  alt="問題画像"
                  className="mb-4 max-h-64 rounded-lg object-contain"
                />
              )}
              {currentQuestion.isMultipleChoice && (
                <Badge variant="secondary" className="mb-3">
                  複数選択可
                </Badge>
              )}

              {/* Options */}
              {currentQuestion.isMultipleChoice ? (
                <div className="space-y-3">
                  {(currentQuestion.options as string[]).map((option, index) => {
                    const isSelected = selectedIndices.includes(index);
                    const isCorrect = showAnswer && currentResult?.correctIndices.includes(index);
                    const isWrong = showAnswer && isSelected && !currentResult?.correctIndices.includes(index);

                    let borderClass = "hover:bg-muted/50";
                    if (showAnswer) {
                      if (isCorrect) {
                        borderClass = "border-green-500 bg-green-50 dark:bg-green-950";
                      } else if (isWrong) {
                        borderClass = "border-red-500 bg-red-50 dark:bg-red-950";
                      }
                    } else if (isSelected) {
                      borderClass = "border-primary bg-primary/5";
                    }

                    return (
                      <div
                        key={index}
                        className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors ${
                          showAnswer ? "" : "cursor-pointer"
                        } ${borderClass}`}
                        onClick={() =>
                          !showAnswer && handleSelectAnswer(currentQuestion.id, index, true)
                        }
                      >
                        <Checkbox
                          id={`option-${index}`}
                          checked={isSelected}
                          disabled={showAnswer}
                          onCheckedChange={() =>
                            !showAnswer && handleSelectAnswer(currentQuestion.id, index, true)
                          }
                        />
                        <Label
                          htmlFor={`option-${index}`}
                          className={`flex-1 ${showAnswer ? "" : "cursor-pointer"}`}
                        >
                          {option}
                        </Label>
                        {showAnswer && isCorrect && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {showAnswer && isWrong && (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <RadioGroup
                  value={selectedIndices[0]?.toString() ?? ""}
                  onValueChange={(value) =>
                    !showAnswer && handleSelectAnswer(currentQuestion.id, parseInt(value), false)
                  }
                  disabled={showAnswer}
                >
                  <div className="space-y-3">
                    {(currentQuestion.options as string[]).map((option, index) => {
                      const isSelected = selectedIndices.includes(index);
                      const isCorrect = showAnswer && currentResult?.correctIndices.includes(index);
                      const isWrong = showAnswer && isSelected && !currentResult?.correctIndices.includes(index);

                      let borderClass = "hover:bg-muted/50";
                      if (showAnswer) {
                        if (isCorrect) {
                          borderClass = "border-green-500 bg-green-50 dark:bg-green-950";
                        } else if (isWrong) {
                          borderClass = "border-red-500 bg-red-50 dark:bg-red-950";
                        }
                      } else if (isSelected) {
                        borderClass = "border-primary bg-primary/5";
                      }

                      return (
                        <div
                          key={index}
                          className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors ${
                            showAnswer ? "" : "cursor-pointer"
                          } ${borderClass}`}
                          onClick={() =>
                            !showAnswer && handleSelectAnswer(currentQuestion.id, index, false)
                          }
                        >
                          <RadioGroupItem
                            value={index.toString()}
                            id={`option-${index}`}
                          />
                          <Label
                            htmlFor={`option-${index}`}
                            className={`flex-1 ${showAnswer ? "" : "cursor-pointer"}`}
                          >
                            {option}
                          </Label>
                          {showAnswer && isCorrect && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                          {showAnswer && isWrong && (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </RadioGroup>
              )}

              {/* Answer Result */}
              {showAnswer && currentResult && (
                <div className="mt-6 space-y-4">
                  <div
                    className={`p-4 rounded-lg ${
                      currentResult.isCorrect
                        ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100"
                        : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100"
                    }`}
                  >
                    <p className="font-semibold flex items-center gap-2">
                      {currentResult.isCorrect ? (
                        <>
                          <CheckCircle className="h-5 w-5" />
                          正解！
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5" />
                          不正解
                        </>
                      )}
                    </p>
                  </div>

                  {currentResult.explanation && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">解説</p>
                      <p className="text-sm text-muted-foreground">{currentResult.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              正解数: {Array.from(oneByOneResults.values()).filter((r) => r.isCorrect).length} / {oneByOneResults.size}
            </div>

            {!showAnswer ? (
              <Button
                onClick={handleCheckAnswer}
                disabled={selectedIndices.length === 0 || isCheckingAnswer}
              >
                {isCheckingAnswer ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                回答を確認
              </Button>
            ) : isLastQuestion ? (
              <Button onClick={handleFinishOneByOne} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                結果を確認
              </Button>
            ) : (
              <Button onClick={handleNextQuestion}>
                次の問題
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Standard mode (existing behavior)
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Header />
      <main className="flex-1 container py-6">
        {/* Progress Bar */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">試験モード</Badge>
              <span className="font-medium">{quizData.title}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                {currentIndex + 1} / {quizData.questions.length}
              </span>
              {remainingTime !== null && (
                <div
                  className={`flex items-center gap-1 ${remainingTime < 60 ? "text-red-500" : ""}`}
                >
                  <Clock className="h-4 w-4" />
                  <span className="font-mono">{formatTime(remainingTime)}</span>
                </div>
              )}
            </div>
          </div>
          <Progress value={progress} />
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">
                Q{currentIndex + 1}. {currentQuestion.content}
              </CardTitle>
              <span className="text-sm text-muted-foreground shrink-0 ml-4">
                {currentQuestion.points}点
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {currentQuestion.imageUrl && (
              <img
                src={currentQuestion.imageUrl}
                alt="問題画像"
                className="mb-4 max-h-64 rounded-lg object-contain"
              />
            )}
            {currentQuestion.isMultipleChoice && (
              <Badge variant="secondary" className="mb-3">
                複数選択可
              </Badge>
            )}
            {currentQuestion.isMultipleChoice ? (
              <div className="space-y-3">
                {(currentQuestion.options as string[]).map((option, index) => {
                  const selectedIndices = answers.get(currentQuestion.id) ?? [];
                  const isSelected = selectedIndices.includes(index);
                  return (
                    <div
                      key={index}
                      className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() =>
                        handleSelectAnswer(currentQuestion.id, index, true)
                      }
                    >
                      <Checkbox
                        id={`option-${index}`}
                        checked={isSelected}
                        onCheckedChange={() =>
                          handleSelectAnswer(currentQuestion.id, index, true)
                        }
                      />
                      <Label
                        htmlFor={`option-${index}`}
                        className="flex-1 cursor-pointer"
                      >
                        {option}
                      </Label>
                    </div>
                  );
                })}
              </div>
            ) : (
              <RadioGroup
                value={answers.get(currentQuestion.id)?.[0]?.toString() ?? ""}
                onValueChange={(value) =>
                  handleSelectAnswer(currentQuestion.id, parseInt(value), false)
                }
              >
                <div className="space-y-3">
                  {(currentQuestion.options as string[]).map((option, index) => {
                    const selectedIndices = answers.get(currentQuestion.id) ?? [];
                    const isSelected = selectedIndices.includes(index);
                    return (
                      <div
                        key={index}
                        className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() =>
                          handleSelectAnswer(currentQuestion.id, index, false)
                        }
                      >
                        <RadioGroupItem
                          value={index.toString()}
                          id={`option-${index}`}
                        />
                        <Label
                          htmlFor={`option-${index}`}
                          className="flex-1 cursor-pointer"
                        >
                          {option}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((i) => i - 1)}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            前の問題
          </Button>

          <div className="text-sm text-muted-foreground">
            回答済み: {answeredCount} / {quizData.questions.length}
          </div>

          {currentIndex < quizData.questions.length - 1 ? (
            <Button onClick={() => setCurrentIndex((i) => i + 1)}>
              次の問題
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              回答を提出
            </Button>
          )}
        </div>

        {/* Question Navigator */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">問題一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {quizData.questions.map((q, index) => (
                <Button
                  key={q.id}
                  variant={
                    currentIndex === index
                      ? "default"
                      : answers.has(q.id)
                        ? "secondary"
                        : "outline"
                  }
                  size="sm"
                  className="w-10 h-10"
                  onClick={() => setCurrentIndex(index)}
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
