import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw, Volume2, VolumeX } from "lucide-react";
import Nav from "@/components/ooh/Nav";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";
import SiteFooter from "@/components/ooh/SiteFooter";
import { KW, fromLines } from "@/lib/hexagrams";

// OOH Earth — I Ching Sequencer (Lab)
// 64-step sequencer across three orderings, on the OOH design system.
// Two-column layout (lanes + readout | field + mechanics) so the whole
// state space reads at once. Driven by hexagrams.js. Lane colours mapped to
// the OOH palette: ozone / cyan / brand-green.

const LANE = [
  { name: "KING WEN", sub: "received sequence · H1 → H64", color: "#EDFF00" },
  { name: "FUXI", sub: "binary · yang enters from the top", color: "#6fd6ff" },
  { name: "OOH PROTOCOL", sub: "address walk · Ring 1 = LSB", color: "#39FF14" },
];
const FREQS = [110, 130.81, 146.83, 164.81, 196, 220];

// Hexagram drawn as six stacked lines (yang = solid bar, yin = split bar).
function HexGlyph({ lines, color, big }) {
  const barH = big ? "h-2" : "h-[3px]";
  const w = big ? "w-16" : "w-[22px]";
  return (
    <div className={`flex shrink-0 flex-col ${big ? "gap-1" : "gap-[3px]"} ${w}`}>
      {lines.slice().reverse().map((v, i) => (
        v ? (
          <span key={i} className={`${barH} w-full`} style={{ background: color }} />
        ) : (
          <span key={i} className={`flex ${barH} ${big ? "gap-1.5" : "gap-1"}`}>
            <span className="flex-1" style={{ background: color }} />
            <span className="flex-1" style={{ background: color }} />
          </span>
        )
      ))}
    </div>
  );
}

