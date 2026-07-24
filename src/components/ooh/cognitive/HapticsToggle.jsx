import { Vibrate, VibrateOff } from "lucide-react";
import useHaptics from "@/hooks/useHaptics";

export default function HapticsToggle() {
  const { enabled, toggle, supported } = useHaptics();
  if (!supported) return null;
  return (
    <button
      onClick={toggle}
      aria-label={enabled ? "Disable haptics" : "Enable haptics"}
      title={enabled ? "Haptics on" : "Haptics off"}
      className="flex h-8 w-8 items-center justify-center border border-slate2 text-darkgray transition-colors hover:border-ozone hover:text-ozone"
    >
      {enabled ? <Vibrate className="h-3.5 w-3.5" /> : <VibrateOff className="h-3.5 w-3.5" />}
    </button>
  );
}