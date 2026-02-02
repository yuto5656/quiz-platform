import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LikeButton } from "./like-button";

// Mock next-auth/react
const mockUseSession = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("LikeButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSession.mockReturnValue({ data: null });
    mockFetch.mockResolvedValue({ ok: true });
  });

  describe("unauthenticated user", () => {
    it("should redirect to login when clicked", async () => {
      mockUseSession.mockReturnValue({ data: null });

      render(<LikeButton quizId="quiz-1" />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockPush).toHaveBeenCalledWith("/login");
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("authenticated user", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: { user: { id: "user-1" } },
      });
    });

    it("should render with initial like count", () => {
      render(<LikeButton quizId="quiz-1" initialCount={5} />);

      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("should show filled heart when initially liked", () => {
      render(<LikeButton quizId="quiz-1" initialLiked={true} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-red-500");
    });

    it("should show outline heart when not liked", () => {
      render(<LikeButton quizId="quiz-1" initialLiked={false} />);

      const button = screen.getByRole("button");
      expect(button).not.toHaveClass("bg-red-500");
    });

    it("should optimistically update UI when liking", async () => {
      mockFetch.mockResolvedValue({ ok: true });

      render(<LikeButton quizId="quiz-1" initialCount={5} initialLiked={false} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      // Optimistic update should show immediately
      expect(screen.getByText("6")).toBeInTheDocument();
      expect(button).toHaveClass("bg-red-500");
    });

    it("should call POST /api/likes when liking", async () => {
      mockFetch.mockResolvedValue({ ok: true });

      render(<LikeButton quizId="quiz-1" initialLiked={false} />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/likes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quizId: "quiz-1" }),
        });
      });
    });

    it("should call DELETE /api/likes when unliking", async () => {
      mockFetch.mockResolvedValue({ ok: true });

      render(<LikeButton quizId="quiz-1" initialLiked={true} />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/likes?quizId=quiz-1", {
          method: "DELETE",
        });
      });
    });

    it("should revert UI on API error when liking", async () => {
      mockFetch.mockResolvedValue({ ok: false });

      render(<LikeButton quizId="quiz-1" initialCount={5} initialLiked={false} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      // Optimistic update
      expect(screen.getByText("6")).toBeInTheDocument();

      // Wait for revert
      await waitFor(() => {
        expect(screen.getByText("5")).toBeInTheDocument();
        expect(button).not.toHaveClass("bg-red-500");
      });
    });

    it("should revert UI on API error when unliking", async () => {
      mockFetch.mockResolvedValue({ ok: false });

      render(<LikeButton quizId="quiz-1" initialCount={5} initialLiked={true} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      // Optimistic update
      expect(screen.getByText("4")).toBeInTheDocument();

      // Wait for revert
      await waitFor(() => {
        expect(screen.getByText("5")).toBeInTheDocument();
        expect(button).toHaveClass("bg-red-500");
      });
    });

    it("should revert UI on network error", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      render(<LikeButton quizId="quiz-1" initialCount={5} initialLiked={false} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      // Wait for revert
      await waitFor(() => {
        expect(screen.getByText("5")).toBeInTheDocument();
        expect(button).not.toHaveClass("bg-red-500");
      });
    });

    it("should be disabled while pending", async () => {
      // Make fetch hang
      mockFetch.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 1000))
      );

      render(<LikeButton quizId="quiz-1" />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      // Button should be disabled during transition
      await waitFor(() => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe("display options", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: { user: { id: "user-1" } },
      });
    });

    it("should hide count when showCount is false", () => {
      render(<LikeButton quizId="quiz-1" initialCount={5} showCount={false} />);

      expect(screen.queryByText("5")).not.toBeInTheDocument();
    });

    it("should show count by default", () => {
      render(<LikeButton quizId="quiz-1" initialCount={5} />);

      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(<LikeButton quizId="quiz-1" className="custom-class" />);

      expect(screen.getByRole("button")).toHaveClass("custom-class");
    });

    it("should support different sizes", () => {
      const { rerender } = render(<LikeButton quizId="quiz-1" size="sm" />);
      expect(screen.getByRole("button")).toBeInTheDocument();

      rerender(<LikeButton quizId="quiz-1" size="lg" />);
      expect(screen.getByRole("button")).toBeInTheDocument();

      rerender(<LikeButton quizId="quiz-1" size="icon" />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });
});
