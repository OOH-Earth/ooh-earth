import { useState } from 'react';
import { deriveLogisticsEvidence, isValidCoordinate } from '@/lib/logisticsEvidence';

const inputClass =
  'w-full border border-slate2/70 bg-void px-2 py-2 font-mono text-[10px] text-silver';

export default function LogisticsEvidence({ fields, contextPoint, onContextPointChange }) {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [inputError, setInputError] = useState('');
  const logistics = deriveLogisticsEvidence(fields, contextPoint);
  const hasOrigin = logistics.declaredOrigin != null;
  const hasManufacturing = logistics.manufacturingPlace != null;

  const applyContextPoint = () => {
    const point = { lat: latitude, lng: longitude };
    if (!isValidCoordinate(point)) {
      setInputError('Enter a valid latitude (-90 to 90) and longitude (-180 to 180).');
      return;
    }
    setInputError('');
    onContextPointChange({ lat: Number(latitude), lng: Number(longitude) });
  };

  return (
    <section className="border-t border-slate2/60 p-4" aria-label="Logistics evidence">
      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ozone">
        Logistics V1
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="border border-slate2/60 bg-void p-3">
          <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">
            Declared origin
          </div>
          <div className="mt-1 break-words font-display text-sm text-silver">
            {hasOrigin ? logistics.declaredOrigin : 'Unknown'}
          </div>
          <div className="mt-2 font-mono text-[9px] text-darkgray">
            {hasOrigin ? 'Reported by source' : 'UNKNOWN'}
          </div>
        </div>
        <div className="border border-slate2/60 bg-void p-3">
          <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">
            Manufacturing place
          </div>
          <div className="mt-1 break-words font-display text-sm text-silver">
            {hasManufacturing ? logistics.manufacturingPlace : 'Unknown'}
          </div>
          <div className="mt-2 font-mono text-[9px] text-darkgray">
            {hasManufacturing ? 'Reported by source' : 'UNKNOWN'}
          </div>
        </div>
      </div>

      <div className="mt-3 border border-slate2/60 bg-void p-3">
        <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">
          OOH context point
        </div>
        <p className="mt-1 font-display text-xs leading-relaxed text-darkgray">
          Optional explicit point. No device GPS is read or sent to the product provider.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="font-mono text-[9px] uppercase tracking-[0.12em] text-dim">
            Latitude
            <input
              aria-label="OOH context latitude"
              className={inputClass}
              inputMode="decimal"
              value={latitude}
              onChange={(event) => setLatitude(event.target.value)}
            />
          </label>
          <label className="font-mono text-[9px] uppercase tracking-[0.12em] text-dim">
            Longitude
            <input
              aria-label="OOH context longitude"
              className={inputClass}
              inputMode="decimal"
              value={longitude}
              onChange={(event) => setLongitude(event.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={applyContextPoint}
            className="border border-ozone/60 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ozone hover:bg-ozone/10"
          >
            Apply point
          </button>
        </div>
        {inputError && <p className="mt-2 font-mono text-[9px] text-flare">{inputError}</p>}
        {logistics.distanceKm != null ? (
          <div className="mt-3 border-l-2 border-ozone pl-3">
            <div className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-ozone">
              Derived geodesic distance
            </div>
            <div className="mt-1 font-display text-sm text-silver">
              {logistics.distanceKm.toLocaleString()} km geodesic separation
            </div>
            <div className="mt-1 font-mono text-[9px] text-darkgray">
              Not shipping distance, transport route, or freight distance.
            </div>
          </div>
        ) : (
          <p className="mt-3 font-mono text-[9px] leading-relaxed text-darkgray">
            No evidenced coordinate pair is available. Route, mode, and factory remain UNKNOWN.
          </p>
        )}
      </div>
    </section>
  );
}
