// Client-side image downscale + re-encode before upload.
//
// Phone cameras produce 3–8 MB, 4000px+ photos. Storing/serving those raw makes
// the map and feed heavy. This caps the longest edge and re-encodes as JPEG at a
// high quality — sharp, full-HD, NOT a thumbnail. Already-small images are left
// untouched, and any failure falls open (returns the original) so an upload is
// never blocked by compression.

const MAX_DIM = 1920;            // longest edge — full-HD, crisp on detail views
const QUALITY = 0.85;           // JPEG quality — visually near-lossless for photos
const SKIP_BELOW = 900 * 1024;  // already-small + in-bounds → don't re-encode

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { resolve(img); URL.revokeObjectURL(url); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

export async function compressImage(file, opts = {}) {
  const maxDim = opts.maxDim ?? MAX_DIM;
  const quality = opts.quality ?? QUALITY;
  try {
    if (!file || typeof file !== "object" || !(file instanceof Blob)) return file;
    const type = file.type || "";
    if (!type.startsWith("image/")) return file;
    if (/gif|svg/i.test(type)) return file; // don't rasterise animated / vector

    // Resolve dimensions + a drawable source
    let src = null, width = 0, height = 0;
    if (typeof createImageBitmap === "function") {
      try { src = await createImageBitmap(file); width = src.width; height = src.height; }
      catch { src = null; }
    }
    if (!src) {
      const img = await loadImage(file);
      src = img; width = img.naturalWidth; height = img.naturalHeight;
    }
    if (!width || !height) return file;

    const scale = Math.min(1, maxDim / Math.max(width, height));
    // Already within bounds and modestly sized → keep the original bytes
    if (scale === 1 && file.size <= SKIP_BELOW) { if (src.close) src.close(); return file; }

    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) { if (src.close) src.close(); return file; }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src, 0, 0, w, h);
    if (src.close) src.close(); // release ImageBitmap memory

    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
    if (!blob) return file;
    if (blob.size >= file.size) return file; // never make the payload bigger

    const base = (/** @type {File} */ (file).name || "photo").replace(/\.[^./\\]+$/, "");
    return new File([blob], `${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file; // fail open
  }
}
