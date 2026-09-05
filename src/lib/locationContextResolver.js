import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { contextEvidenceFor } from '@/lib/locationContextEvidence';

function validCoordinates(location) {
  return (
    Number.isFinite(Number(location?.lat)) &&
    Number.isFinite(Number(location?.lng)) &&
    Number(location.lat) >= -90 &&
    Number(location.lat) <= 90 &&
    Number(location.lng) >= -180 &&
    Number(location.lng) <= 180
  );
}

export function useLocationContext(location) {
  const staticEvidence = contextEvidenceFor(location?.id);
  const enabled = Boolean(location?.id) && !staticEvidence.length && validCoordinates(location);
  return useQuery({
    queryKey: ['location-context', location?.id, location?.lat, location?.lng],
    enabled,
    staleTime: 300_000,
    retry: false,
    queryFn: async () => {
      try {
        const result = await base44.functions.invoke('heritageContext', {
          lat: Number(location.lat),
          lng: Number(location.lng),
        });
        return result && Array.isArray(result.evidence)
          ? result
          : { status: 'unavailable', evidence: [] };
      } catch {
        return { status: 'unavailable', evidence: [] };
      }
    },
  });
}
