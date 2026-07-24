import { Gamepad2, Layers, Globe2, Instagram, Play, MapPin } from "lucide-react";

export const PLATFORMS = [
  { id: "metaverse_game", label: "Metaverse / In-game", Icon: Gamepad2, accent: "#EDFF00" },
  { id: "ar_layer", label: "AR Layer", Icon: Layers, accent: "#FF5C00" },
  { id: "browser", label: "Browser", Icon: Globe2, accent: "#EDFF00" },
  { id: "social_feed", label: "Social Feed", Icon: Instagram, accent: "#FF5C00" },
  { id: "streaming", label: "Streaming", Icon: Play, accent: "#EDFF00" },
  { id: "other", label: "Other", Icon: MapPin, accent: "#B2B2B2" },
];

export const platformMeta = (id) =>
  PLATFORMS.find((p) => p.id === id) || PLATFORMS.find((p) => p.id === "other");

export const METHODS = [
  { id: "overlay", label: "Overlay" },
  { id: "replace", label: "Replace" },
  { id: "hijack", label: "Hijack" },
  { id: "projection", label: "Projection" },
  { id: "counter", label: "Counter-ad" },
];

// Fallback sample busts used until the database has records.
export const SEED_BUSTS = [
  { platform: "metaverse_game", platform_name: "Roblox", surface: "in-game billboard", target_brand: "Shell", method: "replace", region: "Brookhaven · Sector 4", proof_url: "", notes: "Replaced fossil-fuel promo with #TrueCost counter-ad" },
  { platform: "browser", platform_name: "Chrome", surface: "banner takeover", target_brand: "Coca-Cola", method: "overlay", region: "theguardian.com", proof_url: "" },
  { platform: "social_feed", platform_name: "Instagram", surface: "sponsored post", target_brand: "Nestlé", method: "counter", region: "Reels feed", proof_url: "" },
  { platform: "ar_layer", platform_name: "TikTok AR", surface: "branded lens", target_brand: "Samsung", method: "hijack", region: "Discover", proof_url: "" },
  { platform: "streaming", platform_name: "YouTube", surface: "pre-roll", target_brand: "Unilever", method: "overlay", region: "Doomscroll channel", proof_url: "" },
  { platform: "metaverse_game", platform_name: "Decentraland", surface: "plot billboard", target_brand: "Adidas", method: "replace", region: "(-34,12)", proof_url: "" },
];