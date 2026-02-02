"use client";

import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export function GoogleAnalytics() {
  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}

// Track page views
export function trackPageView(url: string) {
  if (typeof window !== "undefined" && GA_ID) {
    (window as typeof window & { gtag?: (...args: unknown[]) => void }).gtag?.(
      "config",
      GA_ID,
      {
        page_path: url,
      }
    );
  }
}

// Track custom events
export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  if (typeof window !== "undefined" && GA_ID) {
    (window as typeof window & { gtag?: (...args: unknown[]) => void }).gtag?.(
      "event",
      action,
      {
        event_category: category,
        event_label: label,
        value: value,
      }
    );
  }
}

// Quiz-specific tracking
export const quizEvents = {
  startQuiz: (quizId: string, quizTitle: string) => {
    trackEvent("start_quiz", "quiz", quizTitle, undefined);
  },
  completeQuiz: (quizId: string, score: number, percentage: number) => {
    trackEvent("complete_quiz", "quiz", quizId, Math.round(percentage));
  },
  createQuiz: (quizId: string) => {
    trackEvent("create_quiz", "quiz", quizId);
  },
  shareQuiz: (quizId: string, platform: string) => {
    trackEvent("share", "social", `${platform}:${quizId}`);
  },
};
