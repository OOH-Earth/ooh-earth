import { useEffect, useState, useRef } from "react";
import { CircleMarker, Tooltip, Popup } from "react-leaflet";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Loader2 } from "lucide-react";

// Fetches current conflict zone and humanitarian alert data via LLM web search,
// then renders pulsing red markers at each location with severity + advisory popups.
export default function WarZoneLayer() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt:
            "Return 8 current active conflict zones and humanitarian emergencies around the world. Use real verifiable events from the last 30 days. For each, provide: the conflict or emergency name, the affected region/country, a short advisory note (max 120 chars), the severity level ('critical' for active combat zones, 'warning' for political instability or refugee crises), latitude, longitude, and the source name.",
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              zones: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    region: { type: "string" },
                    advisory: { type: "string" },
                    severity: { type: "string", enum: ["critical", "warning"] },
                    lat: { type: "number" },
                    lng: { type: "number" },
                    source: { type: "string" },
                  },
                  required: ["title", "severity", "lat", "lng"],
                },
              },
            },
            required: ["zones"],
          },
        });
        if (mounted.current) {
          setZones(res?.zones || []);
          setLoading(false);
        }
      } catch {
        if (mounted.current) {
          setZones([]);
          setLoading(false);
        }
      }
    })();
    return () => {
      mounted.current = false;
    };
  }, []);

  if (loading) {
    return (
      <CircleMarker center={[13.746, 100.55]} radius={0} pathOptions={{ opacity: 0 }}>
        <Tooltip permanent direction="center" opacity={0.85}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Inter Tight', sans-serif" }}>
            <Loader2 className="h-3 w-3 animate-spin" style={{ color: "#FF0040" }} />
            <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: "#FF0040", fontWeight: 700 }}>
              Acquiring conflict intel…
            </span>
          </div>
        </Tooltip>
      </CircleMarker>
    );
  }

  return zones.map((z, i) => {
    const critical = z.severity === "critical";
    const color = critical ? "#FF0040" : "#FF5C00";
    return (
      <CircleMarker
        key={`war-${i}`}
        center={[z.lat, z.lng]}
        radius={critical ? 14 : 10}
        pathOptions={{
          color: "#000",
          weight: 2,
          fillColor: color,
          fillOpacity: critical ? 0.55 : 0.4,
        }}
      >
        <Tooltip direction="top" offset={[0, -10]} opacity={0.96}>
          <div style={{ fontFamily: "'Inter Tight', sans-serif", minWidth: 110 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <AlertTriangle size={10} style={{ color }} />
              <span style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color, fontWeight: 700 }}>
                {critical ? "Critical" : "Warning"}
              </span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "hsl(var(--foreground))", marginTop: 2 }}>
              {z.title}
            </div>
            {z.region && (
              <div style={{ fontSize: 9, color: "hsl(var(--muted-foreground))", marginTop: 1 }}>
                {z.region}
              </div>
            )}
          </div>
        </Tooltip>
        <Popup>
          <div style={{ fontFamily: "'Inter Tight', sans-serif", width: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <AlertTriangle size={14} style={{ color }} />
              <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color, fontWeight: 700 }}>
                {critical ? "Critical Zone" : "Advisory"}
              </span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "hsl(var(--foreground))", lineHeight: 1.25 }}>
              {z.title}
            </div>
            {z.region && (
              <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginTop: 3 }}>
                {z.region}
              </div>
            )}
            {z.advisory && (
              <div style={{ fontSize: 10, color: "hsl(var(--foreground))", marginTop: 6, lineHeight: 1.45, opacity: 0.85 }}>
                {z.advisory}
              </div>
            )}
            {z.source && (
              <div style={{ fontSize: 8, color: "hsl(var(--muted-foreground))", marginTop: 8, textTransform: "uppercase", letterSpacing: "0.15em" }}>
                Src: {z.source}
              </div>
            )}
            <div style={{ fontSize: 9, color: "hsl(var(--muted-foreground))", marginTop: 6, fontFamily: "monospace", opacity: 0.8 }}>
              {Number(z.lat).toFixed(4)}, {Number(z.lng).toFixed(4)}
            </div>
          </div>
        </Popup>
      </CircleMarker>
    );
  });
}