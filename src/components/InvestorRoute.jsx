import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { hasInvestorToken, verifyInvestorSession } from '@/components/ooh/investorAccess';

/* ────────────────────────────────────────────────────────────
   InvestorRoute — dual gate for the investor area.
   Opens for EITHER a real account (isAuthenticated) OR a valid,
   server-verified investor token. Otherwise → /investor-access.
   The token is checked against the server on mount, so a forged
   or expired one can't slip through.
──────────────────────────────────────────────────────────── */

const Fallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
  </div>
);

export default function InvestorRoute() {
  const { isAuthenticated, isLoadingAuth, authChecked, checkUserAuth } = useAuth();
  const location = useLocation();
  // token gate: 'checking' | 'ok' | 'no'
  const [tok, setTok] = useState(hasInvestorToken() ? 'checking' : 'no');

  useEffect(() => {
    let alive = true;
    if (tok === 'checking')
      verifyInvestorSession().then((ok) => {
        if (alive) setTok(ok ? 'ok' : 'no');
      });
    return () => {
      alive = false;
    };
  }, [tok]);

  useEffect(() => {
    // Only resolve account auth once the token path has failed.
    if (tok === 'no' && !authChecked && !isLoadingAuth) checkUserAuth();
  }, [tok, authChecked, isLoadingAuth, checkUserAuth]);

  if (tok === 'ok') return <Outlet />;
  if (tok === 'checking') return <Fallback />;

  if (isLoadingAuth || !authChecked) return <Fallback />;
  if (!isAuthenticated)
    return <Navigate to="/investor-access" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
