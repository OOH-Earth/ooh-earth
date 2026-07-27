import { Fragment, useEffect, useMemo, useState } from "react";
import { useMushroomData } from "./layers/useMushroomData";
import { useFloraData } from "./layers/useFloraData";
import { useWarZoneData } from "./layers/useWarZoneData";
import { RIVER_SOURCES, POLLUTION_META } from "./layers/riverData";

const ADS_TYPES = [
  { value: "billboard", label: "Billboard" },
  { value: "digital", label: "Digital" },
  { value: "painted", label: "Painted" },
  { value: "transit", label: "Transit" },
  { value: "projection", label: "Projection" },
  { value: "sticker", label: "Sticker" },
  { value: "mural", label: "Mural" },
  { value: "other", label: "Other" },
];

// --- Tag builders per layer context ---

function adsTags(counts, total) {
  return [
    { value: "all", label: "All", count: total },
    ...ADS_TYPES.filter((t) => (counts[t.value] || 0) > 0).map((t) => ({
      ...t,
      count: counts[t.value],
    })),
  ];
}

function riverTags() {
  const tally = {};
  RIVER_SOURCES.forEach((s) => {
    tally[s.pollution] = (tally[s.pollution] || 0) + 1;
  });
  return [
    { value: "all", label: "All", count: RIVER_SOURCES.length },
    ...Object.keys(POLLUTION_META)
      .map((key) => ({ value: key, label: POLLUTION_META[key].label, count: tally[key] || 0 }))
      .filter((t) => t.count > 0),
  ];
}

function mushroomTags(spots) {
  const tally = {};
  spots.forEach((s) => {
    const r = s.region || "Unknown";
    tally[r] = (tally[r] || 0) + 1;
  });
  return [
    { value: "all", label: "All", count: spots.length },
    ...Object.entries(tally)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([region, count]) => ({ value: region, label: region, count })),
  ];
}

function floraTags(spots) {
  const tally = {};
  spots.forEach((s) => {
    const e = s.ecosystem || "Unknown";
    tally[e] = (tally[e] || 0) + 1;
  });
  return [
    { value: "all", label: "All", count: spots.length },
    ...Object.entries(tally)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([eco, count]) => ({ value: eco, label: eco, count })),
  ];
}

function warTags(zones) {
  const critical = zones.filter((z) => z.severity === "critical").length;
  const advisory = zones.filter((z) => z.severity !== "critical").length;
  return [
    { value: "all", label: "All", count: zones.length },
    { value: "critical", label: "Critical", count: critical },
    { value: "advisory", label: "Advisory", count: advisory },
  ];
}

// Accent colour per layer context
const LAYER_ACCENT = {
  ads: "#EDFF00",
  rivers: "#39FF14",
  mushrooms: "#FF5C00",
  flora: "#39FF14",
  war: "#FF0040",
};

// Priority order for which layer drives the filter bar
const LAYER_PRIORITY = ["ads", "rivers", "mushrooms", "flora", "war"];

export default function DynamicFilterBar({ activeLayers, typeFilter, setTypeFilter, counts = {}, total = 0 }) {
  const { spots: mushrooms } = useMushroomData();
  const { spots: flora } = useFloraData();
  const { zones: warZones } = useWarZoneData();

  const [localFilter, setLocalFilter] = useState("all");

  const primaryLayer = useMemo(
    () => LAYER_PRIORITY.find((l) => activeLayers.includes(l)) || "ads",
    [activeLayers]
  );

  // Reset local filter when the primary layer changes
  useEffect(() => {
    setLocalFilter("all");
  }, [primaryLayer]);

  const tags = useMemo(() => {
    switch (primaryLayer) {
      case "ads": return adsTags(counts, total);
      case "rivers": return riverTags();
      case "mushrooms": return mushroomTags(mushrooms);
      case "flora": return floraTags(flora);
      case "war": return warTags(warZones);
      default: return adsTags(counts, total);
    }
  }, [primaryLayer, counts, total, mushrooms, flora, warZones]);

  const accent = LAYER_ACCENT[primaryLayer] || "#EDFF00";
  const selected = primaryLayer === "ads" ? typeFilter : localFilter;
  const onSelect = primaryLayer === "ads" ? setTypeFilter : setLocalFilter;

  return (
    <div
      data-tour="filters"
      className="atlas-track flex items-center overflow-x-auto px-5 pb-2.5 md:px-8"
    >
      {tags.map((t, i) => {
        const active = selected === t.value;
        return (
          <Fragment key={t.value}>
            {i > 0 && <span className="h-5 w-px shrink-0 bg-slate2/40" />}
            <button
              onClick={() => onSelect(t.value)}
              className={`flex shrink-0 items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${
                active ? "text-void" : "text-darkgray hover:text-silver"
              }`}
              style={active ? { backgroundColor: accent } : {}}
            >
              {t.label}
              <span className={`text-[9px] ${active ? "text-void/70" : "text-dim"}`}>
                {t.count}
              </span>
            </button>
          </Fragment>
        );
      })}
    </div>
  );
}