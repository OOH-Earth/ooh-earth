import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { isAdmin } from '@/lib/clearance';
import Nav from '@/components/ooh/Nav';
import Breadcrumbs from '@/components/ooh/Breadcrumbs';
import SiteFooter from '@/components/ooh/SiteFooter';
import { useToast } from '@/components/ui/use-toast';
import {
  Loader2,
  Lock,
  ExternalLink,
  Power,
  Eye,
  EyeOff,
  Gauge,
  ArrowUpRight,
  Briefcase,
} from 'lucide-react';
import { ROLES, STATUS_META } from '@/components/ooh/careers/roles';
import CollapsibleSection from '@/components/ooh/lab/CollapsibleSection';

// tones: ozone (live/visible) · flare (future) · slate (filled) · red (draft/hidden)
const TONES = {
  ozone: 'border-ozone bg-ozone text-void shadow-[0_0_14px_rgba(237,255,0,0.28)]',
  flare: 'border-flare bg-flare text-void shadow-[0_0_14px_rgba(255,92,0,0.30)]',
  slate: 'border-silver/50 bg-silver/80 text-void',
  red: 'border-destructive bg-destructive text-destructive-foreground shadow-[0_0_14px_rgba(255,0,0,0.22)]',
};

const Tog = ({ active, onClick, children, tone = 'ozone' }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.15em] transition-all ${
      active
        ? TONES[tone]
        : 'border-slate2 text-silver/50 hover:border-silver/60 hover:text-silver/80'
    }`}
  >
    <span className={`h-1.5 w-1.5 ${active ? 'bg-void/70' : 'bg-silver/30'}`} />
    {children}
  </button>
);

function Stat({ label, value, tone }) {
  const toneCls =
    tone === 'ozone'
      ? 'text-ozone'
      : tone === 'flare'
        ? 'text-flare'
        : tone === 'red'
          ? 'text-destructive'
          : 'text-silver/40';
  return (
    <div className="flex items-baseline gap-2 border border-slate2 px-3 py-2">
      <span className={`font-mono text-lg font-bold tabular ${toneCls}`}>{value}</span>
      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-silver/40">
        {label}
      </span>
    </div>
  );
}

const STATUS_TONE = { live: 'ozone', future: 'flare', filled: 'slate', draft: 'red' };

export default function CareersAdmin() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState(null);
  const [saving, setSaving] = useState(null);

  const load = useCallback(async () => {
    try {
      let recs = await base44.entities.CareerRoleStatus.list('sort_order');
      // Auto-provision any role from the roles.js registry that has no record yet,
      // so a new role added there shows up here automatically and stays togglable.
      // Idempotent — keyed on role_id.
      const missing = ROLES.filter((r) => !recs.some((rec) => rec.role_id === r.id));
      if (missing.length) {
        await Promise.all(
          missing.map((r, i) =>
            base44.entities.CareerRoleStatus.create({
              role_id: r.id,
              title: r.title,
              status: r.status || 'future',
              visible: true,
              sort_order: ROLES.findIndex((x) => x.id === r.id),
            }).catch(() => null),
          ),
        );
        recs = await base44.entities.CareerRoleStatus.list('sort_order');
      }
      setItems(recs);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (rec, patch, label) => {
    setSaving(rec.id);
    try {
      await base44.entities.CareerRoleStatus.update(rec.id, patch);
      setItems((prev) => prev.map((r) => (r.id === rec.id ? { ...r, ...patch } : r)));
      toast({ title: `${label} saved` });
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-void">
        <Nav />
        <div className="page-top flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-ozone" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin(user)) {
    return (
      <div className="min-h-screen bg-void text-silver">
        <Nav />
        <div className="page-top mx-auto max-w-md px-5 py-20 text-center">
          <Lock className="mx-auto h-8 w-8 text-flare" />
          <h1 className="mt-4 font-display text-2xl font-bold">Admin only</h1>
          <p className="mt-2 font-mono text-[11px] leading-relaxed text-silver/60">
            The careers control console is restricted to admin accounts. Log in with an admin
            account to manage role status and visibility.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block border border-ozone bg-ozone px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-void"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  const counts = {
    live: items?.filter((r) => r.status === 'live').length || 0,
    future: items?.filter((r) => r.status === 'future').length || 0,
    filled: items?.filter((r) => r.status === 'filled').length || 0,
    hidden: items?.filter((r) => r.visible === false).length || 0,
  };

  return (
    <div className="min-h-screen bg-void text-silver grid-bg">
      <Nav />
      <div className="page-top mx-auto max-w-5xl px-5 py-10 md:px-8">
        <Breadcrumbs items={[{ label: 'Careers', to: '/careers' }, { label: 'Console' }]} />

        {/* Console header */}
        <div className="mt-4 border border-slate2 bg-card">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate2 px-4 py-3">
            <Briefcase className="h-5 w-5 text-ozone" />
            <h1 className="font-display text-xl font-bold uppercase tracking-[0.16em]">
              Careers Control <span className="text-ozone">Console</span>
            </h1>
            <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-silver/50">
              <span className="h-1.5 w-1.5 animate-pulse bg-ozone" /> live sync
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 px-4 py-3">
            <Stat label="live" value={counts.live} tone="ozone" />
            <Stat label="future" value={counts.future} tone="flare" />
            <Stat label="filled" value={counts.filled} tone="slate" />
            <Stat label="hidden" value={counts.hidden} tone="red" />
            <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.18em] text-silver/40">
              {items?.length || 0} roles
            </span>
          </div>
        </div>

        <p className="mt-4 max-w-2xl font-mono text-[11px] leading-relaxed text-silver/55">
          Each role toggles status (live / future need / filled / draft) and public visibility. Role
          content — title, description, responsibilities — stays in code at{' '}
          <span className="text-silver/80">src/components/ooh/careers/roles.js</span>; this console
          only controls what's live on{' '}
          <Link to="/careers" className="text-ozone hover:underline">
            /careers
          </Link>{' '}
          right now.
        </p>

        {items === null ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-ozone" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-20 text-center font-mono text-[11px] text-silver/50">
            No roles registered.
          </p>
        ) : (
          <CollapsibleSection
            title="Roles"
            icon={<Gauge className="h-3.5 w-3.5 text-ozone" />}
            right={
              <span className="font-mono text-[9px] tracking-[0.1em] text-silver/35">
                {counts.live} live · {counts.future} future · {counts.filled} filled ·{' '}
                {counts.hidden} hidden
              </span>
            }
          >
            <div className="space-y-1.5 p-3">
              {items.map((r, i) => {
                const hidden = r.visible === false;
                const roleContent = ROLES.find((x) => x.id === r.role_id);
                const st = STATUS_META[r.status] || STATUS_META.future;
                const led = hidden
                  ? 'bg-destructive'
                  : r.status === 'live'
                    ? 'bg-ozone'
                    : r.status === 'future'
                      ? 'bg-flare'
                      : 'bg-silver/50';
                return (
                  <div
                    key={r.id}
                    className={`border bg-card transition-colors ${hidden ? 'border-destructive/30' : 'border-slate2 hover:border-silver/30'}`}
                  >
                    {/* role header */}
                    <div className="flex items-center gap-3 border-b border-slate2 px-4 py-2.5">
                      <span className="font-mono text-[10px] tabular text-silver/40">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={`h-2 w-2 rounded-full ${led} ${hidden ? '' : 'animate-pulse'}`}
                        title={hidden ? 'hidden' : st.label}
                      />
                      <span className="font-display text-sm font-bold">{r.title}</span>
                      {roleContent && (
                        <a
                          href={`/careers/${r.role_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-silver/30 transition-colors hover:text-ozone"
                          title="Open role page"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {!roleContent && (
                        <span className="border border-destructive/40 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] text-destructive/80">
                          orphaned — removed from roles.js
                        </span>
                      )}
                      <span className="ml-auto font-mono text-[9px] tracking-[0.1em] text-silver/35">
                        {roleContent?.category || '—'}
                      </span>
                      {saving === r.id && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-ozone" />
                      )}
                    </div>

                    {/* controls */}
                    <div className="flex flex-wrap items-end gap-x-7 gap-y-4 px-4 py-3.5">
                      <Ctrl label="Status" icon={<Power className="h-3 w-3" />}>
                        {['live', 'future', 'filled', 'draft'].map((s) => (
                          <Tog
                            key={s}
                            active={r.status === s}
                            tone={STATUS_TONE[s]}
                            onClick={() => save(r, { status: s }, 'Status')}
                          >
                            {s}
                          </Tog>
                        ))}
                      </Ctrl>

                      <Ctrl
                        label="Visible"
                        icon={hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      >
                        <Tog
                          active={!hidden}
                          tone="ozone"
                          onClick={() => save(r, { visible: true }, 'Visibility')}
                        >
                          On
                        </Tog>
                        <Tog
                          active={hidden}
                          tone="red"
                          onClick={() => save(r, { visible: false }, 'Visibility')}
                        >
                          Off
                        </Tog>
                      </Ctrl>
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        )}

        <Link
          to="/careers"
          className="mt-6 inline-flex items-center gap-2 border border-slate2 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-silver/70 transition-colors hover:border-ozone hover:text-ozone"
        >
          <ArrowUpRight className="h-3.5 w-3.5" /> View live page
        </Link>
      </div>
      <SiteFooter />
    </div>
  );
}

function Ctrl({ label, icon, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-silver/45">
        {icon}
        {label}
      </div>
      <div className="flex gap-1.5">{children}</div>
    </div>
  );
}
