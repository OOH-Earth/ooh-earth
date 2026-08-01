import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { isAdmin } from "@/lib/clearance";
import Nav from "@/components/ooh/Nav";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";
import SiteFooter from "@/components/ooh/SiteFooter";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Lock, ExternalLink, Radio, Power, Eye, EyeOff, Gauge } from "lucide-react";

// Toggle button — active state fills with the channel tone. tones:
//   ozone (yellow)  — public / live / visible
//   flare (orange)  — agency·investor / in-build
//   red             — hidden / off
const TONES = {
  ozone: "border-ozone bg-ozone text-void shadow-[0_0_14px_rgba(237,255,0,0.28)]",
  flare: "border-flare bg-flare text-void shadow-[0_0_14px_rgba(255,92,0,0.30)]",
  red: "border-destructive bg-destructive text-destructive-foreground shadow-[0_0_14px_rgba(255,0,0,0.22)]",
};

const Tog = ({ active, onClick, children, tone = "ozone" }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.15em] transition-all ${
      active ? TONES[tone] : "border-slate2 text-silver/50 hover:border-silver/60 hover:text-silver/80"
    }`}
  >
    <span className={`h-1.5 w-1.5 ${active ? "bg-void/70" : "bg-silver/30"}`} />
    {children}
  </button>
);

function Stat({ label, value, tone }) {
  const toneCls = tone === "ozone" ? "text-ozone" : tone === "flare" ? "text-flare" : "text-silver/40";
  return (
    <div className="flex items-baseline gap-2 border border-slate2 px-3 py-2">
      <span className={`font-mono text-lg font-bold tabular ${toneCls}`}>{value}</span>
      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-silver/40">{label}</span>
    </div>
  );
}

export default function LabAdmin() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState(null);
  const [saving, setSaving] = useState(null);

  const load = useCallback(async () => {
    try {
      setItems(await base44.entities.LabPrototype.list("sort_order"));
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
      await base44.entities.LabPrototype.update(rec.id, patch);
      setItems((prev) => prev.map((r) => (r.id === rec.id ? { ...r, ...patch } : r)));
      toast({ title: `${label} saved` });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
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
            The lab control console is restricted to admin accounts. Log in with an admin account to manage prototype access and status.
          </p>
          <Link to="/login" className="mt-6 inline-block border border-ozone bg-ozone px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-void">
            Log in
          </Link>
        </div>
      </div>
    );
  }

  const counts = {
    public: items?.filter((r) => r.access === "public").length || 0,
    restricted: items?.filter((r) => r.access === "restricted").length || 0,
    live: items?.filter((r) => r.status === "live").length || 0,
    hidden: items?.filter((r) => r.visible === false).length || 0,
  };

  return (
    <div className="min-h-screen bg-void text-silver grid-bg">
      <Nav />
      <div className="page-top mx-auto max-w-5xl px-5 py-10 md:px-8">
        <Breadcrumbs items={[{ label: "Lab", to: "/lab" }, { label: "Console" }]} />

        {/* Console header */}
        <div className="mt-4 border border-slate2 bg-card">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate2 px-4 py-3">
            <Gauge className="h-5 w-5 text-ozone" />
            <h1 className="font-display text-xl font-bold uppercase tracking-[0.16em]">Lab Control <span className="text-ozone">Console</span></h1>
            <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-silver/50">
              <span className="h-1.5 w-1.5 animate-pulse bg-ozone" /> live sync
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 px-4 py-3">
            <Stat label="public" value={counts.public} tone="ozone" />
            <Stat label="agency / inv" value={counts.restricted} tone="flare" />
            <Stat label="live" value={counts.live} tone="ozone" />
            <Stat label="hidden" value={counts.hidden} tone="red" />
            <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.18em] text-silver/40">
              {items?.length || 0} channels
            </span>
          </div>
        </div>

        <p className="mt-4 max-w-2xl font-mono text-[11px] leading-relaxed text-silver/55">
          Each channel toggles access (public ↔ agency/investor), build status, and hub visibility. Changes propagate to the live stack and route gating on save.
        </p>

        {items === null ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-ozone" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-20 text-center font-mono text-[11px] text-silver/50">No channels registered.</p>
        ) : (
          <div className="mt-6 space-y-1.5">
            {items.map((r, i) => {
              const hidden = r.visible === false;
              const pub = r.access === "public";
              const live = r.status === "live";
              const led = hidden ? "bg-destructive" : pub ? "bg-ozone" : "bg-flare";
              return (
                <div key={r.id} className={`border bg-card transition-colors ${hidden ? "border-destructive/30" : "border-slate2 hover:border-silver/30"}`}>
                  {/* channel header */}
                  <div className="flex items-center gap-3 border-b border-slate2 px-4 py-2.5">
                    <span className="font-mono text-[10px] tabular text-silver/40">{String(i + 1).padStart(2, "0")}</span>
                    <span className={`h-2 w-2 rounded-full ${led} ${hidden ? "" : "animate-pulse"}`} title={hidden ? "hidden" : pub ? "public" : "restricted"} />
                    <span className="font-display text-sm font-bold">{r.title}</span>
                    <a href={r.path} target="_blank" rel="noreferrer" className="text-silver/30 transition-colors hover:text-ozone" title="Open page">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <span className="ml-auto font-mono text-[9px] tracking-[0.1em] text-silver/35">{r.path}</span>
                    {saving === r.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-ozone" />}
                  </div>

                  {/* controls */}
                  <div className="flex flex-wrap items-end gap-x-7 gap-y-4 px-4 py-3.5">
                    <Ctrl label="Access" icon={<Radio className="h-3 w-3" />}>
                      <Tog active={pub} tone="ozone" onClick={() => save(r, { access: "public" }, "Access")}>Public</Tog>
                      <Tog active={!pub} tone="flare" onClick={() => save(r, { access: "restricted" }, "Access")}>Agency / Inv</Tog>
                    </Ctrl>

                    <Ctrl label="Status" icon={<Power className="h-3 w-3" />}>
                      <Tog active={live} tone="ozone" onClick={() => save(r, { status: "live" }, "Status")}>Live</Tog>
                      <Tog active={!live} tone="flare" onClick={() => save(r, { status: "in_build" }, "Status")}>In build</Tog>
                    </Ctrl>

                    <Ctrl label="Visible" icon={hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}>
                      <Tog active={!hidden} tone="ozone" onClick={() => save(r, { visible: true }, "Visibility")}>On</Tog>
                      <Tog active={hidden} tone="red" onClick={() => save(r, { visible: false }, "Visibility")}>Off</Tog>
                    </Ctrl>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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