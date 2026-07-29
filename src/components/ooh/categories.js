// Canonical surface-type taxonomy for the category directories.
// The physical "what" (billboard / digital / transit / …) — distinct from the
// nine offense categories (the "why", see OffenseCategories.jsx).
// Bus Stops is its own richer dataset (busStops.js) with a dedicated page;
// every other type is a slice of the Location record (live entity + mapSeed fallback).
import {
  BusFront, RectangleHorizontal, MonitorPlay, Paintbrush2,
  Lightbulb, Palette, Sticker, Shapes,
} from "lucide-react";
import MAP_SEED from "@/components/ooh/mapSeed";
import { BUS_STOPS } from "@/components/ooh/busStops";

export const CATEGORIES = [
  { slug: "bus-stops",  label: "Bus Stops",  type: "bus-stop",   to: "/bus-stops",           dedicated: true, icon: BusFront,
    blurb: "Accessible bus-stop ad panels — shelters and poles, mapped from the public accessible-stops record." },
  { slug: "billboard",  label: "Billboards", type: "billboard",  to: "/category/billboard",  icon: RectangleHorizontal,
    blurb: "Large-format static boards — the classic corporate takeover of the skyline." },
  { slug: "digital",    label: "Digital",    type: "digital",    to: "/category/digital",    icon: MonitorPlay,
    blurb: "Illuminated digital screens — always on, energy-hungry, watching back." },
  { slug: "transit",    label: "Transit",    type: "transit",    to: "/category/transit",    icon: BusFront,
    blurb: "Transit shelters and street-furniture ad faces along the public right of way." },
  { slug: "painted",    label: "Painted",    type: "painted",    to: "/category/painted",    icon: Paintbrush2,
    blurb: "Hand-painted walls and takeovers — and the reclaim actions that answer them." },
  { slug: "projection", label: "Projection", type: "projection", to: "/category/projection", icon: Lightbulb,
    blurb: "Guerrilla light projections onto civic surfaces." },
  { slug: "mural",      label: "Mural",      type: "mural",      to: "/category/mural",      icon: Palette,
    blurb: "Mural-scale street art and reclaimed wall space." },
  { slug: "sticker",    label: "Sticker",    type: "sticker",    to: "/category/sticker",    icon: Sticker,
    blurb: "Sticker-scale interventions and subvertising." },
  { slug: "other",      label: "Other",      type: "other",      to: "/category/other",      icon: Shapes,
    blurb: "Everything else on the public record — phoneboxes, odd surfaces, unclassified sites." },
];

export const catBySlug = (slug) => CATEGORIES.find((c) => c.slug === slug) || null;

// Seed-based count (a floor; live Location data augments it at runtime).
export function seedCount(type) {
  if (type === "bus-stop") return BUS_STOPS.length;
  return MAP_SEED.filter((x) => (x.type || "other") === type).length;
}
