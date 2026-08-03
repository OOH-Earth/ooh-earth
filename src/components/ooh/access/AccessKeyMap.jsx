import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useMapStyle } from "@/lib/mapStyleContext";

const STOP_ICON = L.divIcon({
  className: "ooh-akey-pin",
  html: `<span style="display:flex;width:18px;height:18px;border-radius:50%;background:#EDFF00;border:1.5px solid #000;box-shadow:0 0 0 2px rgba(237,255,0,0.18),0 0 10px rgba(237,255,0,0.5);align-items:center;justify-content:center"><svg viewBox="0 0 24 24" width="9" height="9" fill="none"><rect x="5" y="4" width="14" height="11" rx="2" fill="#000"/><rect x="7" y="6" width="10" height="3" fill="#EDFF00"/><circle cx="9" cy="17" r="1.4" fill="#000"/><circle cx="15" cy="17" r="1.4" fill="#000"/></svg></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -10],
});

function FitBounds({ stops }) {
  const map = useMap();
  const did = useRef(false);
  useEffect(() => {
    if (did.current || !stops.length) return;
    did.current = true;
    const b = L.latLngBounds(stops.map((s) => [s.lat, s.lng]));
    map.fitBounds(b, { padding: [40, 40], maxZoom: 15 });
  }, [stops, map]);
  return null;
}

export default function AccessKeyMap({ stops }) {
  const { style } = useMapStyle();
  if (!stops.length) return null;
  return (
    <MapContainer
      center={[51.47, -0.1]}
      zoom={12}
      scrollWheelZoom={false}
      className={`h-full w-full ${style.tint ? "ooh-map-style-matrix" : ""}`}
      style={{ background: style.bg }}
    >
      <TileLayer
        attribution={style.attribution}
        url={style.url}
        subdomains={style.subdomains || "abc"}
        maxZoom={style.maxZoom}
      />
      <FitBounds stops={stops} />
      {stops.map((s) => (
        <Marker key={s.id} position={[s.lat, s.lng]} icon={STOP_ICON}>
          <Popup>
            <div style={{ fontFamily: "Inter Tight, sans-serif", minWidth: 160 }}>
              <div style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "#EDFF00" }}>
                Bus shelter · {s.facing}
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#fff", marginTop: 4, lineHeight: 1.25 }}>{s.name}</div>
              <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 4, fontFamily: "monospace" }}>
                {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
              </div>
              <Link
                to={`/bus-stop/${s.id}`}
                style={{
                  fontSize: 9,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "#EDFF00",
                  textDecoration: "none",
                  marginTop: 6,
                  display: "inline-block",
                }}
              >
                Stop page ↗
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}