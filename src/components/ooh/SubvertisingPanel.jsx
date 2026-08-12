import { Image } from '@/components/ui/image';
import { Ban, ExternalLink, Building2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

// SubvertisingPanel — renders the visual before/after comparison and contextual
// notes. The advertiser intelligence fields (brand, agency, harm tags, etc.)
// live in <AdvertiserInfo /> which is rendered inline in the detail page's
// right column; this panel only appears when there are images or notes to show.
export default function SubvertisingPanel({ loc }) {
  const isSubverted = loc.adbust_type && loc.adbust_type !== 'none';
  const hasBefore = !!loc.image_url;
  const hasAfter = !!loc.adbust_image_url;
  const showCompare = isSubverted && hasAfter;
  const showSingleSubvert = isSubverted && !hasBefore && hasAfter;
  const showParticipation = !isSubverted;
  const showSubvertedNote = isSubverted;
  const hasMediaCorps = !!loc.ooh_operator;

  // Nothing visual to render — advertiser info is handled by AdvertiserInfo
  if (
    !showCompare &&
    !showSingleSubvert &&
    !showParticipation &&
    !showSubvertedNote &&
    !hasMediaCorps
  )
    return null;

  return (
    <div className="border border-slate2/60">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate2/60 px-4 py-3">
        {isSubverted ? (
          <Ban className="h-4 w-4 text-flare" />
        ) : (
          <Building2 className="h-4 w-4 text-ozone" />
        )}
        <span
          className={`font-mono text-[10px] font-bold uppercase tracking-[0.25em] ${isSubverted ? 'text-flare' : 'text-ozone'}`}
        >
          {isSubverted ? '// Subverted' : '// Subvertising'}
        </span>
        {isSubverted && (
          <span className="border border-flare/40 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-flare">
            {loc.adbust_type.replace(/_/g, ' ')}
          </span>
        )}
        {loc.condition && loc.condition !== 'functional' && (
          <span className="ml-auto border border-slate2/60 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] text-darkgray">
            {loc.condition}
          </span>
        )}
      </div>

      <div className="p-4">
        {/* Before / After comparison */}
        {showCompare && (
          <div className="grid gap-3 sm:grid-cols-2">
            {hasBefore && (
              <div>
                <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">
                  Original ad
                </span>
                <div className="relative mt-1 aspect-[4/3] overflow-hidden border border-slate2/60">
                  <Image
                    src={loc.image_url}
                    alt="Original ad"
                    className="h-full w-full"
                    fittingType="fill"
                  />
                </div>
              </div>
            )}
            <div>
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-flare">
                Subverted state
              </span>
              <div className="relative mt-1 aspect-[4/3] overflow-hidden border border-flare/40">
                <Image
                  src={loc.adbust_image_url}
                  alt="Subverted"
                  className="h-full w-full"
                  fittingType="fill"
                />
              </div>
            </div>
          </div>
        )}

        {/* Single subverted image (no original) */}
        {showSingleSubvert && (
          <div className="relative aspect-[4/3] overflow-hidden border border-flare/40">
            <Image
              src={loc.adbust_image_url}
              alt="Subverted"
              className="h-full w-full"
              fittingType="fill"
            />
          </div>
        )}

        {/* Subvertising participation note */}
        {showParticipation && (
          <div className="border-t border-slate2/40 pt-3">
            <p className="font-mono text-[10px] leading-relaxed text-dim">
              // This ad structure is part of the open-access subvertising network — a worldwide
              wave of reactionary media reclamation.
              <a
                href="https://www.publicadcampaign.com/PublicAccess/participate.html"
                target="_blank"
                rel="noreferrer"
                className="ml-1 inline-flex items-center gap-0.5 text-ozone transition-colors hover:text-flare"
              >
                Participate <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </p>
          </div>
        )}

        {/* Subverted note */}
        {showSubvertedNote && (
          <div className="border-t border-slate2/40 pt-3">
            <p className="flex items-start gap-1.5 font-mono text-[10px] leading-relaxed text-flare/70">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              This ad has been subverted — the original corporate message has been replaced or
              modified by an activist intervention. Documented on the public record.
            </p>
          </div>
        )}

        {/* Link to MediaCorps registry */}
        {hasMediaCorps && (
          <Link
            to="/media-corps"
            className="mt-4 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-dim transition-colors hover:text-ozone"
          >
            <Building2 className="h-3 w-3" /> View Media Corps registry →
          </Link>
        )}
      </div>
    </div>
  );
}
