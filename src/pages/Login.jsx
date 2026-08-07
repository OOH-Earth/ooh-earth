import { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import AuthShell, { INPUT, LBL } from "@/components/ooh/AuthShell";
import { safeReturnTo } from "@/lib/authReturnTo";

// OOH Earth — Login (branded auth journey, social-first with email fallback).
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const returnTo = safeReturnTo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = returnTo;
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };
  const handleGoogle = () => base44.auth.loginWithProvider("google", returnTo);

  return (
    <AuthShell>
      <h2 className="text-xl font-bold uppercase tracking-[0.1em]">Log in</h2>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-dim">Access your operative profile</p>

      <button onClick={handleGoogle} className="mt-6 flex w-full items-center justify-center gap-3 border border-slate2 bg-card py-3 font-mono text-xs font-bold uppercase tracking-[0.15em] text-silver transition-colors hover:border-ozone hover:text-ozone">
        <GoogleIcon className="h-4 w-4" /> Continue with Google
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate2/60" /></div>
        <div className="relative flex justify-center"><span className="bg-void px-3 font-mono text-[9px] uppercase tracking-[0.3em] text-darkgray">or</span></div>
      </div>

      {error && <div className="mb-4 border border-flare/40 bg-flare/[0.06] px-3 py-2 font-mono text-[11px] text-flare">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className={LBL}>Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darkgray" aria-hidden="true" />
            <input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT} required />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className={LBL}>Password</label>
            <Link to="/forgot-password" className="font-mono text-[9px] uppercase tracking-wide text-dim transition-colors hover:text-ozone">Forgot?</Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darkgray" aria-hidden="true" />
            <input id="password" type={showPw ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={`${INPUT} pr-10`} required />
            <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-darkgray transition-colors hover:text-silver">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 border-2 border-ozone bg-ozone py-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-void transition-colors hover:border-flare hover:bg-flare disabled:opacity-60">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Logging in…</> : "Log in"}
        </button>
      </form>

      <div className="mt-6 border-t border-slate2/60 pt-5 text-center font-mono text-[11px] text-dim">
        New to the network? <Link to="/register" className="text-ozone hover:underline">Create an account →</Link>
      </div>
      <div className="mt-3 text-center">
        <Link to="/map" className="font-mono text-[10px] uppercase tracking-[0.15em] text-darkgray transition-colors hover:text-silver">Explore without an account</Link>
      </div>
    </AuthShell>
  );
}