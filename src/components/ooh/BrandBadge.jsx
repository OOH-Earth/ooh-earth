import { useEffect, useState } from 'react';
import { resolveEntityLogo, shouldRenderEntityAsset } from '@/lib/entityLogos';

// ── Entity logo icon ────────────────────────────────────────────────────────
// Renders a curated, evidence-backed logo asset from src/lib/entityLogos.js
// when one is registered for the given name; otherwise -- and on any image
// load failure -- falls back to a neutral, non-branded initial treatment.
//
// NO EVIDENCE, NO LOGO: this never generates, approximates, or infers a
// mark, and never renders fake per-brand colors. A missing logo is expected
// and safe; see entityLogos.js for why the registry may be sparse or empty.
//
// The icon is decorative (aria-hidden): every call site already shows the
// entity name as visible text nearby, so exposing it again here would just
// be redundant screen-reader noise.

function NeutralGlyph({ name, size, className }) {
  // A malformed caller (e.g. a non-string entity field from bad data) must
  // still fall back safely instead of throwing on .trim().
  const safeName = typeof name === 'string' ? name.trim() : '';
  const initial = safeName.charAt(0).toUpperCase() || '?';
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-slate2/50 bg-secondary font-mono text-[9px] font-bold text-darkgray ${className}`}
      style={{ width: size, height: size }}
    >
      {initial}
    </span>
  );
}

export function BrandIcon({ name, size = 20, className = '' }) {
  const entry = resolveEntityLogo(name);
  const [imageFailed, setImageFailed] = useState(false);

  // A different entity resolving into the same mounted icon (e.g. a list
  // item's brand_name changing) must not keep a stale failure flag.
  useEffect(() => {
    setImageFailed(false);
  }, [entry?.id]);

  if (!shouldRenderEntityAsset(entry, imageFailed)) {
    return <NeutralGlyph name={name} size={size} className={className} />;
  }

  return (
    <img
      src={entry.asset.path}
      alt=""
      aria-hidden="true"
      width={entry.asset.width}
      height={entry.asset.height}
      className={`inline-block shrink-0 rounded-full border border-white/15 object-contain ${className}`}
      style={{ width: size, height: size }}
      onError={() => setImageFailed(true)}
    />
  );
}

export function BrandBadge({ name, className = '' }) {
  if (!name?.trim()) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 border border-slate2/50 bg-card px-2 py-1 ${className}`}
    >
      <BrandIcon name={name} size={16} />
      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-silver">
        {name}
      </span>
    </span>
  );
}

export default BrandBadge;
