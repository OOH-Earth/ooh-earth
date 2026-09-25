import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { metaFor } from '@/components/ooh/map/LocationThumb';

// Metro rail — auto-scrolling strip of the latest field-logged locations
// (photo-backed only). Pauses on hover; static under reduced-motion.
export default function MetroSlider() {
  const [items, setItems] = useState([]);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    let cancelled = false;
    (async () => {
      try {
        const all = await base44.entities.Location.list('-created_date', 60);
        if (cancelled) return;
        setItems((all || []).filter((l) => l.image_url).slice(0, 18));
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!items.length) return null;
  const loop = [...items, ...items];

  return (
    <div className="group relative z-40 border-b border-slate2/40 bg-void/80 backdrop-blur-sm">
      <div className="flex items-center justify-between px-5 py-2 md:px-8">
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim">
          // Latest field log
        </span>
        <Link
          to="/map"
          className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.25em] text-ozone transition-colors hover:text-flare"
        >
          Open atlas <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="relative overflow-hidden">
        <div
          className={`flex w-max ${reduced ? '' : 'animate-marquee group-hover:[animation-play-state:paused]'}`}
          style={{ animationDuration: '38s' }}
        >
          {loop.map((l, i) => {
            const { Icon, accent, label } = metaFor(l.type);
            return (
              <article
                key={`${l.id}-${i}`}
                data-testid="field-log-card"
                className="group/card relative h-28 w-44 shrink-0 overflow-hidden border-r border-slate2/30 md:h-32 md:w-52"
              >
                {l.id ? (
                  <Link
                    to={`/location/${encodeURIComponent(l.id)}`}
                    data-testid="field-log-location-link"
                    aria-label={`View ${l.title || 'field location'} details`}
                    className="absolute inset-0 z-0"
                  >
                    <img
                      src={l.image_url}
                      alt={l.title || 'Field location'}
                      data-testid="field-log-image"
                      className="block h-full w-full object-cover object-center"
                      loading="lazy"
                    />
                  </Link>
                ) : (
                  <img
                    src={l.image_url}
                    alt={l.title || 'Field location'}
                    data-testid="field-log-image"
                    className="absolute inset-0 block h-full w-full object-cover object-center"
                    loading="lazy"
                  />
                )}
                <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-void/90 via-void/10 to-transparent transition-opacity duration-300 group-hover/card:from-void" />
                <span
                  className="pointer-events-none absolute left-2 top-2 z-10 flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.25em]"
                  style={{ color: accent }}
                >
                  <Icon className="h-2.5 w-2.5" />
                  {label}
                </span>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-2">
                  <div className="truncate font-display text-xs font-bold text-silver">
                    {l.title}
                  </div>
                  {l.address && (
                    <div className="truncate font-mono text-[8px] uppercase tracking-[0.15em] text-darkgray">
                      {l.address}
                    </div>
                  )}
                  {l.id && (
                    <Link
                      to={`/map?highlight=${encodeURIComponent(l.id)}`}
                      data-testid="field-log-map-link"
                      className="pointer-events-auto relative z-20 mt-1 inline-flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.15em] text-ozone/80 hover:text-ozone"
                    >
                      Open map <ArrowUpRight className="h-2.5 w-2.5" />
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
