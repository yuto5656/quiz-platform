"use client";

import { Monitor, CircleUser } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AdminAvatarProps {
  isAdmin: boolean;
  customAvatar?: string | null;
  image?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeConfig = {
  xs: { container: "h-6 w-6", icon: "h-3 w-3" },
  sm: { container: "h-8 w-8", icon: "h-4 w-4" },
  md: { container: "h-16 w-16", icon: "h-8 w-8" },
  lg: { container: "h-20 w-20", icon: "h-10 w-10" },
};

export function AdminAvatar({
  isAdmin,
  customAvatar,
  image,
  name,
  size = "md",
  className,
}: AdminAvatarProps) {
  const { container, icon } = sizeConfig[size];

  // 表示優先順位:
  // 1. isAdmin → PCアイコン
  // 2. customAvatar → カスタム画像
  // 3. 未設定 → デフォルトユーザーアイコン（CircleUser）
  // ※ Googleアバター(image)や名前のイニシャルは使用しない（プライバシー保護）

  if (isAdmin) {
    return (
      <div
        className={cn(
          container,
          "rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center",
          className
        )}
      >
        <Monitor className={cn(icon, "text-white")} />
      </div>
    );
  }

  if (customAvatar) {
    return (
      <Avatar className={cn(container, className)}>
        <AvatarImage src={customAvatar} alt={name || "User avatar"} />
        <AvatarFallback className="bg-muted">
          <CircleUser className={cn(icon, "text-muted-foreground")} />
        </AvatarFallback>
      </Avatar>
    );
  }

  // デフォルト: 汎用ユーザーアイコン
  return (
    <div
      className={cn(
        container,
        "rounded-full bg-muted flex items-center justify-center",
        className
      )}
    >
      <CircleUser className={cn(icon, "text-muted-foreground")} />
    </div>
  );
}
