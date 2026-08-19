"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Count-up number that animates from 0 to `value` when it mounts or changes.
 * Respects prefers-reduced-motion by jumping straight to the value.
 */
export function AnimatedCounter({
  value,
  duration = 600,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced) {
      // Jump straight to the value, but inside a rAF callback so we never
      // setState synchronously in the effect body (react-hooks rule).
      const id = requestAnimationFrame(() => {
        fromRef.current = value;
        setDisplay(value);
      });
      rafRef.current = id;
      return () => cancelAnimationFrame(id);
    }

    const from = fromRef.current;
    const delta = value - from;
    if (delta === 0) return;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic: fast start, gentle settle
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + delta * eased;
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return <span className={className}>{Math.round(display)}</span>;
}