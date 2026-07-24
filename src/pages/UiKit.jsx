import { useEffect, useState } from "react";
import Nav from "@/components/ooh/Nav";
import BrandMark from "@/components/ooh/BrandMark";
import CopyField from "@/components/ooh/uikit/CopyField";
import BrandPalette from "@/components/ooh/uikit/BrandPalette";
import TypeScale from "@/components/ooh/uikit/TypeScale";
import ComponentShowcase from "@/components/ooh/uikit/ComponentShowcase";
import PinLab from "@/components/ooh/uikit/pinlab/PinLab";
import NomadPulse from "@/components/ooh/NomadPulse";
import { Radio } from "lucide-react";

const NAV = [
  { id: "identity", label: "Identity", idx: "00" },
  { id: "palette", label: "Signal palette", idx: "01" },
  { id: "type", label: "Comms type", idx: "02" },
  { id: "components", label: "Field modules", idx: "03" },
  { id: "pins", label: "Pin system", idx: "04" },
  { id: "foundation", label: "System specs", idx: "05" },
  { id: "modes", label: "Operational modes", idx: "06" },
];

const STATS = [
  { k: "Core tokens", v: "07", s: "active" },
  { k: "Type styles", v: "07", s: "active" },
  { k: "Themes", v: "03", s: "online" },
  { k: "Radius", v: "0px", s: "locked" },
];

const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800;900&family=Lacquer&display=swap');";

const FOUNDATION = [
  { label: "Radius", value: "0px", note: "sharp · no rounding" },
  { label: "Body line-height", value: "1.6", note: "scannable" },
  { label: "Body letter-spacing", value: "-0.005em", note: "tight" },
  { label: "Shadow · ozone-glow", value: "0 0 24px rgba(237,255,0,0.22)" },
  { label: "Shadow · flare-glow", value: "0 0 24px rgba(255,92,0,0.28)" },
  { label: "Selection", value: "background #EDFF00 / color #000000" },
];

const THEMES = [
  { mode: "Dark · Default", bg: "#000000", fg: "#F1F1F1", ozone: "#EDFF00", flare: "#FF5C00" },
  { mode: "Light · Solar Smoke", bg: "#F5F5F5", fg: "#0D0D0D", ozone: "#E84A00", flare: "#FF5C00" },
  { mode: "Matrix · Terminal", bg: "#040C04", fg: "#1AFF3F", ozone: "#00FF55", flare: "#FF00C8" },
];

