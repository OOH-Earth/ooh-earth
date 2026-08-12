import { Image } from '@/components/ui/image';

const BAGUA =
  'https://media.base44.com/images/public/6a62213cff3ccbca88c04ff5/7e60b03ed_Screenshot2026-08-01at202141.png';
const MODES = [
  ['Fire', 'Li'],
  ['Earth', 'Kun'],
  ['Lake', 'Dui'],
  ['Heaven', 'Qian'],
  ['Water', 'Kan'],
  ['Wind', 'Xun'],
  ['Mountain', 'Gen'],
  ['Thunder', 'Zhen'],
];

export default function BaGuaModes() {
  return (
    <section className="border border-slate2 bg-card p-6">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">
        8 Ba Gua modes
      </div>
      <p className="mt-2 max-w-xl font-mono text-[11px] leading-relaxed text-silver/50">
        The context ring selects the ecosystem layer. Eight trigrams, eight modes — the city read
        through ancient systems.
      </p>
      <div className="mx-auto mt-4 max-w-[460px] border border-slate2 bg-void">
        <Image
          src={BAGUA}
          alt="Eight Ba Gua trigram modes arranged on an octagon"
          fittingType="fit"
          className="block aspect-square w-full"
        />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-[11px] sm:grid-cols-4">
        {MODES.map(([n, p]) => (
          <div key={n} className="border border-slate2 bg-void/40 px-3 py-2">
            <span className="font-bold uppercase tracking-wide text-silver">{n}</span>{' '}
            <span className="text-silver/40">/ {p}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
