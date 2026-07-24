import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ooh_haptics_enabled";

// Semantic haptic patterns (ms or ms-pulse arrays)
export const HAPTIC_PATTERNS = {
  tap: 8,
  soft: 5,
  select: [12, 30, 12],
  impact: 20,
  success: [10, 40, 20, 40, 30],
  error: [40, 60, 40],
  warning: [25, 50, 25],
};

export function supportsHaptics() {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function isEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}

// Global delegated listener — fires a soft tap haptic on every interactive tap.
let globalInit = false;
export function initGlobalHaptics() {
  if (globalInit || !supportsHaptics()) return;
  globalInit = true;
  const handler = (e) => {
    if (prefersReducedMotion() || !isEnabled()) return;
    const el = e.target instanceof Element
      ? e.target.closest("button, a, [role='button'], [data-tactile], input[type='checkbox'], input[type='radio'], summary")
      : null;
    if (el) navigator.vibrate(HAPTIC_PATTERNS.tap);
  };
  document.addEventListener("pointerdown", handler, { passive: true });
}

export default function useHaptics() {
  const [enabled, setEnabled] = useState(() => isEnabled());

  useEffect(() => { initGlobalHaptics(); }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, next ? "1" : "0"); } catch {}
      return next;
    });
  }, []);

  const buzz = useCallback((pattern = "tap") => {
    if (!supportsHaptics() || prefersReducedMotion() || !isEnabled()) return;
    const p = HAPTIC_PATTERNS[pattern] ?? HAPTIC_PATTERNS.tap;
    navigator.vibrate(p);
  }, []);

  return { buzz, patterns: HAPTIC_PATTERNS, enabled, toggle, supported: supportsHaptics() };
}