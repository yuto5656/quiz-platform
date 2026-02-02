"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  QuizSummary,
  QuizDetail,
  CategoryWithCount,
  UserFull,
  ScoreSummary,
  QuizFormData,
  SubmitAnswersInput,
} from "@/types";

// =============================================================================
// Query Keys - Centralized for consistency and type safety
// =============================================================================
export const queryKeys = {
  categories: ["categories"] as const,
  quizzes: {
    all: ["quizzes"] as const,
    list: (filters: QuizListParams) => ["quizzes", "list", filters] as const,
    detail: (id: string) => ["quizzes", id] as const,
    questions: (id: string) => ["quizzes", id, "questions"] as const,
  },
  users: {
    me: ["users", "me"] as const,
    profile: (id: string) => ["users", id] as const,
  },
  scores: {
    detail: (id: string) => ["scores", id] as const,
  },
};

// =============================================================================
// Types for Query Params
// =============================================================================
interface QuizListParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
  sortBy?: "popular" | "newest" | "score";
}

// =============================================================================
// API Fetchers
// =============================================================================
async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// =============================================================================
// Categories Queries
// =============================================================================
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () =>
      fetchJson<{ categories: CategoryWithCount[] }>("/api/categories").then(
        (res) => res.categories
      ),
    staleTime: 5 * 60 * 1000, // Categories change rarely
  });
}

// =============================================================================
// Quiz Queries
// =============================================================================
interface QuizListResponse {
  quizzes: QuizSummary[];
  total: number;
  totalPages: number;
}

export function useQuizList(params: QuizListParams = {}) {
  return useQuery({
    queryKey: queryKeys.quizzes.list(params),
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set("page", params.page.toString());
      if (params.limit) searchParams.set("limit", params.limit.toString());
      if (params.categoryId) searchParams.set("category", params.categoryId);
      if (params.search) searchParams.set("q", params.search);
      if (params.sortBy) searchParams.set("sortBy", params.sortBy);
      return fetchJson<QuizListResponse>(`/api/quizzes?${searchParams.toString()}`);
    },
  });
}

export function useQuizDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.quizzes.detail(id),
    queryFn: () => fetchJson<QuizDetail>(`/api/quizzes/${id}`),
    enabled: !!id,
  });
}

export function useQuizQuestions(id: string) {
  return useQuery({
    queryKey: queryKeys.quizzes.questions(id),
    queryFn: () =>
      fetchJson<{ questions: Array<{ id: string; content: string; options: string[]; points: number }> }>(
        `/api/quizzes/${id}/questions`
      ).then((res) => res.questions),
    enabled: !!id,
  });
}

// =============================================================================
// User Queries
// =============================================================================
interface DashboardData {
  user: UserFull;
  recentQuizzes: Array<{
    id: string;
    title: string;
    category: string;
    questionCount: number;
    playCount: number;
    createdAt: string;
  }>;
  recentScores: ScoreSummary[];
}

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.users.me,
    queryFn: () => fetchJson<DashboardData>("/api/users/me"),
    retry: false,
  });
}

// =============================================================================
// Mutations
// =============================================================================
export function useCreateQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: QuizFormData) =>
      fetchJson<QuizDetail>("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
    },
  });
}

export function useUpdateQuiz(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: QuizFormData) =>
      fetchJson<QuizDetail>(`/api/quizzes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.all });
    },
  });
}

export function useDeleteQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/quizzes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
    },
  });
}

export function useSubmitAnswers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubmitAnswersInput) =>
      fetchJson<{ scoreId: string }>("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { displayName?: string; bio?: string }) =>
      fetchJson("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
    },
  });
}
