import { Volume2, VolumeX } from "lucide-react";
import useSoundscape from "@/hooks/useSoundscape";

export default function SoundToggle() {
  const { enabled, toggle, supported } = useSoundscape();
  if (!supported) return null;
  return (
    <button
      onClick={toggle}
      aria-label={enabled ? "Disable soundscape" : "Enable soundscape"}
      title={enabled ? "Soundscape on" : "Soundscape off"}
      className="flex h-8 w-8 items-center justify-center border border-slate2 text-darkgray transition-colors hover:border-ozone hover:text-ozone"
    >
      {enabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
    </button>
  );
}