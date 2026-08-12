import { RotateCw, Hexagon, Vibrate, Move, Nfc, ShieldCheck, Lightbulb, Usb } from 'lucide-react';
import { Image } from '@/components/ui/image';

const SPHERE =
  'https://media.base44.com/images/public/6a62213cff3ccbca88c04ff5/1e2306297_Screenshot2026-08-01at202127.png';
const MATERIALS = [
  'Brass / Sandblasted Titanium',
  'Sapphire Glass',
  'Ceramic Core',
  'Neodymium Magnets',
];
const FEATURES = [
  { icon: RotateCw, t: '6 Rotating Rings', d: 'Build any of the 64 hexagrams' },
  { icon: Hexagon, t: '8 Trigram Modes', d: 'Ba Gua contextual layer' },
  { icon: Vibrate, t: 'Haptic Feedback', d: 'Tactile clicks & vibration' },
  { icon: Move, t: 'IMU / Gesture Sensor', d: 'Detects motion & orientation' },
  { icon: Nfc, t: 'NFC / UWB', d: 'Location awareness & pairing' },
  { icon: ShieldCheck, t: 'Secure Element', d: 'Hardware wallet grade security' },
  { icon: Lightbulb, t: 'RGB Core Light', d: 'State, feedback & charging' },
  { icon: Usb, t: 'USB-C / Wireless Charge', d: 'Long life battery' },
];

export default function EngineHero() {
  return (
    <section className="border border-slate2 bg-card p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-silver/50">
            OOH Earth
          </div>
          <h2 className="text-3xl font-bold uppercase tracking-[0.06em] md:text-4xl">
            Hex <span className="text-ozone">Engine</span>
          </h2>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ozone">
            The city is the interface
          </p>
          <p className="mt-4 max-w-xl font-mono text-[11px] leading-relaxed text-silver/55">
            A tangible protocol navigator inspired by the I Ching, Ba Gua and sacred geometry.
            Navigate maps, campaigns, DAOs and crypto with the mechanics of the hand.
          </p>
          <div className="mt-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ozone">
              Materials
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {MATERIALS.map((m) => (
                <span
                  key={m}
                  className="border border-slate2 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-silver/70"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="border border-slate2 bg-void">
          <Image
            src={SPHERE}
            alt="OOH Earth Hex Engine — the 3D Ba Gua sphere"
            fittingType="fit"
            className="block aspect-square w-full"
          />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.t} className="border border-slate2 bg-void/40 p-3">
            <f.icon className="h-5 w-5 text-ozone" strokeWidth={1.5} />
            <div className="mt-2 text-[11px] font-bold uppercase tracking-wide text-silver">
              {f.t}
            </div>
            <div className="mt-0.5 font-mono text-[9px] leading-snug text-silver/45">{f.d}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
