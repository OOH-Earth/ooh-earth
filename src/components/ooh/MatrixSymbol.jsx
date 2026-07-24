import { useEffect, useRef } from "react";

const CHARS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇ01".split("");
const CELL = 5;
const COLS = 6;
const ROWS = 8;
const W = COLS * CELL;
const H = ROWS * CELL;

export default function MatrixSymbol({ className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = W;
    canvas.height = H;
    const drops = Array.from({ length: COLS }, () => ({ y: Math.random() * ROWS, speed: 0.12 + Math.random() * 0.2 }));
    let raf;
    let frame = 0;
    const draw = () => {
      frame++;
      ctx.fillStyle = "rgba(0,0,0,0.30)";
      ctx.fillRect(0, 0, W, H);
      ctx.font = `${CELL + 1}px monospace`;
      ctx.textAlign = "center";
      const intro = frame < 55;
      for (let c = 0; c < COLS; c++) {
        const d = drops[c];
        const yi = Math.floor(d.y);
        ctx.fillStyle = intro ? "#d6ffd6" : "#bfffcc";
        ctx.fillText(CHARS[(Math.random() * CHARS.length) | 0], c * CELL + CELL / 2, yi * CELL + CELL);
        for (let t = 1; t < 6; t++) {
          const ty = yi - t;
          if (ty < 0) break;
          ctx.fillStyle = `rgba(0,255,85,${Math.max(0, 0.55 - t * 0.1)})`;
          ctx.fillText(CHARS[(Math.random() * CHARS.length) | 0], c * CELL + CELL / 2, ty * CELL + CELL);
        }
        if (intro) {
          for (let r = 0; r < ROWS; r++) {
            if (Math.random() < 0.5) {
              ctx.fillStyle = `rgba(0,255,85,${0.2 + Math.random() * 0.3})`;
              ctx.fillText(CHARS[(Math.random() * CHARS.length) | 0], c * CELL + CELL / 2, r * CELL + CELL);
            }
          }
        }
        d.y += d.speed;
        if (d.y > ROWS + 3) d.y = -1;
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className={className} style={{ imageRendering: "pixelated", borderRadius: 2 }} aria-hidden />;
}