import { useEffect, useRef } from "react";

/**
 * Periodic analog TV-static burst — fires every ~25–48s for a fraction of a
 * second, like an old CRT losing sync. No-op under prefers-reduced-motion.
 */
export default function TvStatic() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);

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

    const burst = () => {
      const dur = 260 + Math.random() * 280;
      const start = performance.now();
      wrap.style.opacity = "0.5";
      wrap.style.transform = `translateY(${((Math.random() * 6 - 3) | 0)}px)`;
      const loop = (t) => {
        drawFrame();
        if (t - start < dur) {
          raf = requestAnimationFrame(loop);
        } else {
          wrap.style.opacity = "0";
          wrap.style.transform = "";
          schedule();
        }
      };
      raf = requestAnimationFrame(loop);
    };

    const schedule = () => {
      timer = setTimeout(burst, 25000 + Math.random() * 23000);
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
    </div>
  );
}