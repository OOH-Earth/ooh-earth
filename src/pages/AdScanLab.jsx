import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ScanLine,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Tag,
  Building2,
  FileText,
  ArrowRight,
  RotateCcw,
  Upload,
  Navigation,
  Crosshair,
  Flag,
  X,
} from 'lucide-react';
import exifr from 'exifr';
import { compressImage } from '@/lib/imageCompress';
import { validateImageFile } from '@/lib/validateUpload';
import { useKeyboardFilePicker } from '@/hooks/useKeyboardFilePicker';
import Nav from '@/components/ooh/Nav';
import Breadcrumbs from '@/components/ooh/Breadcrumbs';
import SiteFooter from '@/components/ooh/SiteFooter';
import CameraViewfinder from '@/components/ooh/CameraViewfinder';
import PlaceSearch from '@/components/ooh/lab/PlaceSearch';
import { BrandIcon } from '@/components/ooh/BrandBadge';
import { metaFor } from '@/components/ooh/map/LocationThumb';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

const SECTOR_LABELS = {
  fossil_fuel: 'Fossil Fuel',
  tobacco: 'Tobacco',
  alcohol: 'Alcohol',
  gambling: 'Gambling',
  ultra_processed_food: 'Ultra-Processed Food',
  surveillance: 'Surveillance',
  finance: 'Finance',
  real_estate: 'Real Estate',
  fashion: 'Fashion',
  automotive: 'Automotive',
  pharma: 'Pharma',
  other: 'Other',
};

const MAX_PHOTOS = 9;

const SURFACE_TYPES = [
  'billboard',
  'painted',
  'digital',
  'projection',
  'sticker',
  'mural',
  'transit',
  'other',
];

const REVIEW_TEXT_FIELDS = [
  { key: 'brand_name', label: 'Brand', icon: Tag },
  { key: 'campaign_name', label: 'Campaign', icon: FileText },
  { key: 'ad_agency', label: 'Agency', icon: Building2 },
  { key: 'parent_corp', label: 'Parent Corp', icon: Building2 },
  { key: 'ooh_operator', label: 'OOH Operator', icon: Building2 },
];

function reviewFromDetection(det) {
  return {
    brand_name: det.brand_name && det.brand_name !== 'Unknown' ? det.brand_name : '',
    campaign_name: det.campaign_name || '',
    ad_agency: det.ad_agency || '',
    parent_corp: det.parent_corp || '',
    ooh_operator: det.ooh_operator || '',
    industry_sector: det.industry_sector || 'other',
    surface_type: SURFACE_TYPES.includes(det.surface_type) ? det.surface_type : 'other',
    harm_tags: det.harm_tags || [],
    notes: det.description || '',
  };
}

