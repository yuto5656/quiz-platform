"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";

interface Question {
  id: string;
  content: string;
  options: string[];
  imageUrl: string | null;
  points: number;
  order: number;
  isMultipleChoice: boolean;
}

interface QuizData {
  quizId: string;
  title: string;
  timeLimit: number | null;
  questions: Question[];
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
    if (remainingTime === null || remainingTime <= 0) return;

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
  }, [remainingTime]);

  const handleSelectAnswer = (questionId: string, optionIndex: number, isMultipleChoice: boolean) => {
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

  const currentQuestion = quizData.questions[currentIndex];
  const progress = ((currentIndex + 1) / quizData.questions.length) * 100;
  const answeredCount = answers.size;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Header />
      <main className="flex-1 container py-6">
        {/* Progress Bar */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{quizData.title}</span>
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
