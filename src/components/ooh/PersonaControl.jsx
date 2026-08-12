import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, RefreshCw, Users, Save, History, Building2, ChevronDown } from 'lucide-react';

const ROLES = ['admin', 'user'];
const ACCESS = ['admin', 'moderator', 'operative', 'member'];

const ACCESS_CLR = {
  admin: 'text-ozone border-ozone/50',
  moderator: 'text-flare border-flare/50',
  operative: 'text-silver border-silver/40',
  member: 'text-darkgray border-slate2/60',
};

// unwrap base44.functions.invoke result (SDK returns { data })
const payload = (res) => (res && typeof res === 'object' && 'data' in res ? res.data : res);

const fmtWhen = (iso) => {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

export default function PersonaControl({ meId }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [users, setUsers] = useState(null);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [log, setLog] = useState([]);

  const loadLog = useCallback(async () => {
    try {
      setLog((await base44.entities.AccessLog.list('-created_date', 8)) || []);
    } catch {
      setLog([]);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const data = payload(await base44.functions.invoke('personaCtl', { action: 'list' }));
      if (data?.error) throw new Error(data.error);
      const list = data?.users || [];
      setUsers(list);
      const d = {};
      list.forEach((u) => {
        d[u.id] = { role: u.role, access: u.access, agency: !!u.agency };
      });
      setDraft(d);
    } catch (e) {
      setErr(e?.message || 'Failed to load roster.');
    } finally {
      setLoading(false);
    }
  }, []);

  // lazy-load the roster only once the section is expanded
  useEffect(() => {
    if (open && !loaded) {
      setLoaded(true);
      load();
      loadLog();
    }
  }, [open, loaded, load, loadLog]);

  const setField = (id, field, value) =>
    setDraft((d) => ({ ...d, [id]: { ...(d[id] || {}), [field]: value } }));

  const dirty = (u) => {
    const d = draft[u.id];
    return !!d && (d.role !== u.role || d.access !== u.access || !!d.agency !== !!u.agency);
  };

  const save = async (u) => {
    const next = draft[u.id];
    if (!next) return;
    setSaving((s) => ({ ...s, [u.id]: true }));
    setErr('');
    setNote('');
    try {
      const data = payload(
        await base44.functions.invoke('personaCtl', {
          action: 'set',
          id: u.id,
          role: next.role,
          access: next.access,
          agency: !!next.agency,
        }),
      );
      if (data?.error) throw new Error(data.error);
      setUsers(data?.users || []);
      setNote(`${u.email} → ${next.role} / ${next.access}${next.agency ? ' · agency' : ''}`);
      loadLog();
    } catch (e) {
      setErr(e?.message || 'Save failed.');
    } finally {
      setSaving((s) => ({ ...s, [u.id]: false }));
    }
  };

  return (
    <section className="mt-10">
      {/* disclosure header — click to reveal/hide */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 border border-slate2/50 bg-card/40 px-4 py-3 text-left transition-colors hover:border-ozone/40"
      >
        <span className="flex items-center gap-2 font-display text-lg font-bold uppercase tracking-[-0.01em] text-silver">
          <Users className="h-4 w-4 text-ozone" /> Persona control
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
            // admin{users ? ` · ${users.length}` : ''}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-dim transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="mt-3">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
              // role + clearance + agency access · admin only
            </p>
            <button
              onClick={() => {
                load();
                loadLog();
              }}
              aria-label="Reload roster"
              className="flex shrink-0 items-center gap-1.5 border border-slate2 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Reload
            </button>
          </div>

          {err && (
            <div className="mt-3 border border-flare/50 bg-flare/5 px-3 py-2 font-mono text-[10px] text-flare">
              {err}
            </div>
          )}
          {note && (
            <div className="mt-3 border border-ozone/40 bg-ozone/5 px-3 py-2 font-mono text-[10px] text-ozone">
              ✓ {note}
            </div>
          )}

          <div className="mt-4 space-y-2">
            {loading && !users ? (
              <div className="flex items-center justify-center border border-slate2/40 bg-card p-6">
                <Loader2 className="h-4 w-4 animate-spin text-ozone" />
              </div>
            ) : (
              (users || []).map((u) => {
                const d = draft[u.id] || { role: u.role, access: u.access, agency: !!u.agency };
                return (
                  <div
                    key={u.id}
                    className="flex flex-wrap items-center gap-3 border border-slate2/50 bg-card p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-display text-sm font-bold text-silver">
                          {u.full_name || u.email}
                        </span>
                        {u.id === meId && (
                          <span className="shrink-0 border border-ozone/40 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-ozone">
                            you
                          </span>
                        )}
                        <span
                          className={`shrink-0 border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] ${ACCESS_CLR[u.access] || ACCESS_CLR.member}`}
                        >
                          {u.access}
                        </span>
                        {u.agency && (
                          <span className="shrink-0 border border-flare/50 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-flare">
                            agency
                          </span>
                        )}
                      </div>
                      <p className="truncate font-mono text-[9px] uppercase tracking-[0.15em] text-dim">
                        {u.email}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                      <label className="flex flex-col gap-0.5">
                        <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-darkgray">
                          role
                        </span>
                        <select
                          value={d.role}
                          onChange={(e) => setField(u.id, 'role', e.target.value)}
                          className="border border-slate2 bg-void px-2 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-silver"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-0.5">
                        <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-darkgray">
                          access
                        </span>
                        <select
                          value={d.access}
                          onChange={(e) => setField(u.id, 'access', e.target.value)}
                          className="border border-slate2 bg-void px-2 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-silver"
                        >
                          {ACCESS.map((a) => (
                            <option key={a} value={a}>
                              {a}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-0.5">
                        <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-darkgray">
                          agency
                        </span>
                        <button
                          type="button"
                          onClick={() => setField(u.id, 'agency', !d.agency)}
                          aria-pressed={!!d.agency}
                          className={`flex h-[30px] items-center gap-1.5 border px-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${d.agency ? 'border-flare bg-flare/15 text-flare' : 'border-slate2 text-darkgray hover:border-flare/60 hover:text-flare'}`}
                        >
                          <Building2 className="h-3.5 w-3.5" /> {d.agency ? 'On' : 'Off'}
                        </button>
                      </label>
                      <button
                        onClick={() => save(u)}
                        disabled={!dirty(u) || saving[u.id]}
                        className="flex h-[30px] items-center gap-1.5 self-end border border-ozone/50 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ozone transition-colors hover:bg-ozone hover:text-void disabled:opacity-30"
                      >
                        {saving[u.id] ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Save className="h-3.5 w-3.5" /> Save
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* recent access changes — audit trail */}
          {log.length > 0 && (
            <div className="mt-4 border border-slate2/40 bg-card/50 p-3">
              <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
                <History className="h-3 w-3" /> Recent changes
              </div>
              <div className="mt-2 space-y-1">
                {log.map((l) => (
                  <div
                    key={l.id}
                    className="flex flex-wrap items-center gap-x-2 font-mono text-[9px] tracking-[0.1em] text-darkgray"
                  >
                    <span className="text-dim">{fmtWhen(l.created_date)}</span>
                    <span className="text-silver">{l.target_email || l.target_id}</span>
                    <span>→</span>
                    <span className="text-flare/80">
                      {l.to_role}/{l.to_access}
                    </span>
                    <span className="text-dim">by {l.actor_email || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
