"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  quizId: string;
  initialLiked?: boolean;
  initialCount?: number;
  size?: "default" | "sm" | "lg" | "icon";
  showCount?: boolean;
  className?: string;
}

export function LikeButton({
  quizId,
  initialLiked = false,
  initialCount = 0,
  size = "default",
  showCount = true,
  className,
}: LikeButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  const handleClick = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    // Optimistic update
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikeCount((prev) => (newLiked ? prev + 1 : prev - 1));

    startTransition(async () => {
      try {
        if (newLiked) {
          const res = await fetch("/api/likes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quizId }),
          });

          if (!res.ok) {
            // Revert on error
            setIsLiked(false);
            setLikeCount((prev) => prev - 1);
          }
        } else {
          const res = await fetch(`/api/likes?quizId=${quizId}`, {
            method: "DELETE",
          });

          if (!res.ok) {
            // Revert on error
            setIsLiked(true);
            setLikeCount((prev) => prev + 1);
          }
        }
      } catch {
        // Revert on error
        setIsLiked(!newLiked);
        setLikeCount((prev) => (newLiked ? prev - 1 : prev + 1));
      }
    });
  };

  return (
    <Button
      variant={isLiked ? "default" : "outline"}
      size={size}
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        isLiked && "bg-red-500 hover:bg-red-600 border-red-500",
        className
      )}
    >
      <Heart
        className={cn(
          "h-4 w-4",
          showCount && "mr-2",
          isLiked && "fill-current"
        )}
      />
      {showCount && <span>{likeCount}</span>}
    </Button>
  );
}
