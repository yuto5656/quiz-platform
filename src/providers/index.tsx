"use client";

import { SessionProvider } from "./session-provider";
import { ThemeProvider } from "./theme-provider";
import { QueryProvider } from "./query-provider";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <SessionProvider>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </SessionProvider>
    </QueryProvider>
  );
}
