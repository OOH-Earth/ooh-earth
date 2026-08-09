import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { unlockInvestor, hasInvestorToken } from "@/components/ooh/investorAccess";

/* ────────────────────────────────────────────────────────────
   Investor Access (/investor-access) — the special investor
   entry experience. Two doors: a frictionless access code (no
   account needed) or full account sign-in. Opens the gated
   investor area (hub, console, dashboards).
──────────────────────────────────────────────────────────── */

export default function InvestorAccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const dest = location.state?.from || "/investor";

  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  // Already in? Skip the gate.
  useEffect(() => {
    if (hasInvestorToken() || auth?.isAuthenticated) navigate(dest, { replace: true });
    else inputRef.current?.focus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e) => {
    e?.preventDefault();
    if (busy) return;
    setBusy(true);
    const ok = await unlockInvestor(code);
    setBusy(false);
    if (ok) {
      navigate(dest, { replace: true });
    } else {
      setErr("That code isn't recognised. Check it, or request access below.");
      setShake(true);
      setTimeout(() => setShake(false), 420);
    }
  };

  return (
    <div className="iacc">
      <style>{css}</style>
      <div className={`card ${shake ? "shake" : ""}`}>
        <span className="brk tl" /><span className="brk tr" /><span className="brk bl" /><span className="brk br" />

        <div className="brand">ooh<span>.</span>earth</div>
        <div className="eye"><span className="tick" />Investor access · confidential</div>
        <h1>The investor area.</h1>
        <p className="sub">Enter your access code to open the console, dashboards, and capital pathways. No account needed.</p>

        <form className="form" onSubmit={submit}>
          <label htmlFor="ic" className="lab">Access code</label>
          <input
            id="ic"
            ref={inputRef}
            className={`input ${err ? "bad" : ""}`}
            value={code}
            onChange={(e) => { setCode(e.target.value); if (err) setErr(""); }}
            placeholder="OOH-XXXXX-XXXX"
            autoComplete="off"
            spellCheck="false"
          />
          {err && <div className="err">{err}</div>}
          <button type="submit" className="go" disabled={busy}>{busy ? "Checking…" : "Enter →"}</button>
        </form>

        <div className="divider"><span>or</span></div>

        <div className="alts">
          <button className="alt" onClick={() => (auth?.navigateToLogin ? auth.navigateToLogin() : navigate("/login"))}>
            Sign in with an account →
          </button>
          <a className="alt" href="mailto:hello@ooh.earth?subject=OOH%20Earth%20%E2%80%94%20Investor%20access%20request">
            Request access →
          </a>
        </div>

        <div className="foot">
          <Link to="/" className="back">← Back to site</Link>
          <span className="note">Confidential · for the investor class</span>
        </div>
      </div>
    </div>
  );
}

const css = `
.iacc{--y:rgb(var(--c-ozone));--o:rgb(var(--c-flare));--bg:rgb(var(--c-void));--tx:rgb(var(--c-silver));--ln:rgb(var(--c-slate2));--mu:rgb(var(--c-dim));--al:hsl(var(--destructive));
  min-height:100vh;background:var(--bg);color:var(--tx);font-family:var(--font-display);
  display:flex;align-items:center;justify-content:center;padding:24px;
  background-image:linear-gradient(rgb(var(--c-slate2)/.28) 1px,transparent 1px),linear-gradient(90deg,rgb(var(--c-slate2)/.28) 1px,transparent 1px);background-size:44px 44px}
.iacc *{box-sizing:border-box}
.iacc .card{position:relative;width:100%;max-width:440px;background:hsl(var(--card));border:1px solid var(--ln);border-radius:3px;padding:44px 38px 30px}
.iacc .card.shake{animation:iacc-shake .4s}
@keyframes iacc-shake{10%,90%{transform:translateX(-2px)}30%,70%{transform:translateX(4px)}50%{transform:translateX(-6px)}}
.iacc .brk{position:absolute;width:16px;height:16px;border:2px solid var(--y);opacity:.8}
.iacc .brk.tl{top:12px;left:12px;border-right:0;border-bottom:0}
.iacc .brk.tr{top:12px;right:12px;border-left:0;border-bottom:0}
.iacc .brk.bl{bottom:12px;left:12px;border-right:0;border-top:0}
.iacc .brk.br{bottom:12px;right:12px;border-left:0;border-top:0}
.iacc .brand{font-weight:900;font-size:20px;letter-spacing:-.02em}
.iacc .brand span{color:var(--o)}
.iacc .eye{margin-top:20px;font-family:var(--font-mono);font-size:10px;font-weight:600;letter-spacing:.26em;text-transform:uppercase;color:var(--y);display:flex;align-items:center;gap:9px}
.iacc .tick{display:inline-block;width:18px;height:6px;background:var(--o);box-shadow:0 0 18px rgb(var(--c-flare)/.5)}
.iacc h1{margin-top:12px;font-size:30px;font-weight:900;letter-spacing:-.03em;line-height:1}
.iacc .sub{margin-top:12px;font-size:13.5px;color:var(--mu);line-height:1.5}
.iacc .form{margin-top:24px;display:flex;flex-direction:column}
.iacc .lab{font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--mu);margin-bottom:8px}
.iacc .input{background:var(--bg);border:1px solid var(--ln);border-radius:2px;padding:13px 14px;color:var(--tx);font-family:var(--font-mono);font-size:15px;letter-spacing:.14em;text-transform:uppercase;outline:none;transition:border-color .15s}
.iacc .input::placeholder{color:rgb(var(--c-dim)/.7);letter-spacing:.14em}
.iacc .input:focus{border-color:var(--y)}
.iacc .input.bad{border-color:var(--al)}
.iacc .err{margin-top:10px;font-size:12px;color:var(--al);line-height:1.4}
.iacc .go{margin-top:16px;background:var(--y);color:#000;border:0;border-radius:2px;padding:13px 16px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;box-shadow:0 0 24px rgb(var(--c-ozone)/.28);transition:background .15s}
.iacc .go:hover{background:var(--o)}
.iacc .divider{display:flex;align-items:center;gap:12px;margin:24px 0;color:var(--mu);font-family:var(--font-mono);font-size:10px;letter-spacing:.2em;text-transform:uppercase}
.iacc .divider::before,.iacc .divider::after{content:"";height:1px;flex:1;background:rgb(var(--c-slate2)/.6)}
.iacc .alts{display:flex;flex-direction:column;gap:8px}
.iacc .alt{text-align:left;background:transparent;border:1px solid var(--ln);border-radius:2px;padding:12px 14px;color:var(--tx);font-size:13px;font-weight:600;cursor:pointer;transition:border-color .15s,color .15s;text-decoration:none;display:block}
.iacc .alt:hover{border-color:var(--y);color:var(--y)}
.iacc .foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:26px;padding-top:18px;border-top:1px solid rgb(var(--c-slate2)/.5)}
.iacc .back{font-size:12px;font-weight:600;color:var(--mu)}
.iacc .back:hover{color:var(--y)}
.iacc .note{font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--mu)}
@media(prefers-reduced-motion:reduce){.iacc .card.shake{animation:none}}
`;