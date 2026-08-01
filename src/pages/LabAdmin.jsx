import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { isAdmin } from "@/lib/clearance";
import Nav from "@/components/ooh/Nav";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";
import SiteFooter from "@/components/ooh/SiteFooter";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Lock, ExternalLink } from "lucide-react";

const Tog = ({ active, onClick, children, tone = "ozone" }) => {
  const on = active;
  return (
    <button
      onClick={onClick}
      className={`border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.15em] transition-colors ${
        on
          ? tone === "ozone"
            ? "border-ozone bg-ozone text-void"
            : "border-flare bg-flare text-void"
          : "border-slate2 text-silver/60 hover:border-silver/40"
      }`}
    >
      {children}
    </button>
  );
};

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
            The lab control panel is restricted to admin accounts. Log in with an admin account to manage prototype access and status.
          </p>
          <Link to="/login" className="mt-6 inline-block border border-ozone bg-ozone px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-void">
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void text-silver">
      <Nav />
      <div className="page-top mx-auto max-w-5xl px-5 py-10 md:px-8">
        <Breadcrumbs items={[{ label: "Lab", to: "/lab" }, { label: "Admin" }]} />
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">Lab Control Panel</h1>
        <p className="mt-2 max-w-2xl font-mono text-[11px] leading-relaxed text-silver/60">
          Toggle each prototype between public and agency / investor access, flip its build status, or hide it from the lab stack. Changes take effect immediately on the live hub and route gating.
        </p>

        {items === null ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-ozone" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-20 text-center font-mono text-[11px] text-silver/50">No prototypes registered.</p>
        ) : (
          <div className="mt-8 space-y-2">
            {items.map((r) => (
              <div key={r.id} className="border border-slate2 bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-base font-bold">{r.title}</span>
                      <a
                        href={r.path}
                        target="_blank"
                        rel="noreferrer"
                        className="text-silver/40 transition-colors hover:text-ozone"
                        title="Open page"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                    <span className="font-mono text-[10px] text-silver/40">{r.path}</span>
                  </div>
                  {saving === r.id && <Loader2 className="h-4 w-4 animate-spin text-ozone" />}
                </div>

                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-4">
                  <div>
                    <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-silver/40">Access</div>
                    <div className="flex gap-1.5">
                      <Tog active={r.access === "public"} onClick={() => save(r, { access: "public" }, "Access", "ozone")}>Public</Tog>
                      <Tog active={r.access === "restricted"} onClick={() => save(r, { access: "restricted" }, "Access", "ozone")}>Agency / Investor</Tog>
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-silver/40">Status</div>
                    <div className="flex gap-1.5">
                      <Tog active={r.status === "live"} onClick={() => save(r, { status: "live" }, "Status", "ozone")}>Live</Tog>
                      <Tog active={r.status === "in_build"} onClick={() => save(r, { status: "in_build" }, "Status", "ozone")}>In build</Tog>
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-silver/40">Visible</div>
                    <div className="flex gap-1.5">
                      <Tog active={r.visible} onClick={() => save(r, { visible: true }, "Visibility", "ozone")}>On</Tog>
                      <Tog active={!r.visible} onClick={() => save(r, { visible: false }, "Visibility", "ozone")}>Off</Tog>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}