import { CircleMarker, Tooltip, Popup } from 'react-leaflet';
import { Sprout, Loader2 } from 'lucide-react';
import { useFloraData } from './useFloraData';

// Renders plant biodiversity hotspot markers. Data fetched via LLM web search
// using the shared useFloraData hook.
export default function FloraLayer() {
  const { spots, loading } = useFloraData();

  if (loading) {
    return (
      <CircleMarker center={[13.746, 100.55]} radius={0} pathOptions={{ opacity: 0 }}>
        <Tooltip permanent direction="center" opacity={0.85}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: "'Inter Tight', sans-serif",
            }}
          >
            <Loader2 className="h-3 w-3 animate-spin" style={{ color: '#39FF14' }} />
            <span
              style={{
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: '#39FF14',
                fontWeight: 700,
              }}
            >
              Scanning flora index…
            </span>
          </div>
        </Tooltip>
      </CircleMarker>
    );
  }

  return spots.map((s, i) => (
    <CircleMarker
      key={`flora-${i}`}
      center={[s.lat, s.lng]}
      radius={8}
      pathOptions={{
        color: '#000',
        weight: 2,
        fillColor: '#39FF14',
        fillOpacity: 0.55,
      }}
    >
      <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
        <div style={{ fontFamily: "'Inter Tight', sans-serif", minWidth: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Sprout size={10} style={{ color: '#39FF14' }} />
            <span
              style={{
                fontSize: 8,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#39FF14',
                fontWeight: 700,
              }}
            >
              Flora
            </span>
          </div>
          <div
            style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--foreground))', marginTop: 2 }}
          >
            {s.region || 'Unknown'}
          </div>
          <div style={{ fontSize: 9, color: '#39FF14', marginTop: 2, fontStyle: 'italic' }}>
            {s.species}
          </div>
        </div>
      </Tooltip>
      <Popup>
        <div style={{ fontFamily: "'Inter Tight', sans-serif", width: 180 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Sprout size={12} style={{ color: '#39FF14' }} />
            <span
              style={{
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: '#39FF14',
                fontWeight: 700,
              }}
            >
              Flora Index
            </span>
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'hsl(var(--foreground))' }}>
            {s.region || 'Unknown'}
          </div>
          <div style={{ fontSize: 11, color: '#39FF14', marginTop: 4, fontStyle: 'italic' }}>
            {s.species}
          </div>
          {s.ecosystem && (
            <div style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
              <span
                style={{
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontWeight: 700,
                  fontSize: 8,
                }}
              >
                Ecosystem
              </span>
              <br />
              {s.ecosystem}
            </div>
          )}
          {s.note && (
            <div
              style={{
                fontSize: 10,
                color: 'hsl(var(--muted-foreground))',
                marginTop: 4,
                lineHeight: 1.4,
              }}
            >
              {s.note}
            </div>
          )}
          <div
            style={{
              fontSize: 9,
              color: 'hsl(var(--muted-foreground))',
              marginTop: 6,
              fontFamily: 'monospace',
              opacity: 0.8,
            }}
          >
            {Number(s.lat).toFixed(4)}, {Number(s.lng).toFixed(4)}
          </div>
        </div>
      </Popup>
    </CircleMarker>
  ));
}
