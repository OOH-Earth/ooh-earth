import { Camera, Crosshair, Loader2, Upload } from "lucide-react";
import exifr from "exifr";
import { base44 } from "@/api/base44Client";
import { compressImage } from "@/lib/imageCompress";
import { useState } from "react";
import ReportScanner from "@/components/ooh/report/ReportScanner";
import MapPinDropper from "@/components/ooh/report/MapPinDropper";
import MultiPhotoUpload from "@/components/ooh/gallery/MultiPhotoUpload";

const TYPES = [
  { value: "billboard", label: "Billboard" },
  { value: "digital", label: "Digital" },
  { value: "painted", label: "Painted" },
  { value: "transit", label: "Transit" },
  { value: "projection", label: "Projection" },
  { value: "sticker", label: "Sticker / Paste" },
  { value: "mural", label: "Mural" },
  { value: "other", label: "Other" },
];

const inp = "w-full bg-void border border-slate2 px-4 py-3 font-display text-sm text-silver outline-none transition-colors placeholder:text-dim focus:border-ozone";

export default function ReportStep1Document({ data, onChange }) {
  const [locating, setLocating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const locate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { onChange({ lat: p.coords.latitude.toFixed(5), lng: p.coords.longitude.toFixed(5) }); setLocating(false); },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    // Try EXIF GPS from the photo
    try {
      const gps = await exifr.gps(file);
      if (gps && isFinite(gps.latitude) && isFinite(gps.longitude)) {
        onChange({ lat: gps.latitude.toFixed(5), lng: gps.longitude.toFixed(5) });
      }
    } catch { /* no EXIF GPS */ }
    try {
      const res = await base44.integrations.Core.UploadFile({ file: await compressImage(file) });
      onChange({ image_url: res.file_url });
    } finally { setUploading(false); }
  };

  return (
    <div className="space-y-7">
      {/* Type */}
      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-dim">Media type</label>
        <div className="grid grid-cols-2 gap-px border border-slate2/60 bg-slate2/40 sm:grid-cols-4">
          {TYPES.map((t) => (
            <button key={t.value} type="button" onClick={() => onChange({ type: t.value })}
              className={`px-3 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${data.type === t.value ? "bg-ozone text-void" : "bg-card text-darkgray hover:text-silver"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Photo — capture or upload */}
      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-dim">Field photograph</label>
        {data.image_url ? (
          <div className="relative overflow-hidden border border-slate2 bg-card">
            <img src={data.image_url} alt="capture" className="max-h-48 w-full object-cover" />
            <button type="button" onClick={() => onChange({ image_url: "" })}
              className="absolute right-2 top-2 flex items-center gap-1.5 border border-slate2 bg-void/80 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-silver backdrop-blur-sm transition-colors hover:border-flare hover:text-flare">
              <Camera className="h-3 w-3" /> Replace
            </button>
          </div>
        ) : uploading ? (
          <div className="flex items-center gap-3 border border-ozone/40 bg-card px-4 py-6">
            <Loader2 className="h-4 w-4 animate-spin text-ozone" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ozone">Uploading…</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-px border border-slate2/60 bg-slate2/40">
            <label className="group flex cursor-pointer flex-col items-center gap-2 bg-card px-4 py-6 transition-colors hover:border-ozone">
              <Camera className="h-5 w-5 text-ozone transition-transform group-hover:scale-110" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-silver">Capture live</span>
              <input type="file" accept="image/*" capture="environment" onChange={onPhoto} className="hidden" />
            </label>
            <label className="group flex cursor-pointer flex-col items-center gap-2 bg-card px-4 py-6 transition-colors hover:border-flare">
              <Upload className="h-5 w-5 text-flare transition-transform group-hover:scale-110" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-silver">Upload</span>
              <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
            </label>
          </div>
        )}
      </div>

      {/* Additional gallery photos */}
      <MultiPhotoUpload files={data.extraPhotos || []} onChange={(extraPhotos) => onChange({ extraPhotos })} />

      {/* AI Ad Scanner — beta */}
      <ReportScanner data={data} onChange={onChange} />

      {/* Address */}
      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-dim">Location / address</label>
        <input value={data.address} onChange={(e) => onChange({ address: e.target.value })}
          placeholder="Street, district, city" className={inp} />
      </div>

      {/* Coordinates — live map pin dropper + locate me */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-dim">GPS coordinates</label>
          <button type="button" onClick={locate} disabled={locating}
            className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-ozone transition-opacity hover:opacity-70 disabled:opacity-40">
            {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5" />}
            {locating ? "Locating…" : "Locate me"}
          </button>
        </div>
        <MapPinDropper
          lat={data.lat}
          lng={data.lng}
          onPick={({ lat, lng }) => onChange({ lat: String(lat), lng: String(lng) })}
        />
        <details className="group mt-2">
          <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-[0.2em] text-dim/60 transition-colors hover:text-ozone">Enter coordinates manually</summary>
          <div className="mt-2 grid grid-cols-2 gap-px border border-slate2/60 bg-slate2/40">
            <input value={data.lat} onChange={(e) => onChange({ lat: e.target.value })} placeholder="Latitude" inputMode="decimal" className={`${inp} border-0`} />
            <input value={data.lng} onChange={(e) => onChange({ lng: e.target.value })} placeholder="Longitude" inputMode="decimal" className={`${inp} border-0`} />
          </div>
        </details>
      </div>

      {/* Title (optional) */}
      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-dim">Unit label <span className="text-dim/50">(optional)</span></label>
        <input value={data.title} onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g. Billboard · 1039 Pleonchit" className={inp} />
      </div>
    </div>
  );
}