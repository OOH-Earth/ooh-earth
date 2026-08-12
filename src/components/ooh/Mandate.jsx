import { Globe2, Scale, Network, Leaf, ShieldCheck } from 'lucide-react';

const DOCTRINE = [
  {
    icon: Globe2,
    n: '01',
    title: 'Public-space sovereignty',
    body: 'The visual commons belongs to the public, not the highest bidder. We reclaim the walls, hoardings and screens that frame daily life.',
    sdg: 'SDG 11',
  },
  {
    icon: Scale,
    n: '02',
    title: 'Truth in advertising',
    body: 'Every billboard is evidence. We archive greenwashing, extraction and corporate disinformation for the public record.',
    sdg: 'SDG 16 · 12',
  },
  {
    icon: Leaf,
    n: '03',
    title: 'Air & climate accountability',
    body: 'We name the polluters behind the posters and track the PM2.5 they leave in our lungs — fossil-fuel advertisers documented at source, air quality logged as a basic field metric.',
    sdg: 'SDG 3 · 13',
  },
  {
    icon: Network,
    n: '04',
    title: 'Distributed resistance',
    body: 'Open-source field protocol so any city can stand up a chapter. No headquarters, no gatekeepers — local autonomy, shared doctrine.',
    sdg: 'SDG 10 · 17',
  },
];

const GOALS = [
  {
    n: '11',
    title: 'Sustainable cities & communities',
    body: 'Reclaiming the visual commons and protecting public space from commercial enclosure.',
  },
  {
    n: '16',
    title: 'Peace, justice & strong institutions',
    body: 'Corporate accountability and a public-record archive of advertising offenses.',
  },
  {
    n: '12',
    title: 'Responsible consumption & production',
    body: 'Exposing the true cost of products through the #TrueCost scanner.',
  },
  {
    n: '3',
    title: 'Good health & well-being',
    body: 'PM2.5 air pollution tracked as a basic field metric across every chapter.',
  },
  {
    n: '13',
    title: 'Climate action',
    body: 'Naming fossil-fuel advertisers and documenting climate disinformation.',
  },
  {
    n: '10',
    title: 'Reduced inequalities',
    body: 'Mobile-first access for the Global South; community-led regional chapters.',
  },
  {
    n: '5',
    title: 'Gender equality',
    body: 'Countering the gendered imagery of the attention economy.',
  },
  {
    n: '9',
    title: 'Industry, innovation & infrastructure',
    body: 'Open mapping infrastructure for civic documentation at scale.',
  },
  {
    n: '17',
    title: 'Partnerships for the goals',
    body: 'A union of ad-industry veterans, street artists and on-chain communities.',
  },
];

export default function Mandate() {
  return (
    <section id="mandate" className="relative border-t border-slate2/40 bg-void">
      <div className="px-5 py-16 md:px-8 md:py-24">
        <div className="flex flex-col gap-4 border-b border-slate2/40 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
              // Section 01 — Strategic mandate
            </span>
            <h2 className="mt-3 font-display text-5xl font-bold leading-[1.05] tracking-[-0.02em] text-silver md:text-7xl">
              An app for
              <br />
              creative disruption
            </h2>
          </div>
          <p className="max-w-sm font-display text-sm font-normal leading-[1.4] text-darkgray">
            OOH operates as a community-funded app reclaiming public space from corporate occupation
            — aligned to the UN Sustainable Development Goals and accountable to the communities it
            serves.
          </p>
        </div>

        {/* Doctrine */}
        <div className="mt-10 grid gap-px border border-slate2/60 bg-slate2/40 sm:grid-cols-2 lg:grid-cols-4">
          {DOCTRINE.map((d) => {
            const Icon = d.icon;
            return (
              <div key={d.n} className="bg-card p-6">
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-ozone" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
                    {d.sdg}
                  </span>
                </div>
                <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-flare">
                  {d.n}
                </div>
                <h3 className="mt-2 font-display text-xl font-bold leading-[1.15] tracking-[-0.02em] text-silver">
                  {d.title}
                </h3>
                <p className="mt-3 font-display text-[13px] font-normal leading-[1.45] text-darkgray">
                  {d.body}
                </p>
              </div>
            );
          })}
        </div>

        {/* SDG alignment */}
        <div className="mt-12">
          <div className="mb-6 flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
              // UN SDG alignment
            </span>
            <span className="h-px flex-1 bg-white/5" />
          </div>
          <div className="grid gap-px border border-slate2/60 bg-slate2/40 sm:grid-cols-2 lg:grid-cols-4">
            {GOALS.map((g) => (
              <div key={g.n} className="bg-card p-5">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-3xl font-black leading-none text-ozone">
                    {g.n}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
                    SDG
                  </span>
                </div>
                <h4 className="mt-3 font-display text-sm font-bold leading-[1.2] tracking-[-0.01em] text-silver">
                  {g.title}
                </h4>
                <p className="mt-2 font-display text-[12px] font-normal leading-[1.4] text-darkgray">
                  {g.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Governance */}
        <div className="mt-10 flex flex-col gap-4 border-t border-slate2/40 pt-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.25em] text-darkgray">
            <ShieldCheck className="h-4 w-4 text-ozone" />
            Non-state · Community-funded · Union-made · Open-source field protocol
          </div>
          <a
            href="#ledger"
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-ozone transition-colors hover:text-flare"
          >
            Engage the app →
          </a>
        </div>
      </div>
    </section>
  );
}
