import { createContext, useContext, useRef, useState, useEffect, useCallback } from "react";
import { RADIO_STATIONS } from "@/components/ooh/radio/radioStations";

const RadioContext = createContext(null);

/**
 * RadioProvider owns a single HTML5 Audio element that lives at the app root.
 * Because the provider never unmounts during route changes, the audio stream
 * keeps playing seamlessly while the user navigates between pages.
 */
export function RadioProvider({ children }) {
  const audioRef = useRef(null);
  const [stationId, setStationId] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.5);
  const [error, setError] = useState(false);

  const station = RADIO_STATIONS.find((s) => s.id === stationId) || null;

  // Create the persistent Audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.5;
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

  // Load + play when station changes
  useEffect(() => {
    if (!station || !audioRef.current) return;
    setError(false);
    audioRef.current.src = station.stream;
    audioRef.current.load();
    audioRef.current.play().catch(() => setError(true));
  }, [stationId]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!station) { setStationId(RADIO_STATIONS[0].id); return; }
    if (audio.paused) audio.play().catch(() => setError(true));
    else audio.pause();
  }, [station]);

  const selectStation = useCallback((id) => {
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
  }, []);

  const setVolume = useCallback((v) => setVolumeState(v), []);
  const toggleMute = useCallback(() => setVolumeState((v) => (v > 0 ? 0 : 0.5)), []);

  return (
    <RadioContext.Provider value={{ station, stationId, playing, volume, error, stations: RADIO_STATIONS, selectStation, togglePlay, setVolume, toggleMute }}>
      {children}
    </RadioContext.Provider>
  );
}

export function useRadio() {
  const ctx = useContext(RadioContext);
  if (!ctx) throw new Error("useRadio must be used within RadioProvider");
  return ctx;
}