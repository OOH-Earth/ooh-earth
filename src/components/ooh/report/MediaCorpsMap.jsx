import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
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

function corpIcon(scope) {
  const color = scope === "global" ? "#EDFF00" : scope === "regional" ? "#FF5C00" : "#B2B2B2";
  return L.divIcon({
    className: "ooh-media-corp-pin",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #000;box-shadow:0 0 8px ${color}80;"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export default function MediaCorpsMap({ filterScope, onSelect }) {
  const { style } = useMapStyle();
  const tile = TILE_LAYERS[style?.id] || TILE_LAYERS.dark;
  const corps = filterScope === "all" ? OOH_MEDIA_CORPS : OOH_MEDIA_CORPS.filter((c) => c.scope === filterScope);

  return (
    <MapContainer center={[20, 0]} zoom={2} minZoom={2} worldCopyJump className="h-full w-full" style={{ background: "#0a0a0a" }}>
      <TileLayer url={tile.url} attribution={tile.attr} />
      {corps.map((corp) => (
        <Marker key={corp.name} position={[corp.lat, corp.lng]} icon={corpIcon(corp.scope)} eventHandlers={{ click: () => onSelect?.(corp) }}>
          <Popup>
            <div className="min-w-[200px]">
              <div className="font-bold text-sm" style={{ color: "#EDFF00" }}>{corp.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">{corp.hq}</div>
              <div className="text-xs mt-2" style={{ color: "#ccc" }}>{corp.desc}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {corp.regions.map((r) => (
                  <span key={r} className="text-[9px] px-1.5 py-0.5 border border-gray-600 text-gray-400">{r}</span>
                ))}
              </div>
              {corp.parent && <div className="text-[10px] text-gray-500 mt-2">Parent: {corp.parent}</div>}
              {corp.url && <a href={corp.url} target="_blank" rel="noreferrer" className="text-[10px] text-yellow-400 underline mt-1 inline-block">Visit site →</a>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}