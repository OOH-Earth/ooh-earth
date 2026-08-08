const KNOWN_TYPES = ["billboard", "digital", "painted", "projection", "sticker", "mural", "transit", "other"];

export const normType = (t) => {
  const s = String(t || "").toLowerCase().trim();
  if (s === "location") return "other";
  return KNOWN_TYPES.includes(s) ? s : "other";
};

export const toMarker = (r) => ({
  id: r.id,
  title: r.title,
  type: normType(r.type),
  address: r.address || "",
  lat: r.lat,
  lng: r.lng,
  image: r.image_url || null,
  link: r.source_link || "",
  status: r.status || "pending",
  graffiti_medium: r.graffiti_medium || null,
  graffiti_style: r.graffiti_style || null,
  graffiti_surface_m2: r.graffiti_surface_m2 || null,
  graffiti_coverage_pct: r.graffiti_coverage_pct || null,
  adbust_type: r.adbust_type || null,
  brand_name: r.brand_name || null,
  industry_sector: r.industry_sector || null,
  harm_tags: r.harm_tags || null,
  condition: r.condition || null,
  campaign_name: r.campaign_name || null,
  ad_agency: r.ad_agency || null,
  parent_corp: r.parent_corp || null,
  ooh_operator: r.ooh_operator || null,
  adbust_image_url: r.adbust_image_url || null,
});