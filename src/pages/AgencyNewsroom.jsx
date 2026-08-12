import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import Nav from '@/components/ooh/Nav';
import HorizonProgress from '@/components/ooh/HorizonProgress';
import Breadcrumbs from '@/components/ooh/Breadcrumbs';
import {
  Loader2,
  Lock,
  Radio,
  Newspaper,
  Palette,
  Map as MapIcon,
  ExternalLink,
  Linkedin,
  LineChart,
  Copy,
  Check,
  ArrowUpRight,
  Rocket,
  Target,
} from 'lucide-react';

import { payload, agencyOf, roleOf, accessOf } from '@/lib/clearance';

const fmtDate = (s) => {
  if (!s) return '';
  try {
    return new Date(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  } catch {
    return s;
  }
};

// Quick-launch tiles — the agency's front door to everything.
const TILES = [
  {
    to: '/agency/blog',
    label: 'Agency Newsroom',
    desc: 'Strategy + dispatch + queue',
    icon: Radio,
    ext: false,
  },
  {
    to: '/blog',
    label: 'Public Blog',
    desc: 'Field dispatches, public',
    icon: Newspaper,
    ext: false,
  },
  {
    to: '/kit',
    label: 'Brand + UI Kit',
    desc: 'Orbital Perspective source',
    icon: Palette,
    ext: false,
  },
  { to: '/sitemap', label: 'Sitemap', desc: 'Architecture + review', icon: MapIcon, ext: false },
  {
    to: '/console',
    label: 'Investor Console',
    desc: 'Capital + valuation',
    icon: LineChart,
    ext: false,
  },
  {
    to: 'https://oohearth.app',
    label: 'The App',
    desc: 'Live production',
    icon: ExternalLink,
    ext: true,
  },
  {
    to: 'https://www.linkedin.com/company/oohearthapp/',
    label: 'LinkedIn',
    desc: '@oohearthapp',
    icon: Linkedin,
    ext: true,
  },
];

// Road to 1,000 — the Q4 ladder (mirrors the strategy post).
const RUNGS = [
  {
    phase: '01 · Ignition',
    from: '0',
    to: '250',
    window: 'Days · Weeks 0–2',
    items: [
      'Launch statement + banner, manifesto pinned',
      'Founder + Assistant to CEO reshare within the hour',
      'Burn page connection-invite credits on the warm network',
      'Direct-invite ambassadors, Brandalism, Adfree Cities, Subvertising Intl',
    ],
  },
  {
    phase: '02 · Momentum',
    from: '250',
    to: '600',
    window: 'Weeks 2–8',
    items: [
      'Settle to 4 posts / week in fixed slots',
      'Founder comments on 3–5 adjacent posts each weekday',
      'First data drop: billboards × cities',
      '5–10 person ambassador reshare pod',
    ],
  },
  {
    phase: '03 · Compounding',
    from: '600',
    to: '1,000+',
    window: 'Through Q4',
    items: [
      'Let the franchises carry the cadence',
      'Best posts → carousels + short video',
      'Partners as co-authors + cross-posters',
      'Report every hundred publicly',
    ],
  },
];

const CHECKLIST = [
  'Logo lockups → real SVG/PNG',
  'LinkedIn follower count → live',
  'Investor Console review pass',
  'Verify data-drop numbers before posting',
];

function QueueCard({ p }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${p.title}\n\n${p.body || p.excerpt || ''}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };
  return (
    <div className="flex flex-col border border-slate2/50 bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="border border-slate2/60 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-darkgray">
          {p.network || 'post'}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">
          {fmtDate(p.published_date)}
        </span>
      </div>
      <Link
        to={`/agency/blog/${p.slug}`}
        className="mt-2 font-display text-sm font-bold leading-tight text-silver hover:text-ozone"
      >
        {p.title}
      </Link>
      {p.excerpt && (
        <p className="mt-1 line-clamp-2 font-display text-[11.5px] leading-snug text-darkgray">
          {p.excerpt}
        </p>
      )}
      <button
        onClick={copy}
        className="mt-2 flex items-center justify-center gap-1.5 border border-flare/50 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-flare transition-colors hover:bg-flare hover:text-void"
      >
        {copied ? (
          <>
            <Check className="h-3 w-3" /> Copied
          </>
        ) : (
          <>
            <Copy className="h-3 w-3" /> Copy to post
          </>
        )}
      </button>
    </div>
  );
}

export default function AgencyNewsroom() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const allowed = roleOf(user) === 'admin' || accessOf(user) === 'admin' || agencyOf(user);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let me = null;
      try {
        me = await base44.auth.me();
      } catch {
        me = null;
      }
      setUser(me);
      if (!(roleOf(me) === 'admin' || accessOf(me) === 'admin' || agencyOf(me))) {
        setLoading(false);
        return;
      }
      try {
        const d = payload(
          await base44.functions.invoke('blog', { action: 'list', scope: 'agency' }),
        );
        setPosts(d?.posts || []);
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const queue = posts.filter((p) => p.network);
  const feed = posts;

  return (
    <div className="relative min-h-screen bg-void page-top">
      <HorizonProgress />
      <Nav />
      <main className="px-5 pb-24 pt-28 md:px-8">
        <div className="mx-auto max-w-6xl">
          <Breadcrumbs items={[{ label: 'Agency HQ' }]} className="mb-6" />

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-5 w-5 animate-spin text-ozone" />
            </div>
          ) : !allowed ? (
            <div className="mt-6 flex flex-col items-center gap-3 border border-flare/40 bg-flare/[0.04] p-10 text-center">
              <Lock className="h-6 w-6 text-flare" />
              <h2 className="font-display text-lg font-bold text-silver">Agency access required</h2>
              <p className="max-w-md font-display text-[13px] leading-relaxed text-darkgray">
                The newsroom HQ is restricted to agency members. Ask an admin to switch on your
                agency status.
              </p>
              <Link
                to="/blog"
                className="mt-1 border border-ozone px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ozone transition-colors hover:bg-ozone hover:text-void"
              >
                Public blog →
              </Link>
            </div>
          ) : (
            <>
              {/* masthead */}
              <div className="border-b border-slate2/50 pb-6">
                <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
                  <Radio className="h-3.5 w-3.5" /> // internal · orbital perspective · intranet
                </span>
                <h1 className="mt-2 font-display text-4xl font-bold leading-[1.02] tracking-[-0.02em] text-silver md:text-5xl">
                  The newsroom for the <span className="text-ozone">movement.</span>
                </h1>
                <p className="mt-2 max-w-2xl font-display text-sm leading-[1.5] text-darkgray">
                  Run the agency from one place — strategy, dispatch, and the queue of posts going
                  out across the networks.
                </p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[9px] uppercase tracking-[0.18em] text-dim">
                  <span>Owner · Dee</span>
                  <span>Build · Base44</span>
                  <span>Design · Orbital Perspective</span>
                  <span>Q4 2026 →</span>
                </div>
              </div>

              {/* quick launch */}
              <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
                {TILES.map((t) => {
                  const Icon = t.icon;
                  const inner = (
                    <>
                      <Icon className="h-4 w-4 text-ozone" />
                      <span className="mt-2 font-display text-[12px] font-bold leading-tight text-silver">
                        {t.label}
                      </span>
                      <span className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-dim">
                        {t.desc}
                      </span>
                    </>
                  );
                  const cls =
                    'group flex flex-col border border-slate2/50 bg-card p-3 transition-colors hover:border-ozone/60';
                  return t.ext ? (
                    <a
                      key={t.label}
                      href={t.to}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cls}
                    >
                      {inner}
                    </a>
                  ) : (
                    <Link key={t.label} to={t.to} className={cls}>
                      {inner}
                    </Link>
                  );
                })}
              </div>

              {/* feed + KPI */}
              <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <section className="lg:col-span-2">
                  <div className="flex items-center gap-2 border-l-2 border-ozone/60 pl-4">
                    <Newspaper className="h-4 w-4 text-ozone" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
                      Agency dispatch
                    </span>
                  </div>
                  <div className="mt-4 space-y-2">
                    {feed.length === 0 ? (
                      <div className="border border-slate2/40 bg-card p-6 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
                        // No dispatches
                      </div>
                    ) : (
                      feed.map((p) => (
                        <Link
                          key={p.id || p.slug}
                          to={`/agency/blog/${p.slug}`}
                          className="group block border border-slate2/50 bg-card p-3 transition-colors hover:border-ozone/40"
                        >
                          <div className="flex items-center gap-2">
                            {p.category && (
                              <span className="border border-ozone/40 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-ozone">
                                {p.category}
                              </span>
                            )}
                            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">
                              {fmtDate(p.published_date)}
                            </span>
                          </div>
                          <h3 className="mt-1.5 font-display text-sm font-bold text-silver group-hover:text-ozone">
                            {p.title}
                          </h3>
                          {p.excerpt && (
                            <p className="mt-0.5 font-display text-[12px] leading-snug text-darkgray">
                              {p.excerpt}
                            </p>
                          )}
                          {p.author && (
                            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.15em] text-dim">
                              {p.author}
                            </p>
                          )}
                        </Link>
                      ))
                    )}
                  </div>
                </section>

                <aside className="space-y-4">
                  <div className="border border-slate2/60 bg-card p-4">
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-ozone">
                      <Linkedin className="h-4 w-4" /> LinkedIn
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <div className="font-display text-2xl font-bold text-silver">—</div>
                        <div className="font-mono text-[8px] uppercase tracking-[0.15em] text-dim">
                          Followers now
                        </div>
                      </div>
                      <div>
                        <div className="font-display text-2xl font-bold text-ozone">1,000</div>
                        <div className="font-mono text-[8px] uppercase tracking-[0.15em] text-dim">
                          Q4 target
                        </div>
                      </div>
                      <div>
                        <div className="font-display text-2xl font-bold text-silver">4–5</div>
                        <div className="font-mono text-[8px] uppercase tracking-[0.15em] text-dim">
                          Posts / week
                        </div>
                      </div>
                      <div>
                        <div className="font-display text-2xl font-bold text-flare">
                          {queue.length}
                        </div>
                        <div className="font-mono text-[8px] uppercase tracking-[0.15em] text-dim">
                          Queued
                        </div>
                      </div>
                    </div>
                    <a
                      href="https://www.linkedin.com/company/oohearthapp/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-center gap-1.5 border border-ozone px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ozone transition-colors hover:bg-ozone hover:text-void"
                    >
                      Open LinkedIn <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="border border-slate2/60 bg-card p-4">
                    <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
                      Push checklist
                    </div>
                    <ul className="mt-2 space-y-1.5">
                      {CHECKLIST.map((c) => (
                        <li
                          key={c}
                          className="flex gap-2 font-display text-[12px] leading-snug text-darkgray"
                        >
                          <span className="mt-1.5 h-1 w-1 shrink-0 bg-flare" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </aside>
              </div>

              {/* road to 1,000 */}
              <section className="mt-12">
                <div className="flex items-center gap-2 border-l-2 border-ozone/60 pl-4">
                  <Target className="h-4 w-4 text-ozone" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
                    Road to 1,000
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                  {RUNGS.map((r) => (
                    <div
                      key={r.phase}
                      className="flex flex-col border border-slate2/50 bg-card p-4"
                    >
                      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-flare">
                        {r.phase}
                      </div>
                      <div className="mt-2 flex items-end gap-1 font-display font-bold leading-none text-silver">
                        <span className="text-lg text-dim">{r.from}</span>
                        <span className="text-dim">→</span>
                        <span className="text-3xl text-ozone">{r.to}</span>
                      </div>
                      <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.15em] text-dim">
                        {r.window}
                      </div>
                      <ul className="mt-3 space-y-1.5">
                        {r.items.map((it) => (
                          <li
                            key={it}
                            className="flex gap-2 font-display text-[11.5px] leading-snug text-darkgray"
                          >
                            <span className="mt-1.5 h-1 w-1 shrink-0 bg-ozone" />
                            {it}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              {/* post queue */}
              {queue.length > 0 && (
                <section className="mt-12">
                  <div className="flex items-center gap-2 border-l-2 border-flare/60 pl-4">
                    <Rocket className="h-4 w-4 text-flare" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-flare">
                      Post queue · ready to share
                    </span>
                  </div>
                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {queue.map((p) => (
                      <QueueCard key={p.id || p.slug} p={p} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