function Panel({ id, idx, title, status, children }) {
  return (
    <section id={id} className="border border-slate2/60 bg-card">
      <div className="flex items-center justify-between border-b border-slate2/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] text-dim/60">{idx}</span>
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-silver">{title}</h2>
        </div>
        <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-ozone">
          <span className="h-1.5 w-1.5 bg-ozone animate-flicker" /> {status}
        </span>
      </div>
      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}

function useClock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () =>
      setT(new Date().toLocaleTimeString("en-GB", { hour12: false, timeZone: "Asia/Bangkok" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

export default function UiKit() {
  const clock = useClock();
  return (
    <div className="min-h-screen bg-void grid-bg">
      <Nav />

      {/* Operations status strip */}
      <div className="fixed left-0 right-0 top-[57px] z-30 border-b border-slate2/60 bg-void/85 backdrop-blur-md md:top-[64px]">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-2 md:px-8">
          <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.3em] text-silver/70">
            <Radio className="h-3 w-3 animate-flicker text-ozone" /> Operations // Tactical Inc.
          </span>
          <span className="flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">
            <span className="hidden sm:inline">BKK · {clock}</span>
            <span className="text-ozone">SYS · NOMINAL</span>
          </span>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px] gap-0 px-0 pt-[92px] md:pt-[104px]">
        {/* Sidebar rail */}
        <aside className="sticky top-[104px] hidden h-[calc(100vh-104px)] w-[220px] shrink-0 border-r border-slate2/40 bg-void/60 md:block">
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2.5 border-b border-slate2/40 px-5 py-4">
              <BrandMark className="h-6 w-6" />
              <span className="font-brand text-base text-silver">ooh<span className="text-ozone">.</span>earth</span>
            </div>
            <nav className="flex-1 overflow-y-auto py-2">
              {NAV.map((n) => (
                <a
                  key={n.id}
                  href={`#${n.id}`}
                  className="group flex items-center justify-between border-l-2 border-transparent px-5 py-2.5 transition-colors hover:border-ozone hover:bg-slate2/20"
                >
                  <span className="flex items-baseline gap-3">
                    <span className="font-mono text-[9px] text-dim/50">{n.idx}</span>
                    <span className="font-display text-[13px] font-medium tracking-[-0.01em] text-silver/80 transition-colors group-hover:text-ozone">{n.label}</span>
                  </span>
                  <span className="h-1 w-1 bg-dim/30 transition-colors group-hover:bg-ozone" />
                </a>
              ))}
            </nav>
            <div className="border-t border-slate2/40 px-5 py-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim/60">// open-source · union-made</span>
            </div>
          </div>
        </aside>

        {/* Main dashboard */}
        <main className="min-w-0 flex-1 px-5 pb-24 md:px-8">
          {/* Mobile tab strip */}
          <nav className="atlas-track -mx-5 mb-6 flex gap-2 overflow-x-auto px-5 md:hidden">
            {NAV.map((n) => (
              <a key={n.id} href={`#${n.id}`} className="shrink-0 border border-slate2/60 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-silver/70">{n.label}</a>
            ))}
          </nav>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.k} className="border border-slate2/60 bg-card p-4">
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">{s.k}</span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-display text-3xl font-bold tabular-nums text-ozone">{s.v}</span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-silver/50">{s.s}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-3">
            <Panel id="identity" idx="00" title="Identity" status="live">
              <div className="flex items-center gap-3">
                <BrandMark className="h-10 w-10" spinning />
                <span className="font-brand text-3xl tracking-tight text-silver">ooh<span className="text-ozone">.</span>earth</span>
              </div>
              <span className="mt-3 block font-mono text-[10px] uppercase tracking-[0.4em] text-ozone">OOH Street Art & Adbusting Maps</span>
              <p className="mt-3 max-w-2xl font-body text-sm leading-[1.6] text-darkgray">
                Open-source design system for the OOH resistance app. Every token, type style and module below is copy-ready for Framer, Tailwind or plain CSS — tap any field to copy.
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <CopyField label="Font import" value={FONT_IMPORT} />
                <CopyField label="Primary typeface" value="Inter Tight — 400 / 500 / 600 / 700 / 800 / 900" note="headings · body · mono labels" />
                <CopyField label="Signature mark" value="Lacquer" note="brand wordmark only" />
                <CopyField label="Selection" value="background #EDFF00 · color #000000" />
              </div>
            </Panel>

            <Panel id="palette" idx="01" title="Signal palette" status="7 tokens">
              <BrandPalette />
            </Panel>

            <Panel id="type" idx="02" title="Comms type" status="7 styles">
              <TypeScale />
            </Panel>

            <Panel id="components" idx="03" title="Field modules" status="ready">
              <ComponentShowcase />
            </Panel>

            <Panel id="pins" idx="04" title="Marker system · Pin lab" status="interactive">
              <PinLab />
            </Panel>

            <Panel id="foundation" idx="05" title="System specs" status="locked">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {FOUNDATION.map((f) => (
                  <CopyField key={f.label} label={f.label} value={f.value} note={f.note} />
                ))}
              </div>
            </Panel>

            <Panel id="modes" idx="06" title="Operational modes" status="3 online">
              <div className="space-y-2">
                {THEMES.map((t) => (
                  <div key={t.mode} className="grid gap-2 border border-slate2/50 bg-void p-3 md:grid-cols-5">
                    <div className="flex items-center gap-3 md:col-span-1">
                      <span className="h-7 w-7 shrink-0 border border-white/10" style={{ backgroundColor: t.bg }} />
                      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-silver">{t.mode}</span>
                    </div>
                    <CopyField label="bg" value={t.bg} swatch={t.bg} />
                    <CopyField label="fg" value={t.fg} swatch={t.fg} />
                    <CopyField label="ozone" value={t.ozone} swatch={t.ozone} />
                    <CopyField label="flare" value={t.flare} swatch={t.flare} />
                  </div>
                ))}
              </div>
            </Panel>

            <Panel id="mobility" idx="07" title="Mobility intel · nomads.com" status="live · Web7">
              <p className="mb-3 max-w-2xl font-body text-sm leading-[1.6] text-darkgray">
                Live external-data module — nomad-density counts pulled from nomads.com, rendered through the field design system. Demonstrates ambient, composable, sovereign-data card patterns.
              </p>
              <NomadPulse compact />
            </Panel>
          </div>

          <footer className="mt-8 border-t border-slate2/40 pt-6">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim">// open-source · union-made · aligned to UN SDGs · Operations Tactical Inc.</p>
          </footer>
        </main>
      </div>
    </div>
  );
}