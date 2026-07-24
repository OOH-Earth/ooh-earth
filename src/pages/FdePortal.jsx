import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import Nav from "@/components/ooh/Nav";
import HorizonProgress from "@/components/ooh/HorizonProgress";
import LocationThumb from "@/components/ooh/map/LocationThumb";
import { Link } from "react-router-dom";
import {
  Loader2, LogOut, RefreshCw, MapPin, Radio, ShieldCheck, ArrowUpRight,
  Crosshair, Camera, ScanLine, Trash2, IdCard, Map as MapIcon, Users, Building2, AlertTriangle,
} from "lucide-react";

const STATUS_BADGE = {
  pending: "border-ozone/50 text-ozone",
  verified: "border-[#39FF14]/50 text-[#39FF14]",
  rejected: "border-flare/50 text-flare",
};

const TYPE_LABEL = {
  billboard: "Billboard", painted: "Painted", digital: "Digital", projection: "Projection",
  sticker: "Sticker", mural: "Mural", transit: "Transit", other: "Other",
};

const TOOLS = [
  { to: "/report", Icon: Crosshair, label: "Field Report", desc: "Log a new offense" },
  { to: "/map", Icon: MapIcon, label: "Atlas", desc: "Global deployment map" },
  { to: "/ar", Icon: Camera, label: "AR Lens", desc: "Overlay tool" },
  { to: "/trash", Icon: Trash2, label: "Trash ID", desc: "Waste traceability" },
  { to: "/scan", Icon: ScanLine, label: "TrueCost", desc: "UPC impact scan" },
  { to: "/field-id", Icon: IdCard, label: "Field ID", desc: "Operative card" },
];

// Deterministic 0001–0101 node id from a seed string (user id / email)
function nodeId(seed = "") {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return String((h % 101) + 1).padStart(4, "0");
}

function Stat({ Icon, label, value, accent }) {
  return (
    <div className="border border-slate2/60 bg-card p-4">
      <Icon className={`h-4 w-4 ${accent || "text-dim"}`} />
      <div className="mt-3 font-display text-2xl font-bold tabular text-silver">{value}</div>
      <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">{label}</div>
    </div>
  );
}

function DeploymentRow({ r }) {
  return (
    <Link to={`/location/${r.id}`} className="group flex items-center gap-3 border border-slate2/50 bg-card p-3 transition-colors hover:border-ozone/60">
      <LocationThumb m={{ image: r.image_url, type: r.type, title: r.title }} className="h-12 w-12 border border-slate2/50" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-display text-sm font-bold text-silver">{r.title}</span>
          <span className={`shrink-0 border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] ${STATUS_BADGE[r.status] || ""}`}>{r.status}</span>
        </div>
        <p className="truncate font-mono text-[9px] uppercase tracking-[0.15em] text-dim">
          {TYPE_LABEL[r.type] || r.type} · {r.address || `${r.lat?.toFixed(4)}, ${r.lng?.toFixed(4)}`}
        </p>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-darkgray transition-colors group-hover:text-ozone" />
    </Link>
  );
}

