import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, ScanLine, UserPlus, LogIn, ArrowRight } from 'lucide-react';

// Tactical operative-registration modal. Fires when an unauthed visitor
// tries to create/act inside the Lab. Browsing is free; acting requires
// joining the union.

export default function LabSignupModal({ open, action, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
        >
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden border border-ozone/40 bg-void shadow-[0_0_60px_rgba(237,255,0,0.12),0_24px_60px_rgba(0,0,0,0.7)]"
          >
            {/* scanline sweep */}
            <style>{`@keyframes lab-gate-scan{0%{transform:translateY(-100%)}100%{transform:translateY(400%)}}`}</style>
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-16"
              style={{
                background: 'linear-gradient(180deg,rgba(237,255,0,0.18),transparent)',
                animation: 'lab-gate-scan 3.2s linear infinite',
              }}
            />
            {/* corner brackets */}
            <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-ozone/70" />
            <span className="pointer-events-none absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2 border-ozone/70" />
            <span className="pointer-events-none absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-ozone/70" />
            <span className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-ozone/70" />

            {/* header */}
            <div className="flex items-center justify-between border-b border-slate2/60 px-5 py-3.5">
              <span className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-ozone">
                <ScanLine className="h-3.5 w-3.5" /> Clearance required
              </span>
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex h-7 w-7 items-center justify-center text-dim transition-colors hover:text-flare"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* body */}
            <div className="px-6 py-7">
              <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim">
                // member registration
              </div>
              <h2 className="mt-2 font-display text-2xl font-bold uppercase tracking-[0.04em] text-silver">
                Join the <span className="text-ozone">union</span>
              </h2>
              <p className="mt-3 font-mono text-[11px] leading-relaxed text-silver/60">
                Browsing the Lab is open. To{' '}
                <span className="text-ozone">{action || 'create'}</span>, you need an account — it's
                free and takes 30 seconds.
              </p>
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-silver/45">
                Registered members can mint, export, claim field leads, and join the DAO.
                Union-made, aligned to the UN SDGs.
              </p>

              <div className="mt-6 flex flex-col gap-2.5">
                <Link
                  to="/register"
                  onClick={onClose}
                  className="group flex items-center justify-center gap-2 border-2 border-ozone bg-ozone px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare"
                >
                  <UserPlus className="h-4 w-4" />
                  Create account
                </Link>
                <Link
                  to="/login"
                  onClick={onClose}
                  className="group flex items-center justify-center gap-2 border border-slate2 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-silver/80 transition-colors hover:border-ozone hover:text-ozone"
                >
                  <LogIn className="h-4 w-4" />I have an account
                </Link>
              </div>

              <button
                onClick={onClose}
                className="mt-4 flex w-full items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-dim/70 transition-colors hover:text-silver"
              >
                Continue browsing <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* footer strip */}
            <div className="border-t border-slate2/60 px-5 py-2.5">
              <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-dim/50">
                // oohearth.app · resistance is free · creating requires a handle
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
