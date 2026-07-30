import { Link } from "react-router-dom";
import Nav from "@/components/ooh/Nav";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";
import SiteFooter from "@/components/ooh/SiteFooter";

// OOH Earth — Hex Engine Poster (Lab)
// Rebuilt on the OOH Earth design system, responsive. Concept-art slots use
// ASSET_BASE — once the webp set is uploaded to Base44 media, set ASSET_BASE
// to the media base URL and every slot fills automatically.
const ASSET_BASE = ""; // e.g. "https://media.base44.com/<app-id>/lab"

function Art({ name, alt, className }) {
  if (ASSET_BASE) {
    return <img src={`${ASSET_BASE}/${name}.webp`} alt={alt} loading="lazy" className={`block h-full w-full object-cover ${className || ""}`} />;
  }
  return (
    <div className={`flex items-center justify-center border border-dashed border-slate2 bg-void/60 ${className || ""}`}>
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver/40">{name}.webp</span>
    </div>
  );
}

function Panel({ title, sub, children, className }) {
  return (
    <section className={`border border-slate2 bg-card/60 p-6 ${className || ""}`}>
      {title && <div className="pb-3 text-lg font-bold uppercase tracking-[0.16em]">{title}</div>}
      {sub && <div className="-mt-2 mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">{sub}</div>}
      {children}
    </section>
  );
}

const SPECS = [
  ["Diameter", "95 mm"], ["Connectivity", "BLE 5.3 · UWB · NFC"],
  ["Thickness", "46 mm"], ["Sensors", "9-axis IMU · pressure · proximity · magnetometer"],
  ["Weight", "380 g"], ["Battery", "LiPo 300 mAh · Qi 2.0 · USB-C"],
  ["Materials", "Titanium · brass · sapphire · ceramic · Nd magnets"], ["Security", "Secure element (EAL6+) · hardware wallet"],
  ["Finish", "PVD antique brass + sandblast"], ["Haptics", "LRA engine · 16-detent magnetic rings"],
];
const HERO_FEATURES = [
  ["6 rotating rings", "One I Ching line per ring · 0 = yin, 1 = yang · 64 states"],
  ["Ba Gua context ring", "8 modes mapped to OOH Earth ecosystem layers"],
  ["Central orb core", "Secure element, sensors, haptics & RGB feedback"],
  ["Titanium shell", "CNC Grade 5 titanium · PVD antique brass finish"],
];
const EXPLODED = ["Titanium outer shell", "6 rotating rings", "Magnetic detent", "Ba Gua ring", "Sapphire top lens", "Rear cover + coil", "Haptic ring + RGB", "Ceramic bearings", "Central orb core", "Main PCB + antennas", "Vibration motor", "Wireless coil / USB-C"];
const BAGUA = [
  ["☰ Heaven", "Identity"], ["☱ Lake", "Wallet"], ["☲ Fire", "Campaigns"], ["☳ Thunder", "Maps / Discovery"],
  ["☴ Wind", "Communities"], ["☵ Water", "Events"], ["☶ Mountain", "Assets"], ["☷ Earth", "DAO / Governance"],
];
const ORB_CORE = ["Secure element", "Haptic engine", "RGB LED core", "NFC / UWB antennas"];
const MATERIALS = ["Sapphire crystal", "Titanium shell", "Brass rings", "Magnetic detents", "Ceramic bearings", "Laser engraving"];
const FINISHES = ["Antique brass PVD", "Sandblasted titanium", "Obsidian PVD"];
const SENSORS = ["Pressure", "Magnetometer", "Proximity", "Ultra low power"];
const GESTURES = [["Rotate", "flip a line"], ["Twist", "mode + 1"], ["Flip", "invert all"], ["Press", "execute"], ["Shake", "randomize"], ["Hold", "lock 2s"]];
const ECOSYSTEM = ["Maps", "Campaigns", "Wallet", "Verification", "Collectibles"];

const GoldLabel = ({ children }) => <span className="text-ozone">{children}</span>;

