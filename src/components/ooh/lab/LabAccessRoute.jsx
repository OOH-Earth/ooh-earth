import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { hasInvestorToken, verifyInvestorSession } from "@/components/ooh/investorAccess";
import { base44 } from "@/api/base44Client";

/* ────────────────────────────────────────────────────────────
   LabAccessRoute — dynamic gate for every /lab/* page.
   Reads the LabPrototype record for the current path; if its
   `access` is "restricted", opens only for a server-verified
   investor token OR an authenticated account (agency/admin).
   Otherwise renders the page publicly. The admin panel flips
   access per prototype at /lab/admin.
──────────────────────────────────────────────────────────── */

const Fallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
  </div>
);

// Hub + showcase pages that are always public regardless of DB state,
// so the lab index never locks itself out.
const ALWAYS_PUBLIC = ["/lab", "/lab/poster", "/lab/coin-poster", "/lab/sequencer", "/lab/nft"];

export default function LabAccessRoute() {
  const { isAuthenticated, isLoadingAuth, authChecked, checkUserAuth } = useAuth();
  const location = useLocation();
  const [tok, setTok] = useState(hasInvestorToken() ? "checking" : "no");
  const [access, setAccess] = useState(null);
  const [cfgLoading, setCfgLoading] = useState(true);

  // verify investor token (if any) once
  useEffect(() => {
    let alive = true;
    if (tok === "checking") verifyInvestorSession().then((ok) => { if (alive) setTok(ok ? "ok" : "no"); });
    return () => { alive = false; };
  }, [tok]);

  // only resolve account auth when the token path has failed
  useEffect(() => {
    if (tok === "no" && !authChecked && !isLoadingAuth) checkUserAuth();
  }, [tok, authChecked, isLoadingAuth, checkUserAuth]);

  // fetch the access setting for this path
  useEffect(() => {
    let alive = true;
    setCfgLoading(true);
    (async () => {
      try {
        const recs = await base44.entities.LabPrototype.filter({ path: location.pathname });
        if (alive) setAccess(recs[0]?.access || "restricted");
      } catch {
        if (alive) setAccess("restricted");
      } finally {
        if (alive) setCfgLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [location.pathname]);

  if (ALWAYS_PUBLIC.includes(location.pathname)) return <Outlet />;
  if (cfgLoading) return <Fallback />;

  if (access === "public") return <Outlet />;

  // restricted path — need token or authenticated account
  if (tok === "ok") return <Outlet />;
  if (tok === "checking") return <Fallback />;
  if (isLoadingAuth || !authChecked) return <Fallback />;
  if (!isAuthenticated) return <Navigate to="/investor-access" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}