import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import {
  User as UserIcon,
  LogOut,
  LogIn,
  UserPlus,
  LayoutDashboard,
  Zap,
  Cpu,
  Settings,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';

/* ────────────────────────────────────────────────────────────
   Global account control for the top nav. Surfaces login/logout
   from anywhere in the app + a per-member-type quick menu.
   - Not authenticated → guest panel → Log in / Create account.
   - Authenticated → avatar → Account / Dashboard / Field profile /
     (Architecture Ops for agency) / Sign out.
   Reads clearance defensively (role/access/agency), same helpers
   the rest of the app uses. Never writes anything.
──────────────────────────────────────────────────────────── */

import { roleOf, accessOf, agencyOf } from '@/lib/clearance';

const ACCESS_BADGE = {
  admin: 'border-ozone/50 text-ozone',
  moderator: 'border-flare/50 text-flare',
  operative: 'border-silver/40 text-silver',
  member: 'border-slate2/60 text-darkgray',
};

function initials(name, email) {
  const src = (name || email || '').trim();
  if (!src) return 'OP';
  const parts = src.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export default function AccountMenu() {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const triggerRef = useRef(null);

  // Escape has no other focus target, so closing it must return focus to
  // the trigger -- otherwise a keyboard user loses their position entirely
  // (focus falls back to document.body). An outside click is different: the
  // user's click already has its own target (another link, the map, empty
  // space), so stealing focus back to the trigger there would fight the
  // interaction they were actually making -- just close and let the
  // browser's normal focus behavior for that click proceed.
  const closeViaKeyboard = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') closeViaKeyboard();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!isAuthenticated || !user) {
    return (
      <div className="relative" ref={ref}>
        <button
          ref={triggerRef}
          onClick={() => setOpen((o) => !o)}
          aria-label="Account"
          aria-expanded={open}
          className="flex h-10 items-center gap-2 border border-slate2 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-silver transition-colors hover:border-ozone hover:text-ozone md:h-8"
        >
          <UserIcon className="h-4 w-4 md:h-3.5 md:w-3.5" />{' '}
          <span className="hidden sm:inline">Log in</span>
        </button>

        {open && (
          <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-64 border border-slate2 bg-void shadow-[0_8px_28px_rgba(0,0,0,0.5)]">
            <div className="border-b border-slate2/60 px-4 py-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ozone">
                Guest access
              </div>
              <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-dim">
                You're browsing the open map. Sign in to file offenses, earn rank, and shape the
                DAO.
              </p>
            </div>
            <div className="p-2">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 border-2 border-ozone bg-ozone py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:border-flare hover:bg-flare"
              >
                <LogIn className="h-3.5 w-3.5" /> Log in
              </Link>
              <Link
                to="/register"
                onClick={() => setOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 border border-slate2 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-silver transition-colors hover:border-ozone hover:text-ozone"
              >
                <UserPlus className="h-3.5 w-3.5" /> Create account
              </Link>
            </div>
            <div className="flex items-center justify-between border-t border-slate2/60 px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.15em] text-darkgray">
              <span>Newcomer → Mythic</span>
              <Link
                to="/map"
                onClick={() => setOpen(false)}
                className="transition-colors hover:text-ozone"
              >
                Map →
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  const isAdmin = roleOf(user) === 'admin' || accessOf(user) === 'admin';
  const isAgency = isAdmin || agencyOf(user);
  const access = isAdmin ? 'admin' : accessOf(user);
  const label = user.handle || user.full_name || user.email;

  const items = [
    { to: '/account', label: 'Account settings', icon: Settings },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/operative', label: 'Field profile', icon: Zap },
    ...(isAgency ? [{ to: '/portal/ops', label: 'Architecture Ops', icon: Cpu }] : []),
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        className="flex h-10 items-center gap-1.5 border border-slate2 pl-1.5 pr-2 text-silver transition-colors hover:border-ozone hover:text-ozone md:h-8"
      >
        <span className="flex h-7 w-7 items-center justify-center bg-ozone/10 font-mono text-[10px] font-bold text-ozone md:h-6 md:w-6">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            initials(user.full_name, user.email)
          )}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-60 border border-slate2 bg-void shadow-[0_8px_28px_rgba(0,0,0,0.5)]">
          <div className="border-b border-slate2/60 px-3 py-3">
            <div className="truncate font-display text-sm font-bold text-silver">{label}</div>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] ${ACCESS_BADGE[access] || ACCESS_BADGE.member}`}
              >
                {(access === 'admin' || access === 'moderator') && (
                  <ShieldCheck className="h-2.5 w-2.5" />
                )}
                {access}
              </span>
              {isAgency && (
                <span className="border border-ozone/40 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-ozone">
                  agency
                </span>
              )}
            </div>
          </div>
          <nav className="py-1">
            {items.map((it) => {
              const Icon = it.icon;
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-dim transition-colors hover:bg-ozone/[0.06] hover:text-silver"
                >
                  <Icon className="h-3.5 w-3.5" /> {it.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-slate2/60 py-1">
            <button
              onClick={() => base44.auth.logout('/')}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-darkgray transition-colors hover:bg-flare/[0.06] hover:text-flare"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
