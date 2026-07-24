import Nav from "@/components/ooh/Nav";
import HorizonProgress from "@/components/ooh/HorizonProgress";
import BrandMark from "@/components/ooh/BrandMark";
import CopyField from "@/components/ooh/uikit/CopyField";
import BrandPalette from "@/components/ooh/uikit/BrandPalette";
import TypeScale from "@/components/ooh/uikit/TypeScale";
import ComponentShowcase from "@/components/ooh/uikit/ComponentShowcase";
import { Palette, Type, Boxes, Layers, Moon } from "lucide-react";

const THEME_TOKENS = [
  { mode: "Dark · Default", bg: "#000000", fg: "#F1F1F1", ozone: "#EDFF00", flare: "#FF5C00" },
  { mode: "Light · Solar Smoke", bg: "#F5F5F5", fg: "#0D0D0D", ozone: "#E84A00", flare: "#FF5C00" },
  { mode: "Matrix · Terminal", bg: "#040C04", fg: "#1AFF3F", ozone: "#00FF55", flare: "#FF00C8" },
];

const FOUNDATION = [
  { label: "Radius", value: "0px", note: "sharp · no rounding" },
  { label: "Body line-height", value: "1.6", note: "scannable" },
  { label: "Body letter-spacing", value: "-0.005em", note: "tight" },
  { label: "Shadow · ozone-glow", value: "0 0 24px rgba(237,255,0,0.22)" },
  { label: "Shadow · flare-glow", value: "0 0 24px rgba(255,92,0,0.28)" },
  { label: "Selection", value: "background #EDFF00 / color #000000" },
];

const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800;900&family=Lacquer&display=swap');";

function Section({ id, icon: Icon, kicker, title, desc, children }) {
  return (
    <section id={id} className="border-t border-slate2/40 py-12 md:py-16">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
            <Icon className="h-3.5 w-3.5" /> {kicker}
          </span>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.02em] text-silver md:text-4xl">{title}</h2>
        </div>
        {desc && <p className="hidden max-w-xs font-body text-sm leading-[1.5] text-darkgray md:block">{desc}</p>}
      </div>
      {children}
    </section>
  );
}

export default function UiKit() {
  return (
    <div className="relative min-h-screen bg-void">
      <HorizonProgress />
      <Nav />
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-28 md:px-8">
        {/* Identity */}
        <header className="border-b border-slate2/40 pb-12">
          <div className="flex items-center gap-3">
            <BrandMark className="h-10 w-10" spinning />
            <span className="font-brand text-3xl tracking-tight text-silver">ooh<span className="text-ozone">.</span>earth</span>
          </div>
          <span className="mt-4 block font-mono text-[10px] uppercase tracking-[0.4em] text-ozone">OOH Street Art & Adbusting Maps</span>
          <h1 className="mt-3 font-display text-4xl font-bold leading-[1.02] tracking-[-0.02em] text-silver md:text-6xl">Brand & UI Kit</h1>
          <p className="mt-4 max-w-2xl font-body text-sm leading-[1.6] text-darkgray">
            Open-source design system for the OOH resistance app. Every token, type style and component below is copy-ready for Framer, Tailwind or plain CSS — tap any field to copy.
          </p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <CopyField label="Font import" value={FONT_IMPORT} />
            <CopyField label="Primary typeface" value="Inter Tight — 400 / 500 / 600 / 700 / 800 / 900" note="headings · body · mono labels" />
            <CopyField label="Signature mark" value="Lacquer" note="brand wordmark only" />
            <CopyField label="Selection" value="background #EDFF00 · color #000000" />
          </div>
        </header>

        <Section id="palette" icon={Palette} kicker="01 · Color" title="Brand palette" desc="Seven core tokens on a void canvas, plus extended signal colors. Hi-vis Ozone is the primary accent; Neon Flare is the alarm.">
          <BrandPalette />
        </Section>

        <Section id="type" icon={Type} kicker="02 · Typography" title="Type scale" desc="Inter Tight across all weights, Lacquer reserved for the signature mark. Tight tracking on headings, generous 1.6 leading on body.">
          <TypeScale />
        </Section>

        <Section id="components" icon={Boxes} kicker="03 · Components" title="UI primitives" desc="Sharp 0px radius, mono-uppercase labels, ozone-on-void contrast. Copy the Tailwind recipe for any element.">
          <ComponentShowcase />
        </Section>

        <Section id="foundation" icon={Layers} kicker="04 · Foundation" title="Tokens & utilities" desc="Radius, shadows and global type settings that keep every surface consistent.">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {FOUNDATION.map((f) => (
              <CopyField key={f.label} label={f.label} value={f.value} note={f.note} />
            ))}
          </div>
        </Section>

        <Section id="themes" icon={Moon} kicker="05 · Themes" title="Mode tokens" desc="Three switchable themes share the same token names; only the values shift. Copy the hex per mode.">
          <div className="space-y-3">
            {THEME_TOKENS.map((t) => (
              <div key={t.mode} className="grid gap-2 border border-slate2/50 bg-card p-4 md:grid-cols-[1fr_1fr_1fr_1fr_1fr]">
                <div className="flex items-center gap-3 md:col-span-1">
                  <span className="h-8 w-8 shrink-0 border border-white/10" style={{ backgroundColor: t.bg }} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-silver">{t.mode}</span>
                </div>
                <CopyField label="bg" value={t.bg} swatch={t.bg} />
                <CopyField label="fg" value={t.fg} swatch={t.fg} />
                <CopyField label="ozone" value={t.ozone} swatch={t.ozone} />
                <CopyField label="flare" value={t.flare} swatch={t.flare} />
              </div>
            ))}
          </div>
        </Section>

        <footer className="border-t border-slate2/40 pt-8">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim">// Out Of Hell™ · open-source · union-made · aligned to UN SDGs</p>
        </footer>
      </main>
    </div>
  );
}