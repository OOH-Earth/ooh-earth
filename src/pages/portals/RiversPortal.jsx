import { useState, useMemo } from "react";
import PortalShell from "@/components/ooh/map/PortalShell";
import LayerResultCard from "@/components/ooh/map/LayerResultCard";
import { RIVER_SOURCES, POLLUTION_META } from "@/components/ooh/map/layers/riverData";

export default function RiversPortal() {
  const [query, setQuery] = useState("");
  const [filterValue, setFilterValue] = useState("all");

  const filterTags = useMemo(() => {
    const tally = {};
    RIVER_SOURCES.forEach((s) => { tally[s.pollution] = (tally[s.pollution] || 0) + 1; });
    return [
      { value: "all", label: "All", count: RIVER_SOURCES.length },
      ...Object.keys(POLLUTION_META)
        .map((key) => ({ value: key, label: POLLUTION_META[key].label, count: tally[key] || 0 }))
        .filter((t) => t.count > 0),
    ];
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RIVER_SOURCES.filter((s) =>
      (filterValue === "all" || s.pollution === filterValue) &&
      (!q || `${s.name} ${s.river} ${s.notes}`.toLowerCase().includes(q))
    );
  }, [filterValue, query]);

  const mapMarkers = RIVER_SOURCES.map((s) => ({ id: s.name, lat: s.lat, lng: s.lng }));

  return (
    <PortalShell
      title="Rivers · Hydrology"
      accent="#1F51FF"
      activeLayers={["rivers"]}
      markers={mapMarkers}
      results={results}
      loading={false}
      query={query}
      setQuery={setQuery}
      filterTags={filterTags}
      filterValue={filterValue}
      onFilterChange={setFilterValue}
      renderCard={(item, i) => (
        <LayerResultCard key={`riv-${i}`} item={item} layer="rivers" />
      )}
    />
  );
}