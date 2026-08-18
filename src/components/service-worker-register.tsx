"use client";

import { useEffect } from "react";

/**
 * Registers the offline service worker. Renders nothing.
 * Guarded: only in browsers that support SW, and only on client render.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        // Non-fatal: PWA/offline is progressive enhancement.
        console.warn("SW registration failed", err);
      });
    };

    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}