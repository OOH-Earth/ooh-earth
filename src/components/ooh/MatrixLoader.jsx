import { useEffect, useRef, useState } from "react";
import { matrixLoaderEnabled } from "@/lib/loaderSettings";

// Matrix-style digital-rain loading screen. Used as the Suspense fallback while
// route chunks stream in, and as the app-boot screen. Lightweight canvas loop,
// cleaned up on unmount. Orbital Perspective readout (reticle + mono + coords).
const GLYPHS = "\u30A2\u30AB\u30B5\u30BF\u30CA\u30CF\u30DE\u30E4\u30E9\u30EF\u30F2\u30A6\u30A8\u30AA\u30AD\u30B1\u30B30123456789\uFF66\uFF67\uFF68\uFF69\uFF6A\uFF6B\uFF6C:.=*+-<>\u00A6\uFF5C";

export default function MatrixLoader({ label = "LOADING", fullscreen = true }) {
  const ref = useRef(null);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 320);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0, drops = [], cols = 0, W = 0, H = 0;
    const font = 15;

    const setup = () => {
      const parent = canvas.parentElement;
      W = canvas.width = parent ? parent.clientWidth : window.innerWidth;
      H = canvas.height = parent ? parent.clientHeight : window.innerHeight;
      cols = Math.max(1, Math.floor(W / font));
      drops = Array.from({ length: cols }, () => Math.floor((Math.random() * -H) / font));
      ctx.fillStyle = "#020402";
      ctx.fillRect(0, 0, W, H);
    };
    setup();

    const draw = () => {
      // translucent wash leaves fading trails
      ctx.fillStyle = "rgba(2,4,2,0.10)";
      ctx.fillRect(0, 0, W, H);
      ctx.font = `${font}px "IBM Plex Mono", ui-monospace, monospace`;
      for (let i = 0; i < cols; i++) {
        const ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
        const x = i * font;
        const y = drops[i] * font;
        // occasional bright leading head, otherwise brand green
        ctx.fillStyle = Math.random() > 0.93 ? "#e8ffee" : "#39FF14";
        ctx.fillText(ch, x, y);
        if (y > H && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    window.addEventListener("resize", setup);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", setup); };
  }, []);

  if (!matrixLoaderEnabled()) {
    return (
      <div className={`${fullscreen ? "fixed" : "absolute"} inset-0 z-[9999] flex flex-col items-center justify-center gap-3 bg-void`}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate2 border-t-ozone" />
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-ozone/70">// {label}{dots}</span>
      </div>
    );
  }

  return (
    <div className={`${fullscreen ? "fixed" : "absolute"} inset-0 z-[9999] overflow-hidden bg-[#020402]`}>
      <canvas ref={ref} className="absolute inset-0 h-full w-full opacity-80" />
      {/* vignette */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(120% 120% at 50% 45%, transparent 38%, rgba(0,0,0,0.88) 100%)" }} />
      {/* readout */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative px-9 py-7">
          <span className="absolute left-0 top-0 h-4 w-4 border-l border-t border-ozone/70" />
          <span className="absolute right-0 top-0 h-4 w-4 border-r border-t border-ozone/70" />
          <span className="absolute bottom-0 left-0 h-4 w-4 border-b border-l border-ozone/70" />
          <span className="absolute bottom-0 right-0 h-4 w-4 border-b border-r border-ozone/70" />
          <div className="flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-[0.3em] text-ozone" style={{ textShadow: "0 0 14px rgba(237,255,0,0.55)" }}>
            <span>// {label}{dots}</span>
            <span className="inline-block h-4 w-[7px] animate-pulse bg-ozone" />
          </div>
          <div className="mt-2 text-center font-mono text-[9px] uppercase tracking-[0.28em] text-[#39FF14]/60">
            ooh.earth &middot; orbital atlas &middot; syncing
          </div>
        </div>
      </div>
    </div>
  );
}
