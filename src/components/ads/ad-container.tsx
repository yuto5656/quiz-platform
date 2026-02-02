"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type AdSize = "banner" | "rectangle" | "leaderboard" | "native";

interface AdContainerProps {
  size: AdSize;
  slot?: string;
  className?: string;
  testMode?: boolean;
}

const adSizes: Record<AdSize, { width: number; height: number; label: string }> = {
  banner: { width: 728, height: 90, label: "728x90 Banner" },
  rectangle: { width: 300, height: 250, label: "300x250 Rectangle" },
  leaderboard: { width: 970, height: 90, label: "970x90 Leaderboard" },
  native: { width: 0, height: 0, label: "Native Ad" },
};

export function AdContainer({
  size,
  slot,
  className,
  testMode = process.env.NODE_ENV === "development",
}: AdContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const adConfig = adSizes[size];

  useEffect(() => {
    if (!testMode && slot && typeof window !== "undefined") {
      // Google AdSense integration would go here
      // (window.adsbygoogle = window.adsbygoogle || []).push({});
    }
  }, [slot, testMode]);

  if (testMode) {
    // Development/test mode: show placeholder
    return (
      <div
        ref={containerRef}
        className={cn(
          "flex items-center justify-center bg-muted/50 border border-dashed border-muted-foreground/30 text-muted-foreground text-sm",
          size === "native" ? "w-full min-h-[100px]" : "",
          className
        )}
        style={
          size !== "native"
            ? {
                width: adConfig.width,
                height: adConfig.height,
                maxWidth: "100%",
              }
            : undefined
        }
        role="region"
        aria-label="Advertisement"
      >
        <span>AD: {adConfig.label}</span>
      </div>
    );
  }

  // Production mode: render actual ad
  return (
    <div
      ref={containerRef}
      className={cn(
        "ad-container",
        size === "native" ? "w-full" : "",
        className
      )}
      style={
        size !== "native"
          ? {
              width: adConfig.width,
              height: adConfig.height,
              maxWidth: "100%",
            }
          : undefined
      }
      role="region"
      aria-label="Advertisement"
    >
      {slot ? (
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
          data-ad-slot={slot}
          data-ad-format={size === "native" ? "fluid" : "auto"}
          data-full-width-responsive="true"
        />
      ) : null}
    </div>
  );
}

// Specific ad components for common placements
export function HeaderAd({ className }: { className?: string }) {
  return (
    <div className={cn("flex justify-center py-2", className)}>
      <AdContainer size="banner" slot={process.env.NEXT_PUBLIC_AD_SLOT_HEADER} />
    </div>
  );
}

export function SidebarAd({ className }: { className?: string }) {
  return (
    <div className={cn("hidden lg:block sticky top-20", className)}>
      <AdContainer size="rectangle" slot={process.env.NEXT_PUBLIC_AD_SLOT_SIDEBAR} />
    </div>
  );
}

export function InFeedAd({ className }: { className?: string }) {
  return (
    <div className={cn("my-4", className)}>
      <AdContainer size="native" slot={process.env.NEXT_PUBLIC_AD_SLOT_INFEED} />
    </div>
  );
}

export function ResultAd({ className }: { className?: string }) {
  return (
    <div className={cn("flex justify-center my-6", className)}>
      <AdContainer size="rectangle" slot={process.env.NEXT_PUBLIC_AD_SLOT_RESULT} />
    </div>
  );
}
