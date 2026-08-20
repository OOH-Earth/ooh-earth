import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { roleOf, accessOf, payload } from '@/lib/clearance';
import Nav from '@/components/ooh/Nav';
import HorizonProgress from '@/components/ooh/HorizonProgress';
import {
  Loader2,
  LogOut,
  Check,
  X,
  ShieldCheck,
  ArrowUpRight,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Eye,
  FileText,
  Clock,
  Inbox,
  Flame,
  Search,
  ChevronDown,
  Activity,
  Route,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import LocationThumb from '@/components/ooh/map/LocationThumb';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import PullToRefresh from '@/components/ooh/PullToRefresh';
import PersonaControl from '@/components/ooh/PersonaControl';
import { STATUS_BADGE_CLASSES as STATUS_BADGE } from '@/lib/statusBadge';
import { trackEvent } from '@/lib/trackEvent';

const ACCESS_BADGE = {
  admin: 'border-ozone/50 text-ozone',
  moderator: 'border-flare/50 text-flare',
  operative: 'border-silver/40 text-silver',
  member: 'border-slate2/60 text-darkgray',
};
const MINE_FILTERS = [
  ['all', 'All'],
  ['pending', 'Pending'],
  ['verified', 'Verified'],
  ['rejected', 'Rejected'],
];

// normalise the two moderatable entities into one row shape
const normLoc = (r) => ({
  ...r,
  _entity: 'Location',
  _title: r.title || 'Untitled capture',
  _sub: r.address || (r.lat != null ? `${r.lat.toFixed(4)}, ${r.lng?.toFixed?.(4)}` : ''),
  _type: r.type,
});
const normBust = (b) => ({
  ...b,
  _entity: 'DigitalBust',
  _title: b.target_brand || b.platform_name || b.surface || 'Digital bust',
  _sub: [b.platform, b.region].filter(Boolean).join(' · ') || b.surface || '',
  _type: b.platform,
  image_url: b.image_url || null,
  source_link: b.proof_url || null,
});
const normFieldCheck = (c) => ({
  ...c,
  _entity: 'FieldCheck',
  _title: c.location_title || c.brand_name || 'Field check',
  _sub: [c.brand_name, c.address].filter(Boolean).join(' · '),
  _type: c.location_type,
});

const timeAgo = (iso) => {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

function StatCard({ label, value, Icon, tone = 'text-silver' }) {
  return (
    <div className="min-w-[128px] flex-1 border border-slate2/60 bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">{label}</span>
        <Icon className={`h-3.5 w-3.5 ${tone}`} />
      </div>
      <div className={`mt-2 font-mono text-3xl font-bold tabular ${tone}`}>{value}</div>
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`border px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em] transition-colors ${active ? 'border-ozone bg-ozone/[0.08] text-ozone' : 'border-slate2/60 text-dim hover:border-ozone/40 hover:text-silver'}`}
    >
      {children}
    </button>
  );
}

function Row({
  n,
  onVerify = null,
  busy = false,
  triage = false,
  selectable = false,
  selected = false,
  onToggle = null,
}) {
  return (
    <div
      className={`flex items-center gap-3 border bg-card p-3 ${selected ? 'border-ozone/60' : 'border-slate2/50'}`}
    >
      {selectable && (
        <button
          onClick={onToggle}
          aria-pressed={selected}
          aria-label="Select capture"
          className={`flex h-5 w-5 shrink-0 items-center justify-center border transition-colors ${selected ? 'border-ozone bg-ozone text-void' : 'border-slate2 text-transparent hover:border-ozone/60'}`}
        >
          <Check className="h-3 w-3" />
        </button>
      )}
      <LocationThumb
        m={{ image: n.image_url, type: n._type, title: n._title }}
        className="h-14 w-14 border border-slate2/50"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-display text-sm font-bold text-silver">{n._title}</span>
          <span
            className={`shrink-0 border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] ${STATUS_BADGE[n.status] || ''}`}
          >
            {n.status}
          </span>
          {n._entity === 'DigitalBust' && (
            <span className="shrink-0 border border-silver/30 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-silver/70">
              bust
            </span>
          )}
          {n._entity === 'FieldCheck' && (
            <span className="shrink-0 border border-ozone/30 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-ozone/70">
              re-check
            </span>
          )}
          {triage && (
            <span className="shrink-0 border border-flare/60 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-flare">
              Triage
            </span>
          )}
        </div>
        <p className="truncate font-mono text-[9px] uppercase tracking-[0.15em] text-dim">
          {n._type && <span className="text-darkgray">{n._type} · </span>}
          {n._sub}
        </p>
      </div>
      {onVerify && (
        <div className="flex shrink-0 gap-1">
          <button
            onClick={() => onVerify(n.id, 'verified', n._entity)}
            disabled={busy}
            aria-label="Approve"
            className="flex h-7 w-7 items-center justify-center border border-ozone/50 text-ozone transition-colors hover:bg-ozone hover:text-void disabled:opacity-40"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onVerify(n.id, 'rejected', n._entity)}
            disabled={busy}
            aria-label="Reject"
            className="flex h-7 w-7 items-center justify-center border border-flare/50 text-flare transition-colors hover:bg-flare hover:text-void disabled:opacity-40"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [mine, setMine] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewAs, setPreviewAs] = useState(null);
  // ui
  const [mineFilter, setMineFilter] = useState('all');
  const [mineOpen, setMineOpen] = useState(true);
  const [queueOpen, setQueueOpen] = useState(true);
  const [qSearch, setQSearch] = useState('');
  const [qTriageOnly, setQTriageOnly] = useState(false);
  const [qType, setQType] = useState('all');
  const [selected, setSelected] = useState(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await base44.auth.logout('/');
    } catch {
      setDeleting(false);
    }
  };

  const load = useCallback(async () => {
    const u = await base44.auth.me();
    setUser(u);
    const canViewQueue =
      roleOf(u) === 'admin' ||
      accessOf(u) === 'admin' ||
      accessOf(u) === 'moderator' ||
      accessOf(u) === 'operative';
    const myTask = base44.entities.Location.filter({ created_by_id: u.id }, '-created_date', 100);
    const pendTask = canViewQueue
      ? base44.functions
          .invoke('moderate', { action: 'queue' })
          .then((res) => {
            const d = payload(res) || {};
            return [
              ...(d.locations || []).map(normLoc),
              ...(d.digital_busts || []).map(normBust),
              ...(d.field_checks || []).map(normFieldCheck),
            ];
          })
          .catch(() => [])
      : Promise.resolve([]);
    const [myList, pendList] = await Promise.all([myTask, pendTask]);
    setMine((myList || []).map(normLoc));
    setPending(pendList || []);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch {
        /* route guard */
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  useEffect(() => {
    const u1 = base44.entities.Location.subscribe(() => {
      load();
    });
    let u2;
    try {
      u2 = base44.entities.DigitalBust?.subscribe?.(() => {
        load();
      });
    } catch {
      u2 = null;
    }
    let u3;
    try {
      u3 = base44.entities.FieldCheck?.subscribe?.(() => {
        load();
      });
    } catch {
      u3 = null;
    }
    return () => {
      if (u1) u1();
      if (u2) u2();
      if (u3) u3();
    };
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const verify = async (id, status, entity = 'Location') => {
    setBusy((b) => ({ ...b, [id]: true }));
    try {
      await base44.functions.invoke('moderate', { action: 'verify', entity, id, status });
      // A genuine verification transition only -- never on reject, never
      // for DigitalBust (not one of the approved analytics events).
      if (status === 'verified') {
        if (entity === 'Location') trackEvent('report_verified');
        else if (entity === 'FieldCheck') trackEvent('recheck_verified');
      }
      setPending((p) => p.filter((r) => !(r.id === id && r._entity === entity)));
      setSelected((s) => {
        const ns = new Set(s);
        ns.delete(`${entity}:${id}`);
        return ns;
      });
    } catch {
      /* bubbles */
    } finally {
      setBusy((b) => ({ ...b, [id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void">
        <Loader2 className="h-6 w-6 animate-spin text-ozone" />
      </div>
    );
  }

  const realIsAdmin = roleOf(user) === 'admin' || accessOf(user) === 'admin';
  const realCanAct = realIsAdmin || accessOf(user) === 'moderator';
  const realCanView = realCanAct || accessOf(user) === 'operative';
  const effAccess = previewAs || (realIsAdmin ? 'admin' : accessOf(user));
  const isAdmin = previewAs ? previewAs === 'admin' : realIsAdmin;
  const canAct = previewAs ? previewAs === 'admin' || previewAs === 'moderator' : realCanAct;
  const canView = previewAs
    ? previewAs === 'admin' || previewAs === 'moderator' || previewAs === 'operative'
    : realCanView;

  const triageScore = (r) => (r.image_url ? 2 : 0) + (r.source_link ? 1 : 0);
  const sortedPending = [...pending].sort((a, b) => triageScore(b) - triageScore(a));
  const triageCount = sortedPending.filter((r) => triageScore(r) >= 2).length;

  const myVerified = mine.filter((r) => r.status === 'verified').length;
  const myPending = mine.filter((r) => r.status === 'pending').length;
  const queueTypes = [...new Set(sortedPending.map((r) => r._type).filter(Boolean))].sort();
  const filteredQueue = sortedPending.filter((r) => {
    if (qTriageOnly && triageScore(r) < 2) return false;
    if (qType !== 'all' && r._type !== qType) return false;
    if (qSearch.trim()) {
      const s = qSearch.trim().toLowerCase();
      if (!((r._title || '').toLowerCase().includes(s) || (r._sub || '').toLowerCase().includes(s)))
        return false;
    }
    return true;
  });
  const filteredMine = mineFilter === 'all' ? mine : mine.filter((r) => r.status === mineFilter);

  const keyOf = (n) => `${n._entity}:${n.id}`;
  const toggleSel = (n) =>
    setSelected((s) => {
      const k = keyOf(n);
      const ns = new Set(s);
      if (ns.has(k)) ns.delete(k);
      else ns.add(k);
      return ns;
    });
  const allFilteredSelected =
    filteredQueue.length > 0 && filteredQueue.every((n) => selected.has(keyOf(n)));
  const toggleAll = () =>
    setSelected((s) => {
      const ns = new Set(s);
      if (allFilteredSelected) filteredQueue.forEach((n) => ns.delete(keyOf(n)));
      else filteredQueue.forEach((n) => ns.add(keyOf(n)));
      return ns;
    });
  const bulkVerify = async (status) => {
    const items = pending.filter((n) => selected.has(keyOf(n)));
    if (!items.length) return;
    setBulkBusy(true);
    try {
      for (const n of items) {
        await verify(n.id, status, n._entity);
      }
    } finally {
      setBulkBusy(false);
      setSelected(new Set());
    }
  };

  const cards = [
    { label: 'Filed', value: mine.length, Icon: FileText, tone: 'text-silver' },
    { label: 'Verified', value: myVerified, Icon: ShieldCheck, tone: 'text-brand-green' },
    { label: 'In review', value: myPending, Icon: Clock, tone: 'text-ozone' },
    ...(canView
      ? [{ label: 'In queue', value: pending.length, Icon: Inbox, tone: 'text-ozone' }]
      : []),
    ...(canAct ? [{ label: 'Triage', value: triageCount, Icon: Flame, tone: 'text-flare' }] : []),
  ];

  return (
    <div className="relative min-h-screen bg-void">
      <HorizonProgress />
      <Nav />
      <main className="page-top px-5 pb-24 md:px-8">
        <div className="mx-auto max-w-5xl">
          {/* header */}
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate2/50 pb-6">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
                // Member console
              </span>
              <h1 className="mt-2 font-display text-4xl font-bold leading-[1.02] tracking-[-0.02em] text-silver md:text-5xl">
                Dashboard
              </h1>
              <p className="mt-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
                {user?.email}
                <span
                  className={`flex items-center gap-1 border px-2 py-0.5 ${ACCESS_BADGE[effAccess] || ACCESS_BADGE.member}`}
                >
                  {(effAccess === 'admin' || effAccess === 'moderator') && (
                    <ShieldCheck className="h-3 w-3" />
                  )}{' '}
                  {effAccess}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {realIsAdmin && (
                <div className="flex items-center gap-1.5 border border-ozone/30 bg-ozone/[0.03] pl-2.5">
                  <Eye className="h-3 w-3 text-dim" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
                    Preview
                  </span>
                  <select
                    value={previewAs ?? ''}
                    onChange={(e) => setPreviewAs(e.target.value || null)}
                    aria-label="Preview as role"
                    className="cursor-pointer border-0 bg-transparent py-2 pr-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-ozone outline-none"
                  >
                    <option value="">live</option>
                    <option value="member">member</option>
                    <option value="operative">operative</option>
                    <option value="moderator">moderator</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
              )}
              <button
                onClick={refresh}
                aria-label="Refresh"
                className="flex items-center gap-1.5 border border-slate2 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => base44.auth.logout('/')}
                className="flex items-center gap-2 border border-slate2 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-flare hover:text-flare"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          </div>

          {previewAs && (
            <div className="mt-3 flex items-center gap-2 border border-flare/30 bg-flare/[0.04] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-flare/90">
              <Eye className="h-3 w-3" /> Previewing as {previewAs} · UI only — data &amp;
              permissions unchanged
            </div>
          )}

          {/* KPI cards */}
          <div className="mt-6 flex flex-wrap gap-3">
            {cards.map((c) => (
              <StatCard key={c.label} {...c} />
            ))}
          </div>

          {/* activity + roadmap */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="border border-slate2/60 bg-card p-4">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ozone">
                <Activity className="h-3.5 w-3.5" /> Recent activity
              </div>
              <div className="mt-3 space-y-2">
                {mine.length ? (
                  mine.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      className="flex items-center gap-2 border-b border-slate2/30 pb-2 last:border-0 last:pb-0"
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${n.status === 'verified' ? 'bg-brand-green' : n.status === 'rejected' ? 'bg-flare' : 'bg-ozone'}`}
                      />
                      <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-silver/80">
                        {n._title}
                      </span>
                      <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.15em] text-dim">
                        {n.status}
                      </span>
                      <span className="shrink-0 font-mono text-[9px] text-darkgray">
                        {timeAgo(n.created_date)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
                    // No activity yet
                  </p>
                )}
              </div>
            </div>
            <Link
              to="/plans"
              className="group flex flex-col justify-between border border-slate2/60 bg-card p-4 transition-colors hover:border-ozone/50"
            >
              <div>
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ozone">
                  <Route className="h-3.5 w-3.5" /> Roadmap
                </div>
                <p className="mt-2 font-mono text-[11px] leading-relaxed text-silver/60">
                  Where the movement is headed — plans, milestones, and how to plug in.
                </p>
              </div>
              <span className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ozone">
                View plans{' '}
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>

          {/* ── PRIMARY: my captures — collapsible dropdown ── */}
          <section className="mt-10">
            <button
              onClick={() => setMineOpen((o) => !o)}
              aria-expanded={mineOpen}
              className="flex w-full items-center justify-between gap-3 border border-slate2/50 bg-card/40 px-4 py-3 text-left transition-colors hover:border-ozone/40"
            >
              <span className="flex flex-wrap items-center gap-2 font-display text-lg font-bold uppercase tracking-[-0.01em] text-silver">
                <FileText className="h-4 w-4 text-ozone" /> My field captures
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
                  // {mine.length} filed
                  {myVerified > 0 && (
                    <span className="text-brand-green"> · {myVerified} verified</span>
                  )}
                  {myPending > 0 && <span className="text-ozone"> · {myPending} in review</span>}
                </span>
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-dim transition-transform ${mineOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {mineOpen && (
              <div className="mt-3">
                <div className="flex flex-wrap items-center gap-1.5 border border-slate2/40 bg-card/30 p-2">
                  {MINE_FILTERS.map(([key, label]) => (
                    <Chip key={key} active={mineFilter === key} onClick={() => setMineFilter(key)}>
                      {label}{' '}
                      {key === 'all' ? mine.length : mine.filter((r) => r.status === key).length}
                    </Chip>
                  ))}
                  <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
                    {filteredMine.length} shown
                  </span>
                </div>
                <PullToRefresh
                  onRefresh={refresh}
                  className="mt-2 max-h-[55vh] min-h-0 lg:max-h-none"
                >
                  <div className="space-y-2">
                    {filteredMine.length ? (
                      filteredMine.map((n) => <Row key={n.id} n={n} />)
                    ) : (
                      <div className="border border-slate2/40 bg-card p-6 text-center">
                        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
                          //{' '}
                          {mine.length ? 'No captures match this filter' : 'No captures filed yet'}
                        </p>
                        {!mine.length && (
                          <Link
                            to="/map"
                            className="mt-3 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-ozone"
                          >
                            Open the map <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </PullToRefresh>
              </div>
            )}
          </section>

          {/* ── SECONDARY: verification queue — collapsible + filters + bulk ── */}
          {canView && (
            <section className="mt-10">
              <button
                onClick={() => setQueueOpen((o) => !o)}
                aria-expanded={queueOpen}
                className="flex w-full items-center justify-between gap-3 border border-slate2/50 bg-card/40 px-4 py-3 text-left transition-colors hover:border-ozone/40"
              >
                <span className="flex flex-wrap items-center gap-2 font-display text-lg font-bold uppercase tracking-[-0.01em] text-silver">
                  <Inbox className="h-4 w-4 text-ozone" />{' '}
                  {canAct ? 'Verification queue' : 'Incoming intel'}
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
                    // {pending.length} pending
                    {triageCount > 0 && (
                      <span className="text-flare/80"> · {triageCount} triage</span>
                    )}
                    {!canAct && ' · read-only'}
                  </span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-dim transition-transform ${queueOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {queueOpen && (
                <div className="mt-3">
                  {/* filter bar */}
                  <div className="flex flex-wrap items-center gap-2 border border-slate2/40 bg-card/30 p-2">
                    <div className="relative min-w-[160px] flex-1">
                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-darkgray" />
                      <input
                        value={qSearch}
                        onChange={(e) => setQSearch(e.target.value)}
                        placeholder="Search title or location"
                        className="w-full border border-slate2 bg-void py-1.5 pl-8 pr-2 font-mono text-[10px] text-silver outline-none transition-colors placeholder:text-darkgray focus:border-ozone"
                      />
                    </div>
                    <Chip active={qTriageOnly} onClick={() => setQTriageOnly((v) => !v)}>
                      Triage only
                    </Chip>
                    {queueTypes.length > 0 && (
                      <select
                        value={qType}
                        onChange={(e) => setQType(e.target.value)}
                        className="border border-slate2 bg-void px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-silver"
                      >
                        <option value="all">all types</option>
                        {queueTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    )}
                    {canAct && filteredQueue.length > 0 && (
                      <button
                        onClick={toggleAll}
                        className="border border-slate2/60 px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-dim transition-colors hover:border-ozone/40 hover:text-silver"
                      >
                        {allFilteredSelected ? 'Deselect all' : 'Select all'}
                      </button>
                    )}
                    <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
                      {filteredQueue.length} shown
                    </span>
                  </div>

                  {/* bulk action bar */}
                  {canAct && selected.size > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 border border-ozone/40 bg-ozone/[0.05] px-3 py-2">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ozone">
                        {selected.size} selected
                      </span>
                      <button
                        onClick={() => bulkVerify('verified')}
                        disabled={bulkBusy}
                        className="flex items-center gap-1.5 border border-ozone bg-ozone px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-void transition-colors hover:bg-flare hover:border-flare disabled:opacity-50"
                      >
                        <Check className="h-3 w-3" /> Approve
                      </button>
                      <button
                        onClick={() => bulkVerify('rejected')}
                        disabled={bulkBusy}
                        className="flex items-center gap-1.5 border border-flare px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-flare transition-colors hover:bg-flare hover:text-void disabled:opacity-50"
                      >
                        <X className="h-3 w-3" /> Reject
                      </button>
                      <button
                        onClick={() => setSelected(new Set())}
                        className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim transition-colors hover:text-silver"
                      >
                        Clear
                      </button>
                      {bulkBusy && <Loader2 className="h-3.5 w-3.5 animate-spin text-ozone" />}
                    </div>
                  )}

                  {/* scrollable list */}
                  <div className="mt-2 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                    {filteredQueue.length ? (
                      filteredQueue.map((n) => (
                        <Row
                          key={keyOf(n)}
                          n={n}
                          onVerify={canAct ? verify : undefined}
                          busy={busy[n.id]}
                          triage={triageScore(n) >= 2}
                          selectable={canAct}
                          selected={selected.has(keyOf(n))}
                          onToggle={() => toggleSel(n)}
                        />
                      ))
                    ) : (
                      <div className="border border-slate2/40 bg-card p-6 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
                        //{' '}
                        {pending.length
                          ? 'No captures match these filters'
                          : 'Queue clear — no pending captures'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ── ADMIN TOOLS: persona control (collapsible) ── */}
          {isAdmin && <PersonaControl meId={user?.id} />}

          {/* ── danger zone ── */}
          <section className="mt-10">
            <div className="border border-flare/40">
              <div className="border-b border-flare/30 px-4 py-3">
                <h2 className="flex items-center gap-2 font-display text-lg font-bold text-flare">
                  <AlertTriangle className="h-4 w-4" /> Danger zone
                </h2>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
                  // irreversible account actions
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
                <div>
                  <div className="font-display text-sm font-semibold text-silver">
                    Delete account
                  </div>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-darkgray">
                    Permanently sign out and remove your member session. This cannot be undone.
                  </p>
                </div>
                <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                  <AlertDialogTrigger asChild>
                    <button className="flex items-center gap-2 border border-flare px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-flare transition-colors hover:bg-flare hover:text-void">
                      <Trash2 className="h-3.5 w-3.5" /> Delete account
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-flare/50 bg-void">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-display text-lg font-bold text-silver">
                        Delete account?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="font-mono text-[11px] leading-relaxed text-darkgray">
                        This will sign you out permanently. To fully erase your stored data, contact
                        Base44 support after confirming. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-slate2 font-mono text-[10px] uppercase tracking-[0.2em] text-darkgray">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={deleteAccount}
                        disabled={deleting}
                        className="border border-flare bg-flare font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-void hover:bg-flare/80"
                      >
                        {deleting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          'Confirm deletion'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
