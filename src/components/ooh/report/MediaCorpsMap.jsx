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

// Pin size scales logarithmically with panel count — 0 panels = 8px, 1M+ = 24px
function panelSize(panels) {
  if (!panels || panels <= 0) return 8;
  return Math.min(24, Math.max(8, Math.round(Math.log10(panels + 1) * 3.2)));
}

function corpIcon(corp, isSelected) {
  const color = corp.scope === "global" ? "#EDFF00" : corp.scope === "regional" ? "#FF5C00" : "#B2B2B2";
  const size = isSelected ? panelSize(corp.panels) + 8 : panelSize(corp.panels);
  const ringSize = isSelected ? 3 : 2;
  return L.divIcon({
    className: "ooh-media-corp-pin",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${ringSize}px solid #000;box-shadow:0 0 ${isSelected ? 18 : 10}px ${color}${isSelected ? "cc" : "70"};${isSelected ? "animation:ooh-pinpulse 1.5s ease-out infinite;" : ""}"></div>${corp.panels > 0 ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:${Math.max(7, size * 0.35)}px;font-weight:700;color:#000;font-family:monospace;line-height:1;pointer-events:none;">${corp.panels >= 1000000 ? (corp.panels / 1000000).toFixed(1) + "M" : corp.panels >= 1000 ? Math.round(corp.panels / 1000) + "K" : ""}</div>` : ""}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
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

export default function MediaCorpsMap({ corps, selected, onSelect }) {
  const { style } = useMapStyle();
  const tile = TILE_LAYERS[style?.id] || TILE_LAYERS.dark;
  const list = corps || [];

  return (
    <MapContainer center={[25, 10]} zoom={2} minZoom={2} worldCopyJump className="h-full w-full" style={{ background: "#0a0a0a" }}>
      <TileLayer url={tile.url} attribution={tile.attr} />
      <FlyTo target={selected} />
      {list.map((corp) => (
        <Marker
          key={corp.id || corp.name}
          position={[corp.lat, corp.lng]}
          icon={corpIcon(corp, selected?.name === corp.name)}
          eventHandlers={{ click: () => onSelect?.(corp) }}
        >
          <Popup>
            <div className="min-w-[200px]">
              <div className="font-bold text-sm" style={{ color: "#EDFF00" }}>{corp.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">{corp.hq}</div>
              <div className="text-[10px] text-gray-500 mt-1.5">
                {corp.scope} · {corp.countries || 0} countries
                {corp.panels > 0 && ` · ${corp.panels >= 1000000 ? (corp.panels / 1000000).toFixed(1) + "M" : corp.panels.toLocaleString()} panels`}
              </div>
              {corp.parent && <div className="text-[9px] text-gray-600 mt-1">{corp.parent}</div>}
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