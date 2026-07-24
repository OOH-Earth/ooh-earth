import { Marker, Tooltip } from "react-leaflet";
import L from "leaflet";

// Dashed "future" marker — ozone + flare rings, FUT glyph. Non-clustering,
// rendered as a separate layer so they read as roadmap placeholders, not live spots.
const futureIcon = L.divIcon({
  className: "ooh-pin ooh-pin--future",
  html: `<div style="position:relative;width:34px;height:34px"><span style="position:absolute;inset:-6px;border-radius:50%;border:1px dashed rgba(237,255,0,0.5)"></span><span style="position:absolute;inset:2px;border-radius:50%;border:1px dashed rgba(255,92,0,0.55)"></span><span style="position:relative;display:flex;width:34px;height:34px;border-radius:50%;background:rgba(10,10,10,0.75);border:1px solid #EDFF00;box-shadow:0 0 10px rgba(237,255,0,0.28);align-items:center;justify-content:center"><span style="font-family:'Inter Tight',monospace;font-weight:700;font-size:8px;color:#EDFF00;letter-spacing:0.1em">FUT</span></span></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  tooltipAnchor: [0, -16],
});

export default function FutureLayer({ futures }) {
  if (!futures?.length) return null;
  return futures.map((f, i) => (
    <Marker key={f.id || i} position={[f.lat, f.lng]} icon={futureIcon} zIndexOffset={-100}>
      <Tooltip direction="top" offset={[0, -14]} opacity={1}>
        <div style={{ fontFamily: "'Inter Tight', sans-serif", minWidth: 120 }}>
          <div style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "#FF5C00", fontWeight: 700 }}>Future · {f.phase}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#EDFF00", marginTop: 2 }}>{f.city}, {f.country}</div>
          <div style={{ fontSize: 10, color: "#B2B2B2", marginTop: 2 }}>{f.pillar}</div>
        </div>
      </Tooltip>
    </Marker>
  ));
}