import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { IS_STAGE } from '@/lib/appEnv';

// Persistent, app-wide "this is not production" marker.
// Renders only on the stage/BACKUP build. Also prefixes the tab title with
// [STAGE] and forces a noindex robots tag so the backup can't be indexed.
export default function StageBanner() {
  useEffect(() => {
    if (!IS_STAGE) return;

    const stamp = () => {
      if (!document.title.startsWith('[STAGE]')) document.title = `[STAGE] ${document.title}`;
    };
    stamp();
    let obs;
    const titleEl = document.querySelector('title');
    if (titleEl) {
      obs = new MutationObserver(stamp);
      obs.observe(titleEl, { childList: true });
    }

    let meta = document.querySelector('meta[name="robots"]');
    const createdMeta = !meta;
    const prevRobots = meta ? meta.getAttribute('content') : null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'robots');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'noindex, nofollow');

    return () => {
      if (obs) obs.disconnect();
      if (createdMeta) meta.remove();
      else if (prevRobots != null) meta.setAttribute('content', prevRobots);
    };
  }, []);

  if (!IS_STAGE) return null;

  return (
    <>
      {/* full-viewport hazard ring — never intercepts clicks */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[9998] border-2 border-[#FF0040]/45"
      />
      {/* centered top tab — unmistakable, minimal footprint */}
      <div
        role="status"
        aria-label="Stage environment — not production"
        className="pointer-events-none fixed left-1/2 top-0 z-[9999] flex -translate-x-1/2 items-center gap-1.5 border border-t-0 border-[#FF0040]/70 px-3 py-1 backdrop-blur-sm"
        style={{
          background:
            'repeating-linear-gradient(45deg, rgba(255,0,64,0.28) 0 8px, rgba(10,10,10,0.94) 8px 16px)',
        }}
      >
        <AlertTriangle className="h-3 w-3 text-[#FF0040]" />
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-[#FF0040]">
          Stage · not production
        </span>
      </div>
    </>
  );
}
