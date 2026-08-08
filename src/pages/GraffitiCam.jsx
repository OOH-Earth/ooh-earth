import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { SprayCan, Loader2, CheckCircle2, MapPin, Upload, RotateCcw, Navigation, Crosshair, Camera } from "lucide-react";
import exifr from "exifr";
import Nav from "@/components/ooh/Nav";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";
import SiteFooter from "@/components/ooh/SiteFooter";
import CameraViewfinder from "@/components/ooh/CameraViewfinder";
import PlaceSearch from "@/components/ooh/lab/PlaceSearch";
import { base44 } from "@/api/base44Client";
import { submitCapture } from "@/lib/offlineQueue";
import { useToast } from "@/components/ui/use-toast";

const GRAFFITI_TYPES = [
  { value: "painted", label: "Painted" },
  { value: "mural", label: "Mural" },
  { value: "sticker", label: "Sticker" },
  { value: "projection", label: "Projection" },
  { value: "other", label: "Other" },
];

const MEDIUMS = [
  { value: "", label: "— Unknown —" },
  { value: "spray_paint", label: "Spray Paint" },
  { value: "marker", label: "Marker" },
  { value: "sticker", label: "Sticker" },
  { value: "paste_up", label: "Paste-up" },
  { value: "stencil", label: "Stencil" },
  { value: "installation", label: "Installation" },
  { value: "other", label: "Other" },
];

const STYLES = [
  { value: "", label: "— Unknown —" },
  { value: "tag", label: "Tag" },
  { value: "throw_up", label: "Throw-up" },
  { value: "piece", label: "Piece" },
  { value: "mural", label: "Mural" },
  { value: "blockbuster", label: "Blockbuster" },
  { value: "stencil", label: "Stencil" },
  { value: "paste_up", label: "Paste-up" },
  { value: "other", label: "Other" },
];

const inp = "w-full bg-void border border-slate2 px-3 py-2.5 font-mono text-[11px] text-silver outline-none transition-colors placeholder:text-dim focus:border-flare";

