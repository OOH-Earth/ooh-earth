import { BookOpen, Package, Sparkles } from "lucide-react";
import AtlasPreview from "./AtlasPreview";
import ThemePreview from "./ThemePreview";
import MetroKitPreview from "./MetroKitPreview";
import CursorPackPreview from "./CursorPackPreview";
import NftDropPreview from "./NftDropPreview";
import PhysicalPreview from "./PhysicalPreview";

export const CAT_META = {
  library: { icon: BookOpen, label: "Library" },
  plugin: { icon: Package, label: "Plugin" },
  uikit: { icon: Package, label: "UI Kit" },
  theme: { icon: Sparkles, label: "Theme" },
  nft: { icon: Sparkles, label: "NFT Drop" },
  physical: { icon: Package, label: "Prototype" },
};

const PREVIEW = {
  library: AtlasPreview,
  theme: ThemePreview,
  uikit: MetroKitPreview,
  plugin: CursorPackPreview,
  nft: NftDropPreview,
  physical: PhysicalPreview,
};

export function priceLabel(item) {
  if (item.status === "free" || Number(item.price_usd) === 0) return "Free";
  if (item.status === "in_build") return "In build";
  if (item.status === "upcoming") return "Upcoming";
  if (item.status === "sold_out") return "Sold out";
  return `$${item.price_usd}`;
}

export function ProductPreview({ item }) {
  const P = PREVIEW[item.category] || AtlasPreview;
  return <P />;
}