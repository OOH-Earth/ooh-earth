import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Crosshair, Camera, MapPin, Loader2, Check, ArrowUpRight, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const TYPES = [
  { value: "billboard", label: "Billboard" },
  { value: "painted", label: "Painted" },
  { value: "digital", label: "Digital" },
  { value: "projection", label: "Projection" },
  { value: "sticker", label: "Sticker / Paste" },
  { value: "mural", label: "Mural" },
  { value: "other", label: "Other" },
];

const inputCls =
  "w-full bg-void border border-slate2 px-4 py-3 font-display text-sm text-silver outline-none transition-colors placeholder:text-dim focus:border-ozone";

export default function FieldReport() {
  const [type, setType] = useState("billboard");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [image_url, setImageUrl] = useState("");
  const [locating, setLocating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState("");

  const locate = () => {
    if (!navigator.geolocation) {
      setError("Geolocation unavailable on this device.");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(5));
        setLng(pos.coords.longitude.toFixed(5));
        setLocating(false);
      },
      (e) => {
        setError(e.message || "Location permission denied.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(res.file_url);
    } catch (err) {
      setError("Photo upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const latN = parseFloat(lat);
    const lngN = parseFloat(lng);
    if (!isFinite(latN) || !isFinite(lngN)) {
      setError("Coordinates required — locate or enter manually.");
      return;
    }
    setSubmitting(true);
    const label = TYPES.find((t) => t.value === type)?.label || type;
    const finalTitle = title.trim() || `${label} · ${address.split(",")[0].trim() || "Field report"}`;
    try {
      const rec = await base44.entities.Location.create({
        title: finalTitle,
        type,
        address,
        lat: latN,
        lng: lngN,
        image_url,
        notes,
        source_link: "",
        status: "pending",
      });
      setDone(rec);
    } catch (err) {
      setError(err?.message || "Transmission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="border border-ozone/40 bg-card p-8">
        <Check className="h-7 w-7 text-ozone" />
        <h3 className="mt-4 font-display text-3xl font-bold tracking-[-0.02em] text-silver">Transmission received</h3>
        <p className="mt-2 font-display text-sm leading-[1.4] text-darkgray">
          Field report logged to the public record at {done.lat?.toFixed(4)}, {done.lng?.toFixed(4)}. Pending verification by an operative — it renders on the live map immediately.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/map" className="inline-flex items-center gap-2 bg-ozone px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare">
            View on map <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => {
              setDone(null);
              setTitle("");
              setAddress("");
              setNotes("");
              setImageUrl("");
              setLat("");
              setLng("");
            }}
            className="border border-slate2 px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-darkgray transition-colors hover:border-ozone hover:text-ozone"
          >
            File another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-7">
      {/* Type */}
      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-dim">Intervention type</label>
        <div className="grid grid-cols-2 gap-px border border-slate2/60 bg-slate2/40 sm:grid-cols-4">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`px-3 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${
                type === t.value ? "bg-ozone text-void" : "bg-card text-darkgray hover:text-silver"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-dim">Location / address</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Street, district, city"
          className={inputCls}
        />
      </div>

      {/* Coordinates */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-dim">Coordinates</label>
          <button
            type="button"
            onClick={locate}
            disabled={locating}
            className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-ozone transition-opacity hover:opacity-70 disabled:opacity-40"
          >
            {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5" />}
            {locating ? "Locating…" : "Locate me"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-px border border-slate2/60 bg-slate2/40">
          <input
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="Latitude"
            inputMode="decimal"
            className={`${inputCls} border-0`}
          />
          <input
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="Longitude"
            inputMode="decimal"
            className={`${inputCls} border-0`}
          />
        </div>
      </div>

      {/* Photo */}
      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-dim">Field photograph</label>
        <label className="flex cursor-pointer items-center gap-3 border border-slate2 bg-card px-4 py-4 transition-colors hover:border-ozone">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-ozone" />
          ) : image_url ? (
            <img src={image_url} alt="field" className="h-12 w-12 object-cover" />
          ) : (
            <Camera className="h-4 w-4 text-dim" />
          )}
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-darkgray">
            {uploading ? "Uploading…" : image_url ? "Replace photo" : "Tap to capture / upload"}
          </span>
          <input type="file" accept="image/*" capture="environment" onChange={onPhoto} className="hidden" />
        </label>
      </div>

      {/* Title */}
      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-dim">Title <span className="text-dim/60">(optional — auto-generated if blank)</span></label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Billboard · 1039 Pleonchit" className={inputCls} />
      </div>

      {/* Notes */}
      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-dim">Field notes <span className="text-dim/60">(optional)</span></label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Brand, message, context, counter-narrative…" className={`${inputCls} resize-none`} />
      </div>

      {error && (
        <div className="flex items-start gap-2 border border-flare/40 bg-flare/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-flare" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-flare">{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 bg-ozone px-6 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-void transition-colors hover:bg-flare disabled:opacity-40"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
        {submitting ? "Transmitting…" : "Transmit report"}
      </button>
    </form>
  );
}