import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Nav from "@/components/ooh/Nav";
import { useAuth } from "@/lib/AuthContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Check, User as UserIcon, SlidersHorizontal, ShieldCheck, Database, LogOut, Trash2, AlertTriangle, Download, KeyRound, LayoutDashboard, Zap, Cpu, Coins, ArrowUpRight, Mail } from "lucide-react";

/* ────────────────────────────────────────────────────────────
   OOH Earth · Account & Settings hub · /account
   One surface for every member type. Identity is self-editable
   and writes back via base44.auth.updateMe (safe fields only —
   never role/access/agency, so there's no self-escalation).
   Preferences persist on the user record AND mirror to
   localStorage for instant apply. Tabs adapt to clearance.
──────────────────────────────────────────────────────────── */

const roleOf = (u) => (u && (u.role ?? u.data?.role)) || "user";
const accessOf = (u) => (u && (u.access ?? u.data?.access)) || "member";
const agencyOf = (u) => !!(u && (u.agency ?? u.data?.agency));

const ACCESS_BADGE = {
  admin: "border-ozone/50 text-ozone",
  moderator: "border-flare/50 text-flare",
  operative: "border-silver/40 text-silver",
  member: "border-slate2/60 text-darkgray",
};

const PREF_DEFAULTS = { notifications: true, comms_email: false, reduced_motion: false, sound: true };
const PREF_META = [
  ["notifications", "In-app notifications", "Queue updates, verifications, and mission alerts."],
  ["comms_email", "Movement email", "Occasional dispatches from the movement. Off by default."],
  ["reduced_motion", "Reduced motion", "Calm the animations and transitions across the app."],
  ["sound", "Interface sound", "Audio cues for captures, busts, and confirmations."],
];

function Toggle({ on, onClick, label, desc }) {
  return (
    <button onClick={onClick} className="flex w-full items-start justify-between gap-4 border-b border-slate2/30 py-4 text-left last:border-0">
      <span className="min-w-0">
        <span className="block font-display text-[13.5px] font-semibold text-silver">{label}</span>
        <span className="mt-0.5 block text-[12px] leading-relaxed text-darkgray">{desc}</span>
      </span>
      <span className={`mt-1 flex h-5 w-9 shrink-0 items-center rounded-full border px-0.5 transition-colors ${on ? "justify-end border-ozone bg-ozone/30" : "justify-start border-slate2 bg-card"}`}>
        <span className={`h-3.5 w-3.5 rounded-full ${on ? "bg-ozone" : "bg-slate2"}`} />
      </span>
    </button>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">{label}</span>
      {children}
      {hint && <span className="mt-1 block font-mono text-[9px] tracking-[0.05em] text-darkgray/70">{hint}</span>}
    </label>
  );
}

const inputCls = "mt-1.5 w-full border border-slate2 bg-card px-3 py-2.5 font-display text-[14px] text-silver outline-none transition-colors placeholder:text-darkgray/50 focus:border-ozone";

