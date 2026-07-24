import { useEffect } from "react";
import useHaptics from "@/hooks/useHaptics";
import AmbientPulse from "@/components/ooh/cognitive/AmbientPulse";
import ContextualNudge from "@/components/ooh/cognitive/ContextualNudge";
import Subvocal from "@/components/ooh/cognitive/Subvocal";
import ReadAloud from "@/components/ooh/cognitive/ReadAloud";

// Single global mount — haptics auto-init, ambient sensory + contextual intel.
export default function CognitiveLayer() {
  const { buzz } = useHaptics();

  useEffect(() => {
    const onVisible = () => { if (!document.hidden) buzz("soft"); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [buzz]);

  return (
    <>
      <AmbientPulse />
      <ContextualNudge />
      <Subvocal />
      <ReadAloud />
    </>
  );
}