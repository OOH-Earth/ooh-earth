import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";

// Shared data hook — fetches current conflict zone and humanitarian alert data
// via LLM web search. Used by both the Leaflet WarZoneLayer and the MapLibre
// GlobeLayerManager.
export function useWarZoneData() {
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

  return { zones, loading };
}