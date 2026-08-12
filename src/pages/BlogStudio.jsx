import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useSearchParams } from 'react-router-dom';
import Nav from '@/components/ooh/Nav';
import HorizonProgress from '@/components/ooh/HorizonProgress';
import Breadcrumbs from '@/components/ooh/Breadcrumbs';
import {
  Loader2,
  Lock,
  Plus,
  Save,
  ArrowLeft,
  Pin,
  Eye,
  PenLine,
  ExternalLink,
} from 'lucide-react';
import { isAdmin, payload } from '@/lib/clearance';

const CATEGORIES = ['guide', 'post', 'dispatch', 'launch', 'strategy', 'explainer', 'futures'];
const today = () => new Date().toISOString().slice(0, 10);

const BLANK = {
  title: '',
  slug: '',
  category: 'post',
  audience: 'public',
  status: 'draft',
  author: 'OOH Earth',
  excerpt: '',
  body: '',
  cta: '',
  cover_image: '',
  network: '',
  pinned: false,
  published_date: today(),
};

const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);

const fmtDate = (s) => {
  if (!s) return '\u2014';
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

// markdown-lite preview \u2014 mirrors the renderer in BlogArticle.jsx
function Preview({ text }) {
  const blocks = String(text || '')
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  if (!blocks.length)
    return <p className="font-mono text-[11px] text-dim">// nothing to preview yet</p>;
  return (
    <div className="space-y-4">
      {blocks.map((b, i) => {
        if (b.startsWith('## '))
          return (
            <h2
              key={i}
              className="mt-6 font-display text-xl font-bold tracking-[-0.01em] text-silver"
            >
              {b.slice(3)}
            </h2>
          );
        const lines = b.split('\n');
        if (lines.every((l) => l.trim().startsWith('- ')))
          return (
            <ul key={i} className="space-y-1.5 pl-1">
              {lines.map((l, j) => (
                <li
                  key={j}
                  className="flex gap-2 font-display text-[14px] leading-[1.6] text-darkgray"
                >
                  <span className="mt-2 h-1 w-1 shrink-0 bg-ozone" />
                  <span>{l.trim().slice(2)}</span>
                </li>
              ))}
            </ul>
          );
        return (
          <p key={i} className="font-display text-[14px] leading-[1.7] text-darkgray">
            {b}
          </p>
        );
      })}
    </div>
  );
}

const LBL = 'font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-dim';
const INP =
  'mt-1 w-full border border-slate2 bg-void px-3 py-2 font-display text-sm text-silver outline-none transition-colors focus:border-ozone/60';

function Field({ label, children }) {
  return (
    <label className="block">
      <span className={LBL}>{label}</span>
      {children}
    </label>
  );
}

export default function BlogStudio() {
  const [params, setParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // list | edit
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const admin = isAdmin(user);

  const load = async () => {
    setLoading(true);
    const all = [];
    for (const scope of ['public', 'agency']) {
      try {
        const data = payload(
          await base44.functions.invoke('blog', { action: 'list', scope, includeDrafts: true }),
        );
        (data?.posts || []).forEach((p) => all.push(p));
      } catch {
        /* ignore per-scope errors */
      }
    }
    const seen = new Set();
    const merged = all.filter((p) => {
      const k = p.id || p.slug;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    merged.sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        String(b.published_date || '').localeCompare(String(a.published_date || '')),
    );
    setPosts(merged);
    setLoading(false);
    return merged;
  };

  const openNew = () => {
    setForm({ ...BLANK, published_date: today() });
    setSlugTouched(false);
    setMsg('');
    setShowPreview(false);
    setView('edit');
  };
  const openEdit = (p) => {
    setForm({ ...BLANK, ...p });
    setSlugTouched(true);
    setMsg('');
    setShowPreview(false);
    setView('edit');
  };
  const backToList = () => {
    setView('list');
    setMsg('');
    if (params.get('edit')) setParams({}, { replace: true });
  };

  useEffect(() => {
    (async () => {
      let me = null;
      try {
        me = await base44.auth.me();
      } catch {
        me = null;
      }
      setUser(me);
      setReady(true);
      if (!isAdmin(me)) {
        setLoading(false);
        return;
      }
      const merged = await load();
      const editSlug = params.get('edit');
      if (editSlug) {
        const p = merged.find((x) => x.slug === editSlug);
        if (p) openEdit(p);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const onTitle = (v) =>
    setForm((f) => ({ ...f, title: v, slug: slugTouched ? f.slug : slugify(v) }));

  const save = async () => {
    const post = { ...form, title: (form.title || '').trim() };
    post.slug = (post.slug || slugify(post.title)).trim();
    if (!post.title) {
      setMsg('Title is required.');
      return;
    }
    if (!post.slug) {
      setMsg('Slug is required.');
      return;
    }
    setSaving(true);
    setMsg('');
    try {
      const data = payload(await base44.functions.invoke('blog', { action: 'save', post }));
      if (data?.error) throw new Error(data.error);
      if (data?.post?.id) setForm((f) => ({ ...f, id: data.post.id }));
      setMsg('Saved \u2713');
      await load();
    } catch (e) {
      setMsg(e?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const crumbs = [{ label: 'Blog', to: '/blog' }, { label: 'Studio' }];

  return (
    <div className="relative min-h-screen bg-void page-top">
      <HorizonProgress />
      <Nav />
      <main className="px-5 pb-24 pt-28 md:px-8">
        <div className="mx-auto max-w-4xl">
          <Breadcrumbs items={crumbs} className="mb-6" />

          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate2/50 pb-6">
            <div>
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
                <PenLine className="h-3.5 w-3.5" /> // blog studio \u00b7 admin
              </span>
              <h1 className="mt-2 font-display text-4xl font-bold leading-[1.02] tracking-[-0.02em] text-silver md:text-5xl">
                Write the <span className="text-ozone">record.</span>
              </h1>
            </div>
            {ready && admin && view === 'list' && (
              <button
                onClick={openNew}
                className="inline-flex items-center gap-2 bg-ozone px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-void transition-opacity hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" /> New post
              </button>
            )}
          </div>

          {/* gate */}
          {!ready ? (
            <div className="mt-10 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-ozone" />
            </div>
          ) : !admin ? (
            <div className="mt-10 flex flex-col items-center gap-3 border border-flare/40 bg-flare/[0.04] p-10 text-center">
              <Lock className="h-6 w-6 text-flare" />
              <h2 className="font-display text-lg font-bold text-silver">Admin only</h2>
              <p className="max-w-md font-display text-[13px] leading-relaxed text-darkgray">
                The blog studio is restricted to admins. Sign in with an admin account to write or
                edit posts.
              </p>
              <Link
                to="/blog"
                className="mt-1 border border-ozone px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ozone transition-colors hover:bg-ozone hover:text-void"
              >
                Back to blog
              </Link>
            </div>
          ) : view === 'list' ? (
            /* ---------- LIST ---------- */
            loading ? (
              <div className="mt-10 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-ozone" />
              </div>
            ) : posts.length === 0 ? (
              <div className="mt-10 border border-slate2/40 bg-card p-8 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-dim">
                // No posts yet \u2014 hit New post
              </div>
            ) : (
              <div className="mt-8 divide-y divide-slate2/40 border border-slate2/50">
                {posts.map((p) => (
                  <div
                    key={p.id || p.slug}
                    className="flex flex-wrap items-center gap-3 bg-card px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {p.pinned && <Pin className="h-3 w-3 shrink-0 text-flare" />}
                        <span className="truncate font-display text-sm font-bold text-silver">
                          {p.title || '(untitled)'}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-[0.15em] text-dim">
                        <span className={p.status === 'published' ? 'text-ozone' : 'text-flare'}>
                          {p.status || 'draft'}
                        </span>
                        <span>\u00b7</span>
                        <span>{p.audience || 'public'}</span>
                        {p.category && (
                          <>
                            <span>\u00b7</span>
                            <span>{p.category}</span>
                          </>
                        )}
                        <span>\u00b7</span>
                        <span>{fmtDate(p.published_date)}</span>
                      </div>
                    </div>
                    {p.status === 'published' && (
                      <a
                        href={`${p.audience === 'agency' ? '/agency/blog' : '/blog'}/${p.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        title="View live"
                        className="text-dim transition-colors hover:text-ozone"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      onClick={() => openEdit(p)}
                      className="border border-slate2 px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-silver transition-colors hover:border-ozone hover:text-ozone"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* ---------- EDIT ---------- */
            <div className="mt-8">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={backToList}
                  className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-dim transition-colors hover:text-ozone"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> All posts
                </button>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
                  {form.id ? 'Editing' : 'New post'}
                </span>
              </div>

              <div className="mt-5 space-y-4 border border-slate2/50 bg-card p-5">
                <Field label="Title">
                  <input
                    className={INP}
                    value={form.title}
                    onChange={(e) => onTitle(e.target.value)}
                    placeholder="Field Guide 07 \u2014 \u2026"
                  />
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Slug (URL)">
                    <input
                      className={INP}
                      value={form.slug}
                      onChange={(e) => {
                        setSlugTouched(true);
                        setF('slug', slugify(e.target.value));
                      }}
                      placeholder="field-guide-07-\u2026"
                    />
                  </Field>
                  <Field label="Category">
                    <input
                      className={INP}
                      list="cat-list"
                      value={form.category}
                      onChange={(e) => setF('category', e.target.value)}
                    />
                    <datalist id="cat-list">
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </Field>
                  <Field label="Audience">
                    <select
                      className={INP}
                      value={form.audience}
                      onChange={(e) => setF('audience', e.target.value)}
                    >
                      <option value="public">public \u2014 anyone</option>
                      <option value="agency">agency \u2014 members + admins only</option>
                    </select>
                  </Field>
                  <Field label="Status">
                    <select
                      className={INP}
                      value={form.status}
                      onChange={(e) => setF('status', e.target.value)}
                    >
                      <option value="draft">draft \u2014 hidden</option>
                      <option value="published">published \u2014 live</option>
                    </select>
                  </Field>
                  <Field label="Author">
                    <input
                      className={INP}
                      value={form.author}
                      onChange={(e) => setF('author', e.target.value)}
                    />
                  </Field>
                  <Field label="Published date">
                    <input
                      type="date"
                      className={INP}
                      value={(form.published_date || '').slice(0, 10)}
                      onChange={(e) => setF('published_date', e.target.value)}
                    />
                  </Field>
                  <Field label="CTA label (optional)">
                    <input
                      className={INP}
                      value={form.cta}
                      onChange={(e) => setF('cta', e.target.value)}
                      placeholder="Open the atlas"
                    />
                  </Field>
                  <Field label="Network (share-out, optional)">
                    <input
                      className={INP}
                      value={form.network}
                      onChange={(e) => setF('network', e.target.value)}
                      placeholder="LinkedIn"
                    />
                  </Field>
                  <Field label="Cover image URL (optional)">
                    <input
                      className={INP}
                      value={form.cover_image}
                      onChange={(e) => setF('cover_image', e.target.value)}
                      placeholder="https://\u2026"
                    />
                  </Field>
                  <label className="flex items-center gap-2 self-end pb-2">
                    <input
                      type="checkbox"
                      checked={!!form.pinned}
                      onChange={(e) => setF('pinned', e.target.checked)}
                      className="h-4 w-4 accent-flare"
                    />
                    <span className={LBL}>Pinned</span>
                  </label>
                </div>

                <Field label="Excerpt (card summary)">
                  <textarea
                    className={`${INP} min-h-[60px] resize-y`}
                    value={form.excerpt}
                    onChange={(e) => setF('excerpt', e.target.value)}
                    placeholder="One or two sentences for the blog card."
                  />
                </Field>

                <div>
                  <div className="flex items-center justify-between">
                    <span className={LBL}>Body</span>
                    <button
                      onClick={() => setShowPreview((v) => !v)}
                      className="inline-flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-dim transition-colors hover:text-ozone"
                    >
                      <Eye className="h-3 w-3" /> {showPreview ? 'Edit' : 'Preview'}
                    </button>
                  </div>
                  {showPreview ? (
                    <div className="mt-1 min-h-[240px] border border-slate2 bg-void p-4">
                      <Preview text={form.body} />
                    </div>
                  ) : (
                    <textarea
                      className={`${INP} min-h-[240px] resize-y font-mono text-[13px] leading-[1.6]`}
                      value={form.body}
                      onChange={(e) => setF('body', e.target.value)}
                      placeholder={
                        'Write in Markdown-lite:\n\n## A heading\nA paragraph.\n\n- a bullet\n- another bullet\n\nLink out plainly \u2192 oohearth.app/map'
                      }
                    />
                  )}
                  <p className="mt-1.5 font-mono text-[9px] text-dim">
                    Markdown-lite: <b className="text-silver/70">## </b> heading \u00b7{' '}
                    <b className="text-silver/70">- </b> bullet \u00b7 blank line = new paragraph.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-slate2/40 pt-4">
                  <button
                    onClick={save}
                    disabled={saving}
                    className="inline-flex items-center gap-2 bg-ozone px-5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-void transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    {form.status === 'published' ? 'Save & publish' : 'Save draft'}
                  </button>
                  <button
                    onClick={backToList}
                    className="border border-slate2 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-silver transition-colors hover:border-ozone hover:text-ozone"
                  >
                    Done
                  </button>
                  {msg && (
                    <span
                      className={`font-mono text-[10px] uppercase tracking-[0.15em] ${/saved/i.test(msg) ? 'text-ozone' : 'text-flare'}`}
                    >
                      {msg}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
