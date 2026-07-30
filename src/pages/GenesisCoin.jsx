import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Nav from "@/components/ooh/Nav";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";
import SiteFooter from "@/components/ooh/SiteFooter";

// OOH Earth — Genesis Coin (Hex Engine Lab)
// Built on the OOH Earth design system: void base + grid, ozone accent,
// Inter Tight display / IBM Plex Mono data, sharp corners. The brass coin
// artifact keeps its own material rendering (it's a brass object).

const TRIGRAM_TICKS = ["☲", "☷", "☱", "☰", "☵", "☴", "☶", "☳"];
const EDITIONS = ["FOUNDING EDITION", "CITY EDITION", "ARTIST PROOF"];
const TOKENOMICS = [
  ["Supply", "6,400 physical · 1:1 onchain twin"],
  ["Editions", "64 series × 100 (one per hexagram)"],
  ["Chain", "Base · ERC-721 + NFC claim"],
  ["Claim", "Tap coin → sign → twin binds to wallet"],
  ["Material", "CNC brass, PVD antique finish"],
  ["Utility", "DAO weight ×1 · event proof-of-presence"],
];

// Deterministic pseudo-city network (LCG), ported verbatim from the handoff.
function seededNetwork(num) {
  const rand = (seed) => { let x = seed; return () => (x = (x * 16807) % 2147483647) / 2147483647; };
  const r = rand(num + 7);
  const nodes = Array.from({ length: 22 }, () => {
    const a = r() * Math.PI * 2, d = 12 + r() * 30;
    return { x: Math.round(50 + d * Math.cos(a)), y: Math.round(50 + d * Math.sin(a)), s: r() > 0.75 ? 9 : 6 };
  });
  const edges = [];
  for (let i = 0; i < nodes.length; i++) {
    const j = (i + 1 + Math.floor(r() * 4)) % nodes.length;
    const dx = (nodes[j].x - nodes[i].x) * 3.4, dy = (nodes[j].y - nodes[i].y) * 3.4;
    const len = Math.round(Math.sqrt(dx * dx + dy * dy));
    if (len < 20 || len > 150) continue;
    edges.push({ x: nodes[i].x, y: nodes[i].y, len, ang: Math.round((Math.atan2(dy, dx) * 180) / Math.PI) });
  }
  return { nodes, edges };
}

// Brass material — intrinsic to the artifact, kept as inline style.
const BRASS_OBV = "radial-gradient(circle at 38% 30%, #e0c184, #a5824a 45%, #6e5530 78%, #8f6f3d)";
const BRASS_REV = "radial-gradient(circle at 62% 30%, #d8b876, #9c7a42 48%, #6e5530 80%, #8f6f3d)";
const BRASS_INNER = "radial-gradient(circle at 40% 32%, #c9a860, #93733f 60%, #6e5530)";
const COIN_SHADOW = "inset 0 3px 6px rgba(255,255,255,.4), inset 0 -6px 12px rgba(0,0,0,.55), 0 18px 44px rgba(0,0,0,.6)";
const REEDING = "repeating-conic-gradient(rgba(0,0,0,.14) 0deg .8deg, transparent .8deg 5.625deg)";

function SectionLabel({ children }) {
  return <div className="font-mono text-xs uppercase tracking-[0.22em] text-ozone">{children}</div>;
}

