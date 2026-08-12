// Client-side validation for photo uploads, run before base44.integrations.
// Core.UploadFile() at every upload call site. This is a UX/abuse-reduction
// gate, not a security boundary on its own -- a client can always send
// whatever bytes it wants directly to the API, so treat this as "reject
// obviously-bad input early and cheaply," not "the server can now trust
// what arrives." Whether Base44's own UploadFile integration enforces
// anything server-side is unknown from this repo (see KNOWN_ISSUES.md #21)
// -- that gap still exists after this file, unchanged.

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15MB -- phone photos are typically 3-8MB (see imageCompress.js); generous headroom before compression runs

// Extensions accepted per MIME type. Checked against the two independently
// (a mismatch between what the browser reports as .type and what the
// filename claims is itself a signal of a mislabeled/renamed file).
const ACCEPTED_EXTENSIONS = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'image/gif': ['gif'],
  'image/heic': ['heic'],
  'image/heif': ['heif'],
};

// Magic-byte signatures, checked where the format has a simple fixed-offset
// prefix. HEIC/HEIF use the ISO-BMFF container format (a variable-length
// 'ftyp' box) -- verifying those reliably needs real container parsing, not
// a fixed byte check, so they're deliberately not signature-checked here
// (MIME + extension checks above are the practical limit for them).
const SIGNATURES = {
  'image/jpeg': [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  'image/png': [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  'image/gif': [{ offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }],
  'image/webp': [
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // "RIFF"
    { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }, // "WEBP"
  ],
};
const SIGNATURE_READ_BYTES = 12; // covers every offset+length above (webp's is the longest: 8 + 4)

/**
 * Validates a File before upload. Cheap checks (size, MIME, extension) run
 * first and return synchronously-fast; the signature check only reads the
 * first ~12 bytes of the file (never the whole thing) and only runs if the
 * cheap checks already passed.
 *
 * Always returns both keys (`error` is `null` on success) rather than a
 * discriminated union on `ok` -- checkJs doesn't reliably narrow a JSDoc
 * union return type across call sites, so callers doing
 * `if (!result.ok) result.error` were seeing `error` typed as "doesn't
 * exist on { ok: true }". This shape sidesteps that entirely.
 *
 * @param {File} file
 * @returns {Promise<{ ok: boolean, error: string | null }>}
 */
export async function validateImageFile(file) {
  if (!file) return { ok: false, error: 'No file selected.' };
  if (file.size === 0) return { ok: false, error: 'That file is empty.' };
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: `Image is too large — max ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB.` };
  }

  const mime = (file.type || '').toLowerCase();
  const allowedExts = ACCEPTED_EXTENSIONS[mime];
  if (!allowedExts) {
    return { ok: false, error: 'Unsupported file type — use JPG, PNG, WebP, GIF or HEIC.' };
  }

  const ext = (file.name?.split('.').pop() || '').toLowerCase();
  if (ext && !allowedExts.includes(ext)) {
    return {
      ok: false,
      error: "That file's extension doesn't match its type — try a different photo.",
    };
  }

  const sigChecks = SIGNATURES[mime];
  if (sigChecks) {
    let head;
    try {
      head = new Uint8Array(await file.slice(0, SIGNATURE_READ_BYTES).arrayBuffer());
    } catch {
      return { ok: false, error: 'Could not read that file — try a different photo.' };
    }
    const matches = sigChecks.every((check) =>
      check.bytes.every((b, i) => head[check.offset + i] === b),
    );
    if (!matches) {
      return { ok: false, error: "That file's content doesn't look like a real image." };
    }
  }

  return { ok: true, error: null };
}
