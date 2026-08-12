import { Image } from '@/components/ui/image';

const THE_SET =
  'https://media.base44.com/images/public/6a62213cff3ccbca88c04ff5/3877d532d_Screenshot2026-08-01at202153.png';

export default function TheSet() {
  return (
    <section className="border border-ozone/30 bg-card p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div className="border border-slate2 bg-void">
          <Image
            src={THE_SET}
            alt="The set — Hex Engine and Genesis Coin"
            fittingType="fit"
            className="block w-full h-[260px] sm:h-[340px] md:h-[420px]"
          />
        </div>
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">The set</div>
          <div className="mt-3 text-lg font-bold uppercase tracking-[0.12em] text-silver">
            Ancient systems · future networks · one interface
          </div>
          <p className="mt-3 font-mono text-[11px] leading-relaxed text-silver/55">
            The OOH Earth Hex Engine and Genesis Coin, paired in a limited set — the complexity of
            the city and the blockchain turned into something you can hold, feel and understand.
          </p>
        </div>
      </div>
    </section>
  );
}
