import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Map as MapIcon, RotateCcw } from 'lucide-react';
import { createFieldMission, FIELD_MISSION_CAP, MISSION_PROGRESS } from '@/lib/fieldMission';

const STORAGE_KEY = 'ooh-field-mission-v1';

function readMission() {
  try {
    const value = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    return value?.version === 1 && Array.isArray(value.items) ? value : null;
  } catch {
    return null;
  }
}

function writeMission(value) {
  try {
    if (value) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

const progressOptions = Object.values(MISSION_PROGRESS);

export default function FieldMissionPanel({ queue, locations }) {
  const [selected, setSelected] = useState([]);
  const [mission, setMission] = useState(null);
  const [progress, setProgress] = useState({});
  const locationById = useMemo(
    () =>
      new globalThis.Map(
        (locations || []).map((location) => [
          String(location.id),
          { lat: location.lat, lng: location.lng },
        ]),
      ),
    [locations],
  );

  useEffect(() => {
    const saved = readMission();
    if (!saved) return;
    setMission(saved);
    setSelected(saved.items.map((item) => item.id));
  }, []);

  const candidates = useMemo(
    () =>
      (queue || []).map((row) => ({
        ...row,
        ...(locationById.get(String(row.id)) || {}),
      })),
    [queue, locationById],
  );

  const toggle = (id) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : current.length >= FIELD_MISSION_CAP
          ? current
          : [...current, id],
    );

  const create = () => {
    const chosen = candidates.filter((item) => selected.includes(item.id));
    const next = createFieldMission(chosen);
    setMission(next);
    setProgress({});
    writeMission(next);
  };

  const clear = () => {
    setMission(null);
    setSelected([]);
    setProgress({});
    writeMission(null);
  };

  const mapLink = mission
    ? `/map?mission=${encodeURIComponent(mission.items.map((item) => item.id).join(','))}`
    : '/map';
  return (
    <div className="mb-5 border border-ozone/30 bg-ozone/[0.03] p-4" data-testid="field-mission">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-mono text-[12px] font-bold uppercase tracking-[0.16em] text-ozone">
            Field Mission · temporary session
          </h3>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-dim">
            Select up to {FIELD_MISSION_CAP} attention locations. This is a practical geographic
            work list, not a route or travel plan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={create}
            disabled={!selected.length}
            className="border border-ozone bg-ozone px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-void disabled:cursor-not-allowed disabled:border-slate2 disabled:bg-transparent disabled:text-dim"
          >
            Create mission ({selected.length}/{FIELD_MISSION_CAP})
          </button>
          {mission && (
            <button
              type="button"
              onClick={clear}
              className="border border-slate2 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-dim hover:border-flare hover:text-flare"
            >
              Clear mission
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {candidates.map((item) => (
          <label
            key={item.id}
            className="flex min-w-0 cursor-pointer items-start gap-2 border border-slate2/50 bg-card/60 p-3 hover:border-ozone/60"
          >
            <input
              type="checkbox"
              aria-label={item.id}
              checked={selected.includes(item.id)}
              onChange={() => toggle(item.id)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#EDFF00]"
            />
            <span className="min-w-0">
              <span className="block truncate font-mono text-[11px] font-bold text-silver">
                {item.id}
              </span>
              <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.1em] text-dim">
                {item.priority} · {item.next_action}
              </span>
            </span>
          </label>
        ))}
      </div>

      {mission && (
        <div className="mt-4 border-t border-ozone/20 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-silver">
              Mission {mission.items.length} locations · {mission.ordering}
            </div>
            <Link
              to={mapLink}
              className="inline-flex min-h-9 items-center gap-1.5 border border-ozone/60 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-ozone hover:bg-ozone hover:text-void"
            >
              <MapIcon className="h-3.5 w-3.5" /> View on map
            </Link>
          </div>
          <div className="mt-3 grid gap-2">
            {mission.items.map((item, index) => {
              const state = progress[item.id] || MISSION_PROGRESS.NOT_STARTED;
              return (
                <div
                  key={item.id}
                  className="grid min-w-0 gap-2 border border-slate2/40 bg-card/50 p-3 md:grid-cols-[1fr_auto_auto] md:items-center"
                >
                  <div className="min-w-0">
                    <div className="truncate font-mono text-[11px] font-bold text-silver">
                      {index + 1}. {item.id}
                    </div>
                    <div className="mt-1 text-[12px] text-dim">
                      {item.priority} · {item.reasons?.join('; ') || 'Evidence reason unavailable'}
                    </div>
                    <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-dim">
                      {item.distance_m == null
                        ? 'DISTANCE UNKNOWN'
                        : `${Math.round(item.distance_m).toLocaleString()} m GEODESIC DISTANCE`}{' '}
                      · {item.photo_state || 'PHOTO STATE UNKNOWN'} ·{' '}
                      {item.verification_state || 'VERIFICATION UNKNOWN'}
                    </div>
                  </div>
                  <select
                    aria-label={`Mission status for ${item.id}`}
                    value={state}
                    onChange={(event) =>
                      setProgress((current) => ({ ...current, [item.id]: event.target.value }))
                    }
                    className="min-h-9 border border-slate2 bg-black px-2 font-mono text-[9px] uppercase tracking-[0.08em] text-silver"
                  >
                    {progressOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                  <Link
                    to={`/location/${item.id}?action=recheck&from=field-mission`}
                    className="inline-flex min-h-9 items-center justify-center gap-1 border border-ozone/50 px-2 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-ozone hover:bg-ozone hover:text-void"
                  >
                    {item.next_action} <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-[9px] uppercase tracking-[0.1em] text-dim">
            <span>
              <RotateCcw className="mr-1 inline h-3 w-3" />
              Return to this mission with browser back or reopen Field Attention in this session.
            </span>
            <span>Coordinates missing: distance remains UNKNOWN.</span>
          </div>
        </div>
      )}
    </div>
  );
}
