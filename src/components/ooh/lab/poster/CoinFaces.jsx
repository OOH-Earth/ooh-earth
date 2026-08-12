import { Image } from '@/components/ui/image';

const COIN_FACES =
  'https://media.base44.com/images/public/6a62213cff3ccbca88c04ff5/02066d8dc_Screenshot2026-08-01at202209.png';
const FACES = [
  {
    t: 'Face A — Protocol',
    d: 'OOH Earth logo at center, surrounded by 64 hexagrams. Genesis ID & block height.',
  },
  {
    t: 'Face B — The City',
    d: 'City grid as circuitry. Murals, billboards & nodes connected as a living network.',
  },
  {
    t: 'Face C — The World',
    d: 'Earth as a network, not borders. Communities connected across cultures.',
  },
];

export default function CoinFaces() {
  return (
    <section className="border border-slate2 bg-card p-6">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">
        OOH Earth Genesis Coin · the three faces
      </div>
      <div className="mt-4 border border-slate2 bg-void">
        <Image
          src={COIN_FACES}
          alt="Genesis Coin faces A, B and C"
          fittingType="fit"
          className="block w-full h-[220px] sm:h-[300px] md:h-[360px]"
        />
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {FACES.map((f) => (
          <div key={f.t} className="border border-slate2 bg-void/40 p-4">
            <div className="text-[11px] font-bold uppercase tracking-wide text-silver">{f.t}</div>
            <p className="mt-1 font-mono text-[10px] leading-snug text-silver/50">{f.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