export default function HexPoster() {
  return (
    <div className="min-h-screen bg-void grid-bg text-silver">
      <Nav />
      <div className="mx-auto max-w-6xl page-top px-6 pb-12">
        <Breadcrumbs items={[{ label: "Lab", to: "/lab" }, { label: "Concept Poster" }]} className="mb-4" />
        <header className="flex flex-wrap items-baseline gap-4 border-b border-slate2 pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-[0.14em]">Hex Engine <span className="text-ozone">Poster</span></h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-silver/50">A tangible interface for cities, crypto &amp; creative networks</p>
          <div className="ml-auto flex items-center gap-4 font-mono text-xs uppercase tracking-[0.1em]">
            <Link to="/lab" className="text-ozone transition-colors hover:text-ozone/70">← Lab</Link>
            <span className="border border-flare/40 px-2 py-0.5 text-flare">Working copy</span>
          </div>
        </header>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {/* HERO */}
          <Panel className="md:col-span-2 xl:col-span-3">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
              <Art name="t-hero-orb" alt="Hex Engine hero render" className="aspect-square w-full max-w-[360px] shrink-0 rounded-full" />
              <div className="flex-1">
                <div className="text-3xl font-bold uppercase tracking-[0.06em] md:text-4xl">OOH Earth <span className="text-ozone">Hex Engine</span></div>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ozone">Inspired by the I Ching · designed for the future</p>
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {HERO_FEATURES.map(([t, d]) => (
                    <div key={t}><div className="text-sm font-bold uppercase tracking-[0.1em] text-ozone">{t}</div><div className="mt-1 font-mono text-[11px] leading-relaxed text-silver/60">{d}</div></div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          {/* SPECS */}
          <Panel title="Specifications">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 font-mono text-[11px]">
              {SPECS.map(([k, v]) => (
                <div key={k}><div className="text-ozone">{k}</div><div className="mt-0.5 leading-snug text-silver/80">{v}</div></div>
              ))}
            </div>
          </Panel>

          {/* EXPLODED */}
          <Panel title="Exploded axonometric" className="xl:col-span-2">
            <Art name="t-exploded" alt="Exploded assembly view" className="h-56 w-full" />
            <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-[10px] uppercase tracking-wide text-silver/60 sm:grid-cols-6">
              {EXPLODED.map((c, i) => <div key={c} className={i >= 6 ? "text-ozone" : ""}>{c}</div>)}
            </div>
          </Panel>

          {/* HEXAGRAM SYSTEM */}
          <Panel title="Hexagram system" sub="The 64 states" className="xl:col-span-2">
            <div className="flex flex-col gap-5 sm:flex-row">
              <Art name="t-ring-stack" alt="Six stacked hexagram rings" className="h-48 w-full shrink-0 sm:w-56" />
              <div className="flex-1">
                <p className="font-mono text-[11px] leading-relaxed text-silver/60">Each ring is set to yin (0) or yang (1). The six lines, read Ring 1 → Ring 6, form one of 64 hexagrams — mapped to protocols, modes, locations or network states.</p>
                <div className="mt-3 border border-slate2 bg-void px-4 py-3 font-mono text-[12px] leading-relaxed">
                  <div><GoldLabel>Example</GoldLabel> <span className="text-silver/80">1 0 1 1 0 1</span></div>
                  <div><GoldLabel>Binary</GoldLabel> <span className="text-silver/80">101101 = 45</span></div>
                  <div className="text-ozone">䷬ H45 Cuì · Gathering Together</div>
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row">
              <Art name="t-hands-row" alt="Hands operating the engine" className="h-32 w-full shrink-0 sm:w-72" />
              <div className="font-mono text-[11px] leading-loose text-silver/60">
                <div><GoldLabel>1 Rotate</GoldLabel> turn any ring to flip a line</div>
                <div><GoldLabel>2 Align</GoldLabel> magnetic detents lock it</div>
                <div><GoldLabel>3 State</GoldLabel> six lines = hexagram 0–63</div>
                <div><GoldLabel>4 Action</GoldLabel> press to execute</div>
              </div>
            </div>
          </Panel>

          {/* BA GUA */}
          <Panel title="Ba Gua context ring" sub="8 modes · selects the layer">
            <Art name="t-bagua-dial" alt="Ba Gua dial" className="mx-auto aspect-square w-full max-w-[220px] rounded-full" />
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-[11px]">
              {BAGUA.map(([t, l]) => <div key={t}><span className="text-ozone">{t}</span><br /><span className="text-silver/60">{l}</span></div>)}
            </div>
          </Panel>

          {/* ORB CORE */}
          <Panel title="Central orb core" sub="The sealed instrument heart">
            <Art name="t-orb-core" alt="Central orb core" className="h-40 w-full" />
            <ul className="mt-4 space-y-1.5 font-mono text-[11px] text-silver/70">
              {ORB_CORE.map((f) => <li key={f}><span className="text-ozone">·</span> {f}</li>)}
            </ul>
          </Panel>

          {/* DIMENSIONS */}
          <Panel title="Dimensions">
            <Art name="t-mech-sphere" alt="Mechanical sphere cross-section" className="h-40 w-full" />
            <div className="mt-4 flex justify-between font-mono text-xs">
              {[["Ø", "95 mm"], ["H", "46 mm"], ["M", "380 g"]].map(([k, v]) => <div key={k} className="text-center"><div className="text-ozone">{k}</div><div className="mt-0.5 text-silver/80">{v}</div></div>)}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-1.5 font-mono text-[10px] uppercase text-silver/60">
              {MATERIALS.map((m) => <div key={m}>{m}</div>)}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {FINISHES.map((f) => <span key={f} className="border border-slate2 px-2 py-1 font-mono text-[9px] uppercase tracking-wide text-silver/60">{f}</span>)}
            </div>
          </Panel>

          {/* ELECTRONICS */}
          <Panel title="Electronics architecture">
            <div className="border border-slate2 bg-void px-4 py-5 text-center">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">STM32U5 MCU</div>
              <div className="mt-1 font-mono text-[10px] text-silver/50">+ EAL6+ secure element</div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-[10px] uppercase text-silver/60">
              {SENSORS.map((s) => <div key={s} className="border border-slate2 px-2 py-2 text-center">{s}</div>)}
            </div>
          </Panel>

          {/* GESTURES */}
          <Panel title="Gestures">
            <Art name="t-gesture-hands" alt="Gesture set" className="h-36 w-full" />
            <div className="mt-4 grid grid-cols-3 gap-3 font-mono text-[11px]">
              {GESTURES.map(([g, d]) => <div key={g}><div className="text-ozone">{g}</div><div className="text-silver/50">{d}</div></div>)}
            </div>
          </Panel>

          {/* ECOSYSTEM */}
          <Panel title="Ecosystem">
            <Art name="t-eco-device" alt="Device in the ecosystem" className="h-36 w-full" />
            <div className="mt-4 flex flex-wrap gap-2">
              {ECOSYSTEM.map((e) => <span key={e} className="border border-ozone/40 px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-ozone">{e}</span>)}
            </div>
          </Panel>
        </div>

        <div className="mt-8 border-t border-slate2 pt-5 text-center">
          <div className="text-lg font-bold uppercase tracking-[0.14em]">OOH Earth Hex Engine</div>
          <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-silver/50">Designed for the city · built for the future</div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
