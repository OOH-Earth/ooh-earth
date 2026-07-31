import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import Nav from "@/components/ooh/Nav";
import HorizonProgress from "@/components/ooh/HorizonProgress";
import { Loader2, LogOut, Check, X, ShieldCheck, ArrowUpRight, RefreshCw, Trash2, AlertTriangle, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import LocationThumb from "@/components/ooh/map/LocationThumb";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import PullToRefresh from "@/components/ooh/PullToRefresh";
import PersonaControl from "@/components/ooh/PersonaControl";

const STATUS_BADGE = {
  pending: "border-ozone/50 text-ozone",
  verified: "border-silver/30 text-silver",
  rejected: "border-flare/50 text-flare",
};

const ACCESS_BADGE = {
  admin: "border-ozone/50 text-ozone",
  moderator: "border-flare/50 text-flare",
  operative: "border-silver/40 text-silver",
  member: "border-slate2/60 text-darkgray",
};

// unwrap base44.functions.invoke result (SDK returns { data })
const payload = (res) => (res && typeof res === "object" && "data" in res ? res.data : res);
// read clearance regardless of whether the SDK returns it flat or under .data
const accessOf = (u) => (u && (u.access ?? u.data?.access)) || "member";
const roleOf = (u) => (u && (u.role ?? u.data?.role)) || "user";

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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewAs, setPreviewAs] = useState(null); // UI-only persona preview

  const deleteAccount = async () => {
    setDeleting(true);
    try { await base44.auth.logout("/"); } catch { setDeleting(false); }
  };

  const load = useCallback(async () => {
    const u = await base44.auth.me();
    setUser(u);
    const elevated = roleOf(u) === "admin" || accessOf(u) === "admin";
    const canViewQueue = elevated || accessOf(u) === "moderator" || accessOf(u) === "operative";

    const myTask = base44.entities.Location.filter({ created_by_id: u.id }, "-created_date", 100);
    let pendTask;
    if (elevated) {
      pendTask = base44.entities.Location.filter({ status: "pending" }, "-created_date", 100);
    } else if (canViewQueue) {
      // moderators + operatives read the queue via the server-gated function
      pendTask = base44.functions
        .invoke("moderate", { action: "queue" })
        .then((res) => payload(res)?.locations || [])
        .catch(() => []);
    } else {
      pendTask = Promise.resolve([]);
    }

    const [myList, pendList] = await Promise.all([myTask, pendTask]);
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
      const adminNow = roleOf(user) === "admin" || accessOf(user) === "admin";
      if (adminNow) {
        await base44.entities.Location.update(id, { status });
      } else {
        await base44.functions.invoke("moderate", { action: "verify", entity: "Location", id, status });
      }
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

  const realIsAdmin = roleOf(user) === "admin" || accessOf(user) === "admin";
  const realCanAct = realIsAdmin || accessOf(user) === "moderator";
  const realCanView = realCanAct || accessOf(user) === "operative";
  const effAccess = previewAs || (realIsAdmin ? "admin" : accessOf(user));
  const isAdmin = previewAs ? previewAs === "admin" : realIsAdmin;
  const canAct = previewAs ? (previewAs === "admin" || previewAs === "moderator") : realCanAct;
  const canView = previewAs ? (previewAs === "admin" || previewAs === "moderator" || previewAs === "operative") : realCanView;

  const triageScore = (r) => (r.image_url ? 2 : 0) + (r.source_link ? 1 : 0);
  const sortedPending = [...pending].sort((a, b) => triageScore(b) - triageScore(a));
  const triageCount = sortedPending.filter((r) => triageScore(r) >= 2).length;

  return (
    <div className="relative min-h-screen bg-void">
      <HorizonProgress />
      <Nav />
      <main className="page-top px-5 pb-24 md:px-8">
        <div className="mx-auto max-w-4xl">
          {/* header */}
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate2/50 pb-6">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Operative console</span>
              <h1 className="mt-2 font-display text-4xl font-bold leading-[1.02] tracking-[-0.02em] text-silver md:text-5xl">Dashboard</h1>
              <p className="mt-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
                {user?.email}
                <span className={`flex items-center gap-1 border px-2 py-0.5 ${ACCESS_BADGE[effAccess] || ACCESS_BADGE.member}`}>
                  {(effAccess === "admin" || effAccess === "moderator") && <ShieldCheck className="h-3 w-3" />} {effAccess}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* persona preview — compact dropdown, real admins only */}
              {realIsAdmin && (
                <div className="flex items-center gap-1.5 border border-ozone/30 bg-ozone/[0.03] pl-2.5">
                  <Eye className="h-3 w-3 text-dim" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">Preview</span>
                  <select
                    value={previewAs ?? ""}
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
              <button onClick={refresh} aria-label="Refresh" className="flex items-center gap-1.5 border border-slate2 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              </button>
              <button onClick={() => base44.auth.logout("/")} className="flex items-center gap-2 border border-slate2 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-flare hover:text-flare">
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          </div>

          {/* preview-active notice */}
          {previewAs && (
            <div className="mt-3 flex items-center gap-2 border border-flare/30 bg-flare/[0.04] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-flare/90">
              <Eye className="h-3 w-3" /> Previewing as {previewAs} · UI only — data &amp; permissions unchanged
            </div>
          )}

          {/* ── PRIMARY: my captures ── */}
          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold uppercase tracking-[-0.01em] text-silver">My field captures</h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// {mine.length} filed</span>
            </div>
            <PullToRefresh onRefresh={refresh} className="mt-4 max-h-[55vh] min-h-0 lg:max-h-none">
              <div className="space-y-2">
                {mine.length ? mine.map((r) => <Row key={r.id} r={r} />) : (
                  <div className="border border-slate2/40 bg-card p-6 text-center">
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// No captures filed yet</p>
                    <Link to="/map" className="mt-3 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-ozone">
                      Open the map <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </PullToRefresh>
          </section>

          {/* ── SECONDARY: verification queue (operatives read-only, mods + admins act) ── */}
          {canView && (
            <section className="mt-10">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold uppercase tracking-[-0.01em] text-silver">
                  {canAct ? "Verification queue" : "Incoming — field intel"}
                </h2>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
                  // {pending.length} pending {triageCount > 0 && <span className="text-flare/80">· {triageCount} triage</span>}
                  {!canAct && <span className="text-silver/60"> · read-only</span>}
                </span>
              </div>
              <div className="mt-4 space-y-2">
                {sortedPending.length ? sortedPending.map((r) => <Row key={r.id} r={r} onVerify={canAct ? verify : undefined} busy={busy[r.id]} triage={triageScore(r) >= 2} />) : (
                  <div className="border border-slate2/40 bg-card p-6 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// Queue clear — no pending captures</div>
                )}
              </div>
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
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">// irreversible account actions</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
                <div>
                  <div className="font-display text-sm font-semibold text-silver">Delete account</div>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-darkgray">Permanently sign out and remove your operative session. This cannot be undone.</p>
                </div>
                <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                  <AlertDialogTrigger asChild>
                    <button className="flex items-center gap-2 border border-flare px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-flare transition-colors hover:bg-flare hover:text-void">
                      <Trash2 className="h-3.5 w-3.5" /> Delete account
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-flare/50 bg-void">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-display text-lg font-bold text-silver">Delete account?</AlertDialogTitle>
                      <AlertDialogDescription className="font-mono text-[11px] leading-relaxed text-darkgray">
                        This will sign you out permanently. To fully erase your stored data, contact Base44 support after confirming. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-slate2 font-mono text-[10px] uppercase tracking-[0.2em] text-darkgray">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteAccount} disabled={deleting} className="border border-flare bg-flare font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-void hover:bg-flare/80">
                        {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm deletion"}
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