export default function Account() {
  const { user: ctxUser, checkUserAuth } = useAuth();
  const [me, setMe] = useState(ctxUser || null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("profile");

  const [form, setForm] = useState({ full_name: "", handle: "", bio: "", avatar_url: "" });
  const [prefs, setPrefs] = useState(PREF_DEFAULTS);
  const [savingP, setSavingP] = useState(false);
  const [savedP, setSavedP] = useState(false);
  const [savingPref, setSavingPref] = useState(false);
  const [savedPref, setSavedPref] = useState(false);
  const [err, setErr] = useState(null);
  const [pwSent, setPwSent] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const hydrate = useCallback((u) => {
    setForm({ full_name: u.full_name || "", handle: u.handle || "", bio: u.bio || "", avatar_url: u.avatar_url || "" });
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem("ooh_prefs") || "null"); } catch { /* ignore */ }
    setPrefs({ ...PREF_DEFAULTS, ...(stored || {}), ...(u.prefs || {}) });
  }, []);

  useEffect(() => {
    (async () => {
      try { const u = await base44.auth.me(); setMe(u); hydrate(u); }
      catch { if (ctxUser) { setMe(ctxUser); hydrate(ctxUser); } }
      finally { setLoading(false); }
    })();
  }, [hydrate, ctxUser]);

  const saveProfile = async () => {
    setSavingP(true); setErr(null); setSavedP(false);
    try {
      // Safe subset only — never role/access/agency.
      await base44.auth.updateMe({ full_name: form.full_name, handle: form.handle, bio: form.bio, avatar_url: form.avatar_url });
      try { await checkUserAuth?.(); } catch { /* context refresh is best-effort */ }
      const u = await base44.auth.me(); setMe(u);
      setSavedP(true); setTimeout(() => setSavedP(false), 2200);
    } catch (e) { setErr(e?.message || "Could not save profile."); }
    finally { setSavingP(false); }
  };

  const savePrefs = async (next) => {
    setPrefs(next);
    try { localStorage.setItem("ooh_prefs", JSON.stringify(next)); } catch { /* ignore */ }
    setSavingPref(true); setSavedPref(false); setErr(null);
    try {
      await base44.auth.updateMe({ prefs: next });
      setSavedPref(true); setTimeout(() => setSavedPref(false), 2200);
    } catch (e) { setErr(e?.message || "Preferences saved locally; sync failed."); }
    finally { setSavingPref(false); }
  };

  const sendReset = async () => {
    setErr(null);
    try { await base44.auth.resetPasswordRequest(me.email); setPwSent(true); }
    catch (e) { setErr(e?.message || "Could not send reset email (may not apply to SSO logins)."); }
  };

  const exportData = async () => {
    setExporting(true); setErr(null);
    try {
      let captures = [];
      try { captures = await base44.entities.Location.filter({ created_by_id: me.id }, "-created_date", 500); } catch { captures = []; }
      const bundle = {
        exported_at: new Date().toISOString(),
        account: { id: me.id, email: me.email, full_name: me.full_name, handle: me.handle, role: me.role, access: accessOf(me), agency: agencyOf(me), prefs },
        captures,
      };
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `ooh-earth-account-${me.id}.json`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { setErr(e?.message || "Export failed."); }
    finally { setExporting(false); }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try { await base44.auth.logout("/"); } catch { setDeleting(false); }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-void"><Loader2 className="h-6 w-6 animate-spin text-ozone" /></div>;
  }

  const isAdmin = roleOf(me) === "admin" || accessOf(me) === "admin";
  const isAgency = isAdmin || agencyOf(me);
  const access = isAdmin ? "admin" : accessOf(me);

  const TABS = [
    { id: "profile", label: "Profile", icon: UserIcon },
    { id: "prefs", label: "Preferences", icon: SlidersHorizontal },
    { id: "security", label: "Security", icon: ShieldCheck },
    { id: "data", label: "Data", icon: Database },
  ];

  const quickLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: true },
    { to: "/operative", label: "Field profile", icon: Zap, show: true },
    { to: "/portal/ops", label: "Architecture Ops", icon: Cpu, show: isAgency },
    { to: "/portfolio", label: "Treasury Console", icon: Coins, show: isAgency },
  ].filter((l) => l.show);

  const initials = (form.full_name || me.email || "OP").trim().split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((s) => s[0]).join("").toUpperCase() || "OP";

  return (
    <div className="relative min-h-screen bg-void page-top">
      <Nav />
      <main className="px-5 pb-28 md:px-8">
        <div className="mx-auto max-w-3xl">
          {/* header */}
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate2/50 pb-6 pt-4">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center border border-slate2 bg-ozone/10 font-mono text-lg font-bold text-ozone">
                {form.avatar_url ? <img src={form.avatar_url} alt="" className="h-full w-full object-cover" /> : initials}
              </span>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Account</span>
                <h1 className="mt-1 font-display text-3xl font-bold leading-none tracking-[-0.02em] text-silver md:text-4xl">{form.full_name || "Your account"}</h1>
                <p className="mt-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
                  {me.email}
                  <span className={`inline-flex items-center gap-1 border px-1.5 py-0.5 ${ACCESS_BADGE[access] || ACCESS_BADGE.member}`}>
                    {(access === "admin" || access === "moderator") && <ShieldCheck className="h-3 w-3" />}{access}
                  </span>
                  {isAgency && <span className="border border-ozone/40 px-1.5 py-0.5 text-ozone">agency</span>}
                </p>
              </div>
            </div>
            <button onClick={() => base44.auth.logout("/")} className="flex items-center gap-2 border border-slate2 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-flare hover:text-flare">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>

          {/* quick links */}
          <div className="mt-4 flex flex-wrap gap-2">
            {quickLinks.map((l) => { const Icon = l.icon; return (
              <Link key={l.to} to={l.to} className="flex items-center gap-2 border border-slate2/60 bg-card px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-dim transition-colors hover:border-ozone/50 hover:text-silver">
                <Icon className="h-3.5 w-3.5" /> {l.label} <ArrowUpRight className="h-3 w-3 opacity-50" />
              </Link>
            ); })}
          </div>

          {/* tabs */}
          <nav className="mt-7 flex flex-wrap gap-2 border-t border-slate2/40 pt-6">
            {TABS.map((t) => { const Icon = t.icon; return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 border px-3.5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors ${tab === t.id ? "border-ozone bg-ozone/[0.06] text-ozone" : "border-slate2/60 bg-card/40 text-dim hover:border-ozone/40 hover:text-silver"}`}>
                <Icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            ); })}
          </nav>

          {err && <div className="mt-5 border border-flare/50 bg-flare/[0.05] px-4 py-3 font-mono text-[11px] text-flare">{err}</div>}

          {/* ── PROFILE ── */}
          {tab === "profile" && (
            <div className="mt-6 border border-slate2/60 bg-card/40 p-6">
              <h2 className="font-mono text-[13px] font-bold uppercase tracking-[0.14em] text-silver">Identity</h2>
              <p className="mt-1.5 mb-5 text-[12.5px] leading-relaxed text-dim">This is you across the movement. Editable and saved to your record.</p>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Display name"><input className={inputCls} value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} placeholder="Your name" /></Field>
                <Field label="Handle" hint="Used for shout-outs and leaderboards."><input className={inputCls} value={form.handle} onChange={(e) => setForm((f) => ({ ...f, handle: e.target.value.replace(/\s+/g, "") }))} placeholder="@handle" /></Field>
              </div>
              <div className="mt-5">
                <Field label="Avatar URL" hint="Link to an image. Leave blank to use your initials."><input className={inputCls} value={form.avatar_url} onChange={(e) => setForm((f) => ({ ...f, avatar_url: e.target.value }))} placeholder="https://…" /></Field>
              </div>
              <div className="mt-5">
                <Field label="Bio"><textarea rows={3} className={inputCls} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} placeholder="A line about why you're in this." /></Field>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <button onClick={saveProfile} disabled={savingP} className="flex items-center gap-2 border border-ozone bg-ozone px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-void transition-colors hover:bg-flare hover:border-flare disabled:opacity-50">
                  {savingP ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : savedP ? <Check className="h-3.5 w-3.5" /> : null}
                  {savedP ? "Saved" : "Save profile"}
                </button>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-dim">Email is your login — managed under Security.</span>
              </div>
            </div>
          )}

          {/* ── PREFERENCES ── */}
          {tab === "prefs" && (
            <div className="mt-6 border border-slate2/60 bg-card/40 p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-mono text-[13px] font-bold uppercase tracking-[0.14em] text-silver">Preferences</h2>
                {savingPref ? <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-dim">saving…</span> : savedPref ? <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ozone"><Check className="h-3 w-3" /> saved</span> : null}
              </div>
              <p className="mt-1.5 mb-3 text-[12.5px] leading-relaxed text-dim">Tuned per device instantly and synced to your record.</p>
              {PREF_META.map(([key, label, desc]) => (
                <Toggle key={key} on={!!prefs[key]} label={label} desc={desc} onClick={() => savePrefs({ ...prefs, [key]: !prefs[key] })} />
              ))}
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.15em] text-darkgray">Theme lives in the top bar toggle · applies instantly.</p>
            </div>
          )}

          {/* ── SECURITY ── */}
          {tab === "security" && (
            <div className="mt-6 space-y-5">
              <div className="border border-slate2/60 bg-card/40 p-6">
                <h2 className="font-mono text-[13px] font-bold uppercase tracking-[0.14em] text-silver">Sign-in</h2>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate2/30 py-3">
                  <span className="flex items-center gap-2 text-[13px] text-silver"><Mail className="h-3.5 w-3.5 text-dim" /> {me.email}</span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">login identity</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <div className="font-display text-sm font-semibold text-silver">Password</div>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-darkgray">Send a reset link to your email. Google / SSO logins are managed by your provider.</p>
                  </div>
                  <button onClick={sendReset} disabled={pwSent} className="flex items-center gap-2 border border-slate2 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-silver transition-colors hover:border-ozone hover:text-ozone disabled:opacity-60">
                    <KeyRound className="h-3.5 w-3.5" /> {pwSent ? "Email sent" : "Send reset"}
                  </button>
                </div>
              </div>
              <div className="border border-slate2/60 bg-card/40 p-6">
                <h2 className="font-mono text-[13px] font-bold uppercase tracking-[0.14em] text-silver">Sessions</h2>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[12.5px] leading-relaxed text-dim">Sign out of this device. Session tokens are managed by Base44 auth.</p>
                  <button onClick={() => base44.auth.logout("/")} className="flex items-center gap-2 border border-slate2 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-darkgray transition-colors hover:border-flare hover:text-flare">
                    <LogOut className="h-3.5 w-3.5" /> Sign out
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── DATA ── */}
          {tab === "data" && (
            <div className="mt-6 space-y-5">
              <div className="border border-slate2/60 bg-card/40 p-6">
                <h2 className="font-mono text-[13px] font-bold uppercase tracking-[0.14em] text-silver">Your data</h2>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-display text-sm font-semibold text-silver">Export my data</div>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-darkgray">Download your profile, preferences, and every capture you've filed as JSON.</p>
                  </div>
                  <button onClick={exportData} disabled={exporting} className="flex items-center gap-2 border border-slate2 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-silver transition-colors hover:border-ozone hover:text-ozone disabled:opacity-60">
                    {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Export
                  </button>
                </div>
              </div>
              <div className="border border-flare/40">
                <div className="border-b border-flare/30 px-4 py-3">
                  <h2 className="flex items-center gap-2 font-display text-lg font-bold text-flare"><AlertTriangle className="h-4 w-4" /> Danger zone</h2>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">// irreversible account actions</p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
                  <div>
                    <div className="font-display text-sm font-semibold text-silver">Delete account</div>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-darkgray">Permanently sign out and remove your session. This cannot be undone.</p>
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
                          This signs you out permanently. To fully erase stored data, contact Base44 support after confirming. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-slate2 font-mono text-[10px] uppercase tracking-[0.2em] text-darkgray">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteAccount} disabled={deleting} className="border border-flare bg-flare font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-void hover:bg-flare/80">
                          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          )}

          <div className="mt-12 border-t border-slate2/40 pt-6 font-mono text-[10px] leading-relaxed tracking-[0.05em] text-dim">
            OOH EARTH · ACCOUNT · profile writes via updateMe (safe fields only) · role, access &amp; agency are set by admins, never here.
          </div>
        </div>
      </main>
    </div>
  );
}
