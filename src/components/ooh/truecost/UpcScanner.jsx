import { useEffect, useRef, useState } from 'react';
import { ScanLine, Keyboard, X } from 'lucide-react';

// Dependency-free UPC/EAN scanner using the native BarcodeDetector API
// (Chrome/Edge on mobile + most Android webviews). Falls back to manual entry
// where the API or camera is unavailable (e.g. iOS Safari, preview iframe).
export default function UpcScanner({ onDetected }) {
  const videoRef = useRef(null);
  const rafRef = useRef(null);
  const [supported, setSupported] = useState(true);
  const [active, setActive] = useState(false);
  const [manual, setManual] = useState(false);
  const [manualVal, setManualVal] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasBarcodeDetector = 'BarcodeDetector' in window;
    const isSecure = window.isSecureContext;
    if (!hasBarcodeDetector || !isSecure) setSupported(false);
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    const v = videoRef.current;
    if (v && v.srcObject) {
      v.srcObject.getTracks().forEach((t) => t.stop());
      v.srcObject = null;
    }
    setActive(false);
  };

  const start = async () => {
    setErr('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      const v = videoRef.current;
      v.srcObject = stream;
      await v.play();
      setActive(true);
      const detector = new window.BarcodeDetector({
        formats: ['upc_a', 'upc_e', 'ean_13', 'ean_8'],
      });
      const tick = async () => {
        try {
          const codes = await detector.detect(v);
          if (codes && codes.length) {
            const val = String(codes[0].rawValue).replace(/\D/g, '');
            if (val.length >= 8) {
              stop();
              onDetected(val);
              return;
            }
          }
        } catch (e) {
          /* detect throws on empty frames — keep scanning */
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      setErr(e.message || 'Camera unavailable — use manual entry.');
    }
  };

  const submitManual = (e) => {
    e.preventDefault();
    const v = manualVal.replace(/\D/g, '');
    if (v.length >= 8) onDetected(v);
  };

  return (
    <div className="border border-slate2/60 bg-card">
      <div className="flex items-center justify-between border-b border-slate2/60 px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
          // UPC acquisition
        </span>
        <button
          onClick={() => setManual((m) => !m)}
          className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-darkgray transition-colors hover:text-ozone"
        >
          <Keyboard className="h-3 w-3" /> {manual ? 'Camera' : 'Manual'}
        </button>
      </div>
      <div className="p-4">
        {manual ? (
          <form onSubmit={submitManual} className="flex gap-2">
            <input
              value={manualVal}
              onChange={(e) => setManualVal(e.target.value)}
              inputMode="numeric"
              placeholder="Enter UPC / EAN digits"
              className="flex-1 border border-slate2 bg-void px-3 py-2 font-mono text-sm text-silver outline-none focus:border-ozone"
            />
            <button
              type="submit"
              className="border border-ozone bg-ozone px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-void"
            >
              Decode
            </button>
          </form>
        ) : (
          <div className="relative aspect-video w-full overflow-hidden bg-void">
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            {active && (
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-1/2 h-0.5 w-3/4 -translate-x-1/2 -translate-y-1/2 border-t-2 border-ozone animate-flicker" />
                <div className="absolute left-1/2 top-1/2 h-24 w-3/4 -translate-x-1/2 -translate-y-1/2 border border-ozone/40" />
              </div>
            )}
            {!active && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center">
                {supported ? (
                  <button
                    onClick={start}
                    className="flex items-center gap-2 border-2 border-ozone bg-ozone px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-void"
                  >
                    <ScanLine className="h-4 w-4" /> Start camera
                  </button>
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
                    Camera scanning unsupported here — switch to manual entry.
                  </span>
                )}
                {err && <span className="font-mono text-[9px] text-flare">{err}</span>}
              </div>
            )}
            {active && (
              <button
                onClick={stop}
                className="absolute right-2 top-2 flex items-center gap-1 border border-slate2 bg-void/80 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-silver backdrop-blur-md hover:text-flare"
              >
                <X className="h-3 w-3" /> Stop
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
