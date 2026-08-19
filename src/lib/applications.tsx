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
 * Lightweight localStorage-backed store for application status per vacancy.
 * Tracks the postulación pipeline: interesada → aplicada → en proceso → entrevista → nombrada/descartada.
 */

export const APPLICATION_STATUSES = [
  "interesada",
  "aplicada",
  "en_proceso",
  "entrevista",
  "nombrada",
  "descartada",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface ApplicationRecord {
  status: ApplicationStatus | null;
  updatedAt: string | null;
  notes?: string;
}

const STORAGE_KEY = "merito-tracker:applications";

type Listener = () => void;

let cache: Record<string, ApplicationRecord> | null = null;
const listeners = new Set<Listener>();

function read(): Record<string, ApplicationRecord> {
  if (cache !== null) return cache;
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as Record<string, ApplicationRecord>) : {};
  } catch {
    cache = {};
  }
  return cache;
}

function write(next: Record<string, ApplicationRecord>): void {
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

interface ApplicationsContextValue {
  applications: Record<string, ApplicationRecord>;
  getStatus: (vacancyId: string) => ApplicationStatus | null;
  setStatus: (vacancyId: string, status: ApplicationStatus) => void;
  clearStatus: (vacancyId: string) => void;
  countByStatus: (status: ApplicationStatus) => number;
}

const ApplicationsContext = createContext<ApplicationsContextValue | null>(
  null
);

export function ApplicationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const applications = useSyncExternalStore(
    subscribe,
    read,
    () => ({}) as Record<string, ApplicationRecord>
  );

  const setStatus = useCallback(
    (vacancyId: string, status: ApplicationStatus) => {
      const current = read();
      write({
        ...current,
        [vacancyId]: {
          status,
          updatedAt: new Date().toISOString(),
          notes: current[vacancyId]?.notes,
        },
      });
    },
    []
  );

  const clearStatus = useCallback((vacancyId: string) => {
    const current = read();
    const next = { ...current };
    delete next[vacancyId];
    write(next);
  }, []);

  const value = useMemo<ApplicationsContextValue>(() => {
    const countByStatus = (status: ApplicationStatus) =>
      Object.values(applications).filter((r) => r.status === status).length;
    return {
      applications,
      getStatus: (id) => applications[id]?.status ?? null,
      setStatus,
      clearStatus,
      countByStatus,
    };
  }, [applications, setStatus, clearStatus]);

  return (
    <ApplicationsContext.Provider value={value}>
      {children}
    </ApplicationsContext.Provider>
  );
}

export function useApplications(): ApplicationsContextValue {
  const ctx = useContext(ApplicationsContext);
  if (!ctx) {
    throw new Error(
      "useApplications must be used within ApplicationsProvider"
    );
  }
  return ctx;
}