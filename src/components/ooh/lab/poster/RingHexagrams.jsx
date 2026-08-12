import { Image } from '@/components/ui/image';

const RINGS =
  'https://media.base44.com/images/public/6a62213cff3ccbca88c04ff5/c2b787a6d_Screenshot2026-08-01at202135.png';

export default function RingHexagrams() {
  return (
    <section className="border border-slate2 bg-card p-6">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">
        6 rings = 64 hexagram states
      </div>
      <div className="mt-4 border border-slate2 bg-void">
        <Image
          src={RINGS}
          alt="Six rotating rings forming binary 101100 = Hexagram 44"
          fittingType="fit"
          className="block w-full h-[180px] sm:h-[240px] md:h-[300px]"
        />
      </div>
      <div className="mt-4 flex flex-col items-center gap-2">
        <div className="border border-ozone/40 bg-ozone/5 px-4 py-2 text-center">
          <div className="font-mono text-[12px] uppercase tracking-[0.15em] text-ozone">
            = Hexagram 44 · Gou / Encounter
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-silver/55">
            Binary | 101100b | Decimal 44
          </div>
        </div>
      </div>
      <p className="mt-4 max-w-2xl font-mono text-[11px] leading-relaxed text-silver/50">
        Each ring is set to yin (0) or yang (1). The six lines, read Ring 1 → Ring 6, form one of 64
        hexagrams — mapped to protocols, modes, locations and network states.
      </p>
    </section>
  );
}
