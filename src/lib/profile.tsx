"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { UserProfile } from "@/domain/user-profile";

/**
 * Lightweight localStorage-backed store for the user profile.
 * Same useSyncExternalStore pattern as the favorites store.
 */

const STORAGE_KEY = "merito-tracker:profile";

type Listener = () => void;

let cache: UserProfile | null = null;
const listeners = new Set<Listener>();

const DEFAULT_PROFILE: UserProfile = {
  educationLevel: null,
  degrees: [],
  experienceYears: 0,
  preferredCities: [],
  hasProfessionalLicense: false,
  interests: [],
};

function read(): UserProfile {
  if (cache !== null) return cache;
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? { ...DEFAULT_PROFILE, ...(JSON.parse(raw) as Partial<UserProfile>) } : DEFAULT_PROFILE;
  } catch {
    cache = DEFAULT_PROFILE;
  }
  return cache;
}

function write(next: UserProfile): void {
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

interface ProfileContextValue {
  profile: UserProfile;
  hasProfile: boolean;
  saveProfile: (p: UserProfile) => void;
  clearProfile: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const profile = useSyncExternalStore(subscribe, read, () => DEFAULT_PROFILE);

  const saveProfile = useCallback((p: UserProfile) => {
    write(p);
  }, []);

  const clearProfile = useCallback(() => {
    write(DEFAULT_PROFILE);
  }, []);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      hasProfile:
        profile.educationLevel !== null ||
        profile.experienceYears > 0 ||
        profile.preferredCities.length > 0 ||
        profile.degrees.length > 0,
      saveProfile,
      clearProfile,
    }),
    [profile, saveProfile, clearProfile]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return ctx;
}