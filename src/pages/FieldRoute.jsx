import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Map as MapIcon, RotateCcw, MapPin } from 'lucide-react';
import Nav from '@/components/ooh/Nav';
import {
  MISSION_PROGRESS,
  missionItemProgress,
  updateMissionProgress,
  loadFieldMission,
  saveFieldMission,
  clearFieldMission,
} from '@/lib/fieldMission';

const progressOptions = Object.values(MISSION_PROGRESS);

/**
 * Public view of the "field route" any visitor (anonymous included) builds
 * via "Add to field route" on Map.jsx / LocationDetail.jsx -- a plain
 * sessionStorage list, no entity, no auth. Before this page existed, the
 * only place that ever rendered that list was FieldMissionPanel inside
 * PortalOps, which requires agency/admin access (`isAgency` gate) -- so
 * every non-agency visitor who added locations to a route, then clicked
 * "Return to mission" / "Open route", hit a login wall or an "Agency
 * access required" dead end and could never see, progress, or clear the
 * list they'd just built. This page closes that gap with the same
 * session-only data; it adds no entity, schema, or permission.
 */
export default function FieldRoute() {
  const [mission, setMission] = useState(null);

  useEffect(() => {
    setMission(loadFieldMission());
  }, []);

  const clear = () => {
    clearFieldMission();
    setMission(null);
  };

  const setItemProgress = (id, value) => {
    setMission((current) => {
      if (!current) return current;
      const next = updateMissionProgress(current, id, value);
      saveFieldMission(next);
      return next;
    });
  };

  const items = mission?.items || [];
  const mapLink = items.length
    ? `/map?mission=${encodeURIComponent(items.map((item) => item.id).join(','))}`
    : '/map';

  return (
    <div className="min-h-screen bg-void">
      <Nav />
      <main className="page-top mx-auto max-w-3xl px-5 pb-24 md:px-8">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
            // Field route · temporary session
          </span>
          <h1 className="font-display text-3xl font-black uppercase tracking-tight2 text-silver md:text-5xl">
            Your field route.
          </h1>
          <p className="mt-2 max-w-xl font-display text-sm leading-relaxed text-darkgray">
            A practical work list of locations you&apos;ve added from the map or a location page --
            not a travel plan. Stored for this browser session only; it clears when the tab closes.
          </p>
        </div>

        {items.length === 0 ? (
          <div
            data-testid="field-route-empty"
            className="mt-8 flex flex-col items-center gap-3 border border-dashed border-slate2 bg-card p-10 text-center"
          >
            <MapPin className="h-8 w-8 text-dim" strokeWidth={1.2} />
            <p className="max-w-[40ch] font-mono text-[11px] uppercase tracking-[0.1em] text-dim">
              Nothing in your field route yet. Open the map or any location page and use &quot;Add
              to field route&quot;.
            </p>
            <Link
              to="/map"
              className="mt-2 inline-flex items-center gap-1.5 border border-ozone/60 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-ozone hover:bg-ozone hover:text-void"
            >
              <MapIcon className="h-3.5 w-3.5" /> Open the map
            </Link>
          </div>
        ) : (
          <div className="mt-8 border border-ozone/30 bg-ozone/[0.03] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div
                data-testid="field-route-count"
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-silver"
              >
                {items.length} location{items.length === 1 ? '' : 's'} · {mission.ordering}
              </div>
              <Link
                to={mapLink}
                className="inline-flex min-h-9 items-center gap-1.5 border border-ozone/60 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-ozone hover:bg-ozone hover:text-void"
              >
                <MapIcon className="h-3.5 w-3.5" /> View on map
              </Link>
            </div>

            <div className="mt-3 grid gap-2">
              {items.map((item, index) => {
                const state = missionItemProgress(mission, item.id);
                return (
                  <div
                    key={item.id}
                    data-testid="field-route-item"
                    className="grid min-w-0 gap-2 border border-slate2/40 bg-card/50 p-3 md:grid-cols-[1fr_auto_auto] md:items-center"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-mono text-[11px] font-bold text-silver">
                        {index + 1}. {item.title || item.id}
                      </div>
                      <div className="mt-1 truncate text-[12px] text-dim">
                        {[item.type, item.address].filter(Boolean).join(' · ') ||
                          'Details unavailable'}
                      </div>
                      <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-dim">
                        {item.distance_m == null
                          ? 'DISTANCE UNKNOWN'
                          : `${Math.round(item.distance_m).toLocaleString()} m GEODESIC DISTANCE`}
                      </div>
                    </div>
                    <select
                      aria-label={`Field route status for ${item.title || item.id}`}
                      value={state}
                      onChange={(event) => setItemProgress(item.id, event.target.value)}
                      className="min-h-9 border border-slate2 bg-black px-2 font-mono text-[9px] uppercase tracking-[0.08em] text-silver"
                    >
                      {progressOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                    <Link
                      to={`/location/${item.id}?from=field-route`}
                      className="inline-flex min-h-9 items-center justify-center gap-1 border border-ozone/50 px-2 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-ozone hover:bg-ozone hover:text-void"
                    >
                      Open
                    </Link>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ozone/20 pt-4">
              <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-dim">
                <RotateCcw className="h-3 w-3" /> Coordinates missing: distance stays UNKNOWN.
              </span>
              <button
                type="button"
                onClick={clear}
                className="border border-slate2 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-dim hover:border-flare hover:text-flare"
              >
                Clear route
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