export default function GenesisCoin() {
  const [genesisNumber, setGenesisNumber] = useState(45);
  const [editionLabel, setEditionLabel] = useState("FOUNDING EDITION");
  const num = Math.min(6400, Math.max(1, Number(genesisNumber) || 1));
  const { nodes, edges } = useMemo(() => seededNetwork(num), [num]);
  const numLabel = String(num).padStart(4, "0");

  return (
    <div className="min-h-screen bg-void grid-bg text-silver">
      <Nav />
      <div className="mx-auto max-w-6xl page-top px-6 pb-12">
        <Breadcrumbs items={[{ label: "Lab", to: "/lab" }, { label: "Genesis Coin" }]} className="mb-4" />
        <header className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-slate2 pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-[0.14em]">Genesis <span className="text-ozone">Coin</span></h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-silver/50">Cultural artifact · Founding edition · 64mm Ø</p>
          <div className="ml-auto flex items-center gap-4 font-mono text-xs uppercase tracking-[0.1em]">
            <Link to="/lab" className="text-ozone transition-colors hover:text-ozone/70">← Lab</Link>
            <span className="border border-flare/40 px-2 py-0.5 text-flare">Working copy</span>
          </div>
        </header>

        <div className="mt-5 flex flex-wrap items-center gap-5 font-mono text-[11px] uppercase tracking-[0.14em] text-silver/50">
          <label className="flex items-center gap-2">
            Genesis №
            <input type="number" min={1} max={6400} value={genesisNumber} onChange={(e) => setGenesisNumber(e.target.value)}
              className="w-24 border border-slate2 bg-card px-2 py-1.5 font-mono text-xs tracking-normal text-silver outline-none focus:border-ozone" />
          </label>
          <label className="flex items-center gap-2">
            Edition
            <select value={editionLabel} onChange={(e) => setEditionLabel(e.target.value)}
              className="border border-slate2 bg-card px-2 py-1.5 font-mono text-xs tracking-normal text-silver outline-none focus:border-ozone">
              {EDITIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
        </div>

        <main className="mt-8 flex flex-wrap justify-center gap-10">
          {/* OBVERSE */}
          <section className="flex flex-col items-center gap-4">
            <SectionLabel>Obverse · Identity</SectionLabel>
            <div className="relative h-[340px] w-[340px] rounded-full" style={{ background: BRASS_OBV, boxShadow: COIN_SHADOW }}>
              <div className="absolute inset-0 rounded-full" style={{ background: REEDING }} />
              {TRIGRAM_TICKS.map((sym, i) => (
                <div key={i} className="absolute left-1/2 top-1/2 h-4 w-4 text-center text-xs leading-4 text-[#4a3a1e]"
                  style={{ margin: -8, transform: `rotate(${i * 45}deg) translateY(-146px) rotate(${-i * 45}deg)` }}>{sym}</div>
              ))}
              <div className="absolute inset-11 flex flex-col items-center justify-center gap-1 rounded-full border-2 border-[#6e5530]"
                style={{ background: BRASS_INNER, boxShadow: "inset 0 2px 5px rgba(255,255,255,.3), inset 0 -4px 8px rgba(0,0,0,.5)" }}>
                <div className="relative h-[54px] w-[54px] rounded-full border-[2.5px] border-[#4a3a1e]">
                  <div className="absolute left-1/2 top-0 bottom-0 -ml-px w-[2.5px] bg-[#4a3a1e]" />
                  <div className="absolute top-1/2 left-0 right-0 -mt-px h-[2.5px] bg-[#4a3a1e]" />
                  <div className="absolute inset-1.5 rounded-full border-[1.5px] border-[#4a3a1e]" />
                </div>
                <div className="mt-1.5 text-3xl font-bold tracking-[0.2em] text-[#3d2f16]">OOH</div>
                <div className="ml-[0.5em] text-[13px] font-semibold tracking-[0.5em] text-[#4a3a1e]">EARTH</div>
                <div className="mt-2 font-mono text-[10px] tracking-[0.14em] text-[#4a3a1e]">GENESIS · {editionLabel}</div>
                <div className="font-mono text-[11px] tracking-[0.1em] text-[#3d2f16]">№ {numLabel}</div>
              </div>
            </div>
            <p className="max-w-[320px] text-center font-mono text-[11px] leading-relaxed text-silver/50">64-state protocol ring (one detent per hexagram) · Ba Gua cardinal marks · engraved genesis number</p>
          </section>

          {/* REVERSE */}
          <section className="flex flex-col items-center gap-4">
            <SectionLabel>Reverse · The city as network</SectionLabel>
            <div className="relative h-[340px] w-[340px] overflow-hidden rounded-full" style={{ background: BRASS_REV, boxShadow: COIN_SHADOW }}>
              <div className="absolute inset-0 rounded-full" style={{ background: REEDING }} />
              {edges.map((e, i) => (
                <div key={"e" + i} className="absolute h-0.5 bg-[#4a3a1e]"
                  style={{ left: `${e.x}%`, top: `${e.y}%`, width: e.len, transform: `rotate(${e.ang}deg)`, transformOrigin: "0 50%", opacity: 0.75, boxShadow: "0 1px 0 rgba(255,255,255,.18)" }} />
              ))}
              {nodes.map((n, i) => (
                <div key={"n" + i} className="absolute rounded-full bg-[#3d2f16]"
                  style={{ left: `${n.x}%`, top: `${n.y}%`, width: n.s, height: n.s, margin: -3, boxShadow: "inset 0 1px 2px rgba(0,0,0,.8), 0 1px 0 rgba(255,255,255,.25)" }} />
              ))}
              <div className="absolute inset-0 flex items-end justify-center pb-[34px]">
                <div className="font-mono text-[11px] tracking-[0.3em] text-[#3d2f16]">NO BORDERS · ONLY NETWORKS</div>
              </div>
            </div>
            <p className="max-w-[320px] text-center font-mono text-[11px] leading-relaxed text-silver/50">The city engraved as nodes &amp; connections — infrastructure, movement, creativity — not political borders</p>
          </section>

          {/* EDGE + TOKENOMICS */}
          <section className="min-w-[300px] max-w-[420px] flex-1 basis-[320px]">
            <SectionLabel>Edge · Protocol verbs</SectionLabel>
            <div className="mt-3 overflow-hidden border border-[#6e5530]" style={{ boxShadow: "0 10px 30px rgba(0,0,0,.5)" }}>
              <div className="relative flex justify-center py-3.5" style={{ background: "linear-gradient(180deg, #dcbb7c, #a5824a 40%, #6e5530 60%, #c3a05e)" }}>
                <div className="absolute inset-0" style={{ background: "repeating-linear-gradient(90deg, rgba(0,0,0,.18) 0 2px, transparent 2px 7px)" }} />
                <div className="relative font-mono text-[13px] tracking-[0.42em] text-[#3d2f16]">MOVE · MAP · DISCOVER · CREATE</div>
              </div>
              <div className="relative flex justify-center py-3.5" style={{ background: "linear-gradient(180deg, #c3a05e, #6e5530 40%, #a5824a 60%, #dcbb7c)" }}>
                <div className="absolute inset-0" style={{ background: "repeating-linear-gradient(90deg, rgba(0,0,0,.18) 0 2px, transparent 2px 7px)" }} />
                <div className="relative font-mono text-[13px] tracking-[0.42em] text-[#3d2f16]">BUILD · VERIFY · SIGN · CONNECT</div>
              </div>
            </div>
            <p className="mb-6 mt-2.5 font-mono text-[11px] leading-relaxed text-silver/50">Laser-engraved reeded edge, 8 verbs × 8 repetitions = 64 engravings. Each coin's edge sequence starts at its genesis hexagram.</p>

            <SectionLabel>Artifact + token</SectionLabel>
            <div className="mt-3 border border-slate2 bg-card px-4 py-4 font-mono text-xs text-silver/60">
              {TOKENOMICS.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 py-1"><span className="uppercase tracking-wider">{k}</span><span className="text-right text-silver">{v}</span></div>
              ))}
            </div>
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-silver/40">Not primarily a currency. An artifact of participation — the meme coin you can hold.</p>
          </section>
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
