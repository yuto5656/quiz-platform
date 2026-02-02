"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Plus,
  Trash2,
  GripVertical,
  Loader2,
  ChevronUp,
  ChevronDown,
  Save,
} from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface QuestionInput {
  content: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  points: number;
}

export default function CreateQuizPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Quiz data
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [passingScore, setPassingScore] = useState(60);
  const [questions, setQuestions] = useState<QuestionInput[]>([
    { content: "", options: ["", "", "", ""], correctIndex: 0, explanation: "", points: 10 },
  ]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/create");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    }
    fetchCategories();
  }, []);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { content: "", options: ["", "", "", ""], correctIndex: 0, explanation: "", points: 10 },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, updates: Partial<QuestionInput>) => {
    setQuestions(
      questions.map((q, i) => (i === index ? { ...q, ...updates } : q))
    );
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const addOption = (questionIndex: number) => {
    if (questions[questionIndex].options.length < 6) {
      const newQuestions = [...questions];
      newQuestions[questionIndex].options.push("");
      setQuestions(newQuestions);
    }
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    if (questions[questionIndex].options.length > 2) {
      const newQuestions = [...questions];
      newQuestions[questionIndex].options.splice(optionIndex, 1);
      if (newQuestions[questionIndex].correctIndex >= newQuestions[questionIndex].options.length) {
        newQuestions[questionIndex].correctIndex = 0;
      }
      setQuestions(newQuestions);
    }
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    setQuestions(newQuestions);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("タイトルを入力してください");
      return;
    }
    if (!categoryId) {
      toast.error("カテゴリを選択してください");
      return;
    }
    if (questions.some((q) => !q.content.trim())) {
      toast.error("すべての問題文を入力してください");
      return;
    }
    if (questions.some((q) => q.options.some((o) => !o.trim()))) {
      toast.error("すべての選択肢を入力してください");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          categoryId,
          timeLimit,
          passingScore,
          questions: questions.map((q) => ({
            content: q.content,
            options: q.options.filter((o) => o.trim()),
            correctIndex: q.correctIndex,
            explanation: q.explanation || undefined,
            points: q.points,
          })),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create quiz");
      }

      const quiz = await res.json();
      toast.success("クイズを作成しました！");
      router.push(`/quiz/${quiz.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "クイズの作成に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading") {
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold">クイズを作成</h1>
            <p className="text-muted-foreground mt-2">
              新しいクイズを作成して公開しましょう
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>基本情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">タイトル *</Label>
                    <Input
                      id="title"
                      placeholder="例: JavaScript基礎クイズ"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">説明</Label>
                    <Textarea
                      id="description"
                      placeholder="クイズの説明を入力..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>カテゴリ *</Label>
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger>
                          <SelectValue placeholder="カテゴリを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>合格ライン (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={passingScore}
                        onChange={(e) => setPassingScore(parseInt(e.target.value) || 60)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>制限時間（分）</Label>
                    <Input
                      type="number"
                      min={1}
                      max={120}
                      placeholder="無制限の場合は空欄"
                      value={timeLimit ? timeLimit / 60 : ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setTimeLimit(val ? val * 60 : null);
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Questions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">問題 ({questions.length})</h2>
                  <Button onClick={addQuestion} variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    問題を追加
                  </Button>
                </div>

                {questions.map((question, qIndex) => (
                  <Card key={qIndex}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          問題 {qIndex + 1}
                        </CardTitle>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveQuestion(qIndex, "up")}
                            disabled={qIndex === 0}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveQuestion(qIndex, "down")}
                            disabled={qIndex === questions.length - 1}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeQuestion(qIndex)}
                            disabled={questions.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>問題文 *</Label>
                        <Textarea
                          placeholder="問題を入力..."
                          value={question.content}
                          onChange={(e) =>
                            updateQuestion(qIndex, { content: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>選択肢 * (正解を選択してください)</Label>
                          {question.options.length < 6 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => addOption(qIndex)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              追加
                            </Button>
                          )}
                        </div>
                        <RadioGroup
                          value={question.correctIndex.toString()}
                          onValueChange={(value) =>
                            updateQuestion(qIndex, { correctIndex: parseInt(value) })
                          }
                        >
                          {question.options.map((option, oIndex) => (
                            <div key={oIndex} className="flex items-center gap-2">
                              <RadioGroupItem
                                value={oIndex.toString()}
                                id={`q${qIndex}-o${oIndex}`}
                              />
                              <Input
                                className="flex-1"
                                placeholder={`選択肢 ${oIndex + 1}`}
                                value={option}
                                onChange={(e) =>
                                  updateOption(qIndex, oIndex, e.target.value)
                                }
                              />
                              {question.options.length > 2 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeOption(qIndex, oIndex)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </RadioGroup>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>配点</Label>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={question.points}
                            onChange={(e) =>
                              updateQuestion(qIndex, { points: parseInt(e.target.value) || 10 })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>解説（任意）</Label>
                        <Textarea
                          placeholder="正解の解説を入力..."
                          value={question.explanation}
                          onChange={(e) =>
                            updateQuestion(qIndex, { explanation: e.target.value })
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button onClick={addQuestion} variant="outline" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  問題を追加
                </Button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>公開設定</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>問題数: {questions.length}</p>
                    <p>
                      合計点: {questions.reduce((sum, q) => sum + q.points, 0)}点
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    クイズを公開
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
