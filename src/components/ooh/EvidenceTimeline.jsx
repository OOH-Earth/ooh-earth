import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Camera, Clock3, FileCheck2, History, Loader2, ShieldCheck } from 'lucide-react';
import { buildEvidenceTimeline } from '@/lib/evidenceTimeline';

function dateLabel(value) {
  return value ? new Date(value).toLocaleString() : 'UNKNOWN';
}

function EvidenceClass({ value }) {
  return (
    <span className="border border-slate2/50 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-silver">
      {value}
    </span>
  );
}

export default function EvidenceTimeline({ location }) {
  const [checks, setChecks] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!location?.id) return undefined;
    setLoading(true);
    Promise.all([
      base44.entities.FieldCheck.filter({ location_id: String(location.id) }, '-created_date', 50),
      base44.entities.LocationPhoto.filter(
        { location_id: String(location.id) },
        '-created_date',
        50,
      ),
    ])
      .then(([nextChecks, nextPhotos]) => {
        if (active) {
          setChecks(nextChecks || []);
          setPhotos(nextPhotos || []);
        }
      })
      .catch(() => {
        if (active) {
          setChecks([]);
          setPhotos([]);
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [location?.id]);

  const memory = buildEvidenceTimeline({ location, fieldChecks: checks, locationPhotos: photos });
  const current = memory.events.filter((item) => item.freshness === 'CURRENT');
  const historical = memory.events.filter((item) => item.freshness !== 'CURRENT');

  return (
    <section className="mb-8 border border-ozone/30 bg-card" data-testid="evidence-timeline">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate2/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-ozone" />
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-ozone">
            Evidence Memory
          </h2>
          <span className="border border-ozone/40 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.16em] text-ozone/80">
            cap {memory.cap}
          </span>
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-dim" />}
      </div>
      <div className="px-4 py-4">
        {!loading && memory.evidence_state === 'NO_EVIDENCE' ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-dim">
            No evidence recorded yet.
          </p>
        ) : (
          <>
            <EvidenceGroup label="CURRENT EVIDENCE" items={current} />
            <EvidenceGroup label="HISTORICAL / UNKNOWN EVIDENCE" items={historical} />
            {!loading && (
              <div className="mt-4 border-t border-slate2/30 pt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-dim">
                <span className="text-flare">CHANGE:</span>{' '}
                {memory.changes.length
                  ? memory.changes
                      .map((change) => `${change.label}: ${change.before} → ${change.after}`)
                      .join(' · ')
                  : 'UNKNOWN — no proven comparable change established'}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function EvidenceGroup({ label, items }) {
  if (!items.length) return null;
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-dim">
        {label}
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex min-w-0 gap-3 border-l border-slate2/50 pl-3">
            <div className="mt-0.5 shrink-0 text-ozone">
              {item.kind === 'PHOTO_EVIDENCE' ? (
                <Camera className="h-3.5 w-3.5" />
              ) : item.kind === 'VERIFICATION_STATE' ? (
                <ShieldCheck className="h-3.5 w-3.5" />
              ) : (
                <FileCheck2 className="h-3.5 w-3.5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-silver">
                  {item.what}
                </span>
                <EvidenceClass value={item.evidence_class} />
                {item.status && (
                  <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-dim">
                    {item.status}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[9px] uppercase tracking-[0.1em] text-dim">
                <span>
                  <Clock3 className="mr-1 inline h-3 w-3" />
                  {dateLabel(item.at)}
                </span>
                <span>{item.source}</span>
                <span>{item.freshness}</span>
              </div>
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt="Verified evidence"
                  className="mt-2 h-16 w-24 rounded-none border border-slate2/60 object-cover"
                  loading="lazy"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
