import { Link } from "react-router-dom";
import Nav from "@/components/ooh/Nav";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";
import SiteFooter from "@/components/ooh/SiteFooter";

// OOH Earth — Lab Engineering Status Report
// A living engineering log for the Hex Engine Lab, linked into the sitemap.

const REGISTER = [
  ["Hex Engine Lab", "/lab", "Staged · main", "green"],
  ["Genesis Coin", "/lab/coin", "Staged · main", "green"],
  ["Hex Engine Simulator", "/lab/simulator", "Staged · main", "green"],
  ["I Ching Sequencer", "/lab/sequencer", "Staged · main", "green"],
  ["Companion App", "/lab/companion", "Staged · main", "green"],
  ["Engineering Spec", "/lab/spec", "Staged · main", "green"],
  ["Concept Poster", "/lab/poster", "Staged · main · art pending", "amber"],
  ["3D Device", "/lab/device", "Staged · main", "green"],
  ["Living Coin (spec)", "/lab/livingcoin", "Staged · main", "green"],
  ["Status Report", "/lab/status", "Staged · main · this doc", "green"],
];
const DEVICE_LOG = [
  ["A", "Sphere-engine — 6 equatorial rings, glowing core", "superseded"],
  ["B", "Coin-cube — textured medallion discs", "superseded"],
  ["C", "Technical line-geometry — faces flush to surface", "superseded"],
  ["D", "Spherified body — nested spinners, orthogonal rings", "superseded"],
  ["E", "Detented rotary dials — sequencer-driven hexagram program, per-hexagram chord, cyberpunk shell", "current"],
];
const PIPELINE = [
  ["BACKUP", "6a67…1871 — staging; all 10 Lab pieces build clean here"],
  ["main", "6a62…4ff5 — full Lab promoted & staged (routes, agency-gated menu)"],
  ["LIVE", "publish from main → /lab, agency-only. Founder action."],
];
const ROADMAP = [
  ["Heaven flip", "Earlier ⇄ Later Heaven Ba Gua as a live re-index"],
  ["Valve / merge", "faces open-close or conflate to fewer distinctions"],
  ["Orthogonal circles", "drilled-cube three-axis hexagram rings"],
  ["Photoreal pass", "real face crops as textures on the solid mode"],
  ["Brass env-map", "reflective PBR for the shaded view"],
  ["Poster art", "13 concept webp → media → fill Poster slots"],
];
const OPEN = [
  "Publish main to take the staged Lab live (Founder).",
  "Measure the physical coin (Ø, weight) to lock the spec numbers.",
  "Upload the concept-art webp set and wire the Poster ASSET_BASE.",
  "Build the Earlier ⇄ Later Heaven flip as the first roadmap mechanic.",
];

const dot = (c) => (c === "green" ? "bg-brand-green" : "bg-flare");

function Section({ n, title, children }) {
  return (
    <section className="mt-8">
      <div className="flex items-baseline gap-3 border-b border-slate2 pb-2"><span className="font-mono text-[11px] text-silver/40">{n}</span><h2 className="text-base font-bold uppercase tracking-[0.14em]">{title}</h2></div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function LabStatus() {
  return (
    <div className="min-h-screen bg-void grid-bg text-silver">
      <Nav />
      <div className="mx-auto max-w-4xl page-top px-6 pb-12">
        <Breadcrumbs items={[{ label: "Lab", to: "/lab" }, { label: "Status Report" }]} className="mb-4" />
        <header className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-slate2 pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-[0.14em]">Engineering <span className="text-ozone">Status</span></h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-silver/50">Hex Engine Lab · report 001 · 2026-07-31</p>
          <span className="ml-auto border border-flare/40 px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-flare">Working copy</span>
        </header>

        <Section n="00" title="Summary">
          <p className="font-mono text-xs leading-loose text-silver/60">
            The Hex Engine Lab is a ten-piece prototype suite for the tangible I Ching controller, Genesis Coin and Living Coin — the physical layer of the oohearth.app ecosystem. The full suite is built, proven, and staged on <span className="text-silver">main</span> behind agency auth, awaiting publish. Active development continues on <span className="text-silver">BACKUP</span> (the interactive 3D device and its mechanics roadmap). Everything builds clean. Grounded in the science of the 64-hexagram torus (Judge, 2021).
          </p>
        </Section>

        <Section n="01" title="Build register">
          <div className="overflow-x-auto border border-slate2">
            <table className="w-full border-collapse font-mono text-[11px]">
              <thead><tr className="border-b border-slate2 text-left">{["Piece", "Route", "State"].map((h) => <th key={h} className="px-3 py-2 font-normal uppercase tracking-widest text-ozone">{h}</th>)}</tr></thead>
              <tbody>
                {REGISTER.map(([name, route, state, c]) => (
                  <tr key={route} className="border-b border-slate2/50 last:border-0">
                    <td className="px-3 py-2 text-silver"><Link to={route} className="hover:text-ozone">{name}</Link></td>
                    <td className="px-3 py-2 text-silver/50">{route}</td>
                    <td className="px-3 py-2"><span className="inline-flex items-center gap-2 text-silver/70"><span className={`h-2 w-2 ${dot(c)}`} />{state}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section n="02" title="3D device — revision log">
          <div className="space-y-2 font-mono text-[11px]">
            {DEVICE_LOG.map(([rev, desc, tag]) => (
              <div key={rev} className="flex gap-3 border-b border-slate2/40 pb-1.5">
                <span className={tag === "current" ? "text-ozone" : "text-silver/40"}>REV {rev}</span>
                <span className="flex-1 text-silver/70">{desc}</span>
                <span className={tag === "current" ? "text-brand-green" : "text-silver/30"}>{tag}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section n="03" title="Pipeline">
          <div className="space-y-2 font-mono text-[11px]">
            {PIPELINE.map(([k, v]) => <div key={k} className="flex gap-3"><span className="w-16 shrink-0 text-ozone">{k}</span><span className="text-silver/60">{v}</span></div>)}
          </div>
          <p className="mt-3 font-mono text-[10px] text-silver/40">Rule: prove on BACKUP → promote to main → Founder publishes. main + BACKUP kept structurally in sync.</p>
        </Section>

        <Section n="04" title="Roadmap">
          <div className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
            {ROADMAP.map(([k, v]) => <div key={k} className="border-b border-slate2/40 pb-1.5 font-mono text-[11px]"><span className="text-ozone">{k}</span> <span className="text-silver/50">— {v}</span></div>)}
          </div>
        </Section>

        <Section n="05" title="Open items">
          <ul className="space-y-2 font-mono text-[11px] leading-relaxed text-silver/60">
            {OPEN.map((o, i) => <li key={i} className="flex gap-2"><span className="text-flare">▸</span> {o}</li>)}
          </ul>
        </Section>

        <div className="mt-10 border-t border-slate2 pt-4 font-mono text-[10px] uppercase tracking-widest text-silver/40">
          OOH Earth Lab · Engineering · logged to sitemap under Lab · <a href="https://www.laetusinpraesens.org/docs20s/chinouro.php" target="_blank" rel="noreferrer" className="underline hover:text-ozone">science ref</a>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
