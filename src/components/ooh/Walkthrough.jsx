import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Walkthrough({ open, onClose, steps }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (open) setI(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const step = steps[i];
    let raf;
    const measure = () => {
      if (!step?.target) {
        setRect(null);
        return;
      }
      const el = document.querySelector(step.target);
      if (!el) {
        setRect(null);
        return;
      }
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      raf = setTimeout(() => setRect(el.getBoundingClientRect()), 320);
    };
    measure();
    const onResize = () => {
      if (step?.target) {
        const el = document.querySelector(step.target);
        setRect(el ? el.getBoundingClientRect() : null);
      } else {
        setRect(null);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI((p) => Math.min(p + 1, steps.length - 1));
      if (e.key === "ArrowLeft") setI((p) => Math.max(p - 1, 0));
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, i, steps, onClose]);

  if (!open) return null;
  const step = steps[i];
  const last = i === steps.length - 1;
  const hasRect = !!rect;

  const ttStyle = hasRect
    ? {
        top: rect.bottom + 170 < window.innerHeight ? rect.bottom + 12 : Math.max(16, rect.top - 230),
        left: Math.min(Math.max(16, rect.left), window.innerWidth - 316),
      }
    : {
        top: Math.max(16, window.innerHeight / 2 - 120),
        left: Math.max(16, window.innerWidth / 2 - 150),
      };

  return createPortal(
    <div className="fixed inset-0 z-[2000]" style={{ pointerEvents: "none" }}>
      {hasRect ? (
        <div
          style={{
            position: "absolute",
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.74)",
            border: "2px solid rgb(var(--c-ozone))",
            transition: "all 0.25s ease",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/74" style={{ pointerEvents: "auto" }} />
      )}
      {hasRect && <div className="absolute inset-0" style={{ pointerEvents: "auto" }} />}

      <div
        style={{ position: "absolute", ...ttStyle, pointerEvents: "auto" }}
        className="w-[300px] border border-slate2 bg-card p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
            // Step {i + 1} / {steps.length}
          </span>
          <button onClick={onClose} aria-label="Skip tour" className="text-dim transition-colors hover:text-silver">
            <X className="h-4 w-4" />
          </button>
        </div>
        <h3 className="mt-3 font-display text-xl font-bold leading-tight tracking-[-0.01em] text-silver">{step.title}</h3>
        <p className="mt-2 font-display text-[13px] leading-[1.45] text-darkgray">{step.body}</p>

        {step.cta && (
          <div className="mt-5">
            <Link
              to="/report"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 bg-ozone px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare"
            >
              File a report <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={() => setI((p) => Math.max(p - 1, 0))}
            disabled={i === 0}
            className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-dim transition-colors hover:text-silver disabled:opacity-30"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </button>
          {last ? (
            <button
              onClick={onClose}
              className="flex items-center gap-1 bg-ozone px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:bg-flare"
            >
              Finish
            </button>
          ) : (
            <button
              onClick={() => setI((p) => Math.min(p + 1, steps.length - 1))}
              className="flex items-center gap-1 bg-ozone px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:bg-flare"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center gap-1.5">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${idx === i ? "bg-ozone" : "bg-slate2"}`}
              aria-label={`Go to step ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}