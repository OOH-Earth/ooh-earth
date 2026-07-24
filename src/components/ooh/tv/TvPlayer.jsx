import { useEffect, useRef, useState } from "react";
import useSoundscape from "@/hooks/useSoundscape";
import { PROGRAMS } from "./programs";

// Lazy-load the YouTube IFrame Player API once.
let apiPromise = null;
function loadApi() {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) { resolve(); return; }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    window.onYouTubeIframeAPIReady = () => resolve();
    document.head.appendChild(tag);
  });
  return apiPromise;
}

export default function TvPlayer({ index, onEnded }) {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const { setTvFocus } = useSoundscape();

  // create the player once on mount
  useEffect(() => {
    let cancelled = false;
    loadApi().then(() => {
      if (cancelled || !hostRef.current) return;
      playerRef.current = new window.YT.Player(hostRef.current, {
        videoId: PROGRAMS[index]?.id,
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: () => setReady(true),
          onStateChange: (e) => {
            const YT = window.YT;
            // grab audio focus while the video plays, release when it stops
            if (e.data === YT.PlayerState.PLAYING) setTvFocus(true);
            else if (e.data === YT.PlayerState.ENDED) { setTvFocus(false); onEnded?.(); }
            else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.UNSTARTED || e.data === YT.PlayerState.CUED) {
              setTvFocus(false);
            }
          },
        },
      });
    });
    return () => {
      cancelled = true;
      setTvFocus(false);
      try { playerRef.current?.destroy?.(); } catch {}
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // swap video when the selected program changes
  useEffect(() => {
    const p = playerRef.current;
    if (!p || !ready) return;
    p.loadVideoById(PROGRAMS[index].id);
  }, [index, ready]);

  return (
    <div className="relative w-full overflow-hidden border border-slate2 bg-black" style={{ aspectRatio: "16 / 9" }}>
      <div ref={hostRef} className="absolute inset-0 h-full w-full" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone animate-blink">// loading signal…</span>
        </div>
      )}
    </div>
  );
}