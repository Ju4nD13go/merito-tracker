"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

/**
 * Lightweight localStorage-backed store for favorite vacancy ids.
 * Uses useSyncExternalStore so every tab stays in sync and SSR stays safe.
 */

const STORAGE_KEY = "merito-tracker:favorites";

type Listener = () => void;

let cache: string[] | null = null;
const listeners = new Set<Listener>();

function read(): string[] {
  if (cache !== null) return cache;
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: string[]): void {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage full or blocked — keep in-memory state
  }
  for (const l of listeners) l();
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

interface FavoritesContextValue {
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const favorites = useSyncExternalStore(subscribe, read, () => []);

  const toggleFavorite = useCallback((id: string) => {
    const current = read();
    write(
      current.includes(id)
        ? current.filter((f) => f !== id)
        : [id, ...current]
    );
  }, []);

  const removeFavorite = useCallback((id: string) => {
    write(read().filter((f) => f !== id));
  }, []);

  const clearFavorites = useCallback(() => {
    write([]);
  }, []);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      isFavorite: (id: string) => favorites.includes(id),
      toggleFavorite,
      removeFavorite,
      clearFavorites,
    }),
    [favorites, toggleFavorite, removeFavorite, clearFavorites]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return ctx;
}