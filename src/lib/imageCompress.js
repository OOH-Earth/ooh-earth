// Client-side image downscale + re-encode before upload.
//
// Phone cameras produce 3–8 MB, 4000px+ photos. Storing/serving those raw makes
// the map and feed heavy. This caps the longest edge and re-encodes as JPEG at a
// high quality — sharp, full-HD, NOT a thumbnail.
//
// PRIVACY: this is also this app's only metadata-stripping step for
// uploaded photos, and every current caller (QuickCapture, FieldCheckCamera,
// GraffitiCamera, FieldReport's steps, GraffitiCam, AdScanLab, TrashId — see
// KNOWN_ISSUES) is a field-evidence photo of a real-world location, some of
// them explicitly offered as "Anonymous field capture." A JPEG/PNG/WebP can
// carry EXIF GPS coordinates, camera make/model, and a body serial number;
// silently forwarding those on an anonymous submission would deanonymize
// the reporter regardless of what the app's own structured lat/lng fields
// say. The image file and the application record are separate privacy
// surfaces — this function's job is the former.
//
// For those three formats, every image is now unconditionally re-encoded
// through canvas, even when no resizing is needed — canvas has no memory of
// the source file's metadata, so a fresh toBlob() output cannot carry EXIF
// over. There is no longer a size- or scale-based early return that forwards
// the original bytes. Proven live with a synthetic EXIF fixture (GPS +
// Make/Model + a serial number, no real personal data), not assumed — see
// e2e/image-privacy.spec.ts, which fails against the prior version of this
// file. Orientation needs no special handling: browsers already apply EXIF
// orientation when decoding both createImageBitmap() and <img> (verified
// live — a 100x50 stored JPEG tagged Orientation=6 decodes as 50x100
// through both paths), so the canvas draw below bakes in already-correct
// pixels.
//
// Any processing failure now throws instead of returning the original —
// silently uploading a metadata-bearing file because compression happened
// to fail is exactly the privacy downgrade this function exists to
// prevent. Every current caller already wraps this call in its own
// try/catch with a user-facing "upload failed, try again" message, so this
// doesn't add new unhandled-rejection risk (see KNOWN_ISSUES).
//
// Explicit limitations, not covered by the guarantee above:
// - GIF: never re-encoded (canvas would collapse an animated GIF to one
//   frame). GIF from real camera hardware essentially never carries EXIF —
//   the format has no standard slot for it — so the exposure is low, but
//   this function does not verify or strip whatever a GIF file might carry.
// - HEIC/HEIF: accepted by this app's upload validation (see
//   validateUpload.js) because it's the default photo format on iPhones,
//   but most non-Safari browsers cannot decode HEIC via canvas at all —
//   this was already true before this change (createImageBitmap/<img> both
//   already failed for it), it just used to fail OPEN (silently upload the
//   original, GPS and all) instead of failing closed. On those browsers a
//   HEIC upload now fails with a retry prompt instead of leaking. This is a
//   real, known UX gap this change does not solve — the underlying fix
//   would be transcoding HEIC before it reaches this function, out of
//   scope here.

const MAX_DIM = 1920; // longest edge — full-HD, crisp on detail views
const QUALITY = 0.85; // JPEG quality — visually near-lossless for photos

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve(img);
      URL.revokeObjectURL(url);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

export async function compressImage(file, opts = {}) {
  const maxDim = opts.maxDim ?? MAX_DIM;
  const quality = opts.quality ?? QUALITY;
  if (!file || typeof file !== 'object' || !(file instanceof Blob)) return file;
  const type = file.type || '';
  if (!type.startsWith('image/')) return file;
  if (/gif|svg/i.test(type)) return file; // don't rasterise animated / vector -- see file header

  // From here on, every path either returns a metadata-stripped File or
  // throws -- never the original, metadata-bearing one.
  let src = null,
    width = 0,
    height = 0;
  if (typeof createImageBitmap === 'function') {
    try {
      src = await createImageBitmap(file);
      width = src.width;
      height = src.height;
    } catch {
      src = null;
    }
  }
  if (!src) {
    const img = await loadImage(file);
    src = img;
    width = img.naturalWidth;
    height = img.naturalHeight;
  }
  if (!width || !height) throw new Error('Could not read image dimensions.');

  const scale = Math.min(1, maxDim / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    if (src.close) src.close();
    throw new Error('Image processing is unavailable in this browser.');
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, w, h);
  if (src.close) src.close(); // release ImageBitmap memory

  const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality));
  if (!blob) throw new Error('Could not encode image.');

  // Prettier strips the outer parens here, which shifts the JSDoc cast
  // from `file` to `file.name || 'photo'` and breaks it (verified:
  // reproduces TS2339 on .name/.replace not existing on Blob/File).
  // prettier-ignore
  const base = (/** @type {File} */ (file).name || 'photo').replace(/\.[^./\\]+$/, '');
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
}
