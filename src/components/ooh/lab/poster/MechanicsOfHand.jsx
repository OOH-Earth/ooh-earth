import { RotateCw, RefreshCw, FlipVertical, Target } from "lucide-react";

const STEPS = [
  { icon: RotateCw, t: "Rotate", d: "Navigate layers & content" },
  { icon: RefreshCw, t: "Twist", d: "Change state or protocol" },
  { icon: FlipVertical, t: "Flip", d: "Switch network or context" },
  { icon: Target, t: "Press Core", d: "Confirm / Sign / Authenticate" },
];

export default function MechanicsOfHand() {
  return (
    <section className="border border-slate2 bg-card p-6">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">Mechanics of the hand</div>
      <p className="mt-2 max-w-2xl font-mono text-[11px] leading-relaxed text-silver/50">Four gestures drive the whole protocol. The hand is the input — no screens, no menus, no ambiguity.</p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s) => (
          <div key={s.t} className="border border-slate2 bg-void/40 p-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-ozone/40" style={{ boxShadow: "0 0 20px rgba(237,255,0,.1)" }}>
              <s.icon className="h-7 w-7 text-ozone" strokeWidth={1.5} />
            </div>
            <div className="mt-3 text-sm font-bold uppercase tracking-wide text-silver">{s.t}</div>
            <div className="mt-1 font-mono text-[10px] leading-snug text-silver/50">{s.d}</div>
          </div>
        ))}
      </div>
    </section>
  );
}