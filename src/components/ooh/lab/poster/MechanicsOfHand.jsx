import { RotateCw, RefreshCw, FlipVertical, Target } from 'lucide-react';
import { Image } from '@/components/ui/image';

const MECHANICS =
  'https://media.base44.com/images/public/6a62213cff3ccbca88c04ff5/42d19fc1c_Screenshot2026-08-01at202131.png';
const STEPS = [
  { icon: RotateCw, t: 'Rotate', d: 'Navigate layers & content' },
  { icon: RefreshCw, t: 'Twist', d: 'Change state or protocol' },
  { icon: FlipVertical, t: 'Flip', d: 'Switch network or context' },
  { icon: Target, t: 'Press Core', d: 'Confirm / Sign / Authenticate' },
];

export default function MechanicsOfHand() {
  return (
    <section className="border border-slate2 bg-card p-6">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">
        Mechanics of the hand
      </div>
      <p className="mt-2 max-w-2xl font-mono text-[11px] leading-relaxed text-silver/50">
        Four gestures drive the whole protocol — no screens, no menus, no ambiguity.
      </p>
      <div className="mt-4 border border-slate2 bg-void">
        <Image
          src={MECHANICS}
          alt="Mechanics of the hand — rotate, twist, flip, press core"
          fittingType="fit"
          className="block w-full h-[200px] sm:h-[280px] md:h-[340px]"
        />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s) => (
          <div key={s.t} className="border border-slate2 bg-void/40 p-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-ozone/40">
              <s.icon className="h-6 w-6 text-ozone" strokeWidth={1.5} />
            </div>
            <div className="mt-2 text-sm font-bold uppercase tracking-wide text-silver">{s.t}</div>
            <div className="mt-1 font-mono text-[10px] leading-snug text-silver/50">{s.d}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
