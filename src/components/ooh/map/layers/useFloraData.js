import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";

// Shared data hook — fetches plant biodiversity / flora hotspot data via LLM web search.
// Focused on wild flora, medicinal plants, and endemic species across study regions.
export function useFloraData() {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt:
            "Return 12 notable plant biodiversity hotspots and flora reserves around the world. Include locations from Thailand, UK, Amazon basin, Mediterranean, South Africa, and Southeast Asia. For each, provide: key plant species found (comma-separated), the ecosystem type (rainforest, grassland, wetland, etc.), a short note (max 100 chars), latitude, longitude, and the nearest city or region name. Focus on wild flora, endemic species, and medicinal plants rather than cultivated gardens.",
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              spots: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    species: { type: "string" },
                    ecosystem: { type: "string" },
                    note: { type: "string" },
                    lat: { type: "number" },
                    lng: { type: "number" },
                    region: { type: "string" },
                  },
                  required: ["species", "lat", "lng"],
                },
              },
            },
            required: ["spots"],
          },
        });
        if (mounted.current) {
          setSpots(res?.spots || []);
          setLoading(false);
        }
      } catch {
        if (mounted.current) {
          setSpots([]);
          setLoading(false);
        }
      }
    })();
    return () => {
      mounted.current = false;
    };
  }, []);

  return { spots, loading };
}