// @ts-nocheck -- intentionally excluded from typecheck (jsconfig.json), see TECHNICAL_DEBT_REGISTER.md
import { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import { RADIO_STATIONS } from '@/components/ooh/radio/radioStations';
import { OOH_STATION, RADIO_OPS_ENABLED, fetchNowPlaying } from '@/lib/radioOps';

// The OOH broadcast channel is merged in ONLY for the player list —
// never injected into RADIO_STATIONS (which the map + globe consume).
const STATIONS = RADIO_OPS_ENABLED ? [OOH_STATION, ...RADIO_STATIONS] : RADIO_STATIONS;

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
  const [loading, setLoading] = useState(false);
  const [analyser, setAnalyser] = useState(null);
  const [nowPlaying, setNowPlaying] = useState(null);

  const station = STATIONS.find((s) => s.id === stationId) || null;

  // Create the playback element once (no Web Audio, no CORS)
  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.5;
    playbackRef.current = audio;

    const onPlaying = () => {
      setPlaying(true);
      setError(false);
      setLoading(false);
      // Keep analysis element in sync
      if (analysisRef.current && analysisRef.current.paused) {
        analysisRef.current.play().catch(() => {});
      }
    };
    const onPause = () => {
      setPlaying(false);
      setLoading(false);
      if (analysisRef.current && !analysisRef.current.paused) {
        analysisRef.current.pause();
      }
    };
    const onError = () => {
      setError(true);
      setPlaying(false);
      setLoading(false);
    };

    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.src = '';
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
      if (analysisRef.current) {
        analysisRef.current.pause();
        analysisRef.current.src = '';
      }
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
      if (audioCtxRef.current.state === 'suspended') {
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
      analysisAudio.crossOrigin = 'anonymous';
      // Silence the analysis element at the ELEMENT level, not just via the graph.
      // The graph only mutes it when createMediaElementSource() successfully reroutes
      // the element's output — which is unreliable on mobile Safari/iOS, where the
      // element instead keeps playing straight to the speaker and layers a second,
      // slightly-out-of-phase copy on top of the playback element (the "double audio"
      // bug). muted=true guarantees hardware silence on every platform; the
      // AnalyserNode still taps the decoded signal for the visualizer where CORS
      // allows, and RadioVisualizer falls back to a simulated waveform when it can't.
      analysisAudio.muted = true;
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
    setLoading(true);

    // Main playback — always works (no CORS restriction)
    const pb = playbackRef.current;
    pb.src = station.stream;
    pb.load();
    pb.play().catch(() => setError(true));

    // Analysis stream — CORS required, fails silently for non-CORS streams
    if (analysisRef.current) {
      const an = analysisRef.current;
      an.crossOrigin = 'anonymous';
      an.src = station.stream;
      an.load();
      an.play().catch(() => {});
    }
  }, [stationId]);

  // Sync volume on playback element only
  useEffect(() => {
    if (playbackRef.current) playbackRef.current.volume = volume;
  }, [volume]);

  // Poll AzuraCast now-playing while the OOH broadcast channel is on air.
  // No-op (and clears) for any other station or when Radio Ops isn't configured.
  useEffect(() => {
    if (!RADIO_OPS_ENABLED || stationId !== OOH_STATION.id || !playing) {
      setNowPlaying(null);
      return;
    }
    let active = true;
    const controller = new AbortController();
    const tick = async () => {
      const np = await fetchNowPlaying(controller.signal);
      if (active) setNowPlaying(np);
    };
    tick();
    const iv = setInterval(tick, 15000);
    return () => {
      active = false;
      controller.abort();
      clearInterval(iv);
    };
  }, [stationId, playing]);

  const togglePlay = useCallback(() => {
    ensureAudioGraph();
    const audio = playbackRef.current;
    if (!audio) return;
    if (!station) {
      setStationId(STATIONS[0].id);
      return;
    }
    if (audio.paused) {
      audio.play().catch(() => setError(true));
      if (analysisRef.current) analysisRef.current.play().catch(() => {});
    } else {
      audio.pause();
      if (analysisRef.current) analysisRef.current.pause();
    }
  }, [station, ensureAudioGraph]);

  const selectStation = useCallback(
    (id) => {
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
    },
    [ensureAudioGraph],
  );

  const setVolume = useCallback((v) => setVolumeState(v), []);
  const toggleMute = useCallback(() => setVolumeState((v) => (v > 0 ? 0 : 0.5)), []);

  // Skip to the next / previous station in the list (wraps around).
  const stepStation = useCallback(
    (dir) => {
      ensureAudioGraph();
      setStationId((cur) => {
        const idx = STATIONS.findIndex((s) => s.id === cur);
        const nextIdx = idx < 0 ? 0 : (idx + dir + STATIONS.length) % STATIONS.length;
        return STATIONS[nextIdx].id;
      });
    },
    [ensureAudioGraph],
  );

  // Media Session — lock screen / Control Center / Bluetooth metadata + controls.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    if (station && typeof window.MediaMetadata === 'function') {
      try {
        ms.metadata = new window.MediaMetadata({
          title: station.name,
          artist: station.genre || 'OOH Radio',
          album: 'OOH Radio \u00b7 ooh.earth',
        });
      } catch {
        /* metadata unsupported */
      }
    }
    ms.playbackState = playing ? 'playing' : 'paused';
    const setAction = (name, handler) => {
      try {
        ms.setActionHandler(name, handler);
      } catch {
        /* action unsupported */
      }
    };
    setAction('play', () => togglePlay());
    setAction('pause', () => togglePlay());
    setAction('nexttrack', () => stepStation(1));
    setAction('previoustrack', () => stepStation(-1));
    return () => ['play', 'pause', 'nexttrack', 'previoustrack'].forEach((a) => setAction(a, null));
  }, [station, playing, togglePlay, stepStation]);

  return (
    <RadioContext.Provider
      value={{
        station,
        stationId,
        playing,
        loading,
        volume,
        error,
        stations: STATIONS,
        selectStation,
        stepStation,
        togglePlay,
        setVolume,
        toggleMute,
        analyser,
        nowPlaying,
      }}
    >
      {children}
    </RadioContext.Provider>
  );
}

export function useRadio() {
  const ctx = useContext(RadioContext);
  if (!ctx) throw new Error('useRadio must be used within RadioProvider');
  return ctx;
}