export default function GraffitiCam() {
  const { toast } = useToast();
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);

  const [type, setType] = useState("painted");
  const [medium, setMedium] = useState("spray_paint");
  const [style, setStyle] = useState("");
  const [surfaceM2, setSurfaceM2] = useState("");
  const [coveragePct, setCoveragePct] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [locating, setLocating] = useState(false);
  const [photoCoords, setPhotoCoords] = useState(null);
  const [photoSource, setPhotoSource] = useState(null);
  const [error, setError] = useState("");

  const handleCapture = useCallback(async (file) => {
    setUploading(true);
    setPhotoCoords(null);
    setPhotoSource(null);
    try {
      const gps = await exifr.gps(file);
      if (gps && isFinite(gps.latitude) && isFinite(gps.longitude)) {
        const coords = { lat: gps.latitude, lng: gps.longitude };
        setPhotoCoords(coords);
        setPhotoSource("exif");
        setLat(gps.latitude.toFixed(5));
        setLng(gps.longitude.toFixed(5));
      }
    } catch { /* no EXIF GPS */ }
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCapturedUrl(file_url);
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [toast]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) handleCapture(file);
  }, [handleCapture]);

  const locate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLat(p.coords.latitude.toFixed(5));
        setLng(p.coords.longitude.toFixed(5));
        setPhotoCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
        setPhotoSource("gps");
        setLocating(false);
      },
      () => { setLocating(false); setError("Location unavailable — enter coordinates manually."); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submit = async () => {
    setError("");
    const latN = parseFloat(lat);
    const lngN = parseFloat(lng);
    if (!capturedUrl) { setError("Capture a graffiti photograph first."); return; }
    if (!isFinite(latN) || !isFinite(lngN)) { setError("GPS coordinates required — use Locate me, search, or enter manually."); return; }
    setSubmitting(true);
    const label = GRAFFITI_TYPES.find((t) => t.value === type)?.label || type;
    const title = `Graffiti · ${address.split(",")[0].trim() || "Field capture"}`;
    try {
      const res = await submitCapture({
        title, type, address, lat: latN, lng: lngN, image_url: capturedUrl,
        notes: "Graffiti field capture", source_link: "", status: "pending",
        graffiti_medium: medium || undefined,
        graffiti_style: style || undefined,
        graffiti_surface_m2: surfaceM2 ? Number(surfaceM2) : undefined,
        graffiti_coverage_pct: coveragePct ? Number(coveragePct) : undefined,
      });
      if (res.status === "synced") setDone(res.rec);
      else setDone({ queued: true, lat: latN, lng: lngN });
    } catch (err) {
      setError(err?.message || "Transmission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setCapturedUrl(null);
    setDone(null);
    setType("painted");
    setMedium("spray_paint");
    setStyle("");
    setSurfaceM2("");
    setCoveragePct("");
    setAddress("");
    setLat("");
    setLng("");
    setPhotoCoords(null);
    setPhotoSource(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-void grid-bg text-silver">
      <Nav />
      <div className="mx-auto max-w-4xl page-top px-6 pb-12">
        <Breadcrumbs items={[{ label: "Lab", to: "/lab" }, { label: "Graffiti Camera" }]} className="mb-4" />

        <header className="flex flex-wrap items-baseline gap-4 border-b border-slate2 pb-4">
          <h1 className="flex items-center gap-2 text-2xl font-bold uppercase tracking-[0.14em]">
            <SprayCan className="h-6 w-6 text-flare" />
            Graffiti <span className="text-flare">Camera</span>
          </h1>
          <span className="ml-auto border border-flare/40 px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-flare">Test mode · prototype</span>
        </header>

        <p className="my-6 max-w-2xl font-mono text-xs leading-loose text-silver/50">
          Point-and-shoot graffiti and street art documentation. Capture the piece, classify the medium and style, log the coordinates — feeds the graffiti portal and the live field map.
        </p>

        {done ? (
          <div className="border border-ozone/40 bg-ozone/5 p-8">
            {done.queued ? <MapPin className="h-7 w-7 text-flare" /> : <CheckCircle2 className="h-7 w-7 text-ozone" />}
            <h2 className="mt-4 font-display text-2xl font-bold text-silver">
              {done.queued ? "Queued offline" : "Captured"}
            </h2>
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-darkgray">
              {done.queued
                ? `Offline — saved on this device, transmits when you reconnect. Position ${done.lat?.toFixed(4)}, ${done.lng?.toFixed(4)}.`
                : `Graffiti documented at ${done.lat?.toFixed(4)}, ${done.lng?.toFixed(4)}. Renders on the map and graffiti portal pending verification.`}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/graffiti" className="inline-flex items-center gap-2 border border-ozone bg-ozone px-5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:bg-flare hover:border-flare">
                View on graffiti portal
              </Link>
              <Link to="/map" className="inline-flex items-center gap-2 border border-slate2 px-5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">
                Open field map
              </Link>
              <button onClick={reset} className="inline-flex items-center gap-2 border border-slate2 px-5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-flare hover:text-flare">
                <RotateCcw className="h-3 w-3" /> Another
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Step 01: Capture */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver/40">Step 01 — Capture or upload</span>
                {capturedUrl && (
                  <button onClick={() => setCapturedUrl(null)} className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-silver/40 transition-colors hover:text-flare">
                    <RotateCcw className="h-3 w-3" /> New capture
                  </button>
                )}
              </div>
              {capturedUrl ? (
                <img src={capturedUrl} alt="Captured" className="w-full border border-slate2" />
              ) : (
                <>
                  <CameraViewfinder onCapture={handleCapture} uploading={uploading} />
                  <label className="flex cursor-pointer items-center justify-center gap-2 border border-slate2 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-silver/60 transition-colors hover:border-flare hover:text-flare">
                    <Upload className="h-3.5 w-3.5" /> Upload image
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                  </label>
                </>
              )}
            </div>

            {/* Step 02: Classify */}
            {capturedUrl && (
              <div className="space-y-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver/40">Step 02 — Classify the piece</span>

                {/* Surface type */}
                <div>
                  <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.3em] text-dim">Surface type</span>
                  <div className="grid grid-cols-5 gap-px border border-slate2/60 bg-slate2/40">
                    {GRAFFITI_TYPES.map((t) => (
                      <button key={t.value} type="button" onClick={() => setType(t.value)}
                        className={`py-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] transition-colors ${type === t.value ? "bg-flare text-void" : "bg-card text-darkgray hover:text-silver"}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Medium + Style */}
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">Medium</span>
                    <select value={medium} onChange={(e) => setMedium(e.target.value)} className={`${inp} appearance-none`}>
                      {MEDIUMS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">Style</span>
                    <select value={style} onChange={(e) => setStyle(e.target.value)} className={`${inp} appearance-none`}>
                      {STYLES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </label>
                </div>

                {/* Measurements */}
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">Surface (m²)</span>
                    <input type="number" step="0.1" value={surfaceM2} onChange={(e) => setSurfaceM2(e.target.value)} className={inp} placeholder="e.g. 4.5" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">Coverage %</span>
                    <input type="number" min="0" max="100" value={coveragePct} onChange={(e) => setCoveragePct(e.target.value)} className={inp} placeholder="0–100" />
                  </label>
                </div>

                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, district (optional)" className={inp} />

                {/* Step 03: Location */}
                <div className="space-y-3 border-t border-slate2/40 pt-4">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-3.5 w-3.5 text-ozone" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver/40">Step 03 — Confirm location</span>
                  </div>

                  {photoSource === "exif" && photoCoords ? (
                    <div className="flex items-center gap-2 border border-ozone/40 bg-ozone/5 px-3 py-2">
                      <CheckCircle2 className="h-4 w-4 text-ozone" />
                      <span className="font-mono text-[11px] text-silver">GPS from photo EXIF</span>
                      <span className="ml-auto font-mono text-[10px] tabular text-ozone">{photoCoords.lat.toFixed(5)}, {photoCoords.lng.toFixed(5)}</span>
                    </div>
                  ) : photoCoords ? (
                    <div className="flex items-center gap-2 border border-ozone/40 bg-ozone/5 px-3 py-2">
                      <MapPin className="h-4 w-4 text-ozone" />
                      <span className="font-mono text-[11px] text-silver">{photoSource === "search" ? "Search result" : "GPS lock"}</span>
                      <span className="ml-auto font-mono text-[10px] tabular text-ozone">{photoCoords.lat.toFixed(5)}, {photoCoords.lng.toFixed(5)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between border border-slate2 px-3 py-2">
                      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
                        <Crosshair className="h-3 w-3" />
                        {lat && lng ? `${lat}, ${lng}` : locating ? "Locating…" : "No coordinates"}
                      </span>
                      <button type="button" onClick={locate} disabled={locating} className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ozone transition-opacity hover:opacity-70 disabled:opacity-40">
                        {locating ? "…" : "Locate me"}
                      </button>
                    </div>
                  )}

                  {photoSource !== "exif" && !photoCoords && (
                    <PlaceSearch onSelect={(r) => { setPhotoCoords({ lat: r.lat, lng: r.lng }); setPhotoSource("search"); setLat(r.lat.toFixed(5)); setLng(r.lng.toFixed(5)); }} />
                  )}

                  <details className="group">
                    <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-[0.2em] text-silver/40 transition-colors hover:text-ozone">Enter coordinates manually</summary>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <input type="text" inputMode="decimal" placeholder="Latitude" value={lat} onChange={(e) => { setLat(e.target.value); setPhotoSource("manual"); }} className={inp} />
                      <input type="text" inputMode="decimal" placeholder="Longitude" value={lng} onChange={(e) => { setLng(e.target.value); setPhotoSource("manual"); }} className={inp} />
                    </div>
                  </details>
                </div>

                {error && (
                  <div className="flex items-start gap-2 border border-flare/40 bg-flare/5 px-4 py-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-flare">{error}</span>
                  </div>
                )}

                <button onClick={submit} disabled={submitting || uploading} className="flex w-full items-center justify-center gap-2 border-2 border-flare bg-flare py-4 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-void transition-colors hover:bg-ozone hover:border-ozone disabled:opacity-40">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <SprayCan className="h-4 w-4" />}
                  {submitting ? "Transmitting…" : "Transmit capture"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}