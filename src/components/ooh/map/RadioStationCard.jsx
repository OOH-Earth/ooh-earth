import { Play, Pause, MapPin } from "lucide-react";
import { useRadio } from "@/lib/radioContext";

// Sidebar card for a radio station in the map sidebar. Tunes the global radio
// player on click. Shows category badge, location, and play/pause state.
export default function RadioStationCard({ station }) {
  const { station: active, playing, selectStation } = useRadio();
  const isActive = active?.id === station.id;
  const color = station.category === "news" ? "#FF5C00" : "#EDFF00";

  return (
    <button
      onClick={() => selectStation(station.id)}
      className={`flex w-full items-center justify-between border-b border-slate2/30 px-4 py-3 text-left transition-colors hover:bg-slate2/30 ${isActive ? "bg-slate2/20" : ""}`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[7px] font-bold uppercase tracking-[0.15em]" style={{ color }}>
            {station.category === "news" ? "[NEWS]" : "[MUSIC]"}
          </span>
          <span className="flex items-center gap-0.5 font-mono text-[7px] uppercase tracking-[0.12em] text-dim/50">
            <MapPin className="h-2 w-2" /> {station.city}
          </span>
        </div>
        <div className={`mt-0.5 truncate font-display text-[12px] font-medium tracking-[-0.01em] ${isActive ? "text-ozone" : "text-silver/80"}`}>
          {station.name}
        </div>
        <div className="font-mono text-[7px] uppercase tracking-[0.12em] text-dim/60">{station.genre}</div>
      </div>
      <div className="flex shrink-0" style={{ color: isActive ? color : "#666" }}>
        {isActive && playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </div>
    </button>
  );
}