"use client";

import Script from "next/script";

export function AdSenseScript() {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  // Don't load AdSense script if client ID is not configured
  if (!clientId) {
    return null;
  }

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
      strategy="lazyOnload"
    />
  );
}
