// Geographic taxonomy + expansion roadmap for the directories.
//
// Two independent axes — don't conflate them:
//   status  = coverage: how much we've actually mapped        (live | partial | wip | planned)
//   access  = data regime: whether OPEN public data exists     (open | partial | field)
//
// The access axis encodes a real Global North / South asymmetry in the right to
// public space + open data. UK / EU cities have accessible-asset registers, OSM
// coverage, planning portals and FOI — so unit TYPES can be enumerated
// authoritatively. Much of the Global South (e.g. Bangkok) has no public register
// at all: presence is logged by operatives on the ground, and the surface-type
// breakdown is provisional and largely uncovered. We name that rather than paper
// over it — see /regions.
import MAP_SEED from "@/components/ooh/mapSeed";
import { BUS_STOPS } from "@/components/ooh/busStops";

export const REGIONS = [
  { slug: "london", city: "London", country: "United Kingdom", macro: "UK & Ireland",
    status: "live", access: "open", countryDefault: true,
    note: "Open public data — the accessible bus-stop register, OSM, and planning portals let us enumerate unit types authoritatively. The most complete set on the record." },
  { slug: "bangkok", city: "Bangkok", country: "Thailand", macro: "Southeast Asia",
    status: "partial", access: "field", countryDefault: true,
    note: "No open public register of outdoor units. Presence is field-gathered by members; unit types are provisional and largely uncovered. Classification follows the field, not a database." },
  { slug: "bristol", city: "Bristol", country: "United Kingdom", macro: "UK & Ireland",
    status: "wip", access: "open",
    note: "Adfree Cities' home city. Open data available; mapping underway." },
  { slug: "manchester", city: "Manchester", country: "United Kingdom", macro: "UK & Ireland",
    status: "planned", access: "open", note: "Open-data UK city — queued." },
  { slug: "glasgow", city: "Glasgow", country: "United Kingdom", macro: "UK & Ireland",
    status: "planned", access: "open", note: "Open-data UK city — queued." },
  { slug: "paris", city: "Paris", country: "France", macro: "Europe",
    status: "planned", access: "open", note: "Déboulonneurs / Brandalism heritage. Open EU data; queued." },
  { slug: "berlin", city: "Berlin", country: "Germany", macro: "Europe",
    status: "planned", access: "open", note: "Open EU data; queued." },
  { slug: "amsterdam", city: "Amsterdam", country: "Netherlands", macro: "Europe",
    status: "planned", access: "open", note: "Open EU data; queued." },
  { slug: "chiangmai", city: "Chiang Mai", country: "Thailand", macro: "Southeast Asia",
    status: "planned", access: "field", note: "Field-only, like Bangkok — no open register to lean on." },
  { slug: "vancouver", city: "Vancouver", country: "Canada", macro: "North America",
    status: "planned", access: "partial", note: "Adbusters' base. Mixed open data; queued." },
];

export const MACROS = ["UK & Ireland", "Europe", "North America", "Southeast Asia"];

export const REGION_STATUS = {
  live:    { text: "Live",    cls: "border-[#39FF14]/50 text-[#39FF14]" },
  partial: { text: "Partial", cls: "border-[#EDFF00]/50 text-[#EDFF00]" },
  wip:     { text: "WIP",     cls: "border-[#EDFF00]/50 text-[#EDFF00]" },
  planned: { text: "Planned", cls: "border-[#FF5C00]/60 text-[#FF5C00]" },
};

export const REGION_ACCESS = {
  open:    { text: "Open access",    short: "Open",    cls: "border-[#39FF14]/40 text-[#39FF14]",
             note: "Public registers + OSM — unit types are authoritative." },
  partial: { text: "Partial access", short: "Partial", cls: "border-[#EDFF00]/40 text-[#EDFF00]",
             note: "Some open data; the rest is field-gathered." },
  field:   { text: "Field-only",     short: "Field",   cls: "border-[#FF5C00]/50 text-[#FF5C00]",
             note: "No public register — member-gathered; unit types provisional." },
};

export const regionBySlug = (slug) => REGIONS.find((r) => r.slug === slug) || null;

// Bind a location (by its address string) to a region.
// Pass 1: any city name; Pass 2: a country's default region.
export function regionOf(address = "") {
  const a = String(address).toLowerCase();
  for (const r of REGIONS) if (a.includes(r.city.toLowerCase())) return r.slug;
  for (const r of REGIONS) if (r.countryDefault && a.includes(r.country.toLowerCase())) return r.slug;
  return null;
}

// Seed-based count across all surface types for a region (a floor; live data augments).
export function seedRegionCount(slug) {
  let n = MAP_SEED.filter((x) => regionOf(x.address) === slug).length;
  if (slug === "london") n += BUS_STOPS.length;
  return n;
}
