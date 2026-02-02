// =============================================================================
// Common Type Definitions
// =============================================================================

// User Types
export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  displayName: string | null;
  bio: string | null;
}

export interface UserStats {
  totalScore: number;
  quizzesTaken: number;
  quizzesCreated: number;
}

export interface UserFull extends UserProfile, UserStats {
  createdAt: string;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
}

export interface CategoryWithCount extends Category {
  quizCount: number;
}

// Quiz Types
export interface QuizAuthor {
  id: string;
  name: string | null;
  image: string | null;
}

export interface QuizCategory {
  id: string;
  name: string;
  slug: string;
}

export interface QuizSummary {
  id: string;
  title: string;
  description: string | null;
  author: QuizAuthor;
  category: QuizCategory;
  questionCount: number;
  playCount: number;
  avgScore: number | null;
  timeLimit: number | null;
}

export interface QuizDetail extends QuizSummary {
  passingScore: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// Question Types
export interface Question {
  id: string;
  content: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
  imageUrl: string | null;
  points: number;
  order: number;
}

export interface QuestionForPlay {
  id: string;
  content: string;
  options: string[];
  imageUrl: string | null;
  points: number;
}

// Score Types
export interface ScoreSummary {
  id: string;
  quiz: { id: string; title: string };
  score: number;
  maxScore: number;
  percentage: number;
  createdAt: string;
}

export interface QuestionResult {
  questionId: string;
  content: string;
  options: string[];
  selectedIndex: number;
  correctIndex: number;
  isCorrect: boolean;
  explanation: string | null;
  points: number;
}

export interface ScoreDetail {
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

// API Response Types
export interface ApiError {
  error: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  totalPages: number;
  currentPage: number;
}

// Form Input Types
export interface QuestionInput {
  id?: string;
  content: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  points: number;
}

export interface QuizFormData {
  title: string;
  description: string;
  categoryId: string;
  timeLimit: number | null;
  passingScore: number;
  questions: QuestionInput[];
}

export interface AnswerInput {
  questionId: string;
  selectedIndex: number;
}

export interface SubmitAnswersInput {
  quizId: string;
  answers: AnswerInput[];
  timeSpent?: number;
}
