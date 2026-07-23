import { useEffect, useRef, useState } from "react";

export default function ViewfinderCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [active, setActive] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const raf = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;
    setEnabled(true);

    const move = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      if (raf.current) return;
      raf.current = requestAnimationFrame(() => {
        raf.current = null;
        setPos({ x, y });
        const el = document.elementFromPoint(x, y);
        setActive(!!el?.closest("a, button, input, textarea, select, [data-cursor='view']"));
      });
    };
    window.addEventListener("mousemove", move);
    return () => {
      window.removeEventListener("mousemove", move);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div
      className="pointer-events-none fixed z-[9999] mix-blend-difference transition-[width,height] duration-150"
      style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -50%)" }}
      aria-hidden="true"
    >
      {active ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/80">
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
        </div>
      ) : (
        <div className="relative h-6 w-6">
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white" />
          <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white" />
          <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
        </div>
      )}
    </div>
  );
}