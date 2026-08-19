"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Theme store — light/dark choice persisted in localStorage.
 *
 * Same useSyncExternalStore pattern as the profile/favorites stores, so we
 * never call setState inside an effect. The store applies the `.dark` class
 * to <html> (Tailwind `@custom-variant dark` reads it) and keeps the
 * `color-scheme` CSS property in sync for native form controls/scrollbars.
 */

export type Theme = "light" | "dark";

const STORAGE_KEY = "merito-tracker:theme";

type Listener = () => void;

let theme: Theme = "light";
let loaded = false;
const listeners = new Set<Listener>();

function notify() {
  for (const l of listeners) l();
}

function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(next: Theme): void {
  const root = document.documentElement;
  root.classList.toggle("dark", next === "dark");
  root.style.colorScheme = next;
}

function load(): void {
  if (loaded || typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark") {
      theme = raw;
    } else {
      theme = systemPrefersDark() ? "dark" : "light";
    }
  } catch {
    theme = systemPrefersDark() ? "dark" : "light";
  }
  applyTheme(theme);
  loaded = true;
}

function subscribe(listener: Listener): () => void {
  load();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Theme {
  load();
  return theme;
}

function getServerSnapshot(): Theme {
  // Server has no idea about the user's preference; render light and let the
  // client pick up localStorage after hydration (no flash for light users).
  return "light";
}

export function useTheme(): {
  theme: Theme;
  toggleTheme: () => void;
} {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = useCallback(() => {
    const next: Theme = current === "dark" ? "light" : "dark";
    theme = next;
    loaded = true;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage unavailable — keep in-memory state
    }
    applyTheme(next);
    notify();
  }, [current]);

  return { theme: current, toggleTheme };
}