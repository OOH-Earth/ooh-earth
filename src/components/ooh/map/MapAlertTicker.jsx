import { useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, Loader2, Radio, X } from 'lucide-react';
import DraggableTicker from '@/components/ooh/DraggableTicker';
import { shuffleArray } from '@/hooks/useNewsHeadlines';
import { GENERATED_BADGE } from './layers/generatedLayer';

// Compact environmental summary ticker overlaid on the map.
// The items are written by a language model with web context. They are NOT official warnings, and
// the titles, regions, sources and links are not verified. So: nothing is requested until the
// user asks for it, every state is labelled AI-generated, and links are limited to http(s).
// Severity: "flash" (flare) for hazards the model flags as urgent, "watch" (ozone) otherwise.
const safeUrl = (u) => (/^https?:\/\//i.test(String(u || '')) ? u : null);

function Row({ items }) {
  return (
    <>
      {items.map((it, i) => (
        <a
          key={i}
          href={safeUrl(it.url) || undefined}
          target="_blank"
          rel="noreferrer"
          className="flex shrink-0 items-center gap-2 px-4"
        >
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: it.severity === 'flash' ? '#FF5C00' : '#EDFF00' }}
          />
          {it.severity === 'flash' && <AlertTriangle className="h-3 w-3 shrink-0 text-flare" />}
          <span
            className={`font-mono text-[10px] uppercase tracking-[0.12em] ${
              it.severity === 'flash' ? 'text-flare' : 'text-silver/90'
            }`}
          >
            {it.region && <span className="text-ozone">{it.region} · </span>}
            {it.title}
          </span>
          {it.source && (
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">
              · model-named source: {it.source}
            </span>
          )}
          <span className="text-slate2">◆</span>
        </a>
      ))}
    </>
  );
}

export default function MapAlertTicker({ onClose = null }) {
  const [items, setItems] = useState([]);
  const [requested, setRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!requested) return undefined;
    setLoading(true);
    (async () => {
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt:
            "Return 6 current urgent environmental alerts and regional updates relevant to public-space activism and climate justice. Focus on: wildfire smoke events, air quality emergencies (PM2.5), flood warnings, heat advisories, industrial pollution incidents, and environmental protest crackdowns. Use real verifiable events from the last 48 hours. For each, provide a short title (max 80 chars), the affected region/city, the source name, article URL, and severity ('flash' for immediate life-safety hazards like wildfires/floods, 'watch' for advisories and regional updates).",
          add_context_from_internet: true,
          response_json_schema: {
            type: 'object',
            properties: {
              alerts: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    region: { type: 'string' },
                    source: { type: 'string' },
                    url: { type: 'string' },
                    severity: { type: 'string', enum: ['flash', 'watch'] },
                  },
                  required: ['title', 'severity'],
                },
              },
            },
            required: ['alerts'],
          },
        });
        if (mounted.current) {
          const alerts = /** @type {{ alerts?: any[] }} */ (res)?.alerts;
          setItems(shuffleArray(alerts || []));
          setLoading(false);
        }
      } catch {
        if (mounted.current) {
          setItems([]);
          setLoading(false);
        }
      }
    })();
    return () => {
      mounted.current = false;
    };
  }, [requested]);

  const handleClose = () => {
    setDismissed(true);
    onClose?.();
  };

  if (dismissed) return null;

  if (!requested) {
    return (
      <div className="pointer-events-auto flex h-8 items-center gap-2 border border-slate2/60 bg-void/90 px-2 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setRequested(true)}
          className="flex min-h-[32px] items-center gap-2 px-2 font-mono text-[9px] uppercase tracking-[0.2em] text-darkgray transition-colors hover:text-ozone focus-visible:outline focus-visible:outline-2 focus-visible:outline-ozone"
        >
          <Radio className="h-3 w-3" />
          Load AI summary of environmental news · {GENERATED_BADGE}
        </button>
        <button
          onClick={handleClose}
          aria-label="Dismiss ticker"
          className="ml-auto flex items-center justify-center px-2 text-dim transition-colors hover:text-ozone"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pointer-events-auto flex h-8 items-center gap-2 border border-slate2/60 bg-void/90 px-4 backdrop-blur-md">
        <Loader2 className="h-3 w-3 animate-spin text-ozone" />
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">
          // asking the model for a summary…
        </span>
      </div>
    );
  }

  if (!items.length) return null;

  const hasFlash = items.some((it) => it.severity === 'flash');

  return (
    <div className="pointer-events-auto relative flex h-8 w-full items-center gap-2 border border-slate2/60 bg-void/90 backdrop-blur-md">
      <span
        className={`flex shrink-0 items-center gap-1.5 border-r border-slate2/60 px-3 ${
          hasFlash ? 'text-flare' : 'text-ozone'
        }`}
      >
        {hasFlash ? (
          <AlertTriangle className="h-3 w-3 animate-flicker" />
        ) : (
          <Radio className="h-3 w-3 animate-pulse" />
        )}
        <span className="font-mono text-[8px] font-bold uppercase tracking-[0.25em]">
          AI summary
        </span>
        <span
          className="hidden font-mono text-[8px] uppercase tracking-[0.15em] text-[#FF9A3D] sm:inline"
          title="Written by a language model. Not an official warning. Titles, sources and links are not verified."
        >
          · unverified, not an official warning
        </span>
      </span>
      <DraggableTicker>
        <Row items={items} />
      </DraggableTicker>
      <button
        onClick={handleClose}
        aria-label="Dismiss ticker"
        className="flex shrink-0 items-center justify-center border-l border-slate2/60 px-3 text-dim transition-colors hover:text-ozone"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
