import { useEffect, useState } from "react";

export default function HorizonProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setProgress(max > 0 ? el.scrollTop / max : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const pct = Math.round(progress * 100);

  return (
    <>
      {/* Moving horizon line */}
      <div
        className="pointer-events-none fixed left-0 right-0 z-40"
        style={{ top: `${progress * 100}svh` }}
      >
        <div className="h-px w-full bg-gradient-to-r from-transparent via-ozone/50 to-transparent" />
      </div>

      {/* Coordinate readout */}
      <div className="pointer-events-none fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-1 font-mono text-[9px] uppercase tracking-[0.25em] text-silver/40 md:flex">
        <span>HORIZON</span>
        <span className="tabular-nums text-ozone">{pct.toString().padStart(3, "0")}%</span>
      </div>
    </>
  );
}