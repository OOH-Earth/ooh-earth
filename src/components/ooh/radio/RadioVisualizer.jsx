import { useRef, useEffect } from "react";
import { useRadio } from "@/lib/radioContext";

const NUM_BARS = 14;
const BAR_GAP = 1;
const CW = 48;
const CH = 26;

/**
 * RadioVisualizer — a compact canvas-based FFT spectrum analyzer that replaces
 * the radio toggle button in the header nav. Reads real frequency data from
 * the Web Audio AnalyserNode when available (CORS-friendly streams). Falls
 * back to a smooth simulated waveform for non-CORS streams. Bars use the
 * station category color (news = orange, music = yellow).
 */
export default function RadioVisualizer({ onClick, open }) {
  const { analyser, playing, error, station } = useRadio();
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const simPhase = useRef(0);
  const stateRef = useRef({ analyser, playing, error, cat: station?.category });
  stateRef.current = { analyser, playing, error, cat: station?.category };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CW * dpr;
    canvas.height = CH * dpr;
    ctx.scale(dpr, dpr);

    const barW = (CW - (NUM_BARS - 1) * BAR_GAP) / NUM_BARS;
    let freqData = null;

    const draw = () => {
      const { analyser: an, playing: pl, error: er, cat } = stateRef.current;
      ctx.clearRect(0, 0, CW, CH);

      const color = er ? "#FF5C00" : cat === "news" ? "#FF5C00" : "#EDFF00";
      const vals = new Array(NUM_BARS).fill(0.04);

      if (pl) {
        let hasReal = false;
        if (an) {
          if (!freqData || freqData.length !== an.frequencyBinCount) {
            freqData = new Uint8Array(an.frequencyBinCount);
          }
          an.getByteFrequencyData(freqData);
          const step = Math.max(1, Math.floor(freqData.length / NUM_BARS));
          for (let i = 0; i < NUM_BARS; i++) {
            const v = freqData[i * step] / 255;
            vals[i] = v;
            if (v > 0.01) hasReal = true;
          }
        }
        if (!hasReal) {
          // Simulated fallback for non-CORS streams
          simPhase.current += 0.06;
          for (let i = 0; i < NUM_BARS; i++) {
            const wave = Math.sin(simPhase.current + i * 0.45) * 0.22 + 0.32;
            const noise = Math.sin(simPhase.current * 2.3 + i * 1.7) * 0.1;
            vals[i] = Math.max(0.08, Math.min(0.92, wave + noise));
          }
        }
      }

      for (let i = 0; i < NUM_BARS; i++) {
        const h = Math.max(1, vals[i] * CH * 0.92);
        const x = i * (barW + BAR_GAP);
        const y = CH - h;
        ctx.fillStyle = color;
        ctx.globalAlpha = pl ? 0.88 : 0.2;
        ctx.fillRect(x, y, barW, h);
      }
      ctx.globalAlpha = 1;

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <button
      onClick={onClick}
      aria-label="Open radio"
      aria-expanded={open}
      title="Radio"
      className={`flex h-8 items-center justify-center border px-1 transition-colors hover:border-ozone ${playing ? "border-ozone/60" : "border-slate2"}`}
    >
      <canvas ref={canvasRef} style={{ width: CW, height: CH, display: "block" }} />
    </button>
  );
}