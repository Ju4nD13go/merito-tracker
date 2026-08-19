"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { subscribeBackupListener } from "@/lib/storage-events";

/**
 * localStorage-backed store for the per-vacancy document checklist.
 * Keyed by vacancy id; stores the checked document ids for each vacancy.
 * Same useSyncExternalStore pattern as favorites/applications.
 */

const STORAGE_KEY_PREFIX = "merito-tracker:documents";

type Listener = () => void;

let cache: Record<string, string[]> | null = null;
const listeners = new Set<Listener>();

function read(): Record<string, string[]> {
  if (cache !== null) return cache;
  if (typeof window === "undefined") return {} as Record<string, string[]>;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_PREFIX);
    cache = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
  } catch {
    cache = {};
  }
  return cache;
}

function write(next: Record<string, string[]>): void {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY_PREFIX, JSON.stringify(next));
  } catch {
    // storage full or blocked — keep in-memory state
  }
  for (const l of listeners) l();
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  const onBackup = () => {
    cache = null;
    listener();
  };
  const unsubBackup = subscribeBackupListener(onBackup);
  return () => {
    listeners.delete(listener);
    unsubBackup();
  };
}

interface DocumentsContextValue {
  checkedFor: (vacancyId: string) => string[];
  toggleDoc: (vacancyId: string, docId: string) => void;
  resetFor: (vacancyId: string) => void;
}

const DocumentsContext = createContext<DocumentsContextValue | null>(null);

export function DocumentsProvider({ children }: { children: React.ReactNode }) {
  const store = useSyncExternalStore(
    subscribe,
    read,
    () => ({}) as Record<string, string[]>
  );

  const checkedFor = useCallback(
    (vacancyId: string) => store[vacancyId] ?? [],
    [store]
  );

  const toggleDoc = useCallback((vacancyId: string, docId: string) => {
    const current = read();
    const list = current[vacancyId] ?? [];
    write({
      ...current,
      [vacancyId]: list.includes(docId)
        ? list.filter((d) => d !== docId)
        : [...list, docId],
    });
  }, []);

  const resetFor = useCallback((vacancyId: string) => {
    const current = read();
    const next = { ...current };
    delete next[vacancyId];
    write(next);
  }, []);

  const value = useMemo<DocumentsContextValue>(
    () => ({ checkedFor, toggleDoc, resetFor }),
    [checkedFor, toggleDoc, resetFor]
  );

  return (
    <DocumentsContext.Provider value={value}>
      {children}
    </DocumentsContext.Provider>
  );
}

export function useDocuments(): DocumentsContextValue {
  const ctx = useContext(DocumentsContext);
  if (!ctx) {
    throw new Error("useDocuments must be used within DocumentsProvider");
  }
  return ctx;
}