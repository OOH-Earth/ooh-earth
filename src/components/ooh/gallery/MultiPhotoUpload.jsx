import { useEffect, useRef, useState } from 'react';
import { Images, Plus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { validateImageFile } from '@/lib/validateUpload';

const MAX_EXTRA_PHOTOS = 8;

/**
 * Uploads locally-picked extra photos and links them to a Location via
 * LocationPhoto rows (base44/entities/LocationPhoto.jsonc). Called after the
 * parent Location record exists — field reports create the Location first,
 * then this attaches the gallery. Individual failures don't block the rest
 * (Promise.allSettled) since losing one extra photo shouldn't fail the report.
 * Re-validates each file at the actual upload boundary (not just relying on
 * addFiles' selection-time check below) -- a defense-in-depth check for
 * whatever ends up in the `files` array this was called with.
 */
export async function uploadLocationPhotos(files, locationId) {
  if (!files?.length || !locationId) return [];
  const results = await Promise.allSettled(
    files.map(async (file, i) => {
      const check = await validateImageFile(file);
      if (!check.ok) throw new Error(check.error);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return base44.entities.LocationPhoto.create({
        location_id: String(locationId),
        url: file_url,
        display_order: i,
        status: 'pending',
      });
    }),
  );
  return results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
}

/**
 * Controlled multi-file picker with local thumbnail previews. Files aren't
 * uploaded here — the parent form holds them in state and calls
 * uploadLocationPhotos() once it has a location id to attach them to.
 */
export default function MultiPhotoUpload({ files, onChange, disabled = false, onRejected }) {
  const inputRef = useRef(null);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const addFiles = async (list) => {
    const candidates = Array.from(list || []);
    const checked = await Promise.all(
      candidates.map(async (f) => ({ f, check: await validateImageFile(f) })),
    );
    const incoming = checked.filter((c) => c.check.ok).map((c) => c.f);
    const rejected = checked.filter((c) => !c.check.ok);
    if (rejected.length) onRejected?.(rejected.map((c) => c.check.error));
    if (!incoming.length) return;
    onChange([...files, ...incoming].slice(0, MAX_EXTRA_PHOTOS));
  };

  const remove = (i) => onChange(files.filter((_, idx) => idx !== i));

  return (
    <div>
      <label className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
        <Images className="h-3.5 w-3.5" /> Additional photos{' '}
        <span className="text-dim/60">(optional, up to {MAX_EXTRA_PHOTOS})</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {previews.map((src, i) => (
          <div key={src} className="relative h-16 w-16 overflow-hidden border border-slate2">
            <img src={src} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={disabled}
              aria-label="Remove photo"
              className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center bg-void/80 text-silver transition-colors hover:text-flare disabled:opacity-40"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}
        {files.length < MAX_EXTRA_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            aria-label="Add photos"
            className="flex h-16 w-16 items-center justify-center border border-dashed border-slate2 text-dim transition-colors hover:border-ozone hover:text-ozone disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />
      {files.length > 0 && (
        <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-dim/60">
          // syncs after submission — requires an online connection
        </p>
      )}
    </div>
  );
}
