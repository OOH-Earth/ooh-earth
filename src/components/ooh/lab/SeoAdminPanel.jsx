import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { META, OG_IMAGES } from '@/lib/routeMeta';
import { useToast } from '@/components/ui/use-toast';
import {
  Loader2,
  ImageIcon,
  Sparkles,
  Search,
  Eye,
  EyeOff,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

// Routes the admin can manage. Static routes from META, plus dynamic prefixes
// that represent a class of pages (store item, blog post, location, etc.).
const DYNAMIC_ROUTES = [
  { path: '/store/:id', label: 'Store item (detail)', base: '/store' },
  { path: '/blog/:slug', label: 'Blog article (detail)', base: '/blog' },
  { path: '/location/:id', label: 'Location (detail)', base: '/map' },
  { path: '/bus-stop/:id', label: 'Bus stop (detail)', base: '/bus-stops' },
  { path: '/careers/:id', label: 'Career role (detail)', base: '/careers' },
  { path: '/access-keys/:slug', label: 'Access key (detail)', base: '/access-keys' },
  { path: '/category/:slug', label: 'Category directory', base: '/categories' },
  { path: '/capital/:slug', label: 'Capital lead (detail)', base: '/campaign' },
];

function allRoutes() {
  const statics = Object.keys(META).map((p) => ({
    path: p,
    label: META[p].title.split(' — ')[0],
    dynamic: false,
  }));
  const dyn = DYNAMIC_ROUTES.map((r) => ({ path: r.path, label: r.label, dynamic: true }));
  return [...statics, ...dyn];
}

export default function SeoAdminPanel() {
  const { toast } = useToast();
  const [records, setRecords] = useState(null); // PageMeta records keyed by path
  const [query, setQuery] = useState('');
  const [savingPath, setSavingPath] = useState(null);
  const [genPath, setGenPath] = useState(null);
  const [bulkGen, setBulkGen] = useState({ active: false, done: 0, total: 0, current: '' });
  const [savingAll, setSavingAll] = useState({ active: false, done: 0, total: 0 });
  // Local edit drafts: path -> { title, description, noindex }
  const [drafts, setDrafts] = useState({});

  const routes = allRoutes();

  const load = useCallback(async () => {
    try {
      const recs = await base44.entities.PageMeta.list('-updated_date', 300);
      // Dedup by path — keep the most complete record (og_generated > og_image > newest),
      // delete the rest. Prevents "stuck on old image" when a save shadows a generated card.
      const byPath = {};
      for (const r of recs) {
        if (r.path) (byPath[r.path] = byPath[r.path] || []).push(r);
      }
      const map = {};
      for (const path of Object.keys(byPath)) {
        const arr = byPath[path];
        if (arr.length > 1) {
          arr.sort(
            (a, b) =>
              (b.og_generated ? 1 : 0) - (a.og_generated ? 1 : 0) ||
              (b.og_image ? 1 : 0) - (a.og_image ? 1 : 0) ||
              new Date(b.updated_date).getTime() - new Date(a.updated_date).getTime(),
          );
          arr.slice(1).forEach((r) => base44.entities.PageMeta.delete(r.id).catch(() => {}));
        }
        map[path] = arr[0];
      }
      setRecords(map);
      // Seed drafts from existing records / static fallback
      const d = {};
      for (const route of allRoutes()) {
        const rec = map[route.path];
        const fb = META[route.path];
        d[route.path] = {
          title: rec?.title || fb?.title || '',
          description: rec?.description || fb?.desc || '',
          noindex: rec?.noindex || false,
        };
      }
      setDrafts(d);
    } catch {
      setRecords({});
      setDrafts({});
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const draft = (path) => drafts[path] || { title: '', description: '', noindex: false };
  const setDraft = (path, patch) =>
    setDrafts((p) => ({ ...p, [path]: { ...draft(path), ...patch } }));

  const save = async (path) => {
    const d = draft(path);
    setSavingPath(path);
    try {
      const existing = records?.[path];
      if (existing?.id) {
        await base44.entities.PageMeta.update(existing.id, {
          title: d.title,
          description: d.description,
          noindex: d.noindex,
        });
      } else {
        const created = await base44.entities.PageMeta.create({
          path,
          title: d.title,
          description: d.description,
          noindex: d.noindex,
        });
        setRecords((p) => ({ ...p, [path]: created }));
      }
      setRecords((p) => ({ ...p, [path]: { ...p[path], ...d } }));
      toast({ title: `SEO saved · ${path}` });
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setSavingPath(null);
    }
  };

  // A route is "dirty" if its draft differs from the saved record (or has content with no record).
  const isDirty = (path) => {
    const d = draft(path);
    const rec = records?.[path];
    if (!rec) return !!(d.title || d.description || d.noindex);
    return (
      d.title !== (rec.title || '') ||
      d.description !== (rec.description || '') ||
      !!d.noindex !== !!rec.noindex
    );
  };

  const dirtyCount = routes.filter((r) => isDirty(r.path)).length;

  // Save every dirty draft in one pass — creates or updates per route, then resyncs
  // from the server so ids / og_image stay authoritative.
  const saveAll = async () => {
    const targets = routes.filter((r) => isDirty(r.path));
    if (!targets.length) {
      toast({ title: 'No unsaved changes' });
      return;
    }
    setSavingAll({ active: true, done: 0, total: targets.length });
    let ok = 0;
    for (const r of targets) {
      const d = draft(r.path);
      const existing = records?.[r.path];
      try {
        if (existing?.id) {
          await base44.entities.PageMeta.update(existing.id, {
            title: d.title,
            description: d.description,
            noindex: d.noindex,
          });
        } else {
          const created = await base44.entities.PageMeta.create({
            path: r.path,
            title: d.title,
            description: d.description,
            noindex: d.noindex,
          });
          setRecords((p) => ({ ...p, [r.path]: created }));
        }
        ok++;
      } catch {
        /* skip individual failures */
      }
      setSavingAll((s) => ({ ...s, done: ok }));
    }
    setSavingAll({ active: false, done: ok, total: targets.length });
    await load();
    toast({ title: `Saved ${ok}/${targets.length} routes` });
  };

  const generateOg = async (path) => {
    const d = draft(path);
    if (!d.title) {
      toast({ title: 'Add a title first', variant: 'destructive' });
      return;
    }
    setGenPath(path);
    try {
      const res = await base44.functions.invoke('generateOgImage', {
        path,
        title: d.title,
        subtitle: d.description,
      });
      const data = res?.data ?? res;
      if (data?.url) {
        // Merge the server-persisted record (carries id) so a later Save updates
        // instead of creating a duplicate that would shadow the generated card.
        setRecords((p) => ({
          ...p,
          [path]: {
            ...(p[path] || {}),
            ...(data.saved || {}),
            path,
            og_image: data.url,
            og_generated: true,
          },
        }));
        toast({ title: 'Social card generated' });
      } else {
        toast({ title: data?.error || 'Generation failed', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: e?.message || 'Generation failed', variant: 'destructive' });
    } finally {
      setGenPath(null);
    }
  };

  // Bulk-generate branded social cards for every route that doesn't have one yet.
  // Runs sequentially (each image takes 5-10s) and updates progress live.
  const generateAllMissing = async () => {
    const targets = routes.filter((r) => {
      const rec = records?.[r.path];
      return !rec?.og_generated && !r.dynamic;
    });
    if (!targets.length) {
      toast({ title: 'All routes already have social cards' });
      return;
    }
    setBulkGen({ active: true, done: 0, total: targets.length, current: targets[0].path });
    let done = 0;
    for (const r of targets) {
      const d = draft(r.path);
      setBulkGen({ active: true, done, total: targets.length, current: r.path });
      try {
        const res = await base44.functions.invoke('generateOgImage', {
          path: r.path,
          title: d.title,
          subtitle: d.description,
        });
        const data = res?.data ?? res;
        if (data?.url) {
          setRecords((p) => ({
            ...p,
            [r.path]: {
              ...(p[r.path] || {}),
              ...(data.saved || {}),
              path: r.path,
              og_image: data.url,
              og_generated: true,
            },
          }));
        }
      } catch {
        /* skip individual failures, continue */
      }
      done++;
      setBulkGen({ active: true, done, total: targets.length, current: r.path });
    }
    setBulkGen({ active: false, done, total: targets.length, current: '' });
    toast({ title: `Generated ${done} social cards` });
  };

  const filtered = routes.filter((r) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return r.path.toLowerCase().includes(q) || r.label.toLowerCase().includes(q);
  });

  const ogFor = (path) =>
    records?.[path]?.og_image || (META[path] && OG_IMAGES[ogKey(path)]) || OG_IMAGES.default;

  // Map route path to the OG_IMAGES category key used in routeMeta
  function ogKey(path) {
    if (path.startsWith('/lab')) return 'lab';
    if (path.startsWith('/store') || path.startsWith('/zora') || path === '/lab/nft')
      return 'store';
    if (
      path.startsWith('/map') ||
      path.startsWith('/location') ||
      path.startsWith('/bus') ||
      path.startsWith('/categories') ||
      path.startsWith('/category') ||
      path.startsWith('/regions') ||
      path === '/report' ||
      path === '/ar'
    )
      return 'map';
    if (
      path.startsWith('/campaign') ||
      path.startsWith('/capital') ||
      path.startsWith('/investor') ||
      path.startsWith('/portal') ||
      path === '/console' ||
      path === '/portfolio'
    )
      return 'campaign';
    if (
      path.startsWith('/adbusting') ||
      path.startsWith('/ecology') ||
      path.startsWith('/rivers') ||
      path.startsWith('/warzones') ||
      path === '/inhome'
    )
      return 'adbusting';
    if (path === '/lab/nft') return 'nft';
    return 'default';
  }

  return (
    <div>
      <div className="flex items-center gap-2 border-b border-slate2 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-silver/55">
        <Sparkles className="h-3.5 w-3.5 text-ozone" /> SEO · Social Cards · Metadata
      </div>

      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <div className="flex items-center gap-2 border border-slate2 px-2.5 py-1.5">
          <Search className="h-3 w-3 text-silver/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter routes…"
            className="w-44 bg-transparent font-mono text-[10px] uppercase tracking-[0.15em] text-silver placeholder:text-silver/30 focus:outline-none"
          />
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-silver/40">
          {records
            ? `${Object.keys(records).length} customized · ${routes.length} total routes`
            : 'loading…'}
        </span>
        <button
          onClick={saveAll}
          disabled={savingAll.active || !records}
          className="ml-auto flex items-center gap-1.5 border border-silver/60 bg-silver/5 px-3 py-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-silver transition-colors hover:bg-silver hover:text-void disabled:opacity-50"
        >
          {savingAll.active ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3 w-3" />
          )}
          {savingAll.active
            ? `Saving ${savingAll.done}/${savingAll.total}…`
            : `Save all${dirtyCount ? ` (${dirtyCount})` : ''}`}
        </button>
        <button
          onClick={generateAllMissing}
          disabled={bulkGen.active || !records}
          className="flex items-center gap-1.5 border border-ozone bg-ozone/10 px-3 py-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-ozone transition-colors hover:bg-ozone hover:text-void disabled:opacity-50"
        >
          {bulkGen.active ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          {bulkGen.active ? `Generating ${bulkGen.done}/${bulkGen.total}…` : 'Generate all missing'}
        </button>
      </div>
      {bulkGen.active && (
        <div className="px-4 pb-2 font-mono text-[9px] uppercase tracking-[0.15em] text-flare">
          → {bulkGen.current} ({bulkGen.done}/{bulkGen.total})
        </div>
      )}

      <p className="px-4 pb-3 font-mono text-[10px] leading-relaxed text-silver/45">
        Edit per-route titles, descriptions, and noindex. Generate a branded 1200×630 social-share
        card from the OOH brand kit — each card is saved to the route and served as its{' '}
        <code className="text-ozone">og:image</code>. Dynamic pages (store items, blog posts,
        locations) inherit their section fallback and override at render time.
      </p>

      <div className="divide-y divide-slate2/40">
        {filtered.map((route) => {
          const d = draft(route.path);
          const rec = records?.[route.path];
          const og = ogFor(route.path);
          const customized = !!rec;
          return (
            <div key={route.path} className="px-4 py-3.5">
              <div className="flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${isDirty(route.path) ? 'bg-flare animate-pulse' : customized ? 'bg-ozone' : 'bg-slate2'}`}
                  title={
                    isDirty(route.path) ? 'Unsaved changes' : customized ? 'Customized' : 'Default'
                  }
                />
                <span className="font-display text-sm font-bold text-silver">{route.label}</span>
                {route.dynamic && (
                  <span className="border border-flare/40 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] text-flare">
                    dynamic
                  </span>
                )}
                {customized && (
                  <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.15em] text-ozone">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    custom
                  </span>
                )}
                <a
                  href={route.path}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto text-silver/30 transition-colors hover:text-ozone"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
                <span className="font-mono text-[9px] tracking-[0.1em] text-silver/35">
                  {route.path}
                </span>
              </div>

              <div className="mt-2.5 flex flex-col gap-3 md:flex-row">
                {/* OG preview */}
                <div className="shrink-0">
                  <div className="relative h-[78px] w-[148px] overflow-hidden border border-slate2/50 bg-void">
                    {og ? (
                      <img src={og} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-slate2" />
                      </div>
                    )}
                    {rec?.og_generated && (
                      <span className="absolute right-1 top-1 border border-ozone/50 bg-void/80 px-1 py-0.5 font-mono text-[6px] uppercase tracking-[0.1em] text-ozone">
                        auto
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => generateOg(route.path)}
                    disabled={genPath === route.path}
                    className="mt-1.5 flex w-[148px] items-center justify-center gap-1.5 border border-ozone/50 bg-ozone/10 px-2 py-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-ozone transition-colors hover:bg-ozone hover:text-void disabled:opacity-50"
                  >
                    {genPath === route.path ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    {rec?.og_generated ? 'Regenerate' : 'Generate card'}
                  </button>
                </div>

                {/* Editors */}
                <div className="flex-1 space-y-2">
                  <div>
                    <label className="font-mono text-[8px] uppercase tracking-[0.2em] text-silver/45">
                      Title
                    </label>
                    <input
                      value={d.title}
                      onChange={(e) => setDraft(route.path, { title: e.target.value })}
                      className="mt-0.5 w-full border border-slate2/50 bg-void px-2 py-1.5 font-display text-[12px] text-silver focus:border-ozone focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[8px] uppercase tracking-[0.2em] text-silver/45">
                      Description
                    </label>
                    <textarea
                      value={d.description}
                      onChange={(e) => setDraft(route.path, { description: e.target.value })}
                      rows={2}
                      className="mt-0.5 w-full resize-none border border-slate2/50 bg-void px-2 py-1.5 font-display text-[11px] leading-relaxed text-silver focus:border-ozone focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setDraft(route.path, { noindex: !d.noindex })}
                      className={`flex items-center gap-1.5 border px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.15em] transition-colors ${d.noindex ? 'border-destructive bg-destructive/10 text-destructive' : 'border-slate2 text-silver/50 hover:border-silver/60'}`}
                    >
                      {d.noindex ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {d.noindex ? 'Noindex' : 'Indexable'}
                    </button>
                    <button
                      onClick={() => save(route.path)}
                      disabled={savingPath === route.path}
                      className="flex items-center gap-1.5 border border-ozone bg-ozone px-3 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-void transition-colors hover:bg-flare hover:border-flare disabled:opacity-50"
                    >
                      {savingPath === route.path ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
