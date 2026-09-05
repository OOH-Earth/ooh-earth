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
  const queryInput = {
    lat: Number(location?.lat),
    lng: Number(location?.lng),
  };
  const heritage = useQuery({
    queryKey: ['location-context', 'heritage', location?.id, location?.lat, location?.lng],
    enabled,
    staleTime: 300_000,
    retry: false,
    queryFn: () => invokeContext('heritageContext', queryInput),
  });
  const weather = useQuery({
    queryKey: ['location-context', 'weather', location?.id, location?.lat, location?.lng],
    enabled,
    staleTime: 15 * 60_000,
    retry: false,
    queryFn: () => invokeContext('weatherContext', queryInput),
  });
  const biodiversity = useQuery({
    queryKey: ['location-context', 'biodiversity', location?.id, location?.lat, location?.lng],
    enabled,
    staleTime: 60 * 60_000,
    retry: false,
    queryFn: () => invokeContext('biodiversityContext', queryInput),
  });
  return {
    data: {
      status:
        heritage.data?.status === 'available' ||
        weather.data?.status === 'available' ||
        biodiversity.data?.status === 'available'
          ? 'available'
          : heritage.data?.status === 'empty' &&
              weather.data?.status === 'empty' &&
              biodiversity.data?.status === 'empty'
            ? 'empty'
            : 'unavailable',
      evidence: [
        ...(heritage.data?.evidence || []),
        ...(weather.data?.evidence || []),
        ...(biodiversity.data?.evidence || []),
      ],
    },
    isFetching: heritage.isFetching || weather.isFetching || biodiversity.isFetching,
  };
}

async function invokeContext(functionName, queryInput) {
  try {
    const result = await base44.functions.invoke(functionName, queryInput);
    return result && Array.isArray(result.evidence)
      ? result
      : { status: 'unavailable', evidence: [] };
  } catch {
    return { status: 'unavailable', evidence: [] };
  }
}
