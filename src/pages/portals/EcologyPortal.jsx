import { useState, useMemo } from "react";
import PortalShell from "@/components/ooh/map/PortalShell";
import LayerResultCard from "@/components/ooh/map/LayerResultCard";
import { useMushroomData } from "@/components/ooh/map/layers/useMushroomData";
import { useFloraData } from "@/components/ooh/map/layers/useFloraData";

export default function EcologyPortal() {
  const { spots: mushrooms, loading: mushLoading } = useMushroomData();
  const { spots: floraSpots, loading: floraLoading } = useFloraData();
  const [query, setQuery] = useState("");
  const [filterValue, setFilterValue] = useState("all");

  const loading = mushLoading || floraLoading;

  const filterTags = [
    { value: "all", label: "All", count: mushrooms.length + floraSpots.length },
    { value: "mushrooms", label: "Mushrooms", count: mushrooms.length },
    { value: "flora", label: "Flora", count: floraSpots.length },
  ];

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (text) => !q || text.toLowerCase().includes(q);
    const mush = mushrooms
      .filter((s) => matches(`${s.species} ${s.region} ${s.habitat} ${s.note || ""}`))
      .map((s) => ({ ...s, _layer: "mushrooms" }));
    const flor = floraSpots
      .filter((s) => matches(`${s.species} ${s.region} ${s.ecosystem} ${s.note || ""}`))
      .map((s) => ({ ...s, _layer: "flora" }));
    if (filterValue === "mushrooms") return mush;
    if (filterValue === "flora") return flor;
    return [...mush, ...flor];
  }, [mushrooms, floraSpots, filterValue, query]);

  // Pass layer coordinates as markers so the flat map can fit bounds
  const mapMarkers = useMemo(() => [
    ...mushrooms.map((s, i) => ({ id: `mush-${i}`, lat: s.lat, lng: s.lng })),
    ...floraSpots.map((s, i) => ({ id: `flora-${i}`, lat: s.lat, lng: s.lng })),
  ], [mushrooms, floraSpots]);

  return (
    <PortalShell
      title="Ecology"
      accent="#39FF14"
      activeLayers={["mushrooms", "flora"]}
      markers={mapMarkers}
      results={results}
      loading={loading}
      query={query}
      setQuery={setQuery}
      filterTags={filterTags}
      filterValue={filterValue}
      onFilterChange={setFilterValue}
      renderCard={(item, i) => (
        <LayerResultCard key={`eco-${i}`} item={item} layer={item._layer} />
      )}
    />
  );
}