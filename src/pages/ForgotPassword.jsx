import { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Mail, ArrowLeft, Loader2, MailCheck } from "lucide-react";
import AuthShell, { INPUT, LBL } from "@/components/ooh/AuthShell";

// OOH Earth — Forgot password (branded). Base44 resetPasswordRequest.
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
    } catch {
      // Always show success regardless (no account enumeration)
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthShell>
      <h2 className="text-xl font-bold uppercase tracking-[0.1em]">Reset password</h2>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-dim">We'll send you a reset link</p>

      {sent ? (
        <div className="mt-6">
          <div className="flex items-start gap-3 border border-brand-green/40 bg-brand-green/[0.05] p-4">
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />
            <p className="font-mono text-[11px] leading-relaxed text-silver/70">
              If an account exists for <span className="text-silver">{email}</span>, a reset link is on its way. Check your inbox — and spam.
            </p>
          </div>
          <Link to="/login" className="mt-6 flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-dim transition-colors hover:text-ozone">
            <ArrowLeft className="h-3 w-3" /> Back to log in
          </Link>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className={LBL}>Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darkgray" aria-hidden="true" />
                <input id="email" type="email" autoComplete="email" autoFocus placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT} required />
              </div>
            </div>
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 border-2 border-ozone bg-ozone py-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-void transition-colors hover:border-flare hover:bg-flare disabled:opacity-60">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : "Send reset link"}
            </button>
          </form>
          <Link to="/login" className="mt-6 flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-dim transition-colors hover:text-ozone">
            <ArrowLeft className="h-3 w-3" /> Back to log in
          </Link>
        </>
      )}
    </AuthShell>
  );
}
