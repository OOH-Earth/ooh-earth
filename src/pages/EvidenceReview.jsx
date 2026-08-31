import { Link } from 'react-router-dom';
import { ArrowUpRight, Check, Mail } from 'lucide-react';
import Nav from '@/components/ooh/Nav';
import SiteFooter from '@/components/ooh/SiteFooter';
import HorizonProgress from '@/components/ooh/HorizonProgress';
import ViewfinderCursor from '@/components/ooh/ViewfinderCursor';
import { useSeo } from '@/lib/seoContext';

const INPUTS = ['the question you need answered', 'a defined place or corridor', 'the advertising category', 'a time boundary or source preference'];

export default function EvidenceReview() {
  useSeo({
    title: 'Evidence Review — OOH Earth',
    desc: 'A bounded, source-linked evidence brief for a defined outdoor-advertising or public-space question.',
    image: 'https://media.base44.com/images/public/6a62213cff3ccbca88c04ff5/ba44da8c8_generated_image.png',
  });

  return (
    <div className="relative bg-void">
      <ViewfinderCursor />
      <HorizonProgress />
      <Nav />
      <main className="page-top">
        <section className="border-b border-slate2/40 bg-void">
          <div className="px-5 py-16 md:px-8 md:py-24">
            <div className="mx-auto max-w-4xl">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Evidence review</span>
              <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-[1.04] tracking-[-0.02em] text-silver md:text-6xl">Turn a public-space question into a traceable evidence brief.</h1>
              <p className="mt-6 max-w-2xl font-display text-base leading-[1.6] text-darkgray md:text-lg">OOH Earth can organize publicly available evidence for a defined outdoor-advertising or public-space question. You receive sources, method, observations, and uncertainty in one bounded handover.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/contact?subject=Evidence%20review%20question" className="inline-flex items-center gap-2 bg-ozone px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare">Discuss a question <ArrowUpRight className="h-3.5 w-3.5" /></Link>
                <Link to="/map" className="inline-flex items-center gap-2 border border-slate2/70 px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-silver transition-colors hover:border-ozone/60 hover:text-ozone">Inspect the map</Link>
              </div>
            </div>
          </div>
        </section>
        <section className="border-b border-slate2/40 bg-card">
          <div className="mx-auto grid max-w-4xl gap-10 px-5 py-12 md:grid-cols-2 md:px-8 md:py-16">
            <div>
              <h2 className="font-display text-2xl font-bold text-silver">A bounded handover</h2>
              <p className="mt-4 font-display text-sm leading-[1.6] text-darkgray">The review is scoped to a question, geography, category, and time boundary. It is evidence organization and analysis—not a legal opinion, complete inventory, ownership determination, or enforcement decision.</p>
              <ul className="mt-6 space-y-3">
                {['source-linked findings', 'plain-language method', 'explicit uncertainty', 'reproducible links and handover'].map((item) => <li key={item} className="flex items-start gap-3 font-display text-sm text-silver"><Check className="mt-0.5 h-4 w-4 shrink-0 text-ozone" />{item}</li>)}
              </ul>
            </div>
            <div className="border border-slate2/50 bg-void p-6">
              <h2 className="font-display text-2xl font-bold text-silver">What to bring</h2>
              <ul className="mt-4 space-y-3">{INPUTS.map((item) => <li key={item} className="font-display text-sm leading-[1.5] text-darkgray">· {item}</li>)}</ul>
              <a href="mailto:hello@ooh.earth?subject=Evidence%20review%20question" className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ozone hover:text-flare"><Mail className="h-3.5 w-3.5" /> hello@ooh.earth</a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
