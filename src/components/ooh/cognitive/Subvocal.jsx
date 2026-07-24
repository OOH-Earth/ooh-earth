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

  return null;
}