import { Camera, Crosshair, Loader2, Upload } from 'lucide-react';
import exifr from 'exifr';
import { base44 } from '@/api/base44Client';
import { compressImage } from '@/lib/imageCompress';
import { validateImageFile } from '@/lib/validateUpload';
import { useKeyboardFilePicker } from '@/hooks/useKeyboardFilePicker';
import { useRef, useState } from 'react';
import ReportScanner from '@/components/ooh/report/ReportScanner';
import MapPinDropper from '@/components/ooh/report/MapPinDropper';
import MultiPhotoUpload from '@/components/ooh/gallery/MultiPhotoUpload';
import { isPublicSpaceType, SETTING_OPTIONS, PUBLIC_ACCESS_OPTIONS } from '@/lib/publicSpace';

const TYPES = [
  { value: 'billboard', label: 'Billboard' },
  { value: 'digital', label: 'Digital' },
  { value: 'painted', label: 'Painted' },
  { value: 'transit', label: 'Transit' },
  { value: 'projection', label: 'Projection' },
  { value: 'sticker', label: 'Sticker / Paste' },
  { value: 'mural', label: 'Mural' },
  { value: 'skatepark', label: 'Skatepark' },
  { value: 'basketball_court', label: 'Basketball Court' },
  { value: 'multi_use_court', label: 'Multi-Use Court' },
  { value: 'other', label: 'Other' },
];

// Location sources supplied automatically (not chosen by the person).
const AUTO_SOURCES = ['your device location', "the photo's embedded location"];
const USER_CHOSEN_SOURCES = ['the map pin', 'the coordinates you typed'];

const inp =
  'w-full bg-void border border-slate2 px-4 py-3 font-display text-sm text-silver outline-none transition-colors placeholder:text-dim focus:border-ozone';

