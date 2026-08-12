import { useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { getCached } from './layerDataCache';

// Shared data hook — fetches mushroom foraging hotspot data via LLM web search.
// Uses a module-level cache so multiple consumers (Leaflet layer, globe manager,
// filter bar) share a single API call.
export function useMushroomData() {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    getCached('mushrooms', async () => {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:
          'Return 12 well-known mushroom foraging hotspots around the world, focusing on regions with active foraging communities. Include locations from Thailand, UK, Pacific Northwest USA, Japan, Eastern Europe, and Scandinavia. For each, provide: species commonly found (comma-separated), the habitat type (forest, grassland, etc.), a short note (max 100 chars), latitude, longitude, and the nearest city or region name.',
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            spots: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  species: { type: 'string' },
                  habitat: { type: 'string' },
                  note: { type: 'string' },
                  lat: { type: 'number' },
                  lng: { type: 'number' },
                  region: { type: 'string' },
                },
                required: ['species', 'lat', 'lng'],
              },
            },
          },
          required: ['spots'],
        },
      });
      // InvokeLLM's SDK type is `string | object`; response_json_schema
      // above guarantees an object at runtime.
      const data = /** @type {{ spots?: any[] }} */ (res);
      return data?.spots || [];
    })
      .then((data) => {
        if (mounted.current) {
          setSpots(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted.current) {
          setSpots([]);
          setLoading(false);
        }
      });
    return () => {
      mounted.current = false;
    };
  }, []);

  return { spots, loading };
}
