import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import Nav from "@/components/ooh/Nav";
import HorizonProgress from "@/components/ooh/HorizonProgress";
import { Loader2, LogOut, Check, X, MapPin, ShieldCheck, ArrowUpRight, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import LocationThumb from "@/components/ooh/map/LocationThumb";

const STATUS_BADGE = {
  pending: "border-ozone/50 text-ozone",
  verified: "border-silver/30 text-silver",
  rejected: "border-flare/50 text-flare",
};

function Row({ r, onVerify, busy, triage }) {
  return (
    <div className="flex items-center gap-3 border border-slate2/50 bg-card p-3">
      <LocationThumb m={{ image: r.image_url, type: r.type, title: r.title }} className="h-14 w-14 border border-slate2/50" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-display text-sm font-bold text-silver">{r.title}</span>
          <span className={`shrink-0 border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] ${STATUS_BADGE[r.status] || ""}`}>{r.status}</span>
          {triage && <span className="shrink-0 border border-flare/60 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-flare">Triage</span>}
        </div>
        <p className="truncate font-mono text-[9px] uppercase tracking-[0.15em] text-dim">{r.address || `${r.lat?.toFixed(4)}, ${r.lng?.toFixed(4)}`}</p>
      </div>
      {onVerify && (
        <div className="flex shrink-0 gap-1">
          <button onClick={() => onVerify(r.id, "verified")} disabled={busy} aria-label="Approve" className="flex h-7 w-7 items-center justify-center border border-ozone/50 text-ozone transition-colors hover:bg-ozone hover:text-void disabled:opacity-40"><Check className="h-3.5 w-3.5" /></button>
          <button onClick={() => onVerify(r.id, "rejected")} disabled={busy} aria-label="Reject" className="flex h-7 w-7 items-center justify-center border border-flare/50 text-flare transition-colors hover:bg-flare hover:text-void disabled:opacity-40"><X className="h-3.5 w-3.5" /></button>
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

  const load = useCallback(async () => {
    const u = await base44.auth.me();
    setUser(u);
    const [myList, pendList] = await Promise.all([
      base44.entities.Location.filter({ created_by_id: u.id }, "-created_date", 100),
      u.role === "admin" ? base44.entities.Location.filter({ status: "pending" }, "-created_date", 100) : Promise.resolve([]),
    ]);
    setMine(myList || []);
    setPending(pendList || []);
  }, []);

  useEffect(() => {
    (async () => {
      try { await load(); } catch { /* auth handled by route guard */ }
      finally { setLoading(false); }
    })();
  }, [load]);

  useEffect(() => {
    const unsub = base44.entities.Location.subscribe(() => { load(); });
    return () => { if (unsub) unsub(); };
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  };

  const verify = async (id, status) => {
    setBusy((b) => ({ ...b, [id]: true }));
    try {
      await base44.entities.Location.update(id, { status });
      setPending((p) => p.filter((r) => r.id !== id));
    } catch { /* error bubbles */ }
    finally { setBusy((b) => ({ ...b, [id]: false })); }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void">
        <Loader2 className="h-6 w-6 animate-spin text-ozone" />
      </div>
    );
  }

  const isAdmin = user?.role === "admin";
  const triageScore = (r) => (r.image_url ? 2 : 0) + (r.source_link ? 1 : 0);
  const sortedPending = [...pending].sort((a, b) => triageScore(b) - triageScore(a));
  const triageCount = sortedPending.filter((r) => triageScore(r) >= 2).length;

  return (
    <div className="relative min-h-screen bg-void">
      <HorizonProgress />
      <Nav />
      <main className="px-5 pb-24 pt-28 md:px-8">
        <div className="mx-auto max-w-4xl">
          {/* header */}
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate2/50 pb-6">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Operative console</span>
              <h1 className="mt-2 font-display text-4xl font-bold leading-[1.02] tracking-[-0.02em] text-silver md:text-5xl">Dashboard</h1>
              <p className="mt-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
                {user?.email}
                {isAdmin ? <span className="flex items-center gap-1 border border-ozone/50 px-2 py-0.5 text-ozone"><ShieldCheck className="h-3 w-3" /> admin</span> : <span className="border border-slate2/60 px-2 py-0.5 text-darkgray">operative</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={refresh} aria-label="Refresh" className="flex items-center gap-1.5 border border-slate2 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              </button>
              <button onClick={() => base44.auth.logout("/")} className="flex items-center gap-2 border border-slate2 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-flare hover:text-flare">
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          </div>

          {/* admin verification queue */}
          {isAdmin && (
            <section className="mt-10">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold uppercase tracking-[-0.01em] text-silver">Verification queue</h2>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// {pending.length} pending {triageCount > 0 && <span className="text-flare/80">· {triageCount} triage</span>}</span>
              </div>
              <div className="mt-4 space-y-2">
                {sortedPending.length ? sortedPending.map((r) => <Row key={r.id} r={r} onVerify={verify} busy={busy[r.id]} triage={triageScore(r) >= 2} />) : (
                  <div className="border border-slate2/40 bg-card p-6 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// Queue clear — no pending captures</div>
                )}
              </div>
            </section>
          )}

          {/* my captures */}
          <section className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold uppercase tracking-[-0.01em] text-silver">My field captures</h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// {mine.length} filed</span>
            </div>
            <div className="mt-4 space-y-2">
              {mine.length ? mine.map((r) => <Row key={r.id} r={r} />) : (
                <div className="border border-slate2/40 bg-card p-6 text-center">
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// No captures filed yet</p>
                  <Link to="/map" className="mt-3 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-ozone">
                    Open the map <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}