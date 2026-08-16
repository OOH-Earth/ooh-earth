import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { compressImage } from '@/lib/imageCompress';
import { validateImageFile } from '@/lib/validateUpload';
import { SprayCan, Crosshair, Loader2, Check, X, MapPin, CloudOff, Camera } from 'lucide-react';
import { submitCapture } from '@/lib/offlineQueue';
import CameraViewfinder from '@/components/ooh/CameraViewfinder';
import { useKeyboardFilePicker } from '@/hooks/useKeyboardFilePicker';

const GRAFFITI_TYPES = [
  { value: 'painted', label: 'Painted' },
  { value: 'mural', label: 'Mural' },
  { value: 'sticker', label: 'Sticker' },
  { value: 'projection', label: 'Projection' },
  { value: 'other', label: 'Other' },
];

const MEDIUMS = [
  { value: '', label: '— Unknown —' },
  { value: 'spray_paint', label: 'Spray Paint' },
  { value: 'marker', label: 'Marker' },
  { value: 'sticker', label: 'Sticker' },
  { value: 'paste_up', label: 'Paste-up' },
  { value: 'stencil', label: 'Stencil' },
  { value: 'installation', label: 'Installation' },
  { value: 'other', label: 'Other' },
];

const STYLES = [
  { value: '', label: '— Unknown —' },
  { value: 'tag', label: 'Tag' },
  { value: 'throw_up', label: 'Throw-up' },
  { value: 'piece', label: 'Piece' },
  { value: 'mural', label: 'Mural' },
  { value: 'blockbuster', label: 'Blockbuster' },
  { value: 'stencil', label: 'Stencil' },
  { value: 'paste_up', label: 'Paste-up' },
  { value: 'other', label: 'Other' },
];

export default function GraffitiCamera({ open, onClose }) {
  const [type, setType] = useState('painted');
  const [medium, setMedium] = useState('spray_paint');
  const [style, setStyle] = useState('');
  const [surfaceM2, setSurfaceM2] = useState('');
  const [coveragePct, setCoveragePct] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [image_url, setImageUrl] = useState('');
  const [locating, setLocating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState('');
  const uploadTrigger = useKeyboardFilePicker(uploading);

  const locate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(5));
        setLng(pos.coords.longitude.toFixed(5));
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError('Location unavailable — enter coordinates manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  useEffect(() => {
    if (!open) return;
    setError('');
    setDone(null);
    locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const reset = () => {
    setDone(null);
    setImageUrl('');
    setAddress('');
    setLat('');
    setLng('');
    setType('painted');
    setMedium('spray_paint');
    setStyle('');
    setSurfaceM2('');
    setCoveragePct('');
    setError('');
  };

  const uploadFile = async (file) => {
    if (!file) return;
    setError('');
    const check = await validateImageFile(file);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file: await compressImage(file) });
      setImageUrl(res.file_url);
    } catch {
      setError('Photo upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const onPhoto = (e) => uploadFile(e.target.files?.[0]);
  const onCapture = (file) => uploadFile(file);

  const submit = async () => {
    setError('');
    const latN = parseFloat(lat),
      lngN = parseFloat(lng);
    if (!image_url) {
      setError('Capture a graffiti photograph first.');
      return;
    }
    if (!isFinite(latN) || !isFinite(lngN)) {
      setError('Coordinates required — allow location access.');
      return;
    }
    setSubmitting(true);
    const label = GRAFFITI_TYPES.find((t) => t.value === type)?.label || type;
    const title = `Graffiti · ${address.split(',')[0].trim() || 'Field capture'}`;
    // Build payload — strip empty numeric fields (API rejects "" for number type)
    const payload = {
      title,
      type,
      address,
      lat: latN,
      lng: lngN,
      image_url,
      notes: 'Graffiti field capture',
      source_link: '',
      status: 'pending',
      graffiti_medium: medium || undefined,
      graffiti_style: style || undefined,
      graffiti_surface_m2: surfaceM2 ? Number(surfaceM2) : undefined,
      graffiti_coverage_pct: coveragePct ? Number(coveragePct) : undefined,
    };
    try {
      const res = await submitCapture(payload);
      if (res.status === 'synced') setDone(res.rec);
      else setDone({ queued: true, lat: latN, lng: lngN });
    } catch (err) {
      setError(err?.message || 'Transmission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const showManual = !locating && (!lat || !lng);

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto border border-flare/40 bg-void p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 text-dim transition-colors hover:text-flare"
        >
          <X className="h-4 w-4" />
        </button>

        {done ? (
          <>
            {done.queued ? (
              <CloudOff className="h-7 w-7 text-flare" />
            ) : (
              <Check className="h-7 w-7 text-ozone" />
            )}
            <h3 className="mt-3 font-display text-2xl font-bold tracking-[-0.02em] text-silver">
              {done.queued ? 'Queued offline' : 'Captured'}
            </h3>
            <p className="mt-2 font-display text-sm leading-[1.4] text-darkgray">
              {done.queued
                ? `Offline — saved on this device. It transmits automatically when you reconnect. Position ${done.lat?.toFixed(4)}, ${done.lng?.toFixed(4)}.`
                : `Graffiti documented at ${done.lat?.toFixed(4)}, ${done.lng?.toFixed(4)}. It renders on the map and graffiti portal pending verification.`}
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => {
                  reset();
                  onClose();
                }}
                className="inline-flex items-center gap-2 bg-ozone px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare"
              >
                <MapPin className="h-3.5 w-3.5" /> View on map
              </button>
              <button
                onClick={reset}
                className="border border-slate2 px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-darkgray transition-colors hover:border-ozone hover:text-ozone"
              >
                Another
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <SprayCan className="h-4 w-4 text-flare" />
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-flare">
                Graffiti field camera
              </span>
            </div>
            <h3 className="mt-2 font-display text-xl font-bold tracking-[-0.02em] text-silver">
              Photograph the piece
            </h3>
            <p className="mt-1 font-mono text-[10px] leading-relaxed text-dim">
              Capture graffiti and street art in the wild — logs to the graffiti portal and field
              map.
            </p>

            {image_url ? (
              <div className="relative mt-4 aspect-[4/3] overflow-hidden border border-slate2 bg-card">
                <img src={image_url} alt="capture" className="h-full w-full object-cover" />
                <button
                  onClick={() => setImageUrl('')}
                  className="absolute right-2 top-2 flex items-center gap-1.5 border border-slate2 bg-void/80 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-silver backdrop-blur-sm transition-colors hover:border-flare hover:text-flare"
                >
                  <Camera className="h-3 w-3" /> Retake
                </button>
              </div>
            ) : (
              <>
                <div className="mt-4">
                  <CameraViewfinder onCapture={onCapture} uploading={uploading} />
                </div>
                <label
                  {...uploadTrigger.labelProps}
                  aria-label="Or choose from gallery"
                  className={`mt-2 flex items-center justify-center gap-2 border border-slate2/60 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-darkgray transition-colors ${uploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-flare hover:text-flare'}`}
                >
                  <Camera className="h-3 w-3" /> Or choose from gallery
                  <input
                    {...uploadTrigger.inputProps}
                    type="file"
                    accept="image/*"
                    onChange={onPhoto}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </>
            )}

            {/* Surface type */}
            <div className="mt-4">
              <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
                Surface type
              </span>
              <div className="grid grid-cols-5 gap-px border border-slate2/60 bg-slate2/40">
                {GRAFFITI_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`py-2 font-mono text-[9px] font-bold uppercase tracking-[0.1em] transition-colors ${type === t.value ? 'bg-flare text-void' : 'bg-card text-darkgray hover:text-silver'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Medium + Style */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
                  Medium
                </span>
                <select
                  value={medium}
                  onChange={(e) => setMedium(e.target.value)}
                  className="border border-slate2 bg-void px-3 py-2 text-sm text-silver outline-none focus:border-flare"
                >
                  {MEDIUMS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
                  Style
                </span>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="border border-slate2 bg-void px-3 py-2 text-sm text-silver outline-none focus:border-flare"
                >
                  {STYLES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Measurements */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
                  Surface (m²)
                </span>
                <input
                  type="number"
                  step="0.1"
                  value={surfaceM2}
                  onChange={(e) => setSurfaceM2(e.target.value)}
                  className="border border-slate2 bg-void px-3 py-2 text-sm text-silver outline-none focus:border-flare"
                  placeholder="e.g. 4.5"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
                  Coverage %
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={coveragePct}
                  onChange={(e) => setCoveragePct(e.target.value)}
                  className="border border-slate2 bg-void px-3 py-2 text-sm text-silver outline-none focus:border-flare"
                  placeholder="0–100"
                />
              </label>
            </div>

            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, district (optional)"
              className="mt-4 w-full border border-slate2 bg-void px-4 py-3 font-display text-sm text-silver outline-none transition-colors placeholder:text-dim focus:border-flare"
            />

            <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
              <span className="flex items-center gap-1.5">
                <Crosshair className="h-3 w-3" />
                {lat && lng ? `${lat}, ${lng}` : locating ? 'Locating…' : 'No coordinates'}
              </span>
              <button onClick={locate} className="text-flare transition-opacity hover:opacity-70">
                {locating ? '…' : 'Re-locate'}
              </button>
            </div>

            {showManual && (
              <div className="mt-2 grid grid-cols-2 gap-px border border-slate2/60 bg-slate2/40">
                <input
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="Latitude"
                  inputMode="decimal"
                  className="border-0 bg-card px-3 py-2.5 font-mono text-[11px] text-silver outline-none"
                />
                <input
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="Longitude"
                  inputMode="decimal"
                  className="border-0 bg-card px-3 py-2.5 font-mono text-[11px] text-silver outline-none"
                />
              </div>
            )}

            {error && (
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-flare">
                {error}
              </p>
            )}

            <button
              onClick={submit}
              disabled={submitting || uploading}
              className="mt-5 flex w-full items-center justify-center gap-2 border border-flare bg-flare px-6 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-void transition-colors hover:bg-ozone hover:border-ozone disabled:opacity-40"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SprayCan className="h-4 w-4" />
              )}
              {submitting ? 'Transmitting…' : 'Transmit capture'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
