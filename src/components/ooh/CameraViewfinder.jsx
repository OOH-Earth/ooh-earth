import { useEffect, useRef, useState } from "react";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";

/**
 * On-site live camera viewfinder (getUserMedia).
 * Captures a frame to canvas → JPEG File, passed to onCapture(file).
 * Requires a secure context (HTTPS / localhost) — the preview iframe is
 * not secure, so a clear "activate on HTTPS" state is shown there.
 */
export default function CameraViewfinder({ onCapture, uploading }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setError("not-secure");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setReady(true);
      } catch (e) {
        setError(e?.name === "NotAllowedError" ? "denied" : "failed");
      }
    };
    start();
    return () => {
      cancelled = true;
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const shutter = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    c.toBlob(
      (blob) => {
        if (blob) onCapture?.(new File([blob], "field-capture.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9
    );
  };

  if (error === "not-secure") {
    return (
      <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 border border-slate2 bg-card text-center">
        <AlertTriangle className="h-6 w-6 text-flare" />
        <span className="px-6 font-mono text-[10px] uppercase tracking-[0.2em] text-darkgray">Live camera requires HTTPS</span>
        <span className="px-6 font-mono text-[9px] uppercase tracking-[0.15em] text-dim">Publish the app to activate the on-site viewfinder</span>
      </div>
    );
  }
  if (error === "denied" || error === "failed") {
    return (
      <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 border border-slate2 bg-card text-center">
        <AlertTriangle className="h-6 w-6 text-flare" />
        <span className="px-6 font-mono text-[10px] uppercase tracking-[0.2em] text-darkgray">
          {error === "denied" ? "Camera permission denied" : "Camera unavailable"}
        </span>
        <button onClick={() => location.reload()} className="mt-1 inline-flex items-center gap-1.5 border border-slate2 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">
          <RefreshCw className="h-3 w-3" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3] overflow-hidden border border-slate2 bg-black">
      <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-3 top-3 h-5 w-5 border-l-2 border-t-2 border-ozone/70" />
        <div className="absolute right-3 top-3 h-5 w-5 border-r-2 border-t-2 border-ozone/70" />
        <div className="absolute bottom-16 left-3 h-5 w-5 border-b-2 border-l-2 border-ozone/70" />
        <div className="absolute bottom-16 right-3 h-5 w-5 border-b-2 border-r-2 border-ozone/70" />
        <span className="absolute left-3 top-3 pl-7 font-mono text-[8px] uppercase tracking-[0.2em] text-ozone/80">// live</span>
      </div>
      <button
        onClick={shutter}
        disabled={!ready || uploading}
        aria-label="Capture"
        className="absolute bottom-3 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border-2 border-ozone bg-void/60 backdrop-blur-sm transition-transform active:scale-90 disabled:opacity-40"
      >
        {uploading ? <Loader2 className="h-5 w-5 animate-spin text-ozone" /> : <span className="h-6 w-6 rounded-full bg-ozone" />}
      </button>
      {!ready && !uploading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-ozone" />
        </div>
      )}
    </div>
  );
}