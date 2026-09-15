import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { MapPin, ShieldQuestion, ShieldCheck, ShieldX, Send, Loader2 } from 'lucide-react';
import { BrandIcon } from '@/components/ooh/BrandBadge';
import {
  PUBLIC_SPACE_TYPE_LABELS,
  RELATIONSHIP_TYPES,
  relationshipTypeLabel,
  settingLabel,
  publicAccessLabel,
} from '@/lib/publicSpace';

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'today';
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

// RELATIONSHIP status → badge. 'pending'/'rejected' both read as UNKNOWN in
// the public-facing copy -- only a moderator-verified row ever gets to claim
// a real relationship. See LocationRelationship.jsonc's status RLS lock.
function RelationshipRow({ r }) {
  const isVerified = r.status === 'verified';
  const Icon = isVerified ? ShieldCheck : r.status === 'rejected' ? ShieldX : ShieldQuestion;
  return (
    <div className="flex items-start gap-3 border border-slate2/40 bg-void p-3">
      <BrandIconOrFallback name={r.brand_name} />
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm text-silver">
          {r.brand_name} <span className="text-dim">→</span>{' '}
          {isVerified ? relationshipTypeLabel(r.relationship_type) : 'UNKNOWN'}
        </p>
        {isVerified ? (
          <div className="mt-1 space-y-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-dim">
            {r.evidence_source && <p>Source: {r.evidence_source}</p>}
            {r.verified_date && <p>Verified: {timeAgo(r.verified_date)}</p>}
          </div>
        ) : (
          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-dim">
            {r.status === 'rejected'
              ? 'Claim reviewed — evidence did not support it'
              : 'Unverified claim — no evidence reviewed yet'}
          </p>
        )}
      </div>
      <span
        className={`shrink-0 border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] ${
          isVerified
            ? 'border-ozone/50 text-ozone'
            : r.status === 'rejected'
              ? 'border-flare/50 text-flare'
              : 'border-slate2 text-dim'
        }`}
      >
        <Icon className="mr-1 inline h-2.5 w-2.5" />
        {isVerified ? 'Verified' : r.status === 'rejected' ? 'Rejected' : 'Unverified'}
      </span>
    </div>
  );
}

// Icon only -- the brand name text is already rendered by the caller
// (RelationshipRow / the branding block below), so this never duplicates it.
function BrandIconOrFallback({ name }) {
  return (
    <div className="mt-0.5">
      <BrandIcon name={name} size={20} />
    </div>
  );
}

function ProposeRelationship({ location, onAdded }) {
  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState('');
  const [type, setType] = useState('unknown');
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!brand.trim()) {
      setError('Brand/organization name is required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const rec = await base44.entities.LocationRelationship.create({
        location_id: location.id,
        location_title: location.title,
        brand_name: brand.trim(),
        relationship_type: type,
        evidence_source: evidence.trim() || undefined,
        // status is intentionally omitted -- it is RLS-locked and defaults
        // to 'pending'; a submitter can never self-verify a claim.
      });
      setDone(true);
      onAdded?.(rec);
    } catch (e) {
      setError(e.message || 'Failed to submit.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <p className="border border-ozone/30 bg-ozone/5 p-3 font-mono text-[10px] uppercase tracking-[0.15em] text-ozone">
        Claim submitted — stays UNKNOWN/pending until a moderator reviews the evidence.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 border border-slate2 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone"
      >
        <Send className="h-3 w-3" /> Propose a relationship
      </button>
    );
  }

  return (
    <div className="space-y-2 border border-slate2/50 bg-void p-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">
        A claim, not a fact — it stays UNKNOWN until a moderator reviews the evidence you provide.
      </p>
      <input
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
        placeholder="Brand / organization name"
        className="w-full border border-slate2 bg-secondary px-3 py-2 text-sm text-silver outline-none focus:border-ozone"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="w-full border border-slate2 bg-secondary px-3 py-2 text-sm text-silver outline-none focus:border-ozone"
      >
        {RELATIONSHIP_TYPES.map((t) => (
          <option key={t} value={t}>
            {relationshipTypeLabel(t)}
          </option>
        ))}
      </select>
      <textarea
        value={evidence}
        onChange={(e) => setEvidence(e.target.value)}
        placeholder="Evidence: plaque text, naming-rights signage, announcement URL, etc."
        rows={2}
        className="w-full border border-slate2 bg-secondary px-3 py-2 text-sm text-silver outline-none focus:border-ozone"
      />
      {error && <p className="font-mono text-[9px] text-flare">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={submitting}
          className="flex items-center gap-1.5 border-2 border-ozone bg-ozone px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:bg-flare hover:border-flare disabled:opacity-40"
        >
          {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          Submit
        </button>
        <button
          onClick={() => setOpen(false)}
          className="px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-dim hover:text-silver"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function PublicSpacePanel({ location }) {
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!location?.id) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const recs = await base44.entities.LocationRelationship.filter(
          { location_id: location.id },
          '-created_date',
          50,
        );
        if (active) setRelationships(recs || []);
      } catch {
        if (active) setRelationships([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    let unsub;
    try {
      unsub = base44.entities.LocationRelationship?.subscribe?.(load);
    } catch {
      unsub = null;
    }
    return () => {
      active = false;
      if (unsub) unsub();
    };
  }, [location?.id]);

  const typeLabel = PUBLIC_SPACE_TYPE_LABELS[location.type] || location.type;

  return (
    <div data-testid="public-space-panel" className="border border-ozone/30 bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <MapPin className="h-3.5 w-3.5 text-ozone" />
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">
          Public Space
        </span>
      </div>

      <div className="mb-4 space-y-0.5">
        <p className="font-display text-lg font-bold text-silver">{typeLabel}</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-dim">
          {settingLabel(location.setting)} · Public access:{' '}
          {publicAccessLabel(location.public_access)}
        </p>
      </div>

      {location.brand_name && (
        <div className="mb-4">
          <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">
            Visible Branding
          </p>
          <div className="flex items-start gap-3 border border-slate2/40 bg-void p-3">
            <BrandIconOrFallback name={location.brand_name} />
            <div className="min-w-0">
              <p className="font-display text-sm text-silver">{location.brand_name}</p>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-dim">
                Evidence: logo visible in submitted photo — not a claimed relationship
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">
          Relationships
        </p>
        {loading ? (
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">Loading…</p>
        ) : relationships.length === 0 ? (
          <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.15em] text-dim">
            No relationship claims on record — no evidence, no claim.
          </p>
        ) : (
          <div className="mb-2 space-y-2">
            {relationships.map((r) => (
              <RelationshipRow key={r.id} r={r} />
            ))}
          </div>
        )}
        <ProposeRelationship
          location={location}
          onAdded={(rec) => setRelationships((prev) => [rec, ...prev])}
        />
      </div>
    </div>
  );
}
