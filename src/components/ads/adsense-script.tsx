"use client";

import { useEffect } from "react";

export function AdSenseScript() {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  useEffect(() => {
    // Don't load AdSense script if client ID is not configured
    if (!clientId) {
      return;
    }

    // Check if script is already loaded
    if (document.querySelector(`script[src*="adsbygoogle.js"]`)) {
      return;
    }

    // Create script element manually to avoid data-nscript attribute
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);
  }, [clientId]);

  return null;
}
