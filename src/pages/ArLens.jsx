import { useEffect, useRef, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  Camera,
  CameraOff,
  Crosshair,
  Layers,
  Tag,
  BarChart3,
  Zap,
  Loader2,
  Check,
  X,
  Plus,
  Minus,
  RotateCcw,
  MapPin,
} from "lucide-react";

const BILLBOARD_CO2_KG_YR = 4760; // ~4.76 t CO2/yr per illuminated static billboard
const WHO_24H = 15;

function useGeolocation() {
  const [pos, setPos] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    let active = true;
    if (!navigator.geolocation) {
      setErr("Geolocation unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => active && setPos({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }),
      (e) => active && setErr(e.message),
      { enableHighAccuracy: true, timeout: 8000 }
    );
    return () => {
      active = false;
    };
  }, []);
  return { pos, err };
}

export default function ArLens() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [camReady, setCamReady] = useState(false);
  const [camErr, setCamErr] = useState(null);
  const [locked, setLocked] = useState(false);
  const [box, setBox] = useState(60); // percent width of target reticle
  const [layers, setLayers] = useState({ takeover: true, intel: true, log: true });
  const [pm25, setPm25] = useState(null);
  const [logState, setLogState] = useState("idle"); // idle | capturing | uploading | done | error
  const [lastReport, setLastReport] = useState(null);
  const { pos, err: geoErr } = useGeolocation();

  const startCamera = useCallback(async () => {
    setCamErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamReady(true);
    } catch (e) {
      setCamErr(e.message || "Camera access denied");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCamReady(false);
    setLocked(false);
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (!pos) return;
    let active = true;
    fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${pos.lat}&longitude=${pos.lng}&current=pm2_5`
    )
      .then((r) => r.json())
      .then((j) => {
        if (active) setPm25(j?.current?.pm2_5 ?? null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [pos]);

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
  };

  const logReport = async () => {
    if (logState === "capturing" || logState === "uploading") return;
    setLogState("capturing");
    try {
      const blob = await captureFrame();
      if (!blob) {
        setLogState("error");
        return;
      }
      setLogState("uploading");
      const file = new File([blob], `ar-capture-${Date.now()}.jpg`, { type: "image/jpeg" });
      const up = await base44.integrations.Core.UploadFile({ file });
      const lat = pos?.lat ?? 0;
      const lng = pos?.lng ?? 0;
      const rec = await base44.entities.Location.create({
        title: `AR capture · ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        type: "billboard",
        address: `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`,
        lat,
        lng,
        image_url: up.file_url,
        status: "pending",
        notes: "Filed via AR Lens field capture",
      });
      setLastReport(rec);
      setLogState("done");
    } catch (e) {
      console.error(e);
      setLogState("error");
    }
  };

  const resetLock = () => {
    setLocked(false);
    setLogState("idle");
    setLastReport(null);
  };

  const toggle = (k) => setLayers((l) => ({ ...l, [k]: !l[k] }));

  const pmMult = pm25 != null ? (pm25 / WHO_24H).toFixed(1) : null;
  const co2t = (BILLBOARD_CO2_KG_YR / 1000).toFixed(1);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black">
      {/* Camera feed */}
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Fallback states */}
      {!camReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-void p-8 text-center">
          {camErr ? (
            <>
              <CameraOff className="h-10 w-10 text-flare" />
              <div>
                <p className="font-display text-lg font-bold text-silver">Camera blocked</p>
                <p className="mt-1 max-w-xs font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
                  {camErr}. If you're in a preview iframe, open the published app on your phone — camera permissions require a secure, top-level origin.
                </p>
              </div>
              <Link to="/map" className="border border-slate2 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-silver hover:border-ozone hover:text-ozone">
                Back to map
              </Link>
            </>
          ) : (
            <>
              <Camera className="h-10 w-10 text-ozone animate-flicker" />
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-dim">// AR lens standby</p>
              <button
                onClick={startCamera}
                className="flex items-center gap-2 border-2 border-ozone px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare"
                style={{ backgroundColor: "#EDFF00" }}
              >
                <Camera className="h-4 w-4" /> Activate camera
              </button>
              <p className="max-w-xs font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
                Point at a billboard · position the reticle · lock on · overlay + intel + log
              </p>
            </>
          )}
        </div>
      )}

      {/* AR overlay chrome */}
      {camReady && (
        <>
          {/* Grid + scanline */}
          <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-ozone/50 animate-scan" />

          {/* Target reticle */}
          {!locked && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative" style={{ width: `${box}%`, aspectRatio: "3 / 2" }}>
                {[
                  "top-0 left-0 border-t-2 border-l-2",
                  "top-0 right-0 border-t-2 border-r-2",
                  "bottom-0 left-0 border-b-2 border-l-2",
                  "bottom-0 right-0 border-b-2 border-r-2",
                ].map((c) => (
                  <span key={c} className={`absolute h-8 w-8 border-ozone ${c}`} />
                ))}
                <div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2">
                  <Crosshair className="h-6 w-6 text-ozone/80 animate-flicker" />
                </div>
                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.25em] text-ozone">
                  Position billboard in frame
                </span>
              </div>
            </div>
          )}

          {/* Locked overlay — layers render over the target box */}
          {locked && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative" style={{ width: `${box}%`, aspectRatio: "3 / 2" }}>
                {/* Takeover layer */}
                {layers.takeover && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden border-2 border-ozone" style={{ background: "rgba(0,0,0,0.72)" }}>
                    <div className="hi-vis-stripes absolute inset-x-0 top-0 h-2" />
                    <div className="hi-vis-stripes absolute inset-x-0 bottom-0 h-2" />
                    <span className="px-3 text-center font-display text-[clamp(14px,3.5vw,40px)] font-black uppercase leading-[1] tracking-[-0.02em] text-ozone text-glow-ozone">
                      THIS AD COSTS<br />THE PLANET
                    </span>
                    <span className="mt-1 px-3 text-center font-display text-[clamp(10px,2.5vw,26px)] font-black uppercase tracking-[-0.02em] text-flare text-glow-flare">
                      {co2t}t CO₂ / yr
                    </span>
                    <span className="mt-2 font-mono text-[clamp(6px,1.4vw,14px)] uppercase tracking-[0.3em] text-silver/70">OOH·EARTH</span>
                  </div>
                )}

                {/* Intel layer — floating stat cards */}
                {layers.intel && (
                  <>
                    <div className="absolute -left-2 -top-2 -translate-x-full -translate-y-1/2 border border-slate2 bg-void/85 px-2.5 py-1.5 backdrop-blur-md">
                      <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">PM2.5 here</div>
                      <div className="font-display text-base font-black tabular text-flare">{pm25 != null ? `${Math.round(pm25)}` : "—"}</div>
                      <div className="font-mono text-[7px] uppercase tracking-[0.15em] text-dim">{pmMult ? `${pmMult}× WHO` : "µg/m³"}</div>
                    </div>
                    <div className="absolute -right-2 top-1/4 translate-x-full border border-slate2 bg-void/85 px-2.5 py-1.5 backdrop-blur-md">
                      <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">Billboard CO₂</div>
                      <div className="font-display text-base font-black tabular text-ozone">{co2t}t</div>
                      <div className="font-mono text-[7px] uppercase tracking-[0.15em] text-dim">per year</div>
                    </div>
                    <div className="absolute -bottom-2 left-1/2 translate-y-full border border-slate2 bg-void/85 px-2.5 py-1.5 backdrop-blur-md">
                      <div className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.2em] text-dim">
                        <MapPin className="h-2.5 w-2.5" /> GPS lock
                      </div>
                      <div className="font-mono text-[9px] tabular text-silver">{pos ? `${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}` : "acquiring…"}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Top bar */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
            <Link to="/map" className="flex h-9 w-9 items-center justify-center border border-slate2 bg-void/70 text-silver backdrop-blur-md hover:border-ozone hover:text-ozone">
              <X className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2 border border-slate2 bg-void/70 px-3 py-1.5 backdrop-blur-md">
              <span className={`h-1.5 w-1.5 rounded-full ${geoErr ? "bg-flare" : pos ? "bg-ozone" : "bg-dim animate-blink"}`} />
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-silver/70">
                {geoErr ? "No GPS" : pos ? "GPS locked" : "GPS…"}
              </span>
            </div>
            <button onClick={stopCamera} className="flex h-9 w-9 items-center justify-center border border-slate2 bg-void/70 text-silver backdrop-blur-md hover:border-flare hover:text-flare">
              <CameraOff className="h-4 w-4" />
            </button>
          </div>

          {/* Left layer toggles */}
          <div className="absolute left-4 top-1/2 flex -translate-y-1/2 flex-col gap-2">
            <LayerToggle on={layers.takeover} onClick={() => toggle("takeover")} icon={<Layers className="h-4 w-4" />} label="Takeover" />
            <LayerToggle on={layers.intel} onClick={() => toggle("intel")} icon={<BarChart3 className="h-4 w-4" />} label="Intel" />
            <LayerToggle on={layers.log} onClick={() => toggle("log")} icon={<Tag className="h-4 w-4" />} label="Log" />
          </div>

          {/* Right size control */}
          {!locked && (
            <div className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col gap-2">
              <button onClick={() => setBox((b) => Math.min(95, b + 10))} className="flex h-9 w-9 items-center justify-center border border-slate2 bg-void/70 text-silver backdrop-blur-md hover:border-ozone hover:text-ozone">
                <Plus className="h-4 w-4" />
              </button>
              <button onClick={() => setBox((b) => Math.max(25, b - 10))} className="flex h-9 w-9 items-center justify-center border border-slate2 bg-void/70 text-silver backdrop-blur-md hover:border-ozone hover:text-ozone">
                <Minus className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Bottom action bar */}
          <div className="absolute inset-x-0 bottom-0 p-5">
            {!locked ? (
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setLocked(true)}
                  className="flex items-center gap-2 border-2 border-ozone px-8 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-void transition-colors hover:bg-flare hover:border-flare"
                  style={{ backgroundColor: "#EDFF00" }}
                >
                  <Crosshair className="h-4 w-4" /> Lock on
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                {layers.log && (
                  <div className="w-full max-w-sm">
                    {logState === "idle" && (
                      <button
                        onClick={logReport}
                        disabled={!pos}
                        className="flex w-full items-center justify-center gap-2 border-2 border-flare bg-flare px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-void transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Zap className="h-4 w-4" /> {pos ? "Capture & file report" : "Waiting for GPS…"}
                      </button>
                    )}
                    {(logState === "capturing" || logState === "uploading") && (
                      <div className="flex w-full items-center justify-center gap-2 border-2 border-slate2 bg-void/80 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.25em] text-ozone">
                        <Loader2 className="h-4 w-4 animate-spin" /> {logState === "capturing" ? "Capturing frame…" : "Uploading + filing…"}
                      </div>
                    )}
                    {logState === "done" && (
                      <div className="flex w-full items-center justify-center gap-2 border-2 border-ozone bg-void/80 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.25em] text-ozone">
                        <Check className="h-4 w-4" /> Report filed — pending verification
                      </div>
                    )}
                    {logState === "error" && (
                      <button onClick={logReport} className="flex w-full items-center justify-center gap-2 border-2 border-flare px-6 py-3 font-mono text-[11px] uppercase tracking-[0.25em] text-flare">
                        <X className="h-4 w-4" /> Failed — retry
                      </button>
                    )}
                  </div>
                )}
                <button onClick={resetLock} className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-silver/60 hover:text-ozone">
                  <RotateCcw className="h-3.5 w-3.5" /> Re-target
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function LayerToggle({ on, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`flex flex-col items-center gap-1 border px-2 py-2 backdrop-blur-md transition-colors ${
        on ? "border-ozone bg-ozone/10 text-ozone" : "border-slate2 bg-void/70 text-darkgray hover:text-silver"
      }`}
    >
      {icon}
      <span className="font-mono text-[7px] uppercase tracking-[0.15em]">{label}</span>
    </button>
  );
}