export default function HexSequencer() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [sound, setSound] = useState(false);
  const [wave, setWave] = useState("sine");

  const kwLines = useMemo(() => {
    const m = {};
    Object.entries(KW).forEach(([k, kw]) => { const [lo, up] = k.split("|"); m[kw] = (lo + up).split("").map(Number); });
    return m;
  }, []);
  const fuxi = useMemo(() => Array.from({ length: 64 }, (_, i) => i.toString(2).padStart(6, "0").split("").map(Number)), []);
  const laneLines = useMemo(() => [
    (i) => kwLines[i + 1],
    (i) => fuxi[i],
    (i) => [0, 1, 2, 3, 4, 5].map((b) => (i >> b) & 1),
  ], [kwLines, fuxi]);

  const acRef = useRef(null);
  const soundRef = useRef(false);
  const waveRef = useRef("sine");
  useEffect(() => { soundRef.current = sound; }, [sound]);
  useEffect(() => { waveRef.current = wave; }, [wave]);
  const playTone = useCallback((lines) => {
    if (!soundRef.current || !lines) return;
    if (!acRef.current) acRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const ac = acRef.current, t = ac.currentTime;
    lines.forEach((v, i) => {
      if (!v) return;
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = waveRef.current;
      o.frequency.value = FREQS[i] * 2;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.08, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g); g.connect(ac.destination);
      o.start(t); o.stop(t + 0.4);
    });
  }, []);

  const stepRef = useRef(0);
  useEffect(() => { stepRef.current = step; }, [step]);
  const advance = useCallback((d) => {
    const ns = (stepRef.current + d + 64) % 64;
    stepRef.current = ns;
    setStep(ns);
    playTone(kwLines[ns + 1]);
  }, [kwLines, playTone]);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => advance(1), 60000 / bpm);
    return () => clearInterval(id);
  }, [playing, bpm, advance]);
  const reset = () => { setPlaying(false); setStep(0); stepRef.current = 0; };

  const lanes = LANE.map((d, li) => {
    const lines = laneLines[li](step);
    const h = fromLines(lines);
    const ahead = Array.from({ length: 8 }, (_, k) => laneLines[li]((step + k + 1) % 64));
    return { ...d, lines, h, ahead };
  });
  const marks = lanes.map((l) => l.lines.slice().reverse().join(""));
  const cells = fuxi.map((lines, i) => {
    const h = fromLines(lines);
    const li = marks.indexOf(lines.slice().reverse().join(""));
    return { char: h.char, title: `H${h.kw} ${h.pinyin} · ${h.english}`, li, i, lines };
  });
  const proto = fromLines(laneLines[2](step));

  const crumbLink = "font-mono text-[10px] uppercase tracking-[0.2em] text-silver/40 transition-colors hover:text-ozone";

  return (
    <div className="min-h-screen bg-void grid-bg text-silver">
      <Nav />
      <div className="mx-auto max-w-6xl page-top px-6 pb-12">
        <Breadcrumbs items={[{ label: "Lab", to: "/lab" }, { label: "I Ching Sequencer" }]} className="mb-4" />
        <header className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-slate2 pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-[0.14em]">I Ching <span className="text-ozone">Sequencer</span></h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-silver/50">Hexagram player · 3 sequences · 64 steps</p>
          <div className="ml-auto flex items-center gap-4">
            <Link to="/lab/simulator" className={crumbLink}>Simulator</Link>
            <Link to="/lab/poster" className={crumbLink}>Poster</Link>
            <Link to="/lab" className={crumbLink}>Hub</Link>
            <span className="border border-flare/40 px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-flare">Working copy</span>
          </div>
        </header>

        {/* TRANSPORT */}
        <div className="mt-6 flex flex-wrap items-center gap-3 border border-slate2 bg-card p-3">
          <button onClick={() => setPlaying((p) => !p)} className="flex items-center gap-2 border-2 border-ozone bg-ozone px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:bg-flare hover:border-flare">
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}{playing ? "Pause" : "Play"}
          </button>
          <button onClick={() => advance(-1)} aria-label="Step back" className="border border-slate2 p-2 text-silver hover:border-ozone hover:text-ozone"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => advance(1)} aria-label="Step forward" className="border border-slate2 p-2 text-silver hover:border-ozone hover:text-ozone"><ChevronRight className="h-4 w-4" /></button>
          <button onClick={reset} aria-label="Reset" className="border border-slate2 p-2 text-silver hover:border-ozone hover:text-ozone"><RotateCcw className="h-4 w-4" /></button>
          <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-silver/50">
            {bpm} BPM
            <input type="range" min={40} max={480} value={bpm} onChange={(e) => setBpm(+e.target.value)} className="w-28 accent-ozone" />
          </label>
          <button onClick={() => setSound((s) => !s)} className={`flex items-center gap-2 border px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${sound ? "border-brand-green text-brand-green" : "border-slate2 text-silver/50"}`}>
            {sound ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}{sound ? "Sound on" : "Sound off"}
          </button>
          {sound && (
            <select value={wave} onChange={(e) => setWave(e.target.value)} className="border border-slate2 bg-void px-2 py-1.5 font-mono text-[10px] uppercase text-silver">
              {["sine", "triangle", "square"].map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          )}
          <span className="ml-auto font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">Step {step + 1} / 64</span>
        </div>

        {/* TWO-COLUMN: lanes + readout | field + mechanics */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* LEFT — lanes + protocol readout */}
          <div className="space-y-6">
            {lanes.map((l) => (
              <section key={l.name} className="border border-slate2 bg-card p-4">
                <div className="flex items-center gap-4">
                  <div className="w-28 shrink-0">
                    <div className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: l.color }}>{l.name}</div>
                    <div className="mt-1 font-mono text-[9px] uppercase leading-snug tracking-wide text-silver/40">{l.sub}</div>
                  </div>
                  <HexGlyph lines={l.lines} color={l.color} big />
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[11px] text-silver"><span className="mr-1 text-base align-middle" style={{ color: l.color }}>{l.h.char}</span>H{l.h.kw} · {l.h.pinyin}</div>
                    <div className="truncate text-sm font-bold">{l.h.english}</div>
                    <div className="font-mono text-[10px] text-silver/40">{l.h.binary} · {l.h.hex}</div>
                  </div>
                  <div className="hidden items-start gap-2 xl:flex">
                    {l.ahead.map((ln, i) => <HexGlyph key={i} lines={ln} color={`${l.color}55`} />)}
                  </div>
                </div>
              </section>
            ))}

            <div className="border border-brand-green/40 bg-card p-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand-green">OOH Earth protocol readout · protocol lane</div>
              <div className="mt-3 font-mono text-lg">
                <span className="font-bold text-silver">{proto.lower.verb}</span>
                <span className="text-silver/40"> × </span>
                <span className="font-bold" style={{ color: "#6fd6ff" }}>{proto.upper.layer.toUpperCase()}</span>
                <span className="text-silver/40"> · OP {proto.hex}</span>
              </div>
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-silver/50">
                {proto.lower.verbDesc} — each step is one address in the 64-op space; the sequencer is the network breathing through all of them.
              </p>
            </div>
          </div>

          {/* RIGHT — Fuxi field + mechanics */}
          <div className="space-y-6">
            <div className="border border-slate2 bg-card p-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">Fuxi field · 8 × 8</div>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-wide text-silver/40">All 64 hexagrams in binary order · lit = current step per lane</div>
              <div className="mt-4 grid grid-cols-8 gap-1.5">
                {cells.map((c) => {
                  const color = c.li >= 0 ? LANE[c.li].color : null;
                  return (
                    <button key={c.i} onClick={() => setStep(c.i)} title={c.title}
                      className="flex aspect-square items-center justify-center border p-1.5 transition-colors"
                      style={{ borderColor: color || "#1a2334", background: color ? `${color}1f` : "#0d1220" }}>
                      <HexGlyph lines={c.lines} color={color || "#3a4c74"} />
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[9px] uppercase tracking-wide">
                {LANE.map((d) => (
                  <span key={d.name} className="flex items-center gap-1.5 text-silver/50"><span className="h-2 w-2" style={{ background: d.color }} /> {d.name}</span>
                ))}
                <span className="ml-auto text-silver/30">Click a cell to jump</span>
              </div>
            </div>

            <div className="border border-slate2 bg-card p-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">Mechanics</div>
              <p className="mt-3 font-mono text-[11px] leading-relaxed text-silver/60">
                One master step (0–63) drives three concurrent orderings of the same 64 hexagrams: the received <span className="text-ozone">King Wen</span> sequence, the <span style={{ color: "#6fd6ff" }}>Fuxi</span> binary sequence (yang enters from the top), and the <span className="text-brand-green">OOH protocol</span> address walk (Ring 1 = LSB). A time-lapse of the whole state space. With sound on, each yang line voices one of six tones — the hexagram is the chord.
              </p>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
