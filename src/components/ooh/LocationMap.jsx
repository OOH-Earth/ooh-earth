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

const selIcon = L.divIcon({
  className: "ooh-pin ooh-pin--sel",
  html: `<span style="display:block;width:20px;height:20px;border-radius:50%;background:#FF5C00;border:2px solid #000;box-shadow:0 0 0 4px rgba(255,92,0,0.25),0 0 16px rgba(255,92,0,0.6)"></span>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

import { thumbHTML, metaFor } from "@/components/ooh/map/LocationThumb";

function FitBounds({ markers }) {
  const map = useMap();
  useEffect(() => {
    if (!markers.length) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 });
  }, [markers, map]);
  return null;
}

function FlyTo({ selectedId, markers }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedId) return;
    const m = markers.find((x) => x.id === selectedId);
    if (m) map.flyTo([m.lat, m.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [selectedId, markers, map]);
  return null;
}

export default function LocationMap({ markers, selectedId, onSelect }) {
  const pins = useMemo(() => markers.filter((m) => isFinite(m.lat) && isFinite(m.lng)), [markers]);

  return (
    <MapContainer
      center={[13.746, 100.55]}
      zoom={13}
      scrollWheelZoom
      className="h-full w-full"
      style={{ background: "#000" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
      />
      <FitBounds markers={pins} />
      <FlyTo selectedId={selectedId} markers={pins} />
      {pins.map((m, i) => (
        <Marker
          key={m.id || i}
          position={[m.lat, m.lng]}
          icon={selectedId === m.id ? selIcon : pinIcon}
          eventHandlers={{ click: () => onSelect?.(m.id) }}
        >
          <Popup>
            <div style={{ width: 220, fontFamily: "Inter Tight, sans-serif" }}>
              <div dangerouslySetInnerHTML={{ __html: thumbHTML(m) }} />
              <div style={{ padding: "10px 2px 2px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 700, color: "#EDFF00" }}>
                    {metaFor(m.type).label}
                  </span>
                  <span
                    style={{ width: 5, height: 5, borderRadius: 999, background: m.status === "verified" ? "#39FF14" : "#FF5C00" }}
                  />
                  <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: "hsl(var(--muted-foreground))" }}>{m.status}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "hsl(var(--foreground))", lineHeight: 1.25 }}>{m.title}</div>
                <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", marginTop: 4, lineHeight: 1.4 }}>{m.address}</div>
                <div style={{ fontSize: 9, color: "hsl(var(--muted-foreground))", marginTop: 4, fontFamily: "monospace", opacity: 0.8 }}>
                  {Number(m.lat).toFixed(4)}, {Number(m.lng).toFixed(4)}
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: "#FF5C00", textDecoration: "none" }}
                  >
                    Directions ↗
                  </a>
                  {m.link && (
                    <a
                      href={m.link}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: "#EDFF00", textDecoration: "none" }}
                    >
                      OOH.EARTH ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}