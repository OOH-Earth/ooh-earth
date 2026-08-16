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

// Terminal-style field cell — compact bordered unit with mono label + value.
// If `brand` is true, renders a BrandIcon next to the value (brand/operator/corp).
function TerminalField({ icon: Icon, label, value, brand = false }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div className="border border-slate2/40 bg-void/50 px-3 py-2">
      <div className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.15em] text-dim">
        {Icon && <Icon className="h-2.5 w-2.5" />} {label}
      </div>
      <div className="mt-1 flex items-center gap-2">
        {brand && <BrandIcon name={value} size={18} />}
        <span className="font-mono text-[12px] text-silver break-words">
          {Array.isArray(value) ? value.join(', ') : value}
        </span>
      </div>
    </div>
  );
}

export default function AdScanLab() {
  const { toast } = useToast();
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const uploadTrigger = useKeyboardFilePicker(uploading);
  const [scanning, setScanning] = useState(false);
  const [detection, setDetection] = useState(null);
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
      setPhotoCoords(null);
      setPhotoSource(null);
      // Try to read EXIF GPS from the photo
      try {
        const gps = await exifr.gps(file);
        if (gps && isFinite(gps.latitude) && isFinite(gps.longitude)) {
          setPhotoCoords({ lat: gps.latitude, lng: gps.longitude });
          setPhotoSource('exif');
        }
      } catch {
        /* no EXIF or not an image with GPS */
      }
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({
          file: await compressImage(file),
        });
        setCapturedUrl(file_url);
      } catch {
        toast({ title: 'Upload failed', variant: 'destructive' });
      } finally {
        setUploading(false);
      }
    },
    [toast],
  );

  const handleFileSelect = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) handleCapture(file);
    },
    [handleCapture],
  );

  const runScan = async () => {
    if (!capturedUrl) return;
    setScanning(true);
    setDetection(null);
    setCataloged(null);
    try {
      const resp = await base44.functions.invoke('scanAd', { file_url: capturedUrl });
      const det = resp.data?.detection?.response || resp.data?.detection || resp.data;
      setDetection(det);
    } catch {
      toast({ title: 'Scan failed', variant: 'destructive' });
    } finally {
      setScanning(false);
    }
  };

  const catalogLocation = async () => {
    if (!detection) return;
    setCataloging(true);
    try {
      const rec = await base44.entities.Location.create({
        title: detection.brand_name
          ? `Ad scan · ${detection.brand_name}`
          : `Ad scan · ${new Date().toLocaleDateString()}`,
        type: detection.surface_type || 'other',
        image_url: capturedUrl,
        lat: photoCoords?.lat,
        lng: photoCoords?.lng,
        brand_name: detection.brand_name || '',
        ad_agency: detection.ad_agency || '',
        parent_corp: detection.parent_corp || '',
        campaign_name: detection.campaign_name || '',
        ooh_operator: detection.ooh_operator || '',
        industry_sector: detection.industry_sector || 'other',
        harm_tags: detection.harm_tags || [],
        notes: detection.description || '',
        status: 'pending',
      });
      setCataloged(rec);
      toast({ title: 'Cataloged to atlas' });
    } catch {
      toast({ title: 'Catalog failed', variant: 'destructive' });
    } finally {
      setCataloging(false);
    }
  };

  const reset = () => {
    setCapturedUrl(null);
    setDetection(null);
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

        {/* ── Step 1: Capture ──────────────────────────────────────────── */}
        {!capturedUrl && (
          <div className="space-y-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver/40">
              Step 01 — Capture or upload
            </div>
            <CameraViewfinder onCapture={handleCapture} uploading={uploading} />
            <label
              {...uploadTrigger.labelProps}
              aria-label="Upload image"
              className={`flex items-center justify-center gap-2 border border-slate2 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-silver/60 transition-colors ${uploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-ozone hover:text-ozone'}`}
            >
              <Upload className="h-3.5 w-3.5" />
              Upload image
              <input
                {...uploadTrigger.inputProps}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={handleFileSelect}
              />
            </label>
          </div>
        )}

        {/* ── Step 2: Scan ─────────────────────────────────────────────── */}
        {capturedUrl && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver/40">
                Step 02 — Scan for advertising
              </div>
              <button
                onClick={reset}
                className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-silver/40 transition-colors hover:text-ozone"
              >
                <RotateCcw className="h-3 w-3" /> New capture
              </button>
            </div>

            <img src={capturedUrl} alt="Captured" className="w-full border border-slate2" />

            <button
              onClick={runScan}
              disabled={scanning}
              className="flex w-full items-center justify-center gap-2 border-2 border-ozone bg-ozone py-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:bg-flare hover:border-flare disabled:opacity-40"
            >
              {scanning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Scanning…
                </>
              ) : (
                <>
                  <ScanLine className="h-4 w-4" /> Run detection
                </>
              )}
            </button>
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

              {/* Fields grid */}
              {detection.is_advertising && (
                <div className="space-y-3 p-4">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <TerminalField icon={Tag} label="Brand" value={detection.brand_name} brand />
                    <TerminalField
                      icon={FileText}
                      label="Campaign"
                      value={detection.campaign_name}
                    />
                    <TerminalField
                      icon={Building2}
                      label="Agency"
                      value={detection.ad_agency}
                      brand
                    />
                    <TerminalField
                      icon={Building2}
                      label="Parent Corp"
                      value={detection.parent_corp}
                      brand
                    />
                    <TerminalField
                      icon={Building2}
                      label="OOH Operator"
                      value={detection.ooh_operator}
                      brand
                    />
                    <TerminalField
                      icon={MapPin}
                      label="Surface"
                      value={metaFor(detection.surface_type).label}
                    />
                  </div>

                  {/* Harm tags — terminal chips */}
                  {detection.harm_tags && detection.harm_tags.length > 0 && (
                    <div>
                      <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.3em] text-flare/60">
                        // Harm tags
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {detection.harm_tags.map((tag) => (
                          <span
                            key={tag}
                            className="flex items-center gap-1 border border-flare/40 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-flare"
                          >
                            <Flag className="h-2.5 w-2.5" /> {tag.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description + visible text — full width */}
                  {(detection.description || detection.visible_text) && (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {detection.description && (
                        <div className="border border-slate2/40 bg-void/50 px-3 py-2">
                          <div className="font-mono text-[8px] uppercase tracking-[0.15em] text-dim">
                            // Description
                          </div>
                          <p className="mt-1 text-[12px] leading-relaxed text-silver/85">
                            {detection.description}
                          </p>
                        </div>
                      )}
                      {detection.visible_text && (
                        <div className="border border-slate2/40 bg-void/50 px-3 py-2">
                          <div className="font-mono text-[8px] uppercase tracking-[0.15em] text-dim">
                            // Visible text
                          </div>
                          <p className="mt-1 font-mono text-[11px] leading-relaxed text-silver/85">
                            {detection.visible_text}
                          </p>
                        </div>
                      )}
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
