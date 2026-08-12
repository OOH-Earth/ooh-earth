import { Link } from 'react-router-dom';
import { LayoutGrid, ArrowUpRight, ArrowLeft, Globe } from 'lucide-react';
import Nav from '@/components/ooh/Nav';
import { CATEGORIES, seedCount } from '@/components/ooh/categories';

export default function Categories() {
  return (
    <div className="min-h-screen bg-void text-silver">
      <Nav />
      <main className="page-top mx-auto max-w-6xl px-5 pb-24 md:px-8">
        <Link
          to="/map"
          className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-dim hover:text-ozone"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Atlas
        </Link>

        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-ozone" />
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">
            // categories · directories
          </span>
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.02em] md:text-4xl">
          Category directories
        </h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-darkgray">
          The public record, split by surface type. Pick a category to browse every logged site of
          that kind — each directory cross-links to all the others.
        </p>

        <Link
          to="/regions"
          className="mt-4 inline-flex items-center gap-2 border border-slate2/60 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone"
        >
          <Globe className="h-3.5 w-3.5" /> Regions &amp; coverage roadmap &rarr;
        </Link>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const n = seedCount(c.type);
            return (
              <Link
                key={c.slug}
                to={c.to}
                className="group flex flex-col border border-slate2/60 bg-card/50 p-5 transition-colors hover:border-ozone/50 hover:bg-card"
              >
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-dim transition-colors group-hover:text-ozone" />
                  <span className="font-mono text-[10px] tabular text-dim/50">
                    {String(n).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="mt-5 flex items-center gap-1 font-display text-lg font-bold tracking-[-0.01em] text-silver">
                  {c.label}
                  <ArrowUpRight className="h-3.5 w-3.5 text-dim opacity-0 transition-opacity group-hover:opacity-100" />
                </h3>
                <p className="mt-1.5 flex-1 font-display text-[12px] leading-[1.5] text-darkgray">
                  {c.blurb}
                </p>
                <span className="mt-3 font-mono text-[9px] uppercase tracking-[0.2em] text-dim/70">
                  {n} logged{c.dedicated ? ' · dedicated page' : ''}
                </span>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
