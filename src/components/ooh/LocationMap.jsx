import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pinIcon = L.divIcon({
  className: "ooh-pin",
  html: `<span style="display:block;width:14px;height:14px;border-radius:50%;background:#EDFF00;border:1px solid #000;box-shadow:0 0 0 3px rgba(237,255,0,0.22),0 0 12px rgba(237,255,0,0.55)"></span>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -8],
});

function FitBounds({ markers }) {
  const map = useMap();
  useEffect(() => {
    if (!markers.length) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 });
  }, [markers, map]);
  return null;
}

export default function LocationMap({ markers }) {
  const pins = useMemo(
    () => markers.filter((m) => isFinite(m.lat) && isFinite(m.lng)),
    [markers]
  );

  return (
    <MapContainer
      center={[13.746, 100.55]}
      zoom={13}
      scrollWheelZoom
      className="h-full w-full bg-void"
      style={{ background: "#000" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
      />
      <FitBounds markers={pins} />
      {pins.map((m, i) => (
        <Marker key={m.id || i} position={[m.lat, m.lng]} icon={pinIcon}>
          <Popup>
            <div style={{ width: 200, fontFamily: "Inter Tight, sans-serif" }}>
              {m.image && (
                <img
                  src={m.image}
                  alt={m.title}
                  style={{ width: "100%", height: 96, objectFit: "cover", display: "block", background: "#111" }}
                />
              )}
              <div style={{ padding: "8px 2px 2px" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#F1F1F1", lineHeight: 1.2 }}>{m.title}</div>
                <div style={{ fontSize: 11, color: "#999", marginTop: 4, lineHeight: 1.35 }}>{m.address}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: m.status === "verified" ? "#39FF14" : m.status === "pending" ? "#FF5C00" : "#999" }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: "currentColor" }} />
                  {m.status || "field report"}
                </div>
                {m.link && (
                  <a href={m.link} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 8, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: "#EDFF00", textDecoration: "none" }}>
                    View on OOH.EARTH ↗
                  </a>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}