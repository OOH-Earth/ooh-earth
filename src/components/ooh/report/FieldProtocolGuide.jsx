import { useState } from "react";
import { Camera, Sparkles, ShieldAlert, Megaphone, ArrowRight, ArrowLeft, Check, RotateCcw } from "lucide-react";

const COLOR = {
  ozone: { text: "text-ozone", bg: "bg-ozone" },
  flare: { text: "text-flare", bg: "bg-flare" },
};

const STEPS = [
  {
    n: "01",
    label: "Document",
    icon: Camera,
    color: "ozone",
    title: "Pin it. Photograph it.",
    desc: "Capture the billboard, the painted takeover, the digital screen. Tag the GPS, drop the address. Every spot gets a field photograph and coordinates — the foundation of the public record.",
    tips: ["Use Locate Me for GPS", "Photo is optional but powerful", "Address helps cluster by area"],
  },
  {
    n: "02",
    label: "Identify",
    icon: Sparkles,
    color: "ozone",
    title: "Brand, agency, operator.",
    desc: "Name the advertiser. Chain the brand to its parent corp. Identify the OOH structure owner (Clear Channel, Plan B…). Tag the creative agency. Use the AI scanner to auto-detect from your photo, or pick from the registry.",
    tips: ["AI scanner auto-identifies the brand", "OOH operators are pre-loaded", "F-List refs link to Clean Creatives"],
  },
  {
    n: "03",
    label: "Classify",
    icon: ShieldAlert,
    color: "flare",
    title: "What is this ad doing?",
    desc: "Speak the harm. Is it greenwashing? Child targeting? Fossil fuel promotion? Surveillance? Select the violation tags — each mapped to UN SDGs and rights frameworks. Rate the infrastructure condition.",
    tips: ["Harm statement is your voice", "Tags map to SDGs & rights", "Condition tracks the unit itself"],
  },
  {
    n: "04",
    label: "Respond",
    icon: Megaphone,
    color: "flare",
    title: "From witness to action.",
    desc: "Log any adbust intervention — subverted, painted over, projected, wheatpasted. Upload evidence. Then choose your action: legal review, council submission, community reclaim, petition, or archive for case-building.",
    tips: ["Adbust type is optional", "Action flags route the report", "Archive builds the long-term case"],
  },
];

export default function FieldProtocolGuide() {
  const [active, setActive] = useState(0);
  const [completed, setCompleted] = useState(new Set());
  const step = STEPS[active];
  const Icon = step.icon;

  const next = () => {
    setCompleted((s) => new Set(s).add(active));
    if (active < STEPS.length - 1) setActive(active + 1);
  };
  const prev = () => setActive((a) => Math.max(0, a - 1));
  const reset = () => { setActive(0); setCompleted(new Set()); };

  const allDone = completed.size === STEPS.length;

  return (
    <div className="border border-slate2/60 bg-card">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate2/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-ozone">// Field Protocol Guide</span>
        </div>
        <div className="flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <button key={s.n} type="button" onClick={() => setActive(i)}
              className={`h-1.5 transition-all ${i === active ? "w-6 bg-ozone" : completed.has(i) ? "w-3 bg-ozone/50" : "w-3 bg-slate2"}`}
              aria-label={`Step ${s.n}: ${s.label}`} />
          ))}
        </div>
      </div>

      {/* Step illustration + content */}
      <div className="p-5">
        {/* Illustration row */}
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((s, i) => {
            const SIcon = s.icon;
            const isDone = completed.has(i);
            const isActive = i === active;
            const isPast = i < active;
            return (
              <button key={s.n} type="button" onClick={() => setActive(i)}
                className="group flex flex-1 flex-col items-center gap-1.5">
                <div className={`flex h-11 w-11 items-center justify-center border-2 transition-all ${
                  isActive ? "border-ozone bg-ozone/10" : isDone ? "border-ozone/40 bg-ozone/5" : isPast ? "border-slate2 bg-card" : "border-slate2 bg-card opacity-50"
                }`}>
                  {isDone ? <Check className="h-4 w-4 text-ozone" /> : <SIcon className={`h-4 w-4 ${isActive ? "text-ozone" : isPast ? "text-darkgray" : "text-dim"}`} />}
                </div>
                <span className={`font-mono text-[8px] uppercase tracking-[0.15em] transition-colors ${isActive ? "text-ozone" : isDone ? "text-darkgray" : "text-dim"}`}>
                  {s.label}
                </span>
              </button>
            );
          })}
          {/* Connector lines between icons */}
        </div>

        {/* Active step detail */}
        <div className="mt-5">
          <div className="flex items-baseline gap-3">
            <span className={`font-mono text-[10px] uppercase tracking-[0.3em] ${COLOR[step.color].text}`}>Step {step.n}</span>
            <span className="h-px flex-1 bg-slate2/60" />
          </div>
          <h3 className="mt-2 font-display text-xl font-bold tracking-tight text-silver">{step.title}</h3>
          <p className="mt-2 font-display text-[13px] leading-[1.5] text-darkgray">{step.desc}</p>

          {/* Tips */}
          <div className="mt-4 space-y-1">
            {step.tips.map((t, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={`mt-1 h-1 w-1 shrink-0 ${COLOR[step.color].bg}`} />
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-dim">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer nav */}
      <div className="flex items-center justify-between border-t border-slate2/60 px-4 py-3">
        <button type="button" onClick={prev} disabled={active === 0}
          className="inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:text-ozone disabled:opacity-30">
          <ArrowLeft className="h-3 w-3" /> Prev
        </button>

        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
          {active + 1} / {STEPS.length}
        </span>

        {active < STEPS.length - 1 ? (
          <button type="button" onClick={next}
            className="inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ozone transition-colors hover:opacity-70">
            Next <ArrowRight className="h-3 w-3" />
          </button>
        ) : allDone ? (
          <button type="button" onClick={reset}
            className="inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ozone transition-colors hover:opacity-70">
            <RotateCcw className="h-3 w-3" /> Replay
          </button>
        ) : (
          <button type="button" onClick={() => setCompleted(new Set([0,1,2,3]))}
            className="inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ozone transition-colors hover:opacity-70">
            <Check className="h-3 w-3" /> Complete
          </button>
        )}
      </div>
    </div>
  );
}