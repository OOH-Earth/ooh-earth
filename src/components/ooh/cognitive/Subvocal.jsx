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

  // haptic-level digital "voice" on hover — a short tactile chirp whose pitch
  // shifts with the element's label, instead of spoken words. Never repeats
  // while you stay on the same element, and won't re-chirp an identical label
  // back-to-back.
  useEffect(() => {
    let last = 0;
    let lastEl = null;
    let lastLabel = "";
    const onOver = (e) => {
      const el = e.target instanceof Element
        ? e.target.closest('button, a, [role="button"], [data-tactile]')
        : null;
      if (!el || el === lastEl) return;
      const raw = (el.getAttribute("aria-label") || el.textContent || "").trim();
      // strip a leading numeric index (e.g. "01 Home") so menu numbers aren't vocalised
      const label = raw.replace(/^\d{1,3}[\s.\-)]?\s*/, "").trim() || raw;
      if (!label || label.length > 40) return;
      const now = performance.now();
      if (label === lastLabel && now - last < 9000) return;
      last = now;
      lastEl = el;
      lastLabel = label;
      // derive a deterministic pitch from the label so each element feels distinct
      const freq = 380 + (label.charCodeAt(0) % 26) * 22;
      blip(freq, 0.05, "sine", 0.022);
      setTimeout(() => blip(freq * 1.5, 0.04, "sine", 0.014), 70);
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
  }, [blip]);

  return null;
}