// Shared category-specific glyph library for OOH map pins.
// Single source of truth used by both LocationMap (Leaflet, SVG) and
// Globe3D (MapLibre, Canvas). Each location type — billboard, digital,
// transit, painted, mural, sticker, projection, other — gets its own
// distinct iconography instead of the old one-size-fits-all billboard glyph.

export const GLYPH_COLORS = {
  billboard: '#EDFF00',
  digital: '#EDFF00',
  transit: '#39FF14',
  painted: '#FF5C00',
  mural: '#FF5C00',
  sticker: '#EDFF00',
  projection: '#FF5C00',
  other: '#B2B2B2',
};

export const PIN_TYPES = [
  'billboard',
  'digital',
  'transit',
  'painted',
  'mural',
  'sticker',
  'projection',
  'other',
];

// ── SVG path fragments (viewBox 0 0 24 24) ──────────────────────────
// __A__ is replaced at call-time with the type's accent colour.
const GLYPH_PATHS = {
  billboard:
    '<rect x="5" y="3" width="14" height="11" rx="1" fill="#000"/><rect x="7" y="5" width="10" height="2.5" fill="__A__" opacity="0.85"/><rect x="9" y="14" width="2" height="6" fill="#000"/><rect x="13" y="14" width="2" height="6" fill="#000"/>',
  digital:
    '<rect x="5" y="4" width="14" height="10" rx="1" fill="#000"/><rect x="7" y="6" width="10" height="2" fill="__A__"/><rect x="7" y="9" width="6" height="1.5" fill="__A__"/>',
  transit:
    '<rect x="5" y="4" width="14" height="11" rx="2" fill="#000"/><rect x="7" y="6" width="10" height="3" fill="__A__"/><circle cx="9" cy="17" r="1.4" fill="#000"/><circle cx="15" cy="17" r="1.4" fill="#000"/>',
  painted:
    '<rect x="4" y="5" width="13" height="6" rx="1" fill="#000"/><rect x="17" y="6" width="4" height="4" fill="#000"/><rect x="9" y="11" width="2" height="5" fill="#000"/><rect x="7" y="16" width="6" height="3" fill="#000"/>',
  mural:
    '<rect x="4" y="5" width="16" height="10" fill="#000"/><rect x="4" y="5" width="16" height="2.5" fill="__A__"/>',
  sticker:
    '<circle cx="12" cy="12" r="7" fill="#000"/><path d="M12 5v7l4 4" stroke="__A__" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  projection:
    '<rect x="3" y="9" width="6" height="6" fill="#000"/><path d="M9 12L21 6" stroke="#000" stroke-width="2.4" stroke-linecap="round"/>',
  other: '<circle cx="12" cy="12" r="6" fill="#000"/>',
};

// SVG string for Leaflet divIcon HTML. Pass the location type and desired
// rendered size in pixels (defaults to 11 to match the original pin scale).
export function glyphSVG(type, size = 11) {
  const accent = GLYPH_COLORS[type] || GLYPH_COLORS.other;
  const inner = (GLYPH_PATHS[type] || GLYPH_PATHS.other).replace(/__A__/g, accent);
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" aria-hidden="true">${inner}</svg>`;
}

// ── Canvas draw functions (24×24 coordinate space) ───────────────────
// Each function draws the glyph in a 24×24 local space. The caller handles
// translate + scale so the glyph ends up centered at (cx, cy) at the right
// pixel size.
const GLYPH_CANVAS = {
  billboard: (ctx, a) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(5, 3, 14, 11);
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = a;
    ctx.fillRect(7, 5, 10, 2.5);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000';
    ctx.fillRect(9, 14, 2, 6);
    ctx.fillRect(13, 14, 2, 6);
  },
  digital: (ctx, a) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(5, 4, 14, 10);
    ctx.fillStyle = a;
    ctx.fillRect(7, 6, 10, 2);
    ctx.fillRect(7, 9, 6, 1.5);
  },
  transit: (ctx, a) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(5, 4, 14, 11);
    ctx.fillStyle = a;
    ctx.fillRect(7, 6, 10, 3);
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(9, 17, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(15, 17, 1.4, 0, Math.PI * 2);
    ctx.fill();
  },
  painted: (ctx) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(4, 5, 13, 6);
    ctx.fillRect(17, 6, 4, 4);
    ctx.fillRect(9, 11, 2, 5);
    ctx.fillRect(7, 16, 6, 3);
  },
  mural: (ctx, a) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(4, 5, 16, 10);
    ctx.fillStyle = a;
    ctx.fillRect(4, 5, 16, 2.5);
  },
  sticker: (ctx, a) => {
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(12, 12, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = a;
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(12, 5);
    ctx.lineTo(12, 12);
    ctx.lineTo(16, 16);
    ctx.stroke();
  },
  projection: (ctx) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(3, 9, 6, 6);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(9, 12);
    ctx.lineTo(21, 6);
    ctx.stroke();
  },
  other: (ctx) => {
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(12, 12, 6, 0, Math.PI * 2);
    ctx.fill();
  },
};

// Canvas draw for MapLibre globe symbol layer. Draws the category glyph
// centered at (cx, cy), scaled to fit within `size` pixels.
export function drawGlyph(ctx, type, cx, cy, size = 16) {
  const accent = GLYPH_COLORS[type] || GLYPH_COLORS.other;
  const fn = GLYPH_CANVAS[type] || GLYPH_CANVAS.other;
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(size / 24, size / 24);
  fn(ctx, accent);
  ctx.restore();
}