export default function FdePortal() {
  const [user, setUser] = useState(null);
  const [deployments, setDeployments] = useState([]);
  const [pending, setPending] = useState([]);
  const [operatives, setOperatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const u = await base44.auth.me();
    setUser(u);
    const [active, pend, ops] = await Promise.all([
      base44.entities.Location.filter({ status: "verified" }, "-updated_date", 100),
      base44.entities.Location.filter({ status: "pending" }, "-created_date", 50),
      base44.entities.Operative.list("-points", 50).catch(() => []),
    ]);
    setDeployments(active || []);
    setPending(pend || []);
    setOperatives(ops || []);
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void">
        <Loader2 className="h-6 w-6 animate-spin text-ozone" />
      </div>
    );
  }

  const node = `NODE ${nodeId(user?.id || user?.email || "0000")}`;
  const cities = new Set(deployments.map((d) => d.address?.split(",")?.pop()?.trim() || d.title).filter(Boolean)).size;

  return (
    <div className="relative min-h-screen bg-void page-top">
      <HorizonProgress />
      <Nav />
      <main className="px-5 pb-24 pt-28 md:px-8">
        <div className="mx-auto max-w-5xl">
          {/* header */}
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate2/50 pb-6">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// 0101001 // forward-deployed engineer portal</span>
              <h1 className="mt-2 font-display text-4xl font-bold leading-[1.02] tracking-[-0.02em] text-silver md:text-5xl">FDE Portal</h1>
              <p className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
                <span className="flex items-center gap-1 border border-ozone/50 px-2 py-0.5 text-ozone"><Radio className="h-3 w-3 animate-flicker" /> {node}</span>
                {user?.email}
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

          {/* overview */}
          <section className="mt-8 grid grid-cols-2 gap-2.5 md:grid-cols-4">
            <Stat Icon={MapPin} label="Active deployments" value={deployments.length} accent="text-ozone" />
            <Stat Icon={AlertTriangle} label="Pending triage" value={pending.length} accent="text-flare" />
            <Stat Icon={Users} label="Operatives" value={operatives.length} />
            <Stat Icon={Building2} label="Cities" value={cities} accent="text-flare" />
          </section>

          {/* active deployments */}
          <section className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold uppercase tracking-[-0.01em] text-silver">Active field deployments</h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// {deployments.length} verified</span>
            </div>
            <div className="mt-4 space-y-2">
              {deployments.length ? deployments.map((r) => <DeploymentRow key={r.id} r={r} />) : (
                <div className="border border-slate2/40 bg-card p-6 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// No verified deployments — file a report to activate</div>
              )}
            </div>
          </section>

          {/* pending triage */}
          {pending.length > 0 && (
            <section className="mt-10">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold uppercase tracking-[-0.01em] text-flare">Awaiting verification</h2>
                <Link to="/dashboard" className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim transition-colors hover:text-ozone">// triage queue →</Link>
              </div>
              <div className="mt-4 space-y-2">
                {pending.slice(0, 5).map((r) => <DeploymentRow key={r.id} r={r} />)}
              </div>
            </section>
          )}

          {/* reporting tools */}
          <section className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold uppercase tracking-[-0.01em] text-silver">Reporting tools</h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// field kit</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-3">
              {TOOLS.map((t) => (
                <Link key={t.to} to={t.to} className="group flex flex-col border border-slate2/60 bg-card p-4 transition-colors hover:border-ozone/60 hover:bg-card/80">
                  <t.Icon className="h-4 w-4 text-dim transition-colors group-hover:text-ozone" />
                  <div className="mt-4 font-display text-sm font-bold tracking-[-0.01em] text-silver">{t.label}</div>
                  <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-dim">{t.desc}</div>
                </Link>
              ))}
            </div>
          </section>

          {/* operative roster */}
          {operatives.length > 0 && (
            <section className="mt-10">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold uppercase tracking-[-0.01em] text-silver">0101001 roster</h2>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// {operatives.length} units</span>
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {operatives.map((o, i) => (
                  <div key={o.id} className="flex items-center gap-3 border border-slate2/50 bg-card p-3">
                    <span className="flex h-8 w-8 items-center justify-center border border-slate2/60 font-mono text-[9px] font-bold tabular text-ozone">{nodeId(o.id || o.handle).slice(0, 2)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-display text-sm font-bold text-silver">{o.handle}</span>
                        {o.verified && <ShieldCheck className="h-3 w-3 shrink-0 text-[#39FF14]" />}
                      </div>
                      <p className="truncate font-mono text-[9px] uppercase tracking-[0.15em] text-dim">{o.region || "undisclosed"} · {o.tier}</p>
                    </div>
                    <span className="font-mono text-[10px] tabular text-ozone">{o.points?.toLocaleString() || 0}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}