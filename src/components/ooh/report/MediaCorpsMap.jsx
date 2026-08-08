import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import { OOH_MEDIA_CORPS } from "@/components/ooh/report/oohMediaCorps";
import { useMapStyle } from "@/lib/mapStyleContext";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const TILE_LAYERS = {
  dark: { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", attr: '&copy; OpenStreetMap &copy; CARTO' },
  light: { url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", attr: '&copy; OpenStreetMap &copy; CARTO' },
  voyager: { url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", attr: '&copy; OpenStreetMap &copy; CARTO' },
  satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attr: '&copy; Esri' },
  matrix: { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", attr: '&copy; OpenStreetMap &copy; CARTO' },
};

function corpIcon(scope, isSelected) {
  const color = scope === "global" ? "#EDFF00" : scope === "regional" ? "#FF5C00" : "#B2B2B2";
  const size = isSelected ? 20 : 14;
  return L.divIcon({
    className: "ooh-media-corp-pin",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #000;box-shadow:0 0 ${isSelected ? 16 : 8}px ${color}${isSelected ? "cc" : "80"};${isSelected ? "animation:ooh-pinpulse 1.5s ease-out infinite;" : ""}"></div>`,
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

export default function MediaCorpsMap({ filterScope, selected, onSelect }) {
  const { style } = useMapStyle();
  const tile = TILE_LAYERS[style?.id] || TILE_LAYERS.dark;
  const corps = filterScope === "all" ? OOH_MEDIA_CORPS : OOH_MEDIA_CORPS.filter((c) => c.scope === filterScope);

  return (
    <MapContainer center={[25, 10]} zoom={2} minZoom={2} worldCopyJump className="h-full w-full" style={{ background: "#0a0a0a" }}>
      <TileLayer url={tile.url} attribution={tile.attr} />
      <FlyTo target={selected} />
      {corps.map((corp) => (
        <Marker
          key={corp.name}
          position={[corp.lat, corp.lng]}
          icon={corpIcon(corp.scope, selected?.name === corp.name)}
          eventHandlers={{ click: () => onSelect?.(corp) }}
        >
          <Popup>
            <div className="min-w-[180px]">
              <div className="font-bold text-sm" style={{ color: "#EDFF00" }}>{corp.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">{corp.hq}</div>
              <div className="text-[10px] text-gray-500 mt-1.5">{corp.scope} · {corp.countries || 0} countries</div>
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