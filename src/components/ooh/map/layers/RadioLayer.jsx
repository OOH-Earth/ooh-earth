import { CircleMarker, Tooltip } from 'react-leaflet';
import { Radio } from 'lucide-react';
import { useRadio } from '@/lib/radioContext';
import { RADIO_STATIONS } from '@/components/ooh/radio/radioStations';

// Renders radio station signal beacons on the flat Leaflet map. Clicking a
// beacon tunes the global radio player to that station. News = orange,
// music = yellow. Active station pulses with a larger radius.
export default function RadioLayer() {
  const { station, playing, selectStation } = useRadio();

  return RADIO_STATIONS.filter((s) => isFinite(s.lat) && isFinite(s.lng)).map((s) => {
    const isActive = station?.id === s.id && playing;
    const color = s.category === 'news' ? '#FF5C00' : '#EDFF00';
    return (
      <CircleMarker
        key={s.id}
        center={[s.lat, s.lng]}
        radius={isActive ? 11 : 7}
        pathOptions={{
          color: '#000',
          weight: 2,
          fillColor: color,
          fillOpacity: isActive ? 0.9 : 0.55,
        }}
        eventHandlers={{ click: () => selectStation(s.id) }}
      >
        <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
          <div style={{ fontFamily: "'Inter Tight', sans-serif", minWidth: 110 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Radio size={10} style={{ color }} />
              <span
                style={{
                  fontSize: 8,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color,
                  fontWeight: 700,
                }}
              >
                {s.category === 'news' ? 'News Signal' : 'Music Signal'}
              </span>
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'hsl(var(--foreground))',
                marginTop: 2,
              }}
            >
              {s.name}
            </div>
            <div style={{ fontSize: 9, color: 'hsl(var(--muted-foreground))', marginTop: 1 }}>
              {s.city}, {s.country}
            </div>
          </div>
        </Tooltip>
      </CircleMarker>
    );
  });
}
