import { RotateCw, Hexagon, Vibrate, Move, Nfc, ShieldCheck, Lightbulb, Usb } from "lucide-react";

const MATERIALS = ["Brass / Sandblasted Titanium", "Sapphire Glass", "Ceramic Core", "Neodymium Magnets"];
const FEATURES = [
  { icon: RotateCw, t: "6 Rotating Rings", d: "Build any of the 64 hexagrams" },
  { icon: Hexagon, t: "8 Trigram Modes", d: "Ba Gua contextual layer" },
  { icon: Vibrate, t: "Haptic Feedback", d: "Tactile clicks & vibration" },
  { icon: Move, t: "IMU / Gesture Sensor", d: "Detects motion & orientation" },
  { icon: Nfc, t: "NFC / UWB", d: "Location awareness & pairing" },
  { icon: ShieldCheck, t: "Secure Element", d: "Hardware wallet grade security" },
  { icon: Lightbulb, t: "RGB Core Light", d: "State, feedback & charging" },
  { icon: Usb, t: "USB-C / Wireless Charge", d: "Long life battery" },
];

function EngineOrb() {
  return (
    <svg viewBox="0 0 240 240" className="w-60 max-w-full" role="img" aria-label="Hex Engine sphere">
      <defs>
        <radialGradient id="brassOrb" cx="38%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#E8C879" />
          <stop offset="45%" stopColor="#B8860B" />
          <stop offset="100%" stopColor="#5A430A" />
        </radialGradient>
        <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E0F7FA" />
          <stop offset="100%" stopColor="#E0F7FA" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="120" cy="120" r="108" fill="url(#brassOrb)" stroke="#3E3220" strokeWidth="2" />
      {[92, 72, 52, 32].map((r) => <circle key={r} cx="120" cy="120" r={r} fill="none" stroke="#6B5533" strokeWidth="2" opacity="0.7" />)}
      <circle cx="120" cy="120" r="26" fill="url(#coreGlow)" />
      <circle cx="120" cy="120" r="14" fill="#1a1a1a" stroke="#E0F7FA" strokeWidth="1.5" />
      {Array.from({ length: 48 }).map((_, i) => {
        const a = (i / 48) * Math.PI * 2;
        return <line key={i} x1={120 + Math.cos(a) * 106} y1={120 + Math.sin(a) * 106} x2={120 + Math.cos(a) * 112} y2={120 + Math.sin(a) * 112} stroke="#3E3220" strokeWidth="1" />;
      })}
    </svg>
  );
}

export default function EngineHero() {
  return (
    <section className="border border-slate2 bg-card p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div className="flex justify-center"><EngineOrb /></div>
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-silver/50">OOH Earth</div>
          <h2 className="text-3xl font-bold uppercase tracking-[0.06em] md:text-4xl">Hex <span className="text-ozone">Engine</span></h2>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ozone">The city is the interface</p>
          <p className="mt-4 max-w-xl font-mono text-[11px] leading-relaxed text-silver/55">A tangible protocol navigator inspired by the I Ching, Ba Gua and sacred geometry. Navigate maps, campaigns, DAOs and crypto with the mechanics of the hand.</p>
          <div className="mt-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ozone">Materials</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {MATERIALS.map((m) => <span key={m} className="border border-slate2 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-silver/70">{m}</span>)}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.t} className="border border-slate2 bg-void/40 p-3">
            <f.icon className="h-5 w-5 text-ozone" strokeWidth={1.5} />
            <div className="mt-2 text-[11px] font-bold uppercase tracking-wide text-silver">{f.t}</div>
            <div className="mt-0.5 font-mono text-[9px] leading-snug text-silver/45">{f.d}</div>
          </div>
        ))}
      </div>
    </section>
  );
}