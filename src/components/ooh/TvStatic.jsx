import { useEffect, useRef } from "react";

/**
 * Rare analog CRT glitches — static bursts, sync-roll, horizontal tearing,
 * color-shift flashes — fired infrequently (every ~3–8 min) so they stay a
 * surprise instead of noise. No-op under prefers-reduced-motion.
 */
export default function TvStatic() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const rollRef = useRef(null);
  const tearRef = useRef(null);
  const flashRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    const down = 3;
    let raf, timer;

    const resize = () => {
      canvas.width = Math.ceil(window.innerWidth / down);
      canvas.height = Math.ceil(window.innerHeight / down);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    };
    resize();
    window.addEventListener("resize", resize);

    const drawFrame = () => {
      const w = canvas.width;
      const h = canvas.height;
      const img = ctx.createImageData(w, h);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    };

    // --- glitch types -------------------------------------------------
    const staticBurst = (done) => {
      const dur = 220 + Math.random() * 260;
      const start = performance.now();
      wrap.style.opacity = "0.5";
      wrap.style.transform = `translateY(${((Math.random() * 6 - 3) | 0)}px)`;
      const loop = (t) => {
        drawFrame();
        if (t - start < dur) raf = requestAnimationFrame(loop);
        else { wrap.style.opacity = "0"; wrap.style.transform = ""; done(); }
      };
      raf = requestAnimationFrame(loop);
    };

    // vertical sync-roll — a dark band drifts down the screen like losing v-hold
    const syncRoll = (done) => {
      const el = rollRef.current;
      if (!el) return done();
      const dur = 700 + Math.random() * 600;
      const start = performance.now();
      el.style.opacity = "1";
      const loop = (t) => {
        const p = (t - start) / dur;
        el.style.transform = `translateY(${p * 100}vh)`;
        if (t - start < dur) raf = requestAnimationFrame(loop);
        else { el.style.opacity = "0"; el.style.transform = ""; done(); }
      };
      raf = requestAnimationFrame(loop);
    };

    // horizontal tear — a thin bright shearing line jitters across
    const tear = (done) => {
      const el = tearRef.current;
      if (!el) return done();
      const dur = 280 + Math.random() * 220;
      const start = performance.now();
      el.style.opacity = "0.8";
      const loop = (t) => {
        el.style.transform = `translateY(${((Math.random() * 90 + 5) | 0)}vh)`;
        if (t - start < dur) raf = requestAnimationFrame(loop);
        else { el.style.opacity = "0"; el.style.transform = ""; done(); }
      };
      raf = requestAnimationFrame(loop);
    };

    // chroma flash — a quick hue-shift wash, like a mis-calibrated tube
    const chromaFlash = (done) => {
      const el = flashRef.current;
      if (!el) return done();
      const hues = ["rgba(255,92,0,0.10)", "rgba(237,255,0,0.10)", "rgba(0,200,255,0.10)"];
      el.style.background = hues[(Math.random() * hues.length) | 0];
      el.style.opacity = "1";
      setTimeout(() => { el.style.opacity = "0"; done(); }, 90 + Math.random() * 90);
    };

    const glitches = [staticBurst, syncRoll, tear, chromaFlash];

    const schedule = () => {
      // rare: every ~3–8 minutes
      timer = setTimeout(() => {
        // sometimes a couple glitches chain back-to-back
        const run = (i) => {
          if (i <= 0) return schedule();
          const g = glitches[(Math.random() * glitches.length) | 0];
          g(() => run(i - 1));
        };
        run(1 + (Math.random() < 0.25 ? 1 : 0));
      }, 180000 + Math.random() * 300000);
    };

    schedule();
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[45] opacity-0 transition-opacity duration-75 mix-blend-screen"
    >
      <canvas ref={canvasRef} className="h-full w-full" style={{ imageRendering: "pixelated" }} />
      <div className="absolute inset-0 crt-scanlines opacity-40" />

      {/* sync-roll band */}
      <div
        ref={rollRef}
        className="absolute inset-x-0 top-0 h-[14vh] opacity-0 transition-opacity duration-100"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0) 100%)" }}
      />
      {/* horizontal tear line */}
      <div
        ref={tearRef}
        className="absolute inset-x-0 top-0 h-[2px] opacity-0"
        style={{ background: "rgba(237,255,0,0.55)", boxShadow: "0 0 12px rgba(237,255,0,0.5)" }}
      />
      {/* chroma flash wash */}
      <div
        ref={flashRef}
        className="absolute inset-0 opacity-0 transition-opacity duration-75 mix-blend-overlay"
      />
    </div>
  );
}