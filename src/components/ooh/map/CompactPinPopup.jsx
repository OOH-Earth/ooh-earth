import { metaFor } from '@/components/ooh/map/LocationThumb';

/**
 * Terminal-styled compact popup for mobile map pins.
 * Mini terminal window: traffic-light header, grid background, scanlines,
 * category label, title, coordinates, and a single "Expand" button that
 * pushes the full detail into the bottom sheet.
 *
 * Rendered inside react-leaflet <Popup> — uses inline styles to match
 * the existing popup pattern (Leaflet doesn't reliably inherit Tailwind).
 */
export default function CompactPinPopup({ m, onExpand }) {
  const verified = m.status === 'verified';
  const accent = metaFor(m.type).accent;
  const dotColor = verified ? '#39FF14' : '#FF5C00';

  return (
    <div
      style={{
        minWidth: 190,
        maxWidth: 230,
        fontFamily: "'IBM Plex Mono', monospace",
        background: '#0a0a0a',
        backgroundImage:
          'linear-gradient(rgba(237,255,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(237,255,0,0.025) 1px, transparent 1px)',
        backgroundSize: '14px 14px',
      }}
    >
      {/* Terminal header — traffic lights + filename */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '5px 8px',
          borderBottom: '1px solid rgba(237,255,0,0.12)',
          background: '#080808',
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF5555' }} />
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FFB86C' }} />
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#50FA7B' }} />
        <span
          style={{
            marginLeft: 6,
            fontSize: 7,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: '#555',
            fontWeight: 700,
          }}
        >
          {metaFor(m.type).label}.ts
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 6,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#333',
          }}
        >
          DEV
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: '8px 10px', position: 'relative' }}>
        {/* Status row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              fontSize: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              fontWeight: 700,
              color: accent,
            }}
          >
            {metaFor(m.type).label}
          </span>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: dotColor }} />
          <span
            style={{
              fontSize: 7,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: '#555',
            }}
          >
            {m.status}
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontWeight: 700,
            fontSize: 12,
            color: '#f1f1f1',
            marginTop: 3,
            lineHeight: 1.2,
            fontFamily: "'Inter Tight', sans-serif",
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 200,
          }}
        >
          {m.title}
        </div>

        {/* Address */}
        {m.address && (
          <div
            style={{
              fontSize: 8,
              color: '#555',
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 200,
            }}
          >
            {m.address}
          </div>
        )}

        {/* Coordinates */}
        <div
          style={{
            fontSize: 8,
            color: '#333',
            marginTop: 2,
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          {Number(m.lat).toFixed(4)}, {Number(m.lng).toFixed(4)}
        </div>

        {/* Expand button */}
        <button
          onClick={onExpand}
          className="ooh-popup-btn ooh-popup-btn--ozone"
          style={{ marginTop: 7 }}
        >
          ▸ Expand
        </button>
      </div>
    </div>
  );
}