export default function ReportStep1Document({ data, onChange }) {
  const [locating, setLocating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const captureTrigger = useKeyboardFilePicker(uploading);
  const uploadTrigger = useKeyboardFilePicker(uploading);

  const [locError, setLocError] = useState('');
  // Latest form data, read when async work (EXIF, geolocation) resolves so a
  // location the person chose in the meantime is never replaced.
  const dataRef = useRef(data);
  dataRef.current = data;
  const locSource = data.loc_source || '';

  // Set the effective coordinates. Automatically supplied locations (device,
  // photo EXIF) need an explicit acknowledgement; a deliberate map tap or typed
  // coordinates count as the person's own confirmation. Any automatic change
  // resets confirmation.
  const setLocation = (lat, lng, source) =>
    onChange({
      lat: String(lat),
      lng: String(lng),
      loc_source: source,
      loc_confirmed: !AUTO_SOURCES.includes(source),
    });

  const locate = () => {
    setLocError('');
    if (!navigator.geolocation) {
      setLocError('This browser cannot share your location — tap the map or enter coordinates.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocation(
          p.coords.latitude.toFixed(5),
          p.coords.longitude.toFixed(5),
          'your device location',
        );
        setLocating(false);
      },
      (err) => {
        setLocError(
          err?.code === 1
            ? 'Location permission was denied — tap the map to place the pin, or enter coordinates.'
            : err?.code === 3
              ? 'Locating timed out — try again, tap the map, or enter coordinates.'
              : 'Your location is unavailable — tap the map or enter coordinates.',
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError('');
    const check = await validateImageFile(file);
    if (!check.ok) {
      setUploadError(check.error);
      return;
    }
    setUploading(true);
    // Try EXIF GPS from the photo
    try {
      const gps = await exifr.gps(file);
      if (
        gps &&
        isFinite(gps.latitude) &&
        isFinite(gps.longitude) &&
        !USER_CHOSEN_SOURCES.includes(dataRef.current.loc_source)
      ) {
        setLocation(
          gps.latitude.toFixed(5),
          gps.longitude.toFixed(5),
          "the photo's embedded location",
        );
      }
    } catch {
      /* no EXIF GPS */
    }
    try {
      const res = await base44.integrations.Core.UploadFile({ file: await compressImage(file) });
      onChange({ image_url: res.file_url });
    } catch {
      setUploadError('Photo upload failed — try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-7">
      {/* Type */}
      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
          Media type
        </label>
        <div className="grid grid-cols-2 gap-px border border-slate2/60 bg-slate2/40 sm:grid-cols-4">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange({ type: t.value })}
              className={`px-3 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${data.type === t.value ? 'bg-ozone text-void' : 'bg-card text-darkgray hover:text-silver'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Public-space facility metadata — only shown for facility types */}
      {isPublicSpaceType(data.type) && (
        <div className="grid gap-3 border border-ozone/30 bg-ozone/5 p-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">
              Setting
            </span>
            <select
              value={data.setting || 'unknown'}
              onChange={(e) => onChange({ setting: e.target.value })}
              className="border border-slate2 bg-void px-3 py-2 text-sm text-silver outline-none focus:border-ozone"
            >
              {SETTING_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">
              Public Access
            </span>
            <select
              value={data.public_access || 'unknown'}
              onChange={(e) => onChange({ public_access: e.target.value })}
              className="border border-slate2 bg-void px-3 py-2 text-sm text-silver outline-none focus:border-ozone"
            >
              {PUBLIC_ACCESS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* Photo — capture or upload */}
      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
          Cover photo <span className="text-silver/70">(required)</span>
        </label>
        {data.image_url ? (
          <div className="relative overflow-hidden border border-slate2 bg-card">
            <img src={data.image_url} alt="capture" className="max-h-48 w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange({ image_url: '' })}
              className="absolute right-2 top-2 flex items-center gap-1.5 border border-slate2 bg-void/80 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-silver backdrop-blur-sm transition-colors hover:border-flare hover:text-flare"
            >
              <Camera className="h-3 w-3" /> Replace
            </button>
          </div>
        ) : uploading ? (
          <div className="flex items-center gap-3 border border-ozone/40 bg-card px-4 py-6">
            <Loader2 className="h-4 w-4 animate-spin text-ozone" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ozone">
              Uploading…
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-px border border-slate2/60 bg-slate2/40">
            <label
              {...captureTrigger.labelProps}
              aria-label="Capture live"
              className="group flex cursor-pointer flex-col items-center gap-2 bg-card px-4 py-6 transition-colors hover:border-ozone"
            >
              <Camera className="h-5 w-5 text-ozone transition-transform group-hover:scale-110" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-silver">
                Capture live
              </span>
              <input
                {...captureTrigger.inputProps}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onPhoto}
                className="hidden"
              />
            </label>
            <label
              {...uploadTrigger.labelProps}
              aria-label="Upload"
              className="group flex cursor-pointer flex-col items-center gap-2 bg-card px-4 py-6 transition-colors hover:border-flare"
            >
              <Upload className="h-5 w-5 text-flare transition-transform group-hover:scale-110" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-silver">
                Upload
              </span>
              <input
                {...uploadTrigger.inputProps}
                type="file"
                accept="image/*"
                onChange={onPhoto}
                className="hidden"
              />
            </label>
          </div>
        )}
        {uploadError && (
          <p
            className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-flare"
            role="alert"
          >
            {uploadError}
          </p>
        )}
      </div>

      {/* Additional gallery photos */}
      <MultiPhotoUpload
        files={data.extraPhotos || []}
        onChange={(extraPhotos) => onChange({ extraPhotos })}
        onRejected={(errors) => setUploadError(errors[0])}
      />

      {/* AI Ad Scanner — beta */}
      <ReportScanner data={data} onChange={onChange} />

      {/* Address */}
      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
          Location / address
        </label>
        <input
          value={data.address}
          onChange={(e) => onChange({ address: e.target.value })}
          placeholder="Street, district, city"
          className={inp}
        />
      </div>

      {/* Coordinates — live map pin dropper + locate me */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
            GPS coordinates
          </label>
          <button
            type="button"
            onClick={locate}
            disabled={locating}
            className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-ozone transition-opacity hover:opacity-70 disabled:opacity-40"
          >
            {locating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Crosshair className="h-3.5 w-3.5" />
            )}
            {locating ? 'Locating…' : 'Locate me'}
          </button>
        </div>
        <MapPinDropper
          lat={data.lat}
          lng={data.lng}
          onPick={({ lat, lng, source }) => setLocation(lat, lng, source || 'the map pin')}
        />
        {locError && (
          <p
            className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-flare"
            role="alert"
          >
            {locError}
          </p>
        )}
        {isFinite(parseFloat(data.lat)) && isFinite(parseFloat(data.lng)) && (
          <div
            className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-ozone"
            role="status"
            data-testid="location-confirmation"
          >
            {data.loc_confirmed ? (
              <p>
                Location confirmed ({locSource || 'your entry'}): {data.lat}, {data.lng} — tap the
                map to move the pin.
              </p>
            ) : (
              <>
                <p>
                  Location set from {locSource || 'your entry'}: {data.lat}, {data.lng}. Check the
                  pin is where you took the photo — tap the map to move it.
                </p>
                <button
                  type="button"
                  onClick={() => onChange({ loc_confirmed: true })}
                  className="mt-2 border border-ozone px-3 py-2 font-bold text-ozone transition-colors hover:bg-ozone hover:text-void"
                >
                  Yes, this is where it is
                </button>
              </>
            )}
          </div>
        )}
        <details className="group mt-2">
          <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-[0.2em] text-dim/60 transition-colors hover:text-ozone">
            Enter coordinates manually
          </summary>
          <div className="mt-2 grid grid-cols-2 gap-px border border-slate2/60 bg-slate2/40">
            <input
              value={data.lat}
              onChange={(e) => {
                onChange({
                  lat: e.target.value,
                  loc_source: 'the coordinates you typed',
                  loc_confirmed: true,
                });
              }}
              placeholder="Latitude"
              inputMode="decimal"
              className={`${inp} border-0`}
            />
            <input
              value={data.lng}
              onChange={(e) => {
                onChange({
                  lng: e.target.value,
                  loc_source: 'the coordinates you typed',
                  loc_confirmed: true,
                });
              }}
              placeholder="Longitude"
              inputMode="decimal"
              className={`${inp} border-0`}
            />
          </div>
        </details>
      </div>

      {/* Title (optional) */}
      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
          Unit label <span className="text-dim/50">(optional)</span>
        </label>
        <input
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g. Billboard · 1039 Pleonchit"
          className={inp}
        />
      </div>
    </div>
  );
}
