import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";

// Shared data hook — fetches mushroom foraging hotspot data via LLM web search.
// Used by both the Leaflet MushroomLayer and the MapLibre GlobeLayerManager.
export function useMushroomData() {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt:
            "Return 12 well-known mushroom foraging hotspots around the world, focusing on regions with active foraging communities. Include locations from Thailand, UK, Pacific Northwest USA, Japan, Eastern Europe, and Scandinavia. For each, provide: species commonly found (comma-separated), the habitat type (forest, grassland, etc.), a short note (max 100 chars), latitude, longitude, and the nearest city or region name.",
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
                    habitat: { type: "string" },
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