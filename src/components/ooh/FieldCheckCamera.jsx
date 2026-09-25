import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { compressImage } from '@/lib/imageCompress';
import { validateImageFile } from '@/lib/validateUpload';
import {
  Camera,
  Crosshair,
  Loader2,
  Check,
  X,
  MapPin,
  CloudOff,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { submitFieldCheck } from '@/lib/offlineQueue';
import { trackEvent } from '@/lib/trackEvent';
import CameraViewfinder from '@/components/ooh/CameraViewfinder';
import { useKeyboardFilePicker } from '@/hooks/useKeyboardFilePicker';

const CONDITIONS = [
  { value: 'functional', label: 'Functional' },
  { value: 'neglected', label: 'Neglected' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'abandoned', label: 'Abandoned' },
  { value: 'reclaimed', label: 'Reclaimed' },
  { value: 'upgraded', label: 'Upgraded' },
];

const ADBUST_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'subverted', label: 'Subverted' },
  { value: 'painted_over', label: 'Painted Over' },
  { value: 'stickered', label: 'Stickered' },
  { value: 'projected', label: 'Projected' },
  { value: 'wheatpasted', label: 'Wheatpasted' },
  { value: 'removed', label: 'Removed' },
  { value: 'other', label: 'Other' },
];

export default function FieldCheckCamera({ location, open, onClose }) {
  const [image_url, setImageUrl] = useState('');
  const [condition, setCondition] = useState('functional');
  const [adbust_type, setAdbustType] = useState('none');
  const [brand_name, setBrandName] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState(null);
  const uploadTrigger = useKeyboardFilePicker(uploading);

  useEffect(() => {
    if (!open || !location) return;
    setError('');
    setDone(null);
    setImageUrl('');
    setCondition(location.condition || 'functional');
    setAdbustType(location.adbust_type || 'none');
    setBrandName(location.brand_name || '');
    setNotes('');
    setDetected(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, location]);

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

  if (!open || !location) return null;

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
      // Coarse stage only, no error detail -- distinguishes "started but
      // failed before reaching the server" from silence with no submission
      // at all, which recheck_submitted alone can't tell apart.
      trackEvent('recheck_failed', { stage: 'upload' });
    } finally {
      setUploading(false);
    }
  };

  const aiDetect = async () => {
    if (!image_url) return;
    setDetecting(true);
    setDetected(null);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an out-of-home (OOH) field inspector re-checking a known advertising unit. Examine this photo of "${location.title}" and assess its CURRENT state:
1. condition: infrastructure condition, exactly one of: functional, neglected, damaged, abandoned, reclaimed, upgraded.
2. adbust_type: any visible activist intervention on the ad face, exactly one of: none, subverted, painted_over, stickered, projected, wheatpasted, removed, other.
3. brand_name: the brand currently being advertised, if any is visible. If none or unclear, say "Unknown".
Respond in JSON only.`,
        file_urls: [image_url],
        response_json_schema: {
          type: 'object',
          properties: {
            condition: { type: 'string' },
            adbust_type: { type: 'string' },
            brand_name: { type: 'string' },
          },
        },
      });
      // InvokeLLM's SDK type is `string | object`; response_json_schema
      // above guarantees an object at runtime.
      const suggestion =
        /** @type {{condition?: string, adbust_type?: string, brand_name?: string}} */ (result);
      const validCondition = CONDITIONS.some((c) => c.value === suggestion.condition);
      const validAdbust = ADBUST_TYPES.some((a) => a.value === suggestion.adbust_type);
      if (validCondition) setCondition(/** @type {string} */ (suggestion.condition));
      if (validAdbust) setAdbustType(/** @type {string} */ (suggestion.adbust_type));
      if (suggestion.brand_name && suggestion.brand_name !== 'Unknown') {
        setBrandName(suggestion.brand_name);
      }
      setDetected({ condition: validCondition, adbust: validAdbust });
    } catch {
      setDetected({ error: true });
    } finally {
      setDetecting(false);
    }
  };

  const submit = async () => {
    setError('');
    if (!image_url) {
      setError('Capture a photo first.');
      return;
    }
    if (!isFinite(location.lat) || !isFinite(location.lng)) {
      setError('Location coordinates missing.');
      return;
    }
    setSubmitting(true);
    const payload = {
      location_id: location.id,
      location_title: location.title,
      location_type: location.type,
      image_url,
      lat: location.lat,
      lng: location.lng,
      address: location.address || '',
      condition,
      adbust_type,
      brand_name: brand_name || undefined,
      notes: notes || undefined,
      status: 'pending',
    };
    try {
      const res = await submitFieldCheck(payload);
      if (res.status === 'synced') {
        setDone(res.rec);
        // A genuinely transmitted re-check only -- an offline-queued one
        // hasn't actually reached the server yet.
        trackEvent('recheck_submitted', { check_type: location.type });
      } else {
        setDone({ queued: true });
        // submitFieldCheck (offlineQueue.js) collapses "genuinely offline"
        // and "remote submission failed, fell back to local queue" into
        // the same 'queued' result -- this event can't yet tell those
        // apart, but it makes the aggregate volume visible for the first
        // time, which today's zero-signal state cannot.
        trackEvent('recheck_queued_offline', { check_type: location.type });
      }
    } catch (err) {
      setError(err?.message || 'Transmission failed.');
      trackEvent('recheck_failed', { stage: 'transmission' });
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setDone(null);
    setImageUrl('');
    setNotes('');
    setError('');
    setDetected(null);
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto border border-ozone/40 bg-void p-5 sm:p-6"
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
              {done.queued ? 'Queued offline' : 'Field check logged'}
            </h3>
            <p className="mt-2 font-display text-sm leading-[1.4] text-darkgray">
              {done.queued
                ? 'Offline — saved on this device. It transmits automatically when you reconnect.'
                : 'Your field check is now on the timeline. A moderator will verify it, and the location record will be updated.'}
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => {
                  reset();
                  onClose();
                }}
                className="inline-flex items-center gap-2 bg-ozone px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare"
              >
                <MapPin className="h-3.5 w-3.5" /> Done
              </button>
              <button
                onClick={reset}
                className="border border-slate2 px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-darkgray transition-colors hover:border-ozone hover:text-ozone"
              >
                Another check
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-ozone" />
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
                Re-check location
              </span>
            </div>
            <h3 className="mt-2 font-display text-xl font-bold tracking-[-0.02em] text-silver">
              {location.title}
            </h3>
            <div className="mt-1 flex items-center gap-1.5 font-mono text-[10px] text-dim">
              <Crosshair className="h-3 w-3 text-ozone" />
              {location.lat?.toFixed(5)}, {location.lng?.toFixed(5)}
            </div>
            <p className="mt-1 font-mono text-[10px] leading-relaxed text-dim">
              Photograph the exact same spot. This creates a timeline entry — the next member builds
              on your check.
            </p>

            {image_url ? (
              <div className="relative mt-4 aspect-[4/3] overflow-hidden border border-slate2 bg-card">
                <img src={image_url} alt="field check" className="h-full w-full object-cover" />
                <button
                  onClick={() => {
                    setImageUrl('');
                    setDetected(null);
                  }}
                  className="absolute right-2 top-2 flex items-center gap-1.5 border border-slate2 bg-void/80 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-silver backdrop-blur-sm transition-colors hover:border-flare hover:text-flare"
                >
                  <Camera className="h-3 w-3" /> Retake
                </button>
              </div>
            ) : (
              <>
                <div className="mt-4">
                  <CameraViewfinder onCapture={(file) => uploadFile(file)} uploading={uploading} />
                </div>
                <label
                  {...uploadTrigger.labelProps}
                  aria-label="Or choose from gallery"
                  className={`mt-2 flex items-center justify-center gap-2 border border-slate2/60 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-darkgray transition-colors ${uploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-ozone hover:text-ozone'}`}
                >
                  <Camera className="h-3 w-3" /> Or choose from gallery
                  <input
                    {...uploadTrigger.inputProps}
                    type="file"
                    accept="image/*"
                    onChange={(e) => uploadFile(e.target.files?.[0])}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </>
            )}

            {image_url && (
              <div className="mt-4 border border-ozone/30 bg-ozone/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-ozone">
                      AI condition scan
                    </div>
                    {detected?.error && (
                      <p className="mt-0.5 font-mono text-[9px] text-flare">
                        Detection failed — set manually below.
                      </p>
                    )}
                    {detected && !detected.error && (
                      <p className="mt-0.5 font-mono text-[9px] text-ozone">
                        ✓ Suggested — review and correct below.
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={aiDetect}
                    disabled={detecting}
                    className="flex shrink-0 items-center gap-1.5 bg-ozone px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:bg-flare disabled:opacity-40"
                  >
                    {detecting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    {detecting ? 'Scanning…' : 'Scan'}
                  </button>
                </div>
              </div>
            )}

            {/* Condition */}
            <div className="mt-4">
              <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
                Condition observed
              </span>
              <div className="grid grid-cols-3 gap-px border border-slate2/60 bg-slate2/40">
                {CONDITIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCondition(c.value)}
                    className={`py-2 font-mono text-[9px] font-bold uppercase tracking-[0.1em] transition-colors ${condition === c.value ? 'bg-ozone text-void' : 'bg-card text-darkgray hover:text-silver'}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Adbust state */}
            <div className="mt-3">
              <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
                Intervention state
              </span>
              <div className="grid grid-cols-4 gap-px border border-slate2/60 bg-slate2/40">
                {ADBUST_TYPES.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => setAdbustType(a.value)}
                    className={`py-2 font-mono text-[8px] font-bold uppercase tracking-[0.08em] transition-colors ${adbust_type === a.value ? 'bg-flare text-void' : 'bg-card text-darkgray hover:text-silver'}`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand */}
            <input
              value={brand_name}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Brand advertised (if any)"
              className="mt-3 w-full border border-slate2 bg-void px-4 py-3 font-display text-sm text-silver outline-none transition-colors placeholder:text-dim focus:border-ozone"
            />

            {/* Notes */}
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Field observations — what changed since last check?"
              className="mt-3 w-full border border-slate2 bg-void px-4 py-3 text-sm text-silver outline-none transition-colors placeholder:text-dim focus:border-ozone resize-y"
            />

            {error && (
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-flare">
                {error}
              </p>
            )}

            <button
              onClick={submit}
              disabled={submitting || uploading}
              className="mt-5 flex w-full items-center justify-center gap-2 border border-ozone bg-ozone px-6 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-void transition-colors hover:bg-flare hover:border-flare disabled:opacity-40"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {submitting ? 'Transmitting…' : 'Log field check'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
