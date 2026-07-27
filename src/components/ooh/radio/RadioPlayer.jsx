import { useState, useRef, useEffect } from "react";
import { Radio, Play, Pause, Volume2, VolumeX, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { RADIO_STATIONS } from "./radioStations";

function EqBars({ active, bars = 4, className = "" }) {
  if (!active) return null;
  return (
    <span className={`inline-flex items-end gap-[1.5px] ${className}`}>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="eq-bar w-[2px] bg-ozone"
          style={{ height: "10px", animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

export default function RadioPlayer() {
  const audioRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [stationId, setStationId] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [error, setError] = useState(false);

  const station = RADIO_STATIONS.find((s) => s.id === stationId);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audioRef.current = audio;

    const onPlaying = () => { setPlaying(true); setError(false); };
    const onPause = () => setPlaying(false);
    const onError = () => { setError(true); setPlaying(false); };

    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.src = "";
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
    };
  }, []);

  useEffect(() => {
    if (!station || !audioRef.current) return;
    setError(false);
    audioRef.current.src = station.stream;
    audioRef.current.load();
    audioRef.current.play().catch(() => setError(true));
  }, [stationId]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const togglePlay = () => {
    if (!station) {
      setStationId(RADIO_STATIONS[0].id);
      return;
    }
    if (playing) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play().catch(() => setError(true));
    }
  };

  const selectStation = (id) => {
    if (id === stationId) {
      togglePlay();
    } else {
      setStationId(id);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="OOH Radio"
        title="Radio"
        className={`flex h-8 w-8 items-center justify-center border transition-colors md:h-8 ${playing ? "border-ozone text-ozone" : "border-slate2 text-silver hover:border-ozone hover:text-ozone"}`}
      >
        <Radio className={`h-3.5 w-3.5 ${playing ? "animate-pulse" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[98]" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full z-[99] mt-1 w-[280px] border border-slate2 bg-void shadow-[0_24px_60px_rgba(0,0,0,0.7)]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate2/60 px-4 py-3">
                <span className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-ozone">
                  <Radio className="h-3 w-3" /> OOH Radio
                </span>
                <button onClick={() => setOpen(false)} aria-label="Close radio" className="text-dim transition-colors hover:text-flare">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Now Playing + Controls */}
              <div className="border-b border-slate2/60 p-3">
                {station ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlay}
                      aria-label={playing ? "Pause" : "Play"}
                      className="flex h-9 w-9 shrink-0 items-center justify-center bg-ozone text-void transition-colors hover:bg-flare"
                    >
                      {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-px" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <EqBars active={playing} />
                        <span className="truncate font-display text-[13px] font-semibold tracking-[-0.01em] text-silver">{station.name}</span>
                      </div>
                      <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">{station.genre}</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-1 text-center">
                    <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">// Select a station</span>
                  </div>
                )}

                {/* Volume */}
                {station && (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => setVolume(volume > 0 ? 0 : 0.5)}
                      aria-label={volume === 0 ? "Unmute" : "Mute"}
                      className="text-dim transition-colors hover:text-ozone"
                    >
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
                    <span className="w-7 text-right font-mono text-[8px] tabular text-dim">{Math.round(volume * 100)}</span>
                  </div>
                )}

                {error && (
                  <div className="mt-2 font-mono text-[8px] uppercase tracking-[0.2em] text-flare">// Stream unavailable · try another</div>
                )}
              </div>

              {/* Station List */}
              <div className="max-h-[240px] overflow-y-auto">
                {RADIO_STATIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => selectStation(s.id)}
                    className={`flex w-full items-center justify-between border-b border-slate2/30 px-4 py-2.5 text-left transition-colors hover:bg-slate2/30 ${s.id === stationId ? "bg-slate2/20" : ""}`}
                  >
                    <div className="min-w-0">
                      <div className={`truncate font-display text-[12px] font-medium tracking-[-0.01em] ${s.id === stationId ? "text-ozone" : "text-silver/80"}`}>
                        {s.name}
                      </div>
                      <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim/60">{s.genre}</div>
                    </div>
                    {s.id === stationId && <EqBars active={playing} bars={3} />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}