import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import { useMapStyle } from "@/lib/mapStyleContext";

const TILE_LAYERS = {
  dark: { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", attr: '&copy; OpenStreetMap &copy; CARTO' },
  light: { url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", attr: '&copy; OpenStreetMap &copy; CARTO' },
  voyager: { url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", attr: '&copy; OpenStreetMap &copy; CARTO' },
  satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attr: '&copy; Esri' },
  matrix: { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", attr: '&copy; OpenStreetMap &copy; CARTO' },
};

const SCOPE_COLOR = { global: "#EDFF00", regional: "#FF5C00", local: "#B2B2B2" };

function panelLabel(panels) {
  if (!panels || panels <= 0) return "";
  if (panels >= 1000000) return (panels / 1000000).toFixed(1) + "M";
  if (panels >= 1000) return Math.round(panels / 1000) + "K";
  return "";
}

// Teardrop SVG pin: scope-colored, panel count in center, building glyph fallback
function corpIcon(corp, isSelected) {
  const color = SCOPE_COLOR[corp.scope] || SCOPE_COLOR.local;
  const size = isSelected ? 34 : 26;
  const h = Math.round(size * 36 / 28);
  const label = panelLabel(corp.panels);
  const fontSize = isSelected ? 8 : 7;
  const inner = label
    ? `<text x="14" y="18" text-anchor="middle" fill="#000" font-size="${fontSize}" font-weight="700" font-family="monospace">${label}</text>`
    : `<rect x="10" y="10" width="8" height="6" fill="#000"/><rect x="11" y="17" width="2" height="4" fill="#000"/><rect x="15" y="17" width="2" height="4" fill="#000"/>`;
  return L.divIcon({
    className: "ooh-media-corp-pin",
    html: `<svg width="${size}" height="${h}" viewBox="0 0 28 36" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));${isSelected ? "animation:ooh-pinpulse 1.5s ease-out infinite;" : ""}">
      <path d="M14 1C7 1 1 7 1 14c0 8 8 15 13 21 5-6 13-13 13-21C27 7 21 1 14 1z" fill="${color}" stroke="#000" stroke-width="2"${isSelected ? ' stroke="#FF5C00" stroke-width="3"' : ""}/>
      ${inner}
    </svg>`,
    iconSize: [size, h],
    iconAnchor: [size / 2, h - 1],
    popupAnchor: [0, -(h - 4)],
  });
}

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 4), { duration: 1.2 });
    }
  }, [target]);
  return null;
}

function BoundsWatcher({ onBoundsChange }) {
  const map = useMap();
  useEffect(() => {
    const update = () => {
      const b = map.getBounds();
      onBoundsChange?.({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() });
    };
    map.on("moveend", update);
    map.on("zoomend", update);
    update();
    return () => { map.off("moveend", update); map.off("zoomend", update); };
  }, [map, onBoundsChange]);
  return null;
}

export default function MediaCorpsMap({ corps, selected, onSelect, onBoundsChange }) {
  const { style } = useMapStyle();
  const tile = TILE_LAYERS[style?.id] || TILE_LAYERS.dark;
  const list = corps || [];

  return (
    <MapContainer center={[25, 10]} zoom={2} minZoom={2} worldCopyJump className="h-full w-full" style={{ background: "#0a0a0a" }}>
      <TileLayer url={tile.url} attribution={tile.attr} />
      <FlyTo target={selected} />
      <BoundsWatcher onBoundsChange={onBoundsChange} />
      {list.map((corp) => (
        <Marker
          key={corp.id || corp.name}
          position={[corp.lat, corp.lng]}
          icon={corpIcon(corp, selected?.id === corp.id || selected?.name === corp.name)}
          eventHandlers={{ click: () => onSelect?.(corp) }}
        >
          <Popup>
            <div className="min-w-[200px]">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: SCOPE_COLOR[corp.scope] || SCOPE_COLOR.local }} />
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: SCOPE_COLOR[corp.scope] || SCOPE_COLOR.local }}>{corp.scope}</span>
                <span className="font-mono text-[9px] text-gray-500">{corp.countries || 0} countries</span>
              </div>
              <div className="font-bold text-sm mt-1" style={{ color: "#EDFF00" }}>{corp.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">{corp.hq}</div>
              <div className="text-[10px] text-gray-500 mt-1.5">
                {corp.panels > 0 ? `${panelLabel(corp.panels)} panels` : "Infrastructure / software"}
                {corp.parent && ` · ${corp.parent}`}
              </div>
              <button
                onClick={() => onSelect?.(corp)}
                className="mt-2 w-full border border-yellow-500/40 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-yellow-400 hover:bg-yellow-500/10"
              >
                View details →
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}