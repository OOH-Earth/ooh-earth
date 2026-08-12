import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Images } from 'lucide-react';

/**
 * Location photo gallery. Reads LocationPhoto rows (base44/entities/LocationPhoto.jsonc)
 * for loc.id and merges them with the legacy single loc.image_url (kept as the cover
 * photo — see base44/entities/Location.jsonc). Falls back to the old single-image
 * layout when no gallery rows exist yet, so untouched locations render unchanged.
 */
export default function PhotoGallery({ loc, icon: Icon, accent }) {
  const [photos, setPhotos] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!loc?.id) {
        setLoaded(true);
        return;
      }
      try {
        const rows = await base44.entities.LocationPhoto.filter(
          { location_id: String(loc.id) },
          'display_order',
          50,
        );
        if (alive) setPhotos((rows || []).map((r) => ({ url: r.url, caption: r.caption || '' })));
      } catch {
        if (alive) setPhotos([]);
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [loc?.id]);

  const extra = photos.filter((p) => p.url && p.url !== loc.image_url);
  const gallery = loc.image_url ? [{ url: loc.image_url, caption: '' }, ...extra] : extra;

  if (!loaded) {
    return <div className="aspect-[4/3] animate-pulse border border-slate2 grid-bg" />;
  }

  if (gallery.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center border border-slate2 grid-bg">
        {Icon ? <Icon className="h-10 w-10" style={{ color: accent }} strokeWidth={1.2} /> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={() => setOpenIndex(0)}
        className="relative aspect-[4/3] overflow-hidden border border-slate2 text-left"
      >
        <Image
          src={gallery[0].url}
          alt={loc.title}
          className="h-full w-full object-cover"
          fittingType="fill"
        />
        {gallery.length > 1 && (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 border border-slate2 bg-void/80 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-silver backdrop-blur-sm">
            <Images className="h-3 w-3" /> {gallery.length}
          </span>
        )}
      </button>

      {gallery.length > 1 && (
        <div className="grid grid-cols-4 gap-1.5">
          {gallery.slice(1, 5).map((p, i) => (
            <button
              key={`${p.url}-${i}`}
              type="button"
              onClick={() => setOpenIndex(i + 1)}
              className="relative aspect-square overflow-hidden border border-slate2/60 transition-colors hover:border-ozone"
            >
              <Image src={p.url} alt="" className="h-full w-full object-cover" fittingType="fill" />
              {i === 3 && gallery.length > 5 && (
                <span className="absolute inset-0 flex items-center justify-center bg-void/70 font-mono text-[10px] text-silver">
                  +{gallery.length - 5}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <Dialog open={openIndex !== null} onOpenChange={(open) => !open && setOpenIndex(null)}>
        <DialogContent className="max-w-3xl border-slate2 bg-void p-2 sm:p-4">
          {openIndex !== null && gallery[openIndex] && (
            <div className="relative">
              <img
                src={gallery[openIndex].url}
                alt={gallery[openIndex].caption || loc.title}
                className="max-h-[75vh] w-full object-contain"
              />
              {gallery[openIndex].caption && (
                <p className="mt-2 px-1 font-mono text-[11px] text-darkgray">
                  {gallery[openIndex].caption}
                </p>
              )}
              {gallery.length > 1 && (
                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setOpenIndex((i) => (i - 1 + gallery.length) % gallery.length)}
                    className="flex items-center gap-1 border border-slate2 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                  </button>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
                    {openIndex + 1} / {gallery.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpenIndex((i) => (i + 1) % gallery.length)}
                    className="flex items-center gap-1 border border-slate2 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone"
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
