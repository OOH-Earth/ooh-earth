import { useState, useRef, useEffect } from "react";
import { Radio, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRadio } from "@/lib/radioContext";
import RadioVisualizer from "@/components/ooh/radio/RadioVisualizer";

function EqBars({ active, bars = 3 }) {
  if (!active) return null;
  return (
    <span className="inline-flex items-end gap-[1px]">
      {Array.from({ length: bars }).map((_, i) => (
        <span key={i} className="eq-bar w-[1.5px] bg-ozone" style={{ height: "6px", animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  );
}

export default function RadioMiniPlayer() {
  const { station, playing, volume, error, stations, selectStation, togglePlay, setVolume, toggleMute } = useRadio();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="flex items-center">
      {/* Label + inline visualizer — opens dropdown */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open radio"
        aria-expanded={open}
        title="Radio"
        className={`flex h-8 items-center gap-2 border border-slate2 px-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.25em] transition-colors hover:border-ozone hover:text-ozone ${playing ? "border-ozone/60 text-ozone" : "text-silver"}`}
      >
        <Radio className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Radio</span>
        <RadioVisualizer />
      </button>
      {/* On/off toggle — separate from visualizer */}
      <button
        onClick={togglePlay}
        aria-label={playing ? "Pause" : "Play"}
        title={playing ? "Pause" : "Play"}
        className={`flex h-8 w-8 items-center justify-center border-y border-r border-slate2 transition-colors hover:border-ozone hover:text-ozone ${playing ? "text-ozone" : "text-silver"}`}
      >
        {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 top-full z-[200] mt-2 w-[260px] border border-slate2 bg-void shadow-[0_24px_60px_rgba(0,0,0,0.7)]"
          >
            {/* Now playing header */}
            <div className="border-b border-slate2/60 p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.25em] text-ozone">
                  <Radio className="h-2.5 w-2.5" /> OOH Radio
                </span>
                <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className="flex h-8 w-8 items-center justify-center border border-ozone bg-ozone text-void transition-colors hover:bg-flare hover:border-flare">
                  {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div className="mt-2">
                <div className="font-display text-[14px] font-semibold tracking-[-0.02em] text-silver">
                  {station ? station.name : "No station"}
                </div>
                <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">
                  {station ? station.genre : "Select below"}
                </div>
              </div>
              {error && <div className="mt-2 font-mono text-[8px] uppercase tracking-[0.2em] text-flare">// Stream unavailable</div>}
            </div>

            {/* Volume */}
            {station && (
              <div className="flex items-center gap-2 border-b border-slate2/60 px-4 py-3">
                <button onClick={toggleMute} aria-label={volume === 0 ? "Unmute" : "Mute"} className="text-dim transition-colors hover:text-ozone">
                  {volume === 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  aria-label="Volume"
                  className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-slate2 accent-ozone"
                />
              </div>
            )}

            {/* Station list */}
            <div className="max-h-[240px] overflow-y-auto">
              {stations.map((s) => (
                <button
                  key={s.id}
                  onClick={() => selectStation(s.id)}
                  className={`flex w-full items-center justify-between border-b border-slate2/30 px-4 py-2.5 text-left transition-colors hover:bg-slate2/30 ${s.id === station?.id ? "bg-slate2/20" : ""}`}
                >
                  <div className="min-w-0">
                    <div className={`truncate font-display text-[12px] font-medium tracking-[-0.01em] ${s.id === station?.id ? "text-ozone" : "text-silver/80"}`}>
                      {s.name}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-mono text-[7px] font-bold uppercase tracking-[0.15em] ${s.category === "news" ? "text-flare" : "text-ozone/60"}`}>{s.category === "news" ? "[NEWS]" : "[MUSIC]"}</span>
                      <span className="font-mono text-[7px] uppercase tracking-[0.15em] text-dim/60">{s.genre}</span>
                    </div>
                  </div>
                  {s.id === station?.id && <EqBars active={playing} bars={3} />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}