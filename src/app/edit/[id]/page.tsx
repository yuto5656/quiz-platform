"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Loader2,
  ChevronUp,
  ChevronDown,
  Save,
  Send,
} from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface QuestionInput {
  id?: string;
  content: string;
  options: string[];
  correctIndices: number[];
  isMultipleChoice: boolean;
  explanation: string;
  points: number;
}

interface QuizData {
  id: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  timeLimit: number | null;
  passingScore: number;
  isPublic: boolean;
  authorId: string;
  status: "draft" | "published";
  questions: {
    id: string;
    content: string;
    options: string[];
    correctIndices: number[];
    isMultipleChoice: boolean;
    explanation: string | null;
    points: number;
  }[];
}

export default function EditQuizPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.id as string;
  const { data: session, status } = useSession();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quiz data
  const [quizStatus, setQuizStatus] = useState<"draft" | "published">("draft");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [passingScore, setPassingScore] = useState(60);
  const [questions, setQuestions] = useState<QuestionInput[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/edit/${quizId}`);
    }
  }, [status, router, quizId]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [categoriesRes, quizRes] = await Promise.all([
          fetch("/api/categories"),
          fetch(`/api/quizzes/${quizId}`),
        ]);

        if (categoriesRes.ok) {
          const data = await categoriesRes.json();
          setCategories(data.categories);
        }

        if (!quizRes.ok) {
          if (quizRes.status === 404) {
            toast.error("クイズが見つかりません");
            router.push("/dashboard");
            return;
          }
          throw new Error("Failed to fetch quiz");
        }

        const quizData: QuizData = await quizRes.json();

        // Check ownership
        if (session?.user?.id && quizData.authorId !== session.user.id) {
          toast.error("このクイズを編集する権限がありません");
          router.push("/dashboard");
          return;
        }

        setTitle(quizData.title);
        setDescription(quizData.description || "");
        setCategoryId(quizData.categoryId || "");
        setTimeLimit(quizData.timeLimit);
        setPassingScore(quizData.passingScore);
        setQuizStatus(quizData.status);
        setQuestions(
          quizData.questions.map((q) => ({
            id: q.id,
            content: q.content,
            options: q.options,
            correctIndices: q.correctIndices,
            isMultipleChoice: q.isMultipleChoice,
            explanation: q.explanation || "",
            points: q.points,
          }))
        );
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("データの読み込みに失敗しました");
      } finally {
        setIsLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchData();
    }
  }, [status, quizId, session?.user?.id, router]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { content: "", options: ["", "", "", ""], correctIndices: [0], isMultipleChoice: false, explanation: "", points: 10 },
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
      // Filter out indices that are now out of range, and adjust remaining indices
      newQuestions[questionIndex].correctIndices = newQuestions[questionIndex].correctIndices
        .filter((idx) => idx !== optionIndex)
        .map((idx) => (idx > optionIndex ? idx - 1 : idx));
      // Ensure at least one correct answer
      if (newQuestions[questionIndex].correctIndices.length === 0) {
        newQuestions[questionIndex].correctIndices = [0];
      }
      setQuestions(newQuestions);
    }
  };

  const toggleCorrectIndex = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    const question = newQuestions[questionIndex];
    if (question.isMultipleChoice) {
      const isSelected = question.correctIndices.includes(optionIndex);
      if (isSelected && question.correctIndices.length > 1) {
        question.correctIndices = question.correctIndices.filter((idx) => idx !== optionIndex);
      } else if (!isSelected) {
        question.correctIndices = [...question.correctIndices, optionIndex].sort((a, b) => a - b);
      }
    } else {
      question.correctIndices = [optionIndex];
    }
    setQuestions(newQuestions);
  };

  const toggleMultipleChoice = (questionIndex: number, enabled: boolean) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].isMultipleChoice = enabled;
    // Reset to single correct answer when switching to single choice
    if (!enabled && newQuestions[questionIndex].correctIndices.length > 1) {
      newQuestions[questionIndex].correctIndices = [newQuestions[questionIndex].correctIndices[0]];
    }
    setQuestions(newQuestions);
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    setQuestions(newQuestions);
  };

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      toast.error("タイトルを入力してください");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          categoryId: categoryId || undefined,
          timeLimit,
          passingScore,
          status: "draft",
          questions: questions.map((q) => ({
            id: q.id,
            content: q.content,
            options: q.options,
            correctIndices: q.correctIndices,
            isMultipleChoice: q.isMultipleChoice,
            explanation: q.explanation || undefined,
            points: q.points,
          })),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("Draft save error:", error);
        throw new Error(error.error || "Failed to save draft");
      }

      toast.success("下書きを保存しました");
      setQuizStatus("draft");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "下書きの保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    // Strict validation for publishing
    if (!title.trim() || title.length < 3) {
      toast.error("タイトルは3文字以上で入力してください");
      return;
    }
    if (!categoryId) {
      toast.error("カテゴリを選択してください");
      return;
    }
    if (questions.length === 0) {
      toast.error("最低1つの問題を追加してください");
      return;
    }
    if (questions.some((q) => !q.content.trim())) {
      toast.error("すべての問題文を入力してください");
      return;
    }
    if (questions.some((q) => q.options.filter((o) => o.trim()).length < 2)) {
      toast.error("各問題には最低2つの選択肢が必要です");
      return;
    }
    // Validate correctIndices are within range
    for (const q of questions) {
      const validOptionsCount = q.options.filter((o) => o.trim()).length;
      if (q.correctIndices.some((idx) => idx >= validOptionsCount)) {
        toast.error("正解のインデックスが選択肢の範囲外です");
        return;
      }
    }

    setIsPublishing(true);
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          categoryId,
          timeLimit,
          passingScore,
          status: "published",
          questions: questions.map((q) => ({
            id: q.id,
            content: q.content,
            options: q.options.filter((o) => o.trim()),
            correctIndices: q.correctIndices,
            isMultipleChoice: q.isMultipleChoice,
            explanation: q.explanation || undefined,
            points: q.points,
          })),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("Publish error:", error);
        if (error.details) {
          console.error("Validation details:", error.details);
        }
        throw new Error(error.error || "Failed to publish quiz");
      }

      toast.success("クイズを公開しました！");
      setQuizStatus("published");
      router.push(`/quiz/${quizId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "クイズの公開に失敗しました");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete quiz");
      }

      toast.success("クイズを削除しました");
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "クイズの削除に失敗しました");
    } finally {
      setIsDeleting(false);
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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">クイズを編集</h1>
            <p className="text-muted-foreground mt-2">
              クイズの内容を変更できます
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
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Switch
                                id={`multiple-choice-${qIndex}`}
                                checked={question.isMultipleChoice}
                                onCheckedChange={(checked) => toggleMultipleChoice(qIndex, checked)}
                              />
                              <Label htmlFor={`multiple-choice-${qIndex}`} className="text-sm font-normal">
                                複数選択
                              </Label>
                            </div>
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
                        </div>
                        {question.isMultipleChoice ? (
                          <div className="space-y-2">
                            {question.options.map((option, oIndex) => (
                              <div key={oIndex} className="flex items-center gap-2">
                                <Checkbox
                                  id={`q${qIndex}-o${oIndex}`}
                                  checked={question.correctIndices.includes(oIndex)}
                                  onCheckedChange={() => toggleCorrectIndex(qIndex, oIndex)}
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
                          </div>
                        ) : (
                          <RadioGroup
                            value={question.correctIndices[0]?.toString() ?? "0"}
                            onValueChange={(value) =>
                              updateQuestion(qIndex, { correctIndices: [parseInt(value)] })
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
                        )}
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
                  <div className="flex items-center justify-between">
                    <CardTitle>設定</CardTitle>
                    <Badge variant={quizStatus === "draft" ? "secondary" : "default"}>
                      {quizStatus === "draft" ? "下書き" : "公開中"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>問題数: {questions.length}</p>
                    <p>
                      合計点: {questions.reduce((sum, q) => sum + q.points, 0)}点
                    </p>
                  </div>

                  {/* Draft Save Button */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleSaveDraft}
                    disabled={isSaving || isPublishing}
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    下書きを保存
                  </Button>

                  {/* Publish Button */}
                  <Button
                    className="w-full"
                    onClick={handlePublish}
                    disabled={isSaving || isPublishing}
                  >
                    {isPublishing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    {quizStatus === "draft" ? "公開する" : "更新して公開"}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="w-full"
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        クイズを削除
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
                        <AlertDialogDescription>
                          この操作は取り消せません。クイズとすべての問題、スコア履歴が完全に削除されます。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                          削除する
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
