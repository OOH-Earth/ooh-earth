import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Mail, Lock, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import GoogleIcon from '@/components/GoogleIcon';
import PasswordStrength from '@/components/ooh/PasswordStrength';
import AuthShell, { INPUT, LBL } from '@/components/ooh/AuthShell';
import { safeReturnTo } from '@/lib/authReturnTo';

// OOH Earth — Register (branded). Base44 register → email OTP verify flow.
export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [resent, setResent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      window.location.href = safeReturnTo();
    } catch (err) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    setError('');
    try {
      await base44.auth.resendOtp(email);
      setResendIn(30);
      setResent(true);
    } catch (err) {
      setError(err.message || 'Failed to resend code');
    }
  };

  const handleBack = () => {
    setShowOtp(false);
    setOtpCode('');
    setError('');
  };
  const handleGoogle = () => base44.auth.loginWithProvider('google', safeReturnTo());

  useEffect(() => {
    if (showOtp) setResendIn(30);
  }, [showOtp]);
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  if (showOtp) {
    return (
      <AuthShell>
        <h2 className="text-xl font-bold uppercase tracking-[0.1em]">Verify email</h2>
        <p className="mt-1 font-mono text-[11px] tracking-[0.05em] text-dim">
          We sent a 6-digit code to <span className="text-silver">{email}</span>
        </p>

        {error && (
          <div className="mt-5 border border-flare/40 bg-flare/[0.06] px-3 py-2 font-mono text-[11px] text-flare">
            {error}
          </div>
        )}

        <input
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={6}
          placeholder="––––––"
          className="mt-6 w-full border border-slate2 bg-void py-4 text-center font-mono text-2xl tracking-[0.6em] text-ozone outline-none transition-colors placeholder:text-darkgray focus:border-ozone"
        />

        <button
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
          className="mt-5 flex w-full items-center justify-center gap-2 border-2 border-ozone bg-ozone py-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-void transition-colors hover:border-flare hover:bg-flare disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Verifying…
            </>
          ) : (
            'Verify & enter'
          )}
        </button>

        <div className="mt-4 text-center font-mono text-[10px] uppercase tracking-widest text-dim">
          {resendIn > 0 ? (
            <>Resend in {resendIn}s</>
          ) : (
            <button
              onClick={handleResend}
              className="text-silver transition-colors hover:text-ozone"
            >
              Resend code
            </button>
          )}
          {resent && resendIn > 0 && <span className="ml-2 text-brand-green">· sent</span>}
        </div>
        <button
          onClick={handleBack}
          className="mt-3 flex w-full items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-darkgray transition-colors hover:text-silver"
        >
          <ArrowLeft className="h-3 w-3" /> Use a different email
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h2 className="text-xl font-bold uppercase tracking-[0.1em]">Create account</h2>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-dim">
        Join the network
      </p>

      <button
        onClick={handleGoogle}
        className="mt-6 flex w-full items-center justify-center gap-3 border border-slate2 bg-card py-3 font-mono text-xs font-bold uppercase tracking-[0.15em] text-silver transition-colors hover:border-ozone hover:text-ozone"
      >
        <GoogleIcon className="h-4 w-4" /> Continue with Google
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate2/60" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-void px-3 font-mono text-[9px] uppercase tracking-[0.3em] text-darkgray">
            or
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 border border-flare/40 bg-flare/[0.06] px-3 py-2 font-mono text-[11px] text-flare">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className={LBL}>
            Email
          </label>
          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darkgray"
              aria-hidden="true"
            />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={INPUT}
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="password" className={LBL}>
            Password
          </label>
          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darkgray"
              aria-hidden="true"
            />
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${INPUT} pr-10`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-darkgray transition-colors hover:text-silver"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <PasswordStrength value={password} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="confirm" className={LBL}>
            Confirm password
          </label>
          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darkgray"
              aria-hidden="true"
            />
            <input
              id="confirm"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={INPUT}
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 border-2 border-ozone bg-ozone py-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-void transition-colors hover:border-flare hover:bg-flare disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      <div className="mt-6 border-t border-slate2/60 pt-5 text-center font-mono text-[11px] text-dim">
        Already enlisted?{' '}
        <Link to="/login" className="text-ozone hover:underline">
          Log in →
        </Link>
      </div>
    </AuthShell>
  );
}