export default function AdScanLab() {
  const { toast } = useToast();
  const [photos, setPhotos] = useState([]); // uploaded file_urls; photos[0] is the cover/scan target
  const [uploading, setUploading] = useState(false);
  const uploadTrigger = useKeyboardFilePicker(uploading);
  const [scanning, setScanning] = useState(false);
  const [detection, setDetection] = useState(null);
  const [review, setReview] = useState(null); // user-editable copy of AI fields; null while no ad detected
  const [cataloging, setCataloging] = useState(false);
  const [cataloged, setCataloged] = useState(null);
  const [photoCoords, setPhotoCoords] = useState(null);
  const [photoSource, setPhotoSource] = useState(null);

  const handleCapture = useCallback(
    async (file) => {
      const check = await validateImageFile(file);
      if (!check.ok) {
        toast({ title: check.error, variant: 'destructive' });
        return;
      }
      setUploading(true);
      // Only the first photo of a session drives GPS/location detection.
      const isFirst = photos.length === 0;
      if (isFirst) {
        try {
          const gps = await exifr.gps(file);
          if (gps && isFinite(gps.latitude) && isFinite(gps.longitude)) {
            setPhotoCoords({ lat: gps.latitude, lng: gps.longitude });
            setPhotoSource('exif');
          }
        } catch {
          /* no EXIF or not an image with GPS */
        }
      }
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({
          file: await compressImage(file),
        });
        setPhotos((prev) => [...prev, file_url].slice(0, MAX_PHOTOS));
      } catch {
        toast({ title: 'Upload failed', variant: 'destructive' });
      } finally {
        setUploading(false);
      }
    },
    [toast, photos.length],
  );

  const handleFileSelect = useCallback(
    async (e) => {
      const files = Array.from(e.target.files || []);
      e.target.value = '';
      for (const file of files) {
        if (photos.length >= MAX_PHOTOS) break;
        await handleCapture(file);
      }
    },
    [handleCapture, photos.length],
  );

  const removePhoto = (i) => setPhotos((prev) => prev.filter((_, idx) => idx !== i));

  const runScan = async () => {
    if (!photos.length) return;
    setScanning(true);
    setDetection(null);
    setReview(null);
    setCataloged(null);
    try {
      const resp = await base44.functions.invoke('scanAd', { file_url: photos[0] });
      const det = resp.data?.detection?.response || resp.data?.detection || resp.data;
      setDetection(det);
      // AI output is a starting draft, not a fact — seed the editable review
      // fields but require the user to hit "Catalog to atlas" themselves
      // before anything is written. Only ad-classified scans get a review
      // form; a "no ad detected" result has nothing worth editing.
      setReview(det?.is_advertising ? reviewFromDetection(det) : null);
    } catch {
      toast({ title: 'Scan failed', variant: 'destructive' });
    } finally {
      setScanning(false);
    }
  };

  const setReviewField = (key, value) => setReview((r) => ({ ...r, [key]: value }));

  const catalogLocation = async () => {
    if (!detection || !photos.length) return;
    setCataloging(true);
    try {
      const fields = review ?? reviewFromDetection(detection);
      const rec = await base44.entities.Location.create({
        title: fields.brand_name
          ? `Ad scan · ${fields.brand_name}`
          : `Ad scan · ${new Date().toLocaleDateString()}`,
        type: fields.surface_type || 'other',
        image_url: photos[0],
        lat: photoCoords?.lat,
        lng: photoCoords?.lng,
        brand_name: fields.brand_name || '',
        ad_agency: fields.ad_agency || '',
        parent_corp: fields.parent_corp || '',
        campaign_name: fields.campaign_name || '',
        ooh_operator: fields.ooh_operator || '',
        industry_sector: fields.industry_sector || 'other',
        harm_tags: fields.harm_tags || [],
        notes: fields.notes || '',
      });
      if (photos.length > 1) {
        await Promise.allSettled(
          photos.slice(1).map((url, i) =>
            base44.entities.LocationPhoto.create({
              location_id: String(rec.id),
              url,
              display_order: i + 1,
              status: 'pending',
            }),
          ),
        );
      }
      setCataloged(rec);
      toast({ title: 'Cataloged to atlas' });
    } catch {
      toast({ title: 'Catalog failed', variant: 'destructive' });
    } finally {
      setCataloging(false);
    }
  };

  const reset = () => {
    setPhotos([]);
    setDetection(null);
    setReview(null);
    setCataloged(null);
    setPhotoCoords(null);
    setPhotoSource(null);
  };

  const confidencePct = detection ? Math.round((detection.confidence || 0) * 100) : 0;

  return (
    <div className="min-h-screen bg-void grid-bg text-silver">
      <Nav />
      <div className="mx-auto max-w-4xl page-top px-6 pb-12">
        <Breadcrumbs
          items={[{ label: 'Lab', to: '/lab' }, { label: 'Ad Scanner' }]}
          className="mb-4"
        />

        <header className="flex flex-wrap items-baseline gap-4 border-b border-slate2 pb-4">
          <h1 className="flex items-center gap-2 text-2xl font-bold uppercase tracking-[0.14em]">
            <ScanLine className="h-6 w-6 text-ozone" />
            Ad <span className="text-ozone">Scanner</span>
          </h1>
          <span className="ml-auto border border-flare/40 px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-flare">
            Test mode · prototype
          </span>
        </header>

        <p className="my-6 max-w-2xl font-mono text-xs leading-loose text-silver/50">
          Point-and-shoot advertising detection. The scanner identifies brands, agencies, and
          branding on any surface — billboards, transit, digital screens, stickers — and catalogs
          the hit into the OOH Earth atlas for the normal reporting flow.
        </p>

        {/* ── Step 1: Capture / upload (multi-photo) ──────────────────── */}
        {!detection && !scanning && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver/40">
                Step 01 — Capture or upload{' '}
                {photos.length > 0 && `(${photos.length}/${MAX_PHOTOS})`}
              </div>
              {photos.length > 0 && (
                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-silver/40 transition-colors hover:text-ozone"
                >
                  <RotateCcw className="h-3 w-3" /> Clear all
                </button>
              )}
            </div>

            {photos.length < MAX_PHOTOS && (
              <>
                <CameraViewfinder onCapture={handleCapture} uploading={uploading} />
                <label
                  {...uploadTrigger.labelProps}
                  aria-label="Upload images"
                  className={`flex items-center justify-center gap-2 border border-slate2 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-silver/60 transition-colors ${uploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-ozone hover:text-ozone'}`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload images
                  <input
                    {...uploadTrigger.inputProps}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={uploading}
                    onChange={handleFileSelect}
                  />
                </label>
              </>
            )}

            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {photos.map((url, i) => (
                  <div
                    key={url}
                    className="relative h-20 w-20 overflow-hidden border border-slate2"
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    {i === 0 && (
                      <span className="absolute left-0 top-0 bg-ozone px-1 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-void">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      aria-label="Remove photo"
                      className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center bg-void/80 text-silver transition-colors hover:text-flare"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {photos.length > 0 && (
              // This block only renders while !scanning (see the outer
              // guard above), so `scanning` is always false here -- no
              // loading label needed on the button itself; the dedicated
              // "Step 03 -- scanning" panel below covers that state.
              <button
                onClick={runScan}
                disabled={uploading}
                className="flex w-full items-center justify-center gap-2 border-2 border-ozone bg-ozone py-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:bg-flare hover:border-flare disabled:opacity-40"
              >
                <ScanLine className="h-4 w-4" /> Run detection
              </button>
            )}
          </div>
        )}

        {/* ── Step 3: Results ──────────────────────────────────────────── */}
        {scanning && (
          <div className="mt-8 flex flex-col items-center gap-3 border border-slate2 bg-card py-12">
            <div className="relative">
              <ScanLine className="h-10 w-10 text-ozone animate-pulse" />
              <div className="absolute inset-0 animate-ping rounded-full border border-ozone/40" />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver/50">
              Analyzing image…
            </span>
          </div>
        )}

        {detection && !scanning && (
          <div className="mt-8 space-y-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver/40">
              Step 03 — Detection results
            </div>

            {/* ── Detection dossier ── terminal window frame */}
            <div className="relative border border-slate2 bg-card crt-scanlines">
              {/* Terminal title bar — traffic lights + command path */}
              <div className="flex items-center gap-1.5 border-b border-slate2 bg-void/60 px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-flare/70" />
                <span className="h-2 w-2 rounded-full bg-ozone/70" />
                <span className="h-2 w-2 rounded-full bg-dim/50" />
                <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
                  ROOT@OOH:~ - SCAN.SH
                </span>
                <span className="ml-auto font-mono text-[8px] uppercase tracking-[0.2em] text-ozone/60">
                  // dossier
                </span>
              </div>

              {/* Reticle corners */}
              <Crosshair className="pointer-events-none absolute left-2 top-8 h-3 w-3 text-ozone/50" />
              <Crosshair className="pointer-events-none absolute right-2 top-8 h-3 w-3 text-ozone/50" />
              <Crosshair className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 text-ozone/50" />
              <Crosshair className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 text-ozone/50" />

              {/* Location tags row — brought in from detail page for consistency */}
              <div className="flex flex-wrap items-center gap-1.5 border-b border-slate2/60 px-4 py-2 pl-9">
                {detection.surface_type &&
                  (() => {
                    const tm = metaFor(detection.surface_type);
                    return (
                      <span
                        className="flex items-center gap-1 border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em]"
                        style={{ color: tm.accent, borderColor: `${tm.accent}55` }}
                      >
                        <tm.Icon className="h-2.5 w-2.5" /> {tm.label}
                      </span>
                    );
                  })()}
                {detection.is_advertising ? (
                  <span className="border border-ozone/50 px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-ozone">
                    Ad detected
                  </span>
                ) : (
                  <span className="border border-flare/50 px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-flare">
                    No ad
                  </span>
                )}
                <span className="border border-flare/40 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-flare">
                  pending
                </span>
                {detection.industry_sector && (
                  <span className="border border-slate2/50 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-darkgray">
                    {SECTOR_LABELS[detection.industry_sector] || detection.industry_sector}
                  </span>
                )}
              </div>

              {/* Dossier header — brand logo + name + confidence */}
              <div className="flex items-center gap-3 border-b border-slate2 px-4 py-3 pl-9">
                {detection.is_advertising && detection.brand_name ? (
                  <BrandIcon name={detection.brand_name} size={36} />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate2/50">
                    {detection.is_advertising ? (
                      <CheckCircle2 className="h-5 w-5 text-ozone" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-flare" />
                    )}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-[15px] font-bold text-silver">
                    {detection.brand_name || 'Unknown surface'}
                  </div>
                  <span className="mt-0.5 inline-block font-mono text-[8px] uppercase tracking-[0.15em] text-dim">
                    {detection.is_advertising
                      ? '// advertising identified'
                      : '// no advertising detected'}
                  </span>
                </div>
                {/* Confidence readout */}
                <div className="flex flex-col items-end gap-1">
                  <span className="font-mono text-lg font-bold tabular text-ozone">
                    {confidencePct}%
                  </span>
                  <div className="h-1 w-16 bg-slate2">
                    <div
                      className="h-full bg-ozone transition-all"
                      style={{ width: `${confidencePct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Editable review — AI output is a draft, never auto-cataloged.
                  The user can correct any field before "Catalog to atlas". */}
              {review && (
                <div className="space-y-3 border-t border-slate2/60 p-4">
                  <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone/70">
                    // Review &amp; edit before cataloging
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {REVIEW_TEXT_FIELDS.map(({ key, label, icon: Icon }) => (
                      <label
                        key={key}
                        className="block border border-slate2/40 bg-void/50 px-3 py-2"
                      >
                        <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.15em] text-dim">
                          <Icon className="h-2.5 w-2.5" /> {label}
                        </span>
                        <input
                          type="text"
                          value={review[key]}
                          onChange={(e) => setReviewField(key, e.target.value)}
                          placeholder="Unknown"
                          className="mt-1 w-full bg-transparent font-mono text-[12px] text-silver outline-none placeholder:text-dim/40"
                        />
                      </label>
                    ))}

                    <label className="block border border-slate2/40 bg-void/50 px-3 py-2">
                      <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.15em] text-dim">
                        <AlertTriangle className="h-2.5 w-2.5" /> Sector
                      </span>
                      <select
                        value={review.industry_sector}
                        onChange={(e) => setReviewField('industry_sector', e.target.value)}
                        className="mt-1 w-full bg-transparent font-mono text-[12px] text-silver outline-none"
                      >
                        {Object.entries(SECTOR_LABELS).map(([value, label]) => (
                          <option key={value} value={value} className="bg-void text-silver">
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block border border-slate2/40 bg-void/50 px-3 py-2">
                      <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.15em] text-dim">
                        <MapPin className="h-2.5 w-2.5" /> Surface
                      </span>
                      <select
                        value={review.surface_type}
                        onChange={(e) => setReviewField('surface_type', e.target.value)}
                        className="mt-1 w-full bg-transparent font-mono text-[12px] text-silver outline-none"
                      >
                        {SURFACE_TYPES.map((value) => (
                          <option key={value} value={value} className="bg-void text-silver">
                            {metaFor(value).label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="block border border-slate2/40 bg-void/50 px-3 py-2">
                    <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.15em] text-dim">
                      <Flag className="h-2.5 w-2.5" /> Harm tags (comma-separated)
                    </span>
                    <input
                      type="text"
                      value={review.harm_tags.join(', ')}
                      onChange={(e) =>
                        setReviewField(
                          'harm_tags',
                          e.target.value
                            .split(',')
                            .map((t) => t.trim())
                            .filter(Boolean),
                        )
                      }
                      placeholder="e.g. greenwashing, predatory_targeting"
                      className="mt-1 w-full bg-transparent font-mono text-[12px] text-silver outline-none placeholder:text-dim/40"
                    />
                  </label>

                  <label className="block border border-slate2/40 bg-void/50 px-3 py-2">
                    <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-dim">
                      Notes
                    </span>
                    <textarea
                      value={review.notes}
                      onChange={(e) => setReviewField('notes', e.target.value)}
                      rows={3}
                      className="mt-1 w-full resize-y bg-transparent font-mono text-[11px] leading-relaxed text-silver outline-none placeholder:text-dim/40"
                    />
                  </label>

                  {detection.visible_text && (
                    <div className="border border-slate2/40 bg-void/50 px-3 py-2">
                      <div className="font-mono text-[8px] uppercase tracking-[0.15em] text-dim">
                        // AI-read visible text (reference only)
                      </div>
                      <p className="mt-1 font-mono text-[11px] leading-relaxed text-silver/85">
                        {detection.visible_text}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Location step */}
            <div className="border border-slate2 bg-card">
              <div className="flex items-center gap-2 border-b border-slate2 px-4 py-2.5">
                <Navigation className="h-3.5 w-3.5 text-ozone" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver/60">
                  Step 04 — Confirm location
                </span>
              </div>
              <div className="space-y-3 p-4">
                {photoSource === 'exif' && photoCoords ? (
                  <div className="flex items-center gap-2 border border-ozone/40 bg-ozone/5 px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 text-ozone" />
                    <span className="font-mono text-[11px] text-silver">GPS from photo EXIF</span>
                    <span className="ml-auto font-mono text-[10px] tabular text-ozone">
                      {photoCoords.lat.toFixed(5)}, {photoCoords.lng.toFixed(5)}
                    </span>
                  </div>
                ) : photoCoords ? (
                  <div className="flex items-center gap-2 border border-ozone/40 bg-ozone/5 px-3 py-2">
                    <MapPin className="h-4 w-4 text-ozone" />
                    <span className="font-mono text-[11px] text-silver">
                      {photoSource === 'search' ? 'Search result' : 'Manual'}
                    </span>
                    <span className="ml-auto font-mono text-[10px] tabular text-ozone">
                      {photoCoords.lat.toFixed(5)}, {photoCoords.lng.toFixed(5)}
                    </span>
                  </div>
                ) : (
                  <div>
                    <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-flare/80">
                      No GPS in photo — search for the place
                    </div>
                    <PlaceSearch
                      onSelect={(r) => {
                        setPhotoCoords({ lat: r.lat, lng: r.lng });
                        setPhotoSource('search');
                      }}
                    />
                  </div>
                )}
                <details className="group">
                  <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-[0.2em] text-silver/40 transition-colors hover:text-ozone">
                    Enter coordinates manually
                  </summary>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Latitude"
                      defaultValue={photoCoords?.lat ?? ''}
                      onChange={(e) => {
                        const lat = parseFloat(e.target.value);
                        setPhotoCoords((c) => ({
                          lat: isNaN(lat) ? (c?.lat ?? 0) : lat,
                          lng: c?.lng ?? 0,
                        }));
                        setPhotoSource('manual');
                      }}
                      className="w-full border border-slate2 bg-void px-2 py-1.5 font-mono text-[11px] text-silver outline-none focus:border-ozone"
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Longitude"
                      defaultValue={photoCoords?.lng ?? ''}
                      onChange={(e) => {
                        const lng = parseFloat(e.target.value);
                        setPhotoCoords((c) => ({
                          lat: c?.lat ?? 0,
                          lng: isNaN(lng) ? (c?.lng ?? 0) : lng,
                        }));
                        setPhotoSource('manual');
                      }}
                      className="w-full border border-slate2 bg-void px-2 py-1.5 font-mono text-[11px] text-silver outline-none focus:border-ozone"
                    />
                  </div>
                </details>
              </div>
            </div>

            {/* Catalog action */}
            {cataloged ? (
              <div className="relative flex flex-col items-center gap-3 border border-ozone/40 bg-ozone/5 py-8">
                <Crosshair className="absolute left-2 top-2 h-3 w-3 text-ozone/50" />
                <Crosshair className="absolute right-2 top-2 h-3 w-3 text-ozone/50" />
                <Crosshair className="absolute left-2 bottom-2 h-3 w-3 text-ozone/50" />
                <Crosshair className="absolute right-2 bottom-2 h-3 w-3 text-ozone/50" />
                <CheckCircle2 className="h-8 w-8 text-ozone" />
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-silver">
                  Cataloged to atlas
                </span>
                {cataloged.title && (
                  <span className="font-mono text-[10px] text-dim">{cataloged.title}</span>
                )}
                <Link
                  to={`/location/${cataloged.id}`}
                  className="group flex w-full items-center justify-between gap-2 border-2 border-ozone bg-ozone px-5 py-4 font-mono text-[13px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:bg-flare hover:border-flare"
                >
                  <span className="flex items-center gap-2">
                    &gt; page · {cataloged.id?.slice(-8) || 'detail'}
                  </span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            ) : (
              <button
                onClick={catalogLocation}
                disabled={cataloging || !photoCoords}
                className="flex w-full items-center justify-center gap-2 border border-slate2 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-silver transition-colors hover:border-ozone hover:text-ozone disabled:opacity-40"
              >
                {cataloging ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Cataloging…
                  </>
                ) : !photoCoords ? (
                  <>
                    <MapPin className="h-4 w-4" /> Set location to catalog
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" /> Catalog to atlas
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
