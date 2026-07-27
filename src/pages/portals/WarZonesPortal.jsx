import { useState, useMemo } from "react";
import PortalShell from "@/components/ooh/map/PortalShell";
import LayerResultCard from "@/components/ooh/map/LayerResultCard";
import { useWarZoneData } from "@/components/ooh/map/layers/useWarZoneData";

export default function WarZonesPortal() {
  const { zones, loading } = useWarZoneData();
  const [query, setQuery] = useState("");
  const [filterValue, setFilterValue] = useState("all");

  const filterTags = useMemo(() => {
    const critical = zones.filter((z) => z.severity === "critical").length;
    const advisory = zones.filter((z) => z.severity !== "critical").length;
    return [
      { value: "all", label: "All", count: zones.length },
      { value: "critical", label: "Critical", count: critical },
      { value: "advisory", label: "Advisory", count: advisory },
    ];
  }, [zones]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return zones.filter((z) =>
      (filterValue === "all" || (filterValue === "critical" ? z.severity === "critical" : z.severity !== "critical")) &&
      (!q || `${z.title} ${z.region} ${z.advisory} ${z.source || ""}`.toLowerCase().includes(q))
    );
  }, [zones, filterValue, query]);

  const mapMarkers = zones.map((z, i) => ({ id: `war-${i}`, lat: z.lat, lng: z.lng }));

  return (
    <PortalShell
      title="War Zones · Conflict"
      accent="#FF0040"
      activeLayers={["war"]}
      markers={mapMarkers}
      results={results}
      loading={loading}
      query={query}
      setQuery={setQuery}
      filterTags={filterTags}
      filterValue={filterValue}
      onFilterChange={setFilterValue}
      renderCard={(item, i) => (
        <LayerResultCard key={`war-${i}`} item={item} layer="war" />
      )}
    />
  );
}