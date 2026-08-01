import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Download, RotateCw } from "lucide-react";

// Token Icon Studio — canvas-based medallion generator for $OOHEX.
// Produces a downloadable token logo/badge asset (1024px), live customizable.
// Fungible tokens have no physical form — this is the brand-mark generator.

const SWATCHES = [
  { id: "void", name: "Void", hex: "#000000" },
  { id: "smoke", name: "Smoke", hex: "#1a1a1a" },
  { id: "navy", name: "Navy", hex: "#002554" },
  { id: "paper", name: "Paper", hex: "#f1f1f1" },
];

const FIELD_COLORS = [
  { id: "ozone", name: "Ozone", hex: "#EDFF00" },
  { id: "flare", name: "Flare", hex: "#FF5C00" },
  { id: "signal", name: "Signal", hex: "#1F51FF" },
  { id: "white", name: "White", hex: "#F1F1F1" },
  { id: "black", name: "Black", hex: "#0a0a0a" },
];

const RING_COLORS = [
  { id: "ozone", name: "Ozone", hex: "#EDFF00" },
  { id: "flare", name: "Flare", hex: "#FF5C00" },
  { id: "silver", name: "Silver", hex: "#B2B2B2" },
  { id: "white", name: "White", hex: "#F1F1F1" },
];

const PATTERNS = [
  { id: "guilloche", name: "Guilloché" },
  { id: "concentric", name: "Concentric" },
  { id: "radial", name: "Radial" },
  { id: "none", name: "None" },
];

const S = 1024;

