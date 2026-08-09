import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Nav from "@/components/ooh/Nav";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";
import SiteFooter from "@/components/ooh/SiteFooter";

// OOH Earth — Lab · OE-1K/66 "Streetrunner"
// An original Akira-class field-bike concept, built up from flat vector -> blueprint
// -> 3D concept art. One geometry, three treatments. Genre references (inspiration
// only, not reproduced): Katalis x Machine56 EV-1K/56 and the Neo-Tokyo lineage.

const HIVIS = "#EDFF00", FLARE = "#FF5C00";
const W = 1000, H = 560, RCX = 248, RCY = 382, FCX = 766, FCY = 382;
const R_OUT = 118, R_RIM = 74, R_HUB = 44, R_CAP = 13;
const polar = (cx, cy, r, d) => { const a = (d - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
const arc = (cx, cy, r, a0, a1, sw = 1) => {
  const [x0, y0] = polar(cx, cy, r, a0), [x1, y1] = polar(cx, cy, r, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${large} ${sw} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
};
const BODY_D = "M 168 300 Q 162 236 200 224 L 330 214 Q 470 196 604 200 Q 720 204 792 224 Q 812 230 806 258 L 800 268 Q 792 286 762 288 L 690 286 L 690 330 Q 690 352 668 352 L 372 352 Q 350 352 350 330 L 350 300 Q 300 306 250 304 Q 200 302 168 300 Z";

function bikeMarkup(mode, uid) {
  const bp = mode === "blueprint", rn = mode === "render";
  const ID = (s) => `${uid}-${s}`;
  const BODY = rn ? `url(#${ID("bg")})` : bp ? "none" : "#111116";
  const RIM = rn ? `url(#${ID("rg")})` : bp ? "none" : "#1c1d24";
  const TIRE = bp ? "none" : "#0a0a0c", HUB = bp ? "none" : "#0c0c10", SEAT = bp ? "none" : "#0c0c0e";
  const LINE = bp ? HIVIS : "#2b2c34", EDGE = bp ? HIVIS : "#34353d";
  const INK = bp ? HIVIS : "#eaeaee", DIM = bp ? HIVIS : "#7f8087";
  const SW = bp ? 1.4 : 1.0;
  const p = [];
  let defs = "<defs>";
  if (rn) defs += `<linearGradient id="${ID("bg")}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050506"/><stop offset="0.42" stop-color="#2a2b34"/><stop offset="0.62" stop-color="#16171c"/><stop offset="1" stop-color="#050506"/></linearGradient>`
    + `<radialGradient id="${ID("rg")}" cx="0.42" cy="0.38" r="0.75"><stop offset="0" stop-color="#2b2c34"/><stop offset="0.6" stop-color="#141519"/><stop offset="1" stop-color="#070708"/></radialGradient>`
    + `<filter id="${ID("soft")}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="10"/></filter>`;
  defs += "</defs>";
  p.push(defs);
  if (bp) {
    let g = "<g stroke-width=\"1\">";
    for (let x = 0; x < W; x += 28) g += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#0f2a2a"/>`;
    for (let y = 0; y < H; y += 28) g += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#0f2a2a"/>`;
    g += "</g>"; p.push(g);
  }
  const wheel = (cx, cy) => {
    const s = [];
    if (rn) s.push(`<ellipse cx="${cx}" cy="500" rx="104" ry="15" fill="#000" opacity="0.55" filter="url(#${ID("soft")})"/>`);
    s.push(`<circle cx="${cx}" cy="${cy}" r="${R_OUT}" fill="${TIRE}" stroke="${bp ? LINE : "#000"}" stroke-width="${SW}"/>`);
    s.push(`<circle cx="${cx}" cy="${cy}" r="99" fill="none" stroke="${bp ? HIVIS : "#191a20"}" stroke-width="${bp ? SW : 11}" opacity="${bp ? 0.4 : 1}"/>`);
    s.push(`<circle cx="${cx}" cy="${cy}" r="${R_RIM}" fill="${RIM}" stroke="${bp ? LINE : "#000"}" stroke-width="${SW}"/>`);
    s.push(`<circle cx="${cx}" cy="${cy}" r="${R_HUB}" fill="${HUB}" stroke="${bp ? HIVIS : "#26272d"}" stroke-width="${SW}"/>`);
    for (let a = 0; a < 360; a += 30) { const [x1, y1] = polar(cx, cy, 20, a), [x2, y2] = polar(cx, cy, 70, a); s.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${bp ? HIVIS : "#191a20"}" stroke-width="${bp ? 1 : 4}" opacity="${bp ? 0.35 : 1}" stroke-linecap="round"/>`); }
    s.push(`<circle cx="${cx}" cy="${cy}" r="${R_CAP}" fill="${bp ? "none" : "#050506"}" stroke="${bp ? HIVIS : "#2a2b32"}" stroke-width="${SW}"/>`);
    s.push(`<path d="${arc(cx, cy, 85, 150, 272)}" fill="none" stroke="${FLARE}" stroke-width="${bp ? 2 : 6}" stroke-linecap="round"/>`);
    if (rn) s.push(`<path d="${arc(cx, cy - 3, 114, 206, 318)}" fill="none" stroke="${HIVIS}" stroke-width="2" opacity="0.5" stroke-linecap="round"/>`);
    return s.join("");
  };
  p.push(`<line x1="530" y1="336" x2="${RCX + 42}" y2="${RCY}" stroke="${bp ? HIVIS : "#1a1b21"}" stroke-width="${bp ? SW : 17}" opacity="${bp ? 0.6 : 1}" stroke-linecap="round"/>`);
  p.push(`<line x1="476" y1="256" x2="332" y2="356" stroke="${bp ? HIVIS : "#202127"}" stroke-width="${bp ? SW : 9}" opacity="${bp ? 0.6 : 1}" stroke-linecap="round"/>`);
  p.push(wheel(RCX, RCY)); p.push(wheel(FCX, FCY));
  [[-16, "#20212a"], [15, "#17181d"]].forEach(([dx, col]) => { p.push(`<line x1="${FCX + dx - 6}" y1="${FCY - 28}" x2="${FCX + dx + 24}" y2="182" stroke="${bp ? HIVIS : col}" stroke-width="${bp ? SW : 15}" opacity="${bp ? 0.7 : 1}" stroke-linecap="round"/>`); });
  p.push(`<path d="M ${FCX - 98} 302 Q ${FCX} 250 ${FCX + 98} 302 L ${FCX + 94} 326 Q ${FCX} 278 ${FCX - 94} 326 Z" fill="${BODY}" stroke="${LINE}" stroke-width="${SW}"/>`);
  p.push(`<path d="${BODY_D}" fill="${BODY}" stroke="${LINE}" stroke-width="${1.3 * SW}"/>`);
  p.push(`<path d="M 200 224 L 330 214 Q 470 196 604 200 Q 720 204 792 224" fill="none" stroke="${rn ? HIVIS : EDGE}" stroke-width="${rn ? 1.6 : 1.4}" opacity="${rn ? 0.55 : 0.8}"/>`);
  p.push(`<line x1="350" y1="214" x2="350" y2="330" stroke="${LINE}" stroke-width="${SW}"/><line x1="672" y1="240" x2="672" y2="330" stroke="${LINE}" stroke-width="${SW}"/>`);
  p.push(`<rect x="560" y="196" width="10" height="34" rx="3" fill="${FLARE}"/>`);
  p.push(`<path d="M176 296 q-8 -60 8 -74 l14 -2 -6 82 z" fill="${FLARE}"/>`);
  p.push(`<circle cx="188" cy="262" r="13" fill="${bp ? "none" : "#3a0d0d"}" stroke="${FLARE}" stroke-width="3"/><circle cx="188" cy="262" r="5" fill="${FLARE}"/>`);
  if (!bp) p.push(`<path d="M330 214 q4 -26 44 -30 q64 -6 128 -1 q26 3 26 20 l0 11 q-100 -8 -198 0 z" fill="${SEAT}" stroke="#000" stroke-width="1"/>`);
  p.push(`<circle cx="792" cy="252" r="14" fill="${bp ? "none" : "#0d0d10"}" stroke="${bp ? HIVIS : "#3a3b42"}" stroke-width="2"/><circle cx="792" cy="252" r="6" fill="${bp ? "none" : "#cfe3ff"}" stroke="${bp ? HIVIS : "none"}"/>`);
  const FX = 356, FY = 252, FW = 316, FH = 98;
  if (!bp) {
    p.push(`<text x="${FX + 18}" y="${FY + 62}" font-size="58" font-weight="900" fill="${INK}" font-family="sans-serif">奪還</text>`);
    p.push(`<text x="${FX + 20}" y="${FY + 82}" font-size="12" fill="${DIM}" font-family="monospace" letter-spacing="2">ストリート・ランナー</text>`);
    p.push(`<text x="${FX + 20}" y="${FY + 96}" font-size="11" fill="${HIVIS}" font-family="monospace">OE-1K/66 · FIELD OPS</text>`);
    for (let i = 0; i < 6; i++) { const x = FX + FW - 64 + i * 10; p.push(`<line x1="${x}" y1="${FY + FH - 6}" x2="${x + 22}" y2="${FY + FH - 42}" stroke="${i % 2 ? INK : DIM}" stroke-width="5"/>`); }
  }
  if (bp) {
    const call = (x, y, tx, ty, label, anchor = "start") => `<line x1="${x}" y1="${y}" x2="${tx}" y2="${ty}" stroke="${HIVIS}" stroke-width="1" opacity="0.7"/><circle cx="${x}" cy="${y}" r="2.5" fill="${HIVIS}"/><text x="${tx + (anchor === "start" ? 4 : -4)}" y="${ty + 3}" font-size="11" fill="${HIVIS}" font-family="monospace" text-anchor="${anchor}">${label}</text>`;
    p.push(call(760, 120, 850, 96, "EVIDENCE-CAM RIG"));
    p.push(call(792, 220, 900, 196, "USD FORK"));
    p.push(call(766, 382, 900, 392, "HUB MOTOR"));
    p.push(call(430, 300, 430, 470, "6061 ALLOY MONOCOQUE", "middle"));
    p.push(call(510, 340, 560, 470, "SWAPPABLE 52V CELL", "start"));
    p.push(call(188, 262, 90, 300, "TAIL / SIGNAL", "end"));
    p.push(call(430, 190, 300, 110, "OPERATIVE SADDLE", "end"));
    p.push(`<line x1="${RCX}" y1="516" x2="${FCX}" y2="516" stroke="${HIVIS}" stroke-width="1" opacity="0.7"/><line x1="${RCX}" y1="508" x2="${RCX}" y2="524" stroke="${HIVIS}" stroke-width="1"/><line x1="${FCX}" y1="508" x2="${FCX}" y2="524" stroke="${HIVIS}" stroke-width="1"/>`);
    p.push(`<text x="${(RCX + FCX) / 2}" y="512" font-size="10" fill="${HIVIS}" font-family="monospace" text-anchor="middle">WHEELBASE 1130</text>`);
    p.push(`<text x="40" y="40" font-size="26" font-weight="900" fill="${HIVIS}" font-family="sans-serif" letter-spacing="2">OE-1K/66</text>`);
    p.push(`<text x="40" y="60" font-size="11" fill="${HIVIS}" font-family="monospace" letter-spacing="3">// FIELD OPS BLUEPRINT · アキラ級</text>`);
  }
  p.push(`<g stroke="${HIVIS}" stroke-width="1.5" fill="none"><circle cx="322" cy="220" r="9"/><line x1="322" y1="210" x2="322" y2="230"/><line x1="312" y1="220" x2="332" y2="220"/></g>`);
  if (!bp) p.push(`<text x="612" y="236" font-size="12" fill="${DIM}" font-family="monospace" letter-spacing="2">ooh.earth</text>`);
  p.push(`<line x1="702" y1="150" x2="802" y2="178" stroke="${bp ? HIVIS : "#17181d"}" stroke-width="${bp ? SW : 7}" stroke-linecap="round"/>`);
  p.push(`<rect x="744" y="118" width="42" height="30" rx="4" fill="${bp ? "none" : "#17181d"}" stroke="${LINE}" stroke-width="${SW}"/>`);
  p.push(`<circle cx="750" cy="133" r="6" fill="${bp ? "none" : "#0d0d10"}" stroke="${bp ? HIVIS : "#3a3b42"}" stroke-width="2"/><rect x="768" y="124" width="6" height="6" fill="${FLARE}"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="auto">${p.join("")}</svg>`;
}

function Bike({ mode, uid }) {
  return <div className="w-full [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: bikeMarkup(mode, uid) }} />;
}

const STAGES = [
  { key: "vector", n: "01", label: "Vector", cap: "Flat livery pass — silhouette, panel graphics and brand system locked in the Orbital Perspective palette." },
  { key: "blueprint", n: "02", label: "Blueprint", cap: "Technical schematic — components called out, dimensions set, spec-sheet ready." },
  { key: "render", n: "03", label: "3D Concept", cap: "Shaded concept art — volume, rim-light and ground contact. The final concept render." },
];

const SPEC = [
  ["Class", "Field stealth EV"],
  ["Designation", "OE-1K/66 · Streetrunner"],
  ["Motor", "1.5 kW hub · direct drive"],
  ["Battery", "52 V lithium · swappable"],
  ["Top speed", "90 km/h"],
  ["Range", "~80 km"],
  ["Frame / body", "6061 aluminium monocoque · 3 mm"],
  ["Weight", "96 kg"],
  ["Wheelbase", "1130 mm"],
  ["Wheels", "14″ front · 12″ rear"],
  ["Tyres", "80/90 R14"],
  ["Suspension", "USD fork · monoshock"],
  ["Brakes", "Twin disc · regen"],
  ["Livery", "Matte non-reflective · night-ops"],
  ["Rig", "Evidence-cam mount · map uplink"],
  ["Status", "Concept · not for production"],
];

export default function LabStreetRunner() {
  const [i, setI] = useState(0);
  const st = STAGES[i];
  return (
    <div className="min-h-screen bg-void grid-bg text-silver">
      <Nav />
      <div className="mx-auto max-w-6xl page-top px-6 pb-12">
        <Breadcrumbs items={[{ label: "Lab", to: "/lab" }, { label: "Streetrunner" }]} className="mb-4" />
        <header className="flex flex-wrap items-baseline gap-x-4 gap-y-2 border-b border-slate2 pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-[0.14em]">OE-1K/66 <span className="text-ozone">Streetrunner</span></h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-silver/50">Akira-class field bike · concept</p>
          <div className="ml-auto flex items-center gap-4 font-mono text-xs uppercase tracking-[0.1em]">
            <Link to="/lab" className="text-ozone transition-colors hover:text-ozone/70">← Lab</Link>
            <span className="border border-flare/40 px-2 py-0.5 text-flare">Concept · WIP</span>
          </div>
        </header>

        <p className="mt-6 max-w-3xl font-mono text-xs leading-loose text-silver/60">
          The field rider&rsquo;s bike. Silent, matte, camera-rigged — built for night runs when the billboards come down and the
          walls talk back. An original OOH Earth concept in the Neo-Tokyo lineage, developed in the Lab the way any good machine is:
          flat vector first, then blueprint, then the 3D concept render. <span className="text-silver/40">Genre references (inspiration only): Katalis × Machine56 EV-1K/56 · Akira.</span>
        </p>

        {/* build-up stepper */}
        <section className="mt-6 border border-slate2 bg-card/40">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate2 px-4 py-3">
            <div className="flex items-center gap-2">
              {STAGES.map((s, idx) => (
                <button
                  key={s.key}
                  onClick={() => setI(idx)}
                  className={`flex items-center gap-2 border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] transition-colors ${idx === i ? "border-ozone bg-ozone/10 text-ozone" : "border-slate2 text-silver/50 hover:border-ozone/50 hover:text-silver"}`}
                >
                  <span className={idx === i ? "text-ozone" : "text-dim"}>{s.n}</span> {s.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setI((i - 1 + STAGES.length) % STAGES.length)} aria-label="Previous stage" className="flex h-8 w-8 items-center justify-center border border-slate2 text-silver/60 transition-colors hover:border-ozone hover:text-ozone"><ArrowLeft className="h-4 w-4" /></button>
              <button onClick={() => setI((i + 1) % STAGES.length)} aria-label="Next stage" className="flex h-8 w-8 items-center justify-center border border-slate2 text-silver/60 transition-colors hover:border-ozone hover:text-ozone"><ArrowRight className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="bg-void p-3 sm:p-6">
            <Bike mode={st.key} uid={`sr-${st.key}`} />
          </div>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-slate2 px-4 py-3">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-ozone">Stage {st.n} · {st.label}</span>
            <span className="font-mono text-[11px] text-silver/55">{st.cap}</span>
          </div>
        </section>

        {/* spec sheet */}
        <section className="mt-8">
          <div className="flex items-baseline gap-3 border-b border-slate2 pb-2">
            <h2 className="text-base font-bold uppercase tracking-[0.14em]">Spec sheet</h2>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-silver/45">OE-1K/66 · concept figures</span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-0 sm:grid-cols-2">
            {SPEC.map(([k, v], idx) => (
              <div key={k} className={`flex items-baseline justify-between gap-4 border-b border-slate2/50 py-2.5 ${idx === SPEC.length - 1 && SPEC.length % 2 ? "sm:col-span-2" : ""}`}>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ozone">{k}</span>
                <span className="text-right font-mono text-[12px] text-silver/80">{v}</span>
              </div>
            ))}
          </div>
        </section>

        {/* process / credits */}
        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            ["01 · Vector", "Flat side-profile in the house palette — hi-vis + flare on matte black, panel graphics, brandmark and katakana livery."],
            ["02 · Blueprint", "The same geometry stripped to hi-vis wireframe on a survey grid, with component callouts and a wheelbase datum."],
            ["03 · Concept", "Gradient volume, rim-light and a ground shadow bring it up to a 3D concept render — the piece for the deck."],
          ].map(([t, d]) => (
            <div key={t} className="border border-slate2 bg-card/40 p-4">
              <div className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-ozone">{t}</div>
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-silver/55">{d}</p>
            </div>
          ))}
        </section>

        {/* roadmap — set up for further design work */}
        <section className="mt-8">
          <div className="flex items-baseline gap-3 border-b border-slate2 pb-2">
            <h2 className="text-base font-bold uppercase tracking-[0.14em]">Roadmap</h2>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-silver/45">design pipeline · next passes</span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              ["04 · Hero render", "3/4 view — the money shot for the deck and the hub tile."],
              ["05 · Livery variants", "Stealth black vs a hi-vis ‘adbuster’ colourway; field-tier keying."],
              ["06 · Exploded view", "Frame, cell, hub motor and body panels pulled apart, callout-labelled."],
              ["07 · Poster / one-pager", "Spec poster for print and the fundraising deck."],
            ].map(([t, d]) => (
              <div key={t} className="flex items-start gap-3 border border-dashed border-slate2 bg-void/40 p-4">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-flare/70" />
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-silver/80">{t}</div>
                  <p className="mt-1 font-mono text-[11px] leading-relaxed text-silver/45">{d}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-silver/35">// planned · design thinking continues here</p>
        </section>

        <div className="mt-8 border-t border-slate2 pt-4 font-mono text-[10px] uppercase tracking-widest text-silver/40">
          OOH Earth Lab · OE-1K/66 Streetrunner · original concept · vector → blueprint → 3D · not for production
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
