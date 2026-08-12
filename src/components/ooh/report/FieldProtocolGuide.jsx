import { useState } from 'react';
import {
  Camera,
  Sparkles,
  ShieldAlert,
  Megaphone,
  ChevronDown,
  Check,
  BookOpen,
} from 'lucide-react';
import { Image } from '@/components/ui/image';

const STEPS = [
  {
    n: '01',
    label: 'Document',
    icon: Camera,
    color: 'ozone',
    title: 'Pin it. Photograph it.',
    desc: 'Capture the billboard, the painted takeover, the digital screen. Tag the GPS, drop the address. Every spot gets a field photograph and coordinates — the foundation of the public record.',
    tips: [
      'Use Locate Me for GPS',
      'Photo auto-reads GPS from EXIF',
      'AI Scanner fills the whole form from your photo',
      'Address helps cluster by area',
    ],
    image:
      'https://media.base44.com/images/public/6a62213cff3ccbca88c04ff5/d9042f3f5_generated_image.png',
  },
  {
    n: '02',
    label: 'Identify',
    icon: Sparkles,
    color: 'ozone',
    title: 'Brand, agency, operator.',
    desc: 'Name the advertiser. Chain the brand to its parent corp. Identify the OOH structure owner (Clear Channel, Plan B…). Tag the creative agency. Use the AI scanner to auto-detect from your photo, or pick from the registry.',
    tips: [
      'Scanner pre-fills brand, agency, sector & harm tags',
      'OOH operators are pre-loaded',
      'F-List refs link to Clean Creatives',
    ],
    image:
      'https://media.base44.com/images/public/6a62213cff3ccbca88c04ff5/960c08fd0_generated_image.png',
  },
  {
    n: '03',
    label: 'Classify',
    icon: ShieldAlert,
    color: 'flare',
    title: 'What is this ad doing?',
    desc: 'Speak the harm. Is it greenwashing? Child targeting? Fossil fuel promotion? Surveillance? Select the violation tags — each mapped to UN SDGs and rights frameworks. Rate the infrastructure condition.',
    tips: [
      'Harm statement is your voice',
      'Tags map to SDGs & rights',
      'Condition tracks the unit itself',
    ],
    image:
      'https://media.base44.com/images/public/6a62213cff3ccbca88c04ff5/dd151496c_generated_image.png',
  },
  {
    n: '04',
    label: 'Respond',
    icon: Megaphone,
    color: 'flare',
    title: 'From witness to action.',
    desc: 'Log any adbust intervention — subverted, painted over, projected, wheatpasted. Upload evidence. Then choose your action: legal review, council submission, community reclaim, petition, or archive for case-building.',
    tips: [
      'Adbust type is optional',
      'Action flags route the report',
      'Archive builds the long-term case',
    ],
    image:
      'https://media.base44.com/images/public/6a62213cff3ccbca88c04ff5/4c5833a10_generated_image.png',
  },
];

const COLOR = {
  ozone: { text: 'text-ozone', bg: 'bg-ozone', border: 'border-ozone', dot: 'bg-ozone' },
  flare: { text: 'text-flare', bg: 'bg-flare', border: 'border-flare', dot: 'bg-flare' },
};

export default function FieldProtocolGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-slate2/60 bg-card">
      {/* Manual cover / header — click to toggle dropdown */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-ozone/[0.03]"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center border border-ozone/40 bg-ozone/5">
            <BookOpen className="h-3.5 w-3.5 text-ozone" />
          </div>
          <div className="text-left">
            <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">
              Field Protocol 01
            </div>
            <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">
              Safety & Field Manual
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden font-mono text-[8px] uppercase tracking-[0.2em] text-dim sm:inline">
            {open ? 'Close manual' : 'Open manual'}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-darkgray transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown — airline safety card foldout */}
      {open && (
        <div className="border-t border-slate2/60">
          {/* Manual intro strip */}
          <div className="border-b border-slate2/60 bg-void px-4 py-2.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">
              // Read before deployment · 4-step field protocol for documenting OOH advertising
            </p>
          </div>

          {/* Illustrated step panels — foldout grid */}
          <div className="grid grid-cols-1 md:grid-cols-2">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.n}
                  className={`relative flex flex-col border-b border-slate2/60 md:border-r ${i % 2 === 1 ? 'md:border-r-0' : ''} ${i >= 2 ? 'md:border-b-0' : ''}`}
                >
                  {/* Step number ribbon */}
                  <div className="absolute left-0 top-0 z-10 flex items-center gap-1 bg-void/80 px-2 py-1 backdrop-blur-sm">
                    <span
                      className={`font-mono text-[10px] font-bold tracking-[0.2em] ${COLOR[step.color].text}`}
                    >
                      STEP {step.n}
                    </span>
                  </div>

                  {/* Illustrated panel */}
                  <div className="relative aspect-[16/10] overflow-hidden border-b border-slate2/60 bg-void">
                    <Image
                      src={step.image}
                      alt={`Field Protocol Step ${step.n}: ${step.label}`}
                      className="h-full w-full"
                      fittingType="fill"
                    />
                    {/* Label overlay */}
                    <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 bg-gradient-to-t from-void via-void/80 to-transparent px-3 pb-2 pt-8">
                      <Icon className={`h-4 w-4 ${COLOR[step.color].text}`} />
                      <span className="font-display text-sm font-bold uppercase tracking-[0.1em] text-silver">
                        {step.label}
                      </span>
                    </div>
                  </div>

                  {/* Instruction text */}
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="font-display text-base font-bold leading-tight tracking-tight text-silver">
                      {step.title}
                    </h3>
                    <p className="mt-2 font-display text-[12px] leading-[1.5] text-darkgray">
                      {step.desc}
                    </p>

                    {/* Tips — field notes */}
                    <div className="mt-3 space-y-1 border-t border-slate2/40 pt-2.5">
                      {step.tips.map((t, ti) => (
                        <div key={ti} className="flex items-start gap-2">
                          <span className={`mt-1 h-1 w-1 shrink-0 ${COLOR[step.color].dot}`} />
                          <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-dim">
                            {t}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Manual footer */}
          <div className="flex items-center justify-between border-t border-slate2/60 bg-void px-4 py-2.5">
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">
              OOH Earth · Field Protocol v01 · Union Made
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-ozone transition-colors hover:opacity-70"
            >
              <Check className="h-3 w-3" /> Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
