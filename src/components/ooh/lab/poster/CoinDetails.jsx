import { Image } from '@/components/ui/image';

const COIN_REVERSE =
  'https://media.base44.com/images/public/6a62213cff3ccbca88c04ff5/25b41110e_Screenshot2026-08-01at202200.png';
const COIN_EDGE =
  'https://media.base44.com/images/public/6a62213cff3ccbca88c04ff5/1e4b8ec13_Screenshot2026-08-01at202203.png';
const VERBS = ['MOVE', 'MAP', 'MINT', 'BUILD', 'DISCOVER', 'SIGN', 'VERIFY', 'CREATE'];
const SPECS = [
  ['Diameter', '45mm'],
  ['Thickness', '6mm'],
  ['Weight', '62g'],
  ['Material', 'Brass / Antique Gold'],
  ['Process', 'CNC + Hand Polished + Laser Engrave'],
  ['Edition', 'Limited · Numbered'],
];

export default function CoinDetails() {
  return (
    <section className="border border-slate2 bg-card p-6">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">
        Reverse & edge · the wheel and the verbs
      </div>
      <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <div className="border border-slate2 bg-void">
            <Image
              src={COIN_REVERSE}
              alt="Genesis Coin reverse — I Ching wheel"
              fittingType="fit"
              className="block aspect-square w-full"
            />
          </div>
          <div className="mt-3 text-[11px] font-bold uppercase tracking-wide text-silver">
            Reverse — I Ching Wheel
          </div>
          <p className="mt-1 font-mono text-[10px] leading-snug text-silver/50">
            64-state wheel. Not for divination, but for navigation, creation and protocol.
          </p>
        </div>
        <div>
          <div className="border border-slate2 bg-void">
            <Image
              src={COIN_EDGE}
              alt="Genesis Coin edge — laser-engraved action verbs"
              fittingType="fit"
              className="block w-full h-[260px] sm:h-[320px]"
            />
          </div>
          <div className="mt-3 text-[11px] font-bold uppercase tracking-wide text-silver">
            Edge — Action Verbs
          </div>
          <p className="mt-1 font-mono text-[10px] leading-snug text-silver/50">
            Laser engraved with the verbs of the network.
          </p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="border border-slate2 bg-void/40 p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ozone">
            The verbs
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {VERBS.map((v) => (
              <div
                key={v}
                className="border border-slate2 px-2 py-1.5 text-center font-mono text-[10px] uppercase tracking-wide text-silver/70"
              >
                {v}
              </div>
            ))}
          </div>
        </div>
        <div className="border border-slate2 bg-void/40 p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ozone">
            Coin specs
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-[11px]">
            {SPECS.map(([k, v]) => (
              <div key={k}>
                <div className="text-[9px] uppercase tracking-widest text-silver/40">{k}</div>
                <div className="text-silver/80">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
