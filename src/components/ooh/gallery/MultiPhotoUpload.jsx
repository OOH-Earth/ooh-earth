// @ts-nocheck -- upload result/options intentionally support per-file retry state.
import { useEffect, useRef, useState } from 'react';
import { Camera, Images, Plus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { validateImageFile } from '@/lib/validateUpload';
import { compressImage } from '@/lib/imageCompress';

// The cover photograph is collected separately. Eleven additional photos lets
// one report carry a serious documentation set (12 photos total) without
// making the browser or backend process an unbounded batch.
export const MAX_EXTRA_PHOTOS = 11;
export const PHOTO_UPLOAD_CONCURRENCY = 2;

function fileKey(file) {
  return [file.name, file.size, file.lastModified, file.type].join(':');
}

export function mergePhotoFiles(existing, incoming, limit = MAX_EXTRA_PHOTOS) {
  const seen = new Set(existing.map(fileKey));
  const merged = [...existing];
  for (const file of incoming) {
    const key = fileKey(file);
    if (seen.has(key)) continue;
    seen.add(key);
    if (merged.length >= limit) break;
    merged.push(file);
  }
  return merged;
}

/**
 * Uploads locally-picked extra photos and links them to a Location via
 * LocationPhoto rows (base44/entities/LocationPhoto.jsonc). Called after the
 * parent Location record exists — field reports create the Location first,
 * then this attaches the gallery. Individual failures don't block the rest
 * since losing one extra photo shouldn't fail the report.
 * Re-validates each file at the actual upload boundary (not just relying on
 * addFiles' selection-time check below) -- a defense-in-depth check for
 * whatever ends up in the `files` array this was called with.
 *
 * compressImage() here too, same as every other field-evidence upload site
 * (see imageCompress.js) -- these "extra photos" bypassed it entirely
 * before, uploading a picked file's original EXIF GPS/device metadata
 * unmodified even after the cover-photo upload was fixed to strip it. A
 * compressImage() failure for one photo here is caught by the same
 * Promise.allSettled that already drops any invalid photo -- consistent
 * with this function's existing "one bad photo doesn't block the rest"
 * design, and still never uploads a metadata-bearing original.
 */
export async function uploadLocationPhotos(
  files,
  locationId,
  { displayOrders = files.map((_, i) => i), onProgress } = {},
) {
  if (!files?.length || !locationId) return [];
  let completed = 0;
  let nextIndex = 0;
  const results = Array(files.length);
  const worker = async () => {
    while (true) {
      const i = nextIndex++;
      if (i >= files.length) return;
      try {
        const check = await validateImageFile(files[i]);
        if (!check.ok) throw new Error(check.error);
        const { file_url } = await base44.integrations.Core.UploadFile({
          file: await compressImage(files[i]),
        });
        results[i] = {
          status: 'fulfilled',
          value: await base44.entities.LocationPhoto.create({
            location_id: String(locationId),
            url: file_url,
            display_order: displayOrders[i] ?? i,
          }),
        };
      } catch (error) {
        results[i] = { status: 'rejected', reason: error };
      } finally {
        completed += 1;
        onProgress?.({ completed, total: files.length });
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(PHOTO_UPLOAD_CONCURRENCY, files.length) }, worker),
  );
  return {
    uploaded: results.filter((r) => r.status === 'fulfilled').map((r) => r.value),
    failed: results.flatMap((r, index) =>
      r.status === 'rejected' ? [{ index, error: r.reason?.message || 'Upload failed.' }] : [],
    ),
  };
}

export function PhotoSyncStatus({ state, onRetry }) {
  if (!state || state.status === 'complete') return null;
  if (state.status === 'uploading') {
    return (
      <p
        className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ozone"
        role="status"
      >
        // Uploading additional photos: {state.completed}/{state.total}
      </p>
    );
  }
  return (
    <div className="mt-3 border border-flare/40 bg-flare/5 px-3 py-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-flare" role="alert">
        {state.failed.length} additional photo{state.failed.length === 1 ? '' : 's'} failed. The
        successful photos remain attached to this Location.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 border border-flare/60 px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-flare hover:bg-flare/10"
      >
        Retry failed photos
      </button>
    </div>
  );
}

/**
 * Controlled multi-file picker with local thumbnail previews. Files aren't
 * uploaded here — the parent form holds them in state and calls
 * uploadLocationPhotos() once it has a location id to attach them to.
 */
export default function MultiPhotoUpload({ files, onChange, disabled = false, onRejected }) {
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const filesRef = useRef(files);
  const selectionQueueRef = useRef(Promise.resolve());
  const [previews, setPreviews] = useState([]);
  const [selectionNotice, setSelectionNotice] = useState('');

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const addFiles = (list) => {
    const candidates = Array.from(list || []);
    selectionQueueRef.current = selectionQueueRef.current.then(async () => {
      const checked = await Promise.all(
        candidates.map(async (f) => ({ f, check: await validateImageFile(f) })),
      );
      const incoming = checked.filter((c) => c.check.ok).map((c) => c.f);
      const rejected = checked.filter((c) => !c.check.ok);
      if (rejected.length) onRejected?.(rejected.map((c) => c.check.error));
      if (!incoming.length) return;
      const seen = new Set(filesRef.current.map(fileKey));
      const newFiles = incoming.filter((file) => !seen.has(fileKey(file)));
      const remaining = Math.max(0, MAX_EXTRA_PHOTOS - filesRef.current.length);
      const skippedDuplicates = incoming.length - newFiles.length;
      const skippedForCap = Math.max(0, newFiles.length - remaining);
      if (skippedDuplicates || skippedForCap) {
        setSelectionNotice(
          skippedForCap
            ? `Maximum ${MAX_EXTRA_PHOTOS} additional photos reached — remove one to replace it.`
            : 'Already selected photos were skipped.',
        );
      } else {
        setSelectionNotice('');
      }
      const next = mergePhotoFiles(filesRef.current, incoming);
      filesRef.current = next;
      onChange(next);
    });
  };

  const remove = (i) => {
    selectionQueueRef.current = selectionQueueRef.current.then(() => {
      const next = filesRef.current.filter((_, idx) => idx !== i);
      filesRef.current = next;
      onChange(next);
    });
  };

  return (
    <div>
      <label className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
        <Images className="h-3.5 w-3.5" /> Additional photos
        <span className="text-ozone">
          {files.length} / {MAX_EXTRA_PHOTOS} selected
        </span>
      </label>
      <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.15em] text-silver/70">
        Add from gallery or camera repeatedly; these attach after submission.
      </p>
      <div className="flex flex-wrap gap-2">
        {previews.map((src, i) => (
          <div key={src} className="relative h-16 w-16 overflow-hidden border border-slate2">
            <img src={src} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={disabled}
              aria-label="Remove photo"
              title={`Remove additional photo ${i + 1}`}
              className="absolute right-0 top-0 flex min-h-10 min-w-10 items-center justify-center bg-void/85 text-silver transition-colors hover:text-flare disabled:opacity-40"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}
        {files.length < MAX_EXTRA_PHOTOS && (
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={disabled}
              aria-label="Choose photos"
              className="flex h-16 w-16 flex-col items-center justify-center gap-1 border border-dashed border-slate2 text-dim transition-colors hover:border-ozone hover:text-ozone disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              <span className="font-mono text-[7px] uppercase tracking-[0.12em]">Choose</span>
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={disabled}
              aria-label="Take photo"
              className="flex h-16 w-16 flex-col items-center justify-center gap-1 border border-dashed border-slate2 text-dim transition-colors hover:border-ozone hover:text-ozone disabled:opacity-40"
            >
              <Camera className="h-4 w-4" />
              <span className="font-mono text-[7px] uppercase tracking-[0.12em]">Take</span>
            </button>
          </div>
        )}
      </div>
      {selectionNotice && (
        <p
          className="mt-2 font-mono text-[9px] uppercase tracking-[0.15em] text-amber-200"
          role="status"
        >
          {selectionNotice}
        </p>
      )}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
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
