import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, FileText, ShieldCheck, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import Nav from '@/components/ooh/Nav';
import SiteFooter from '@/components/ooh/SiteFooter';
import { useSeo } from '@/lib/seoContext';
import { focusAreaLabel, initialsFrom, normalizeHandle } from '@/lib/founderProfile';

function Avatar({ url, name, handle }) {
  const [broken, setBroken] = useState(false);
  const initials = initialsFrom(name, handle);
  if (url && !broken) {
    return (
      <img
        src={url}
        alt={`${name || handle}'s avatar`}
        className="h-24 w-24 shrink-0 rounded-full border-2 border-ozone/50 object-cover md:h-32 md:w-32"
        loading="lazy"
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <div
      role="img"
      aria-label={`${name || handle}'s avatar`}
      className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 border-ozone/50 bg-card font-display text-3xl font-bold text-ozone md:h-32 md:w-32 md:text-4xl"
    >
      {initials}
    </div>
  );
}

function StatChip({ Icon, value, label }) {
  return (
    <div className="border border-slate2/60 bg-card px-4 py-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-ozone" />
      <div className="mt-1.5 font-mono text-xl font-bold tabular text-silver">{value}</div>
      <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">{label}</div>
    </div>
  );
}

export default function FounderProfile() {
  const { handle: rawHandle } = useParams();
  const handle = normalizeHandle(rawHandle);
  const [state, setState] = useState('loading'); // loading | found | not_found | error
  const [profile, setProfile] = useState(null);
  const [contributions, setContributions] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setState('loading');
      if (!handle) {
        if (alive) setState('not_found');
        return;
      }
      try {
        const res = await base44.functions.invoke('getPublicProfile', { handle });
        const data = res?.data || {};
        if (!alive) return;
        if (!data.found) {
          setState('not_found');
          return;
        }
        setProfile(data.profile);
        setContributions(data.contributions || null);
        setState('found');
      } catch {
        if (alive) setState('error');
      }
    })();
    return () => {
      alive = false;
    };
  }, [handle]);

  useSeo(
    profile
      ? {
          title: `${profile.full_name || profile.handle} — OOH Earth`,
          description:
            profile.bio ||
            `${profile.full_name || profile.handle}'s Founding Profile on OOH Earth.`,
        }
      : undefined,
  );

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-void text-silver">
        <Nav />
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate2 border-t-ozone" />
        </div>
      </div>
    );
  }

  if (state === 'not_found' || state === 'error') {
    return (
      <div className="min-h-screen bg-void text-silver">
        <Nav />
        <div className="mx-auto max-w-3xl px-5 py-24 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-flare">
            // signal lost
          </p>
          <h1 className="mt-3 font-display text-2xl font-bold">
            {state === 'error' ? 'Could not load this profile' : 'Profile not found'}
          </h1>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.15em] text-dim">
            {state === 'error'
              ? 'Something went wrong reaching the network. Try again shortly.'
              : `No founding profile exists at @${handle || ''}.`}
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 border border-slate2 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-silver hover:border-ozone hover:text-ozone"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to OOH Earth
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const memberSince = profile.member_since
    ? new Date(profile.member_since).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
      })
    : null;
  const hasContributions =
    contributions && (contributions.verified_reports > 0 || contributions.verified_rechecks > 0);

  return (
    <div className="min-h-screen bg-void grid-bg text-silver">
      <Nav />
      <main className="mx-auto max-w-3xl page-top px-5 pb-20">
        {/* Hero / identity */}
        <header className="flex flex-col items-center gap-5 border-b border-slate2/50 pb-8 text-center md:flex-row md:items-start md:text-left">
          <Avatar url={profile.avatar_url} name={profile.full_name} handle={profile.handle} />
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-bold tracking-[-0.01em] text-silver md:text-4xl">
              {profile.full_name || `@${profile.handle}`}
            </h1>
            {/* Only show the handle as a second line when it isn't already
                the heading itself (a sparse profile with no display name) --
                otherwise "@handle" would render twice in a row. */}
            {profile.full_name && (
              <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.2em] text-ozone">
                @{profile.handle}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3 md:justify-start">
              {profile.founding_member && (
                <span className="inline-flex items-center gap-1.5 border border-ozone/40 bg-ozone/5 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ozone">
                  <Star className="h-3 w-3" /> Founding Member
                </span>
              )}
              {memberSince && (
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">
                  Member since {memberSince}
                </span>
              )}
              {profile.region && (
                <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.15em] text-dim">
                  <MapPin className="h-3 w-3" /> {profile.region}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Bio */}
        {profile.bio && (
          <p className="mt-8 max-w-xl font-display text-[15px] leading-relaxed text-silver/90 md:mx-0">
            {profile.bio}
          </p>
        )}

        {/* Focus areas */}
        {profile.focus_areas?.length > 0 && (
          <div className="mt-6">
            <h2 className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">
              Focus areas
            </h2>
            <div className="mt-2 flex flex-wrap justify-center gap-2 md:justify-start">
              {profile.focus_areas.map((area) => (
                <span
                  key={area}
                  className="border border-slate2 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-silver/80"
                >
                  {focusAreaLabel(area)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Contribution signals — only real, publicly-verified data */}
        {hasContributions ? (
          <div className="mt-10">
            <h2 className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">
              Verified contribution
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-sm">
              <StatChip
                Icon={FileText}
                value={contributions.verified_reports}
                label="Verified reports"
              />
              <StatChip
                Icon={RefreshCw}
                value={contributions.verified_rechecks}
                label="Verified re-checks"
              />
            </div>
          </div>
        ) : (
          <div className="mt-10 border border-slate2/40 bg-card/30 p-5 text-center md:text-left">
            <ShieldCheck className="mx-auto h-4 w-4 text-dim md:mx-0" />
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-dim">
              No verified public contributions yet.
            </p>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
