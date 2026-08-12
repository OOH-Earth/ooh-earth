import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { compressImage } from "@/lib/imageCompress";
import { Camera, Crosshair, Loader2, Check, X, MapPin, CloudOff } from "lucide-react";
import { submitCapture } from "@/lib/offlineQueue";
import CameraViewfinder from "@/components/ooh/CameraViewfinder";
import MultiPhotoUpload, { uploadLocationPhotos } from "@/components/ooh/gallery/MultiPhotoUpload";

const TYPES = [
  { value: "billboard", label: "Billboard" },
  { value: "painted", label: "Painted" },
  { value: "digital", label: "Digital" },
  { value: "projection", label: "Projection" },
  { value: "sticker", label: "Sticker" },
  { value: "mural", label: "Mural" },
  { value: "transit", label: "Transit" },
  { value: "other", label: "Other" },
];

export default function QuickCapture({ open, onClose }) {
  const [type, setType] = useState("billboard");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [image_url, setImageUrl] = useState("");
  const [extraPhotos, setExtraPhotos] = useState([]);
  const [locating, setLocating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState("");

  const locate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(5));
        setLng(pos.coords.longitude.toFixed(5));
        setLocating(false);
      },
      () => { setLocating(false); setError("Location unavailable — enter coordinates manually."); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (!open) return;
    setError("");
    setDone(null);
    locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  if (!open) return null;

  const reset = () => {
    setDone(null); setImageUrl(""); setExtraPhotos([]); setAddress(""); setLat(""); setLng(""); setType("billboard"); setError("");
  };

  const uploadFile = async (file) => {
    if (!file) return;
    setUploading(true); setError("");
    try {
      const res = await base44.integrations.Core.UploadFile({ file: await compressImage(file) });
      setImageUrl(res.file_url);
    } catch { setError("Photo upload failed."); }
    finally { setUploading(false); }
  };

  const onPhoto = (e) => uploadFile(e.target.files?.[0]);

  const onCapture = (file) => uploadFile(file);

  const submit = async () => {
    setError("");
    const latN = parseFloat(lat), lngN = parseFloat(lng);
    if (!image_url) { setError("Capture a field photograph first."); return; }
    if (!isFinite(latN) || !isFinite(lngN)) { setError("Coordinates required — allow location access."); return; }
    setSubmitting(true);
    const label = TYPES.find((t) => t.value === type)?.label || type;
    const title = `${label} · ${address.split(",")[0].trim() || "Field capture"}`;
    try {
      const res = await submitCapture({
        title, type, address, lat: latN, lng: lngN, image_url,
        notes: "Anonymous field capture", source_link: "", status: "pending",
      });
      if (res.status === "synced") {
        setDone(res.rec);
        if (extraPhotos.length) uploadLocationPhotos(extraPhotos, res.rec.id).catch(() => {});
      } else {
        setDone({ queued: true, lat: latN, lng: lngN });
      }
    } catch (err) { setError(err?.message || "Transmission failed."); }
    finally { setSubmitting(false); }
  };

  const showManual = !locating && (!lat || !lng);

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto border border-slate2 bg-void p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 text-dim transition-colors hover:text-flare"><X className="h-4 w-4" /></button>

        {done ? (
          <>
            {done.queued ? <CloudOff className="h-7 w-7 text-flare" /> : <Check className="h-7 w-7 text-ozone" />}
            <h3 className="mt-3 font-display text-2xl font-bold tracking-[-0.02em] text-silver">{done.queued ? "Queued offline" : "Captured"}</h3>
            <p className="mt-2 font-display text-sm leading-[1.4] text-darkgray">{done.queued ? `Offline — saved on this device. It transmits automatically when you reconnect. Position ${done.lat?.toFixed(4)}, ${done.lng?.toFixed(4)}.` : `Anonymous field report logged at ${done.lat?.toFixed(4)}, ${done.lng?.toFixed(4)}. It renders on the map pending verification.`}</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => { reset(); onClose(); }} className="inline-flex items-center gap-2 bg-ozone px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare">
                <MapPin className="h-3.5 w-3.5" /> View on map
              </button>
              <button onClick={reset} className="border border-slate2 px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">Another</button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-ozone" />
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">Anonymous field capture</span>
            </div>
            <h3 className="mt-2 font-display text-xl font-bold tracking-[-0.02em] text-silver">Photograph the offense</h3>

            {image_url ? (
              <div className="relative mt-4 aspect-[4/3] overflow-hidden border border-slate2 bg-card">
                <img src={image_url} alt="capture" className="h-full w-full object-cover" />
                <button onClick={() => setImageUrl("")} className="absolute right-2 top-2 flex items-center gap-1.5 border border-slate2 bg-void/80 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-silver backdrop-blur-sm transition-colors hover:border-flare hover:text-flare">
                  <Camera className="h-3 w-3" /> Retake
                </button>
              </div>
            ) : (
              <>
                <div className="mt-4">
                  <CameraViewfinder onCapture={onCapture} uploading={uploading} />
                </div>
                <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 border border-slate2/60 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">
                  <Camera className="h-3 w-3" /> Or choose from gallery
                  <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
                </label>
              </>
            )}

            <div className="mt-4">
              <MultiPhotoUpload files={extraPhotos} onChange={setExtraPhotos} disabled={submitting} />
            </div>

            <div className="mt-4">
              <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-dim">Type</span>
              <div className="grid grid-cols-4 gap-px border border-slate2/60 bg-slate2/40">
                {TYPES.map((t) => (
                  <button key={t.value} type="button" onClick={() => setType(t.value)} className={`py-2 font-mono text-[9px] font-bold uppercase tracking-[0.15em] transition-colors ${type === t.value ? "bg-ozone text-void" : "bg-card text-darkgray hover:text-silver"}`}>{t.label}</button>
                ))}
              </div>
            </div>

            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, district (optional)" className="mt-4 w-full border border-slate2 bg-void px-4 py-3 font-display text-sm text-silver outline-none transition-colors placeholder:text-dim focus:border-ozone" />

            <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
              <span className="flex items-center gap-1.5">
                <Crosshair className="h-3 w-3" />
                {lat && lng ? `${lat}, ${lng}` : locating ? "Locating…" : "No coordinates"}
              </span>
              <button onClick={locate} className="text-ozone transition-opacity hover:opacity-70">{locating ? "…" : "Re-locate"}</button>
            </div>

            {showManual && (
              <div className="mt-2 grid grid-cols-2 gap-px border border-slate2/60 bg-slate2/40">
                <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Latitude" inputMode="decimal" className="border-0 bg-card px-3 py-2.5 font-mono text-[11px] text-silver outline-none" />
                <input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Longitude" inputMode="decimal" className="border-0 bg-card px-3 py-2.5 font-mono text-[11px] text-silver outline-none" />
              </div>
            )}

            {error && <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-flare">{error}</p>}

            <button onClick={submit} disabled={submitting || uploading} className="mt-5 flex w-full items-center justify-center gap-2 bg-ozone px-6 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-void transition-colors hover:bg-flare disabled:opacity-40">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {submitting ? "Transmitting…" : "Transmit capture"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}