import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import useSoundscape from "@/hooks/useSoundscape";

// Subvocal layer — whispers contextual labels (from the nudge system) and
// emits a soft cognitive blip on route change. Gated by the sound toggle.
export default function Subvocal() {
  const { speak, blip } = useSoundscape();
  const { pathname } = useLocation();

  useEffect(() => {
    blip(520, 0.14, "sine", 0.05);
  }, [pathname, blip]);

  useEffect(() => {
    const onVocal = (e) => { if (e.detail) speak(e.detail); };
    window.addEventListener("ooh-subvocal", onVocal);
    return () => window.removeEventListener("ooh-subvocal", onVocal);
  }, [speak]);

  // gentle hover-speak on interactive elements — never repeats while you stay
  // on the same element, and won't re-whisper an identical label back-to-back
  useEffect(() => {
    let last = 0;
    let lastEl = null;
    let lastLabel = "";
    const onOver = (e) => {
      const el = e.target instanceof Element
        ? e.target.closest('button, a, [role="button"], [data-tactile]')
        : null;
      if (!el || el === lastEl) return;
      const label = (el.getAttribute("aria-label") || el.textContent || "").trim();
      if (!label || label.length > 40) return;
      const now = performance.now();
      if (label === lastLabel && now - last < 4000) return;
      last = now;
      lastEl = el;
      lastLabel = label;
      speak(label);
    };
    const onOut = (e) => {
      const el = e.target instanceof Element
        ? e.target.closest('button, a, [role="button"], [data-tactile]')
        : null;
      if (el && el === lastEl) lastEl = null;
    };
    document.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseout", onOut, { passive: true });
    return () => {
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
    };
  }, [speak]);

  return null;
}