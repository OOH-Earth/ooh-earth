import { createContext, useContext, useRef, useState, useEffect, useCallback } from "react";
import { RADIO_STATIONS } from "@/components/ooh/radio/radioStations";

const RadioContext = createContext(null);

/**
 * RadioProvider owns the audio playback that lives at the app root, so
 * streams keep playing during route changes.
 *
 * **Two-element architecture for mobile-safe FFT:**
 * 1. `playbackRef` — the element the user hears. No `crossOrigin`, so it
 *    plays ANY stream without CORS issues. Never connected to AudioContext.
 * 2. `analysisRef` — a muted duplicate with `crossOrigin="anonymous"`,
 *    connected to an AnalyserNode (but NOT to destination, so it's silent).
 *    Provides real FFT data for the visualizer when the stream supports CORS.
 *    If CORS fails, it errors silently and the visualizer falls back to
 *    simulated animation.
 *
 * The AudioContext is created lazily inside the first user gesture (required
 * by iOS / mobile autoplay policies). This ensures the context starts in
 * "running" state, not "suspended".
 */
export function RadioProvider({ children }) {
  const playbackRef = useRef(null);
  const analysisRef = useRef(null);
  const audioCtxRef = useRef(null);
  const [stationId, setStationId] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.5);
  const [error, setError] = useState(false);
  const [analyser, setAnalyser] = useState(null);

  const station = RADIO_STATIONS.find((s) => s.id === stationId) || null;

  // Create the playback element once (no Web Audio, no CORS)
  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.5;
    playbackRef.current = audio;

    const onPlaying = () => {
      setPlaying(true);
      setError(false);
      // Keep analysis element in sync
      if (analysisRef.current && analysisRef.current.paused) {
        analysisRef.current.play().catch(() => {});
      }
    };
    const onPause = () => {
      setPlaying(false);
      if (analysisRef.current && !analysisRef.current.paused) {
        analysisRef.current.pause();
      }
    };
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
      if (analysisRef.current) { analysisRef.current.pause(); analysisRef.current.src = ""; }
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    };
  }, []);

  /**
   * Lazily create the AudioContext + analysis element on the first user
   * gesture. Must be called synchronously inside a click/tap handler for
   * iOS to allow the context to start in "running" state.
   */
  const ensureAudioGraph = useCallback(() => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume().catch(() => {});
      }
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    try {
      const ctx = new AudioCtx();
      const an = ctx.createAnalyser();
      an.fftSize = 64;
      an.smoothingTimeConstant = 0.72;
      // Analysis audio element — CORS required for real FFT data
      const analysisAudio = new Audio();
      analysisAudio.crossOrigin = "anonymous";
      analysisAudio.volume = 1; // Full signal to analyser; output is muted (not connected to destination)
      const source = ctx.createMediaElementSource(analysisAudio);
      source.connect(an);
      // Do NOT connect analyser to ctx.destination — analysis audio is silent
      analysisRef.current = analysisAudio;
      audioCtxRef.current = ctx;
      setAnalyser(an);
    } catch (e) {
      // AudioContext unavailable — visualizer will use simulated fallback
    }
  }, []);

  // Load + play when station changes
  useEffect(() => {
    if (!station || !playbackRef.current) return;
    setError(false);

    // Main playback — always works (no CORS restriction)
    const pb = playbackRef.current;
    pb.src = station.stream;
    pb.load();
    pb.play().catch(() => setError(true));

    // Analysis stream — CORS required, fails silently for non-CORS streams
    if (analysisRef.current) {
      const an = analysisRef.current;
      an.crossOrigin = "anonymous";
      an.src = station.stream;
      an.load();
      an.play().catch(() => {});
    }
  }, [stationId]);

  // Sync volume on playback element only
  useEffect(() => {
    if (playbackRef.current) playbackRef.current.volume = volume;
  }, [volume]);

  const togglePlay = useCallback(() => {
    ensureAudioGraph();
    const audio = playbackRef.current;
    if (!audio) return;
    if (!station) { setStationId(RADIO_STATIONS[0].id); return; }
    if (audio.paused) {
      audio.play().catch(() => setError(true));
      if (analysisRef.current) analysisRef.current.play().catch(() => {});
    } else {
      audio.pause();
      if (analysisRef.current) analysisRef.current.pause();
    }
  }, [station, ensureAudioGraph]);

  const selectStation = useCallback((id) => {
    ensureAudioGraph();
    setStationId((cur) => {
      if (cur === id) {
        // Same station tapped → toggle play/pause
        const audio = playbackRef.current;
        if (audio) {
          if (audio.paused) {
            audio.play().catch(() => setError(true));
            if (analysisRef.current) analysisRef.current.play().catch(() => {});
          } else {
            audio.pause();
            if (analysisRef.current) analysisRef.current.pause();
          }
        }
        return cur;
      }
      return id;
    });
  }, [ensureAudioGraph]);

  const setVolume = useCallback((v) => setVolumeState(v), []);
  const toggleMute = useCallback(() => setVolumeState((v) => (v > 0 ? 0 : 0.5)), []);

  return (
    <RadioContext.Provider value={{ station, stationId, playing, volume, error, stations: RADIO_STATIONS, selectStation, togglePlay, setVolume, toggleMute, analyser }}>
      {children}
    </RadioContext.Provider>
  );
}

export function useRadio() {
  const ctx = useContext(RadioContext);
  if (!ctx) throw new Error("useRadio must be used within RadioProvider");
  return ctx;
}