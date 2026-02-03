"use client";

import { Monitor } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AdminAvatarProps {
  isAdmin: boolean;
  image?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeConfig = {
  sm: { container: "h-8 w-8", icon: "h-4 w-4" },
  md: { container: "h-16 w-16", icon: "h-8 w-8" },
  lg: { container: "h-20 w-20", icon: "h-10 w-10" },
};

export function AdminAvatar({
  isAdmin,
  image,
  name,
  size = "md",
  className,
}: AdminAvatarProps) {
  const initials =
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";

  const { container, icon } = sizeConfig[size];

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

  return (
    <Avatar className={cn(container, className)}>
      <AvatarImage src={image || ""} alt={name || ""} />
      <AvatarFallback className={size === "sm" ? "" : size === "lg" ? "text-2xl" : "text-xl"}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