function drawMedallion(ctx, cfg) {
  const cx = S / 2, cy = S / 2;
  const R = 480;
  const ringW = 56;
  const fieldR = R - ringW;

  // Background
  ctx.fillStyle = cfg.bg;
  ctx.fillRect(0, 0, S, S);

  // Glow halo
  if (cfg.glow > 0) {
    const grad = ctx.createRadialGradient(cx, cy, fieldR, cx, cy, fieldR + 120 * cfg.glow);
    grad.addColorStop(0, cfg.ring + "cc");
    grad.addColorStop(1, cfg.ring + "00");
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx, cy, R + 120 * cfg.glow, 0, Math.PI * 2); ctx.fill();
  }

  // Field disc
  ctx.fillStyle = cfg.field;
  ctx.beginPath(); ctx.arc(cx, cy, fieldR, 0, Math.PI * 2); ctx.fill();

  // Pattern inside field
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, fieldR - 4, 0, Math.PI * 2); ctx.clip();
  const darkField = cfg.field === "#EDFF00" || cfg.field === "#F1F1F1" || cfg.field === "#FF5C00";
  const lineCol = darkField ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.10)";
  ctx.strokeStyle = lineCol;
  ctx.lineWidth = 1.2;
  if (cfg.pattern === "guilloche") {
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      ctx.beginPath();
      for (let t = 0; t <= 1; t += 0.02) {
        const r = 40 + t * (fieldR - 50);
        const w = Math.sin(t * 18 + a * 4) * (12 + t * 40);
        const x = cx + Math.cos(a) * r + Math.cos(a + Math.PI / 2) * w;
        const y = cy + Math.sin(a) * r + Math.sin(a + Math.PI / 2) * w;
        if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  } else if (cfg.pattern === "concentric") {
    for (let r = 30; r < fieldR; r += 14) {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (cfg.pattern === "radial") {
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 36) {
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 30, cy + Math.sin(a) * 30);
      ctx.lineTo(cx + Math.cos(a) * (fieldR - 6), cy + Math.sin(a) * (fieldR - 6));
      ctx.stroke();
    }
  }
  ctx.restore();

  // Outer ring
  ctx.strokeStyle = cfg.ring;
  ctx.lineWidth = ringW;
  ctx.beginPath(); ctx.arc(cx, cy, R - ringW / 2, 0, Math.PI * 2); ctx.stroke();

  // Ring inner + outer hairlines
  ctx.lineWidth = 3;
  ctx.strokeStyle = cfg.ring;
  ctx.beginPath(); ctx.arc(cx, cy, R - ringW, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();

  // Ring tick marks
  ctx.strokeStyle = cfg.ring;
  ctx.lineWidth = 3;
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    const r1 = R - ringW + 6, r2 = R - 6;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
    ctx.stroke();
  }

  // Ring text — "$OOHEX · OOH EARTH · VISUAL COMMONS ·"
  const ringText = "$OOHEX · OOH EARTH · VISUAL COMMONS · ";
  ctx.save();
  ctx.fillStyle = cfg.ring;
  ctx.font = "bold 26px 'Inter Tight', sans-serif";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  const chars = ringText.split("");
  const totalAng = chars.length * 0.072;
  for (let i = 0; i < chars.length; i++) {
    const a = -Math.PI / 2 + i * 0.072 - totalAng / 2;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * (R - ringW / 2), cy + Math.sin(a) * (R - ringW / 2));
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(chars[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();

  // Center glyph
  const glyphCol = darkField ? "#0a0a0a" : "#FFFFFF";
  ctx.fillStyle = glyphCol;
  ctx.font = "900 200px 'Inter Tight', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(cfg.glyph, cx, cy + 8);

  // Glyph underline accent
  ctx.strokeStyle = cfg.ring;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(cx - 90, cy + 110);
  ctx.lineTo(cx + 90, cy + 110);
  ctx.stroke();
}

const TokenIconStudio = forwardRef(({ config }, ref) => {
  const canvasRef = useRef(null);
  const [bg, setBg] = useState("#000000");
  const [field, setField] = useState("#EDFF00");
  const [ring, setRing] = useState("#EDFF00");
  const [glyph, setGlyph] = useState("Ø");
  const [pattern, setPattern] = useState("guilloche");
  const [glow, setGlow] = useState(0.6);
  const [spin, setSpin] = useState(false);
  const spinAng = useRef(0);

  useImperativeHandle(ref, () => ({
    exportPNG: () => {
      const c = canvasRef.current; if (!c) return;
      const a = document.createElement("a");
      a.href = c.toDataURL("image/png");
      a.download = `oohex-token-${(config.serial || "logo").toLowerCase()}.png`;
      a.click();
    },
  }));

  useEffect(() => {
    let raf;
    const render = () => {
      const c = canvasRef.current; if (!c) return;
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, S, S);
      ctx.save();
      if (spin) {
        spinAng.current += 0.004;
        ctx.translate(S / 2, S / 2);
        ctx.rotate(spinAng.current);
        ctx.translate(-S / 2, -S / 2);
      }
      drawMedallion(ctx, { bg, field, ring, glyph, pattern, glow });
      ctx.restore();
      if (spin) raf = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(raf);
  }, [bg, field, ring, glyph, pattern, glow, spin]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative border border-slate2 bg-void p-4">
        <canvas ref={canvasRef} width={S} height={S} className="block w-full max-w-[480px] mx-auto" />
        <div className="absolute left-3 top-3 font-mono text-[9px] uppercase tracking-[0.2em] text-silver/30">
          $OOHEX · token mark
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-slate2 bg-card p-3">
          <div className="font-mono text-[9px] uppercase tracking-widest text-ozone">Field</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {FIELD_COLORS.map((f) => (
              <button key={f.id} onClick={() => setField(f.hex)}
                className={`h-7 w-7 border transition-colors ${field === f.hex ? "border-ozone ring-1 ring-ozone" : "border-slate2/50 hover:border-ozone/40"}`}
                style={{ background: f.hex }} title={f.name} />
            ))}
          </div>
        </div>
        <div className="border border-slate2 bg-card p-3">
          <div className="font-mono text-[9px] uppercase tracking-widest text-ozone">Ring</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {RING_COLORS.map((f) => (
              <button key={f.id} onClick={() => setRing(f.hex)}
                className={`h-7 w-7 border transition-colors ${ring === f.hex ? "border-ozone ring-1 ring-ozone" : "border-slate2/50 hover:border-ozone/40"}`}
                style={{ background: f.hex }} title={f.name} />
            ))}
          </div>
        </div>
        <div className="border border-slate2 bg-card p-3">
          <div className="font-mono text-[9px] uppercase tracking-widest text-ozone">Pattern</div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {PATTERNS.map((p) => (
              <button key={p.id} onClick={() => setPattern(p.id)}
                className={`border px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${pattern === p.id ? "border-ozone bg-ozone/5 text-ozone" : "border-slate2 text-silver/50 hover:border-ozone/40"}`}>
                {p.name}
              </button>
            ))}
          </div>
        </div>
        <div className="border border-slate2 bg-card p-3">
          <div className="font-mono text-[9px] uppercase tracking-widest text-ozone">Glyph</div>
          <input type="text" maxLength={3} value={glyph} onChange={(e) => setGlyph(e.target.value)}
            className="mt-2 w-full border border-slate2 bg-card px-2 py-1.5 text-center font-display text-xl font-bold text-silver outline-none focus:border-ozone" />
        </div>
        <div className="border border-slate2 bg-card p-3">
          <div className="font-mono text-[9px] uppercase tracking-widest text-ozone">Glow · {Math.round(glow * 100)}%</div>
          <input type="range" min={0} max={1} step={0.1} value={glow} onChange={(e) => setGlow(Number(e.target.value))}
            className="mt-2 w-full accent-ozone" />
        </div>
        <div className="border border-slate2 bg-card p-3">
          <div className="font-mono text-[9px] uppercase tracking-widest text-ozone">Background</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SWATCHES.map((s) => (
              <button key={s.id} onClick={() => setBg(s.hex)}
                className={`h-7 w-7 border transition-colors ${bg === s.hex ? "border-ozone ring-1 ring-ozone" : "border-slate2/50 hover:border-ozone/40"}`}
                style={{ background: s.hex }} title={s.name} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setSpin((s) => !s)}
          className={`flex flex-1 items-center justify-center gap-2 border px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${spin ? "border-flare bg-flare/10 text-flare" : "border-slate2 text-silver/60 hover:border-ozone hover:text-ozone"}`}>
          <RotateCw className="h-3.5 w-3.5" /> {spin ? "Stop" : "Spin"}
        </button>
      </div>
    </div>
  );
});

export default TokenIconStudio;