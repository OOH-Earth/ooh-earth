import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import Nav from '@/components/ooh/Nav';
import HorizonProgress from '@/components/ooh/HorizonProgress';
import Breadcrumbs from '@/components/ooh/Breadcrumbs';
import { Loader2, ArrowUpRight, Lock, Newspaper, Radio, Pin, PenLine } from 'lucide-react';

import { payload, agencyOf, roleOf, accessOf, isAdmin } from '@/lib/clearance';

const fmtDate = (s) => {
  if (!s) return '';
  try {
    return new Date(s).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return s;
  }
};

function PostCard({ p, base }) {
  return (
    <Link
      to={`${base}/${p.slug}`}
      className="group flex flex-col border border-slate2/50 bg-card p-4 transition-colors hover:border-ozone/50"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {p.pinned && <Pin className="h-3 w-3 text-flare" />}
          {p.category && (
            <span className="border border-ozone/40 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-ozone">
              {p.category}
            </span>
          )}
          {p.network && (
            <span className="border border-slate2/60 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-darkgray">
              {p.network}
            </span>
          )}
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">
          {fmtDate(p.published_date)}
        </span>
      </div>
      <h3 className="mt-3 font-display text-lg font-bold leading-[1.1] tracking-[-0.01em] text-silver group-hover:text-ozone">
        {p.title}
      </h3>
      {p.excerpt && (
        <p className="mt-2 flex-1 font-display text-[12.5px] leading-[1.5] text-darkgray">
          {p.excerpt}
        </p>
      )}
      <span className="mt-3 flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ozone">
        Read <ArrowUpRight className="h-3 w-3" />
      </span>
    </Link>
  );
}

export default function Blog({ scope = 'public' }) {
  const isAgency = scope === 'agency';
  const base = isAgency ? '/agency/blog' : '/blog';
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [cat, setCat] = useState('all');

  const allowed =
    !isAgency || roleOf(user) === 'admin' || accessOf(user) === 'admin' || agencyOf(user);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr('');
      let me = null;
      try {
        me = await base44.auth.me();
      } catch {
        me = null;
      }
      setUser(me);
      const canSee =
        !isAgency || roleOf(me) === 'admin' || accessOf(me) === 'admin' || agencyOf(me);
      if (!canSee) {
        setLoading(false);
        return;
      }
      try {
        const data = payload(await base44.functions.invoke('blog', { action: 'list', scope }));
        if (data?.error) throw new Error(data.error);
        setPosts(data?.posts || []);
      } catch (e) {
        setErr(e?.message || "Couldn't load posts.");
      } finally {
        setLoading(false);
      }
    })();
  }, [scope, isAgency]);

  const cats = ['all', ...Array.from(new Set(posts.map((p) => p.category).filter(Boolean)))];
  const shown = cat === 'all' ? posts : posts.filter((p) => p.category === cat);

  const crumbs = isAgency
    ? [{ label: 'Agency', to: '/agency/blog' }, { label: 'Newsroom' }]
    : [{ label: 'Blog' }];

  return (
    <div className="relative min-h-screen bg-void page-top">
      <HorizonProgress />
      <Nav />
      <main className="px-5 pb-24 pt-28 md:px-8">
        <div className="mx-auto max-w-5xl">
          <Breadcrumbs items={crumbs} className="mb-6" />

          {/* header */}
          <div className="border-b border-slate2/50 pb-6">
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
              {isAgency ? (
                <>
                  <Radio className="h-3.5 w-3.5" /> // agency newsroom · internal
                </>
              ) : (
                <>
                  <Newspaper className="h-3.5 w-3.5" /> // the blog
                </>
              )}
            </span>
            <h1 className="mt-2 font-display text-4xl font-bold leading-[1.02] tracking-[-0.02em] text-silver md:text-5xl">
              {isAgency ? (
                <>
                  The newsroom for the <span className="text-ozone">movement.</span>
                </>
              ) : (
                <>
                  Field <span className="text-ozone">dispatches.</span>
                </>
              )}
            </h1>
            <p className="mt-2 max-w-2xl font-display text-sm leading-[1.5] text-darkgray">
              {isAgency
                ? 'Internal desk: strategy, dispatch notes, and the posts queued to go out across the networks. Agency members only.'
                : 'Notes from the front line of the fight for public space — launches, evidence drops, and the thinking behind the movement.'}
            </p>
            {isAdmin(user) && (
              <Link
                to="/blog/studio"
                className="mt-4 inline-flex items-center gap-2 border border-ozone/50 px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ozone transition-colors hover:bg-ozone hover:text-void"
              >
                <PenLine className="h-3 w-3" /> Studio — write / edit posts
              </Link>
            )}
          </div>

          {/* restricted */}
          {isAgency && !allowed && (
            <div className="mt-10 flex flex-col items-center gap-3 border border-flare/40 bg-flare/[0.04] p-10 text-center">
              <Lock className="h-6 w-6 text-flare" />
              <h2 className="font-display text-lg font-bold text-silver">Agency access required</h2>
              <p className="max-w-md font-display text-[13px] leading-relaxed text-darkgray">
                The newsroom is restricted to agency members. If you should have access, ask an
                admin to switch on your agency status.
              </p>
              <Link
                to="/blog"
                className="mt-1 border border-ozone px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ozone transition-colors hover:bg-ozone hover:text-void"
              >
                Read the public blog →
              </Link>
            </div>
          )}

          {/* content */}
          {allowed && (
            <>
              {cats.length > 2 && (
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  {cats.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCat(c)}
                      className={`border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] transition-colors ${cat === c ? 'border-ozone bg-ozone text-void' : 'border-slate2/60 text-darkgray hover:border-ozone hover:text-ozone'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}

              {loading ? (
                <div className="mt-10 flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-ozone" />
                </div>
              ) : err ? (
                <div className="mt-8 border border-flare/50 bg-flare/5 px-4 py-3 font-mono text-[11px] text-flare">
                  {err}
                </div>
              ) : shown.length === 0 ? (
                <div className="mt-10 border border-slate2/40 bg-card p-8 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-dim">
                  // No posts yet
                </div>
              ) : (
                <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {shown.map((p) => (
                    <PostCard key={p.id || p.slug} p={p} base={base} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
