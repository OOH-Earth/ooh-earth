import { Polyline, Tooltip } from "react-leaflet";
import { RIVERS } from "./riverData";

// Renders major river polylines with a hydrology-green stroke and label tooltip.
export default function RiverLayer() {
  return RIVERS.map((r, i) => (
    <Polyline
      key={`river-${i}`}
      positions={r.coords}
      pathOptions={{
        color: "#39FF14",
        weight: 3,
        opacity: 0.7,
        lineCap: "round",
        lineJoin: "round",
      }}
    >
      <Tooltip sticky direction="top" opacity={0.95}>
        <div style={{ fontFamily: "'Inter Tight', sans-serif", minWidth: 80 }}>
          <div style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "#39FF14", fontWeight: 700 }}>
            Hydrology
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "hsl(var(--foreground))", marginTop: 2 }}>
            {r.name}
          </div>
          <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", marginTop: 1 }}>
            {r.region}
          </div>
        </div>
      </Tooltip>
    </Polyline>
  ));
}