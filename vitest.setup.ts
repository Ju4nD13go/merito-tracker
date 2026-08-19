import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Node 22+ exposes an experimental global localStorage (backed by
// --localstorage-file) that can shadow/break jsdom's storage in tests.
// Provide a deterministic in-memory implementation instead.
const store = new Map<string, string>();
const localStorageMock: Storage = {
  get length() {
    return store.size;
  },
  clear: () => store.clear(),
  getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
  key: (index: number) => [...store.keys()][index] ?? null,
  removeItem: (key: string) => {
    store.delete(key);
  },
  setItem: (key: string, value: string) => {
    store.set(key, String(value));
  },
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  configurable: true,
});
Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  configurable: true,
});

// jsdom lacks matchMedia — AnimatedCounter and theme code rely on it.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}