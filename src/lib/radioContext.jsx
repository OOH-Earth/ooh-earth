import { createContext, useContext, useRef, useState, useEffect, useCallback } from "react";
import { RADIO_STATIONS } from "@/components/ooh/radio/radioStations";

const RadioContext = createContext(null);

/**
 * RadioProvider owns a single HTML5 Audio element that lives at the app root.
 * Because the provider never unmounts during route changes, the audio stream
 * keeps playing seamlessly while the user navigates between pages.
 *
 * The Audio element is connected to a Web Audio API AnalyserNode so the
 * visualizer can render real FFT frequency data. crossOrigin="anonymous" is
 * set to enable CORS for the analyser; if a stream server doesn't support
 * CORS, the error handler retries without it (audio plays, visualizer
 * falls back to simulated bars).
 */
export function RadioProvider({ children }) {
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const corsRetryRef = useRef(false);
  const [stationId, setStationId] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.5);
  const [error, setError] = useState(false);
  const [analyser, setAnalyser] = useState(null);

  const station = RADIO_STATIONS.find((s) => s.id === stationId) || null;

  // Create the persistent Audio element + AudioContext once
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.volume = 0.5;
    audioRef.current = audio;

    // Set up Web Audio API for the FFT visualizer
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      try {
        const ctx = new AudioCtx();
        const an = ctx.createAnalyser();
        an.fftSize = 64;
        an.smoothingTimeConstant = 0.72;
        const source = ctx.createMediaElementSource(audio);
        source.connect(an);
        an.connect(ctx.destination);
        audioCtxRef.current = ctx;
        setAnalyser(an);
      } catch (e) {
        // AudioContext unavailable — audio still works, visualizer simulates
      }
    }

    const onPlaying = () => { setPlaying(true); setError(false); };
    const onPause = () => setPlaying(false);
    const onError = () => {
      // If CORS caused the failure, retry without it (visualizer falls back)
      if (!corsRetryRef.current && audio.crossOrigin) {
        corsRetryRef.current = true;
        audio.crossOrigin = null;
        audio.load();
        audio.play().catch(() => { setError(true); setPlaying(false); });
        return;
      }
      setError(true);
      setPlaying(false);
    };

    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.src = "";
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    };
  }, []);

  const resumeCtx = useCallback(() => {
    if (audioCtxRef.current?.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
  }, []);

  // Load + play when station changes
  useEffect(() => {
    if (!station || !audioRef.current) return;
    setError(false);
    corsRetryRef.current = false;
    // Reset to CORS mode for each new station (enables real FFT data)
    audioRef.current.crossOrigin = "anonymous";
    audioRef.current.src = station.stream;
    audioRef.current.load();
    resumeCtx();
    audioRef.current.play().catch(() => setError(true));
  }, [stationId, resumeCtx]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    resumeCtx();
    if (!station) { setStationId(RADIO_STATIONS[0].id); return; }
    if (audio.paused) audio.play().catch(() => setError(true));
    else audio.pause();
  }, [station, resumeCtx]);

  const selectStation = useCallback((id) => {
    resumeCtx();
    setStationId((cur) => {
      if (cur === id) {
        // Same station tapped → toggle play/pause
        const audio = audioRef.current;
        if (audio) {
          if (audio.paused) audio.play().catch(() => setError(true));
          else audio.pause();
        }
        return cur;
      }
      return id;
    });
  }, [resumeCtx]);

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