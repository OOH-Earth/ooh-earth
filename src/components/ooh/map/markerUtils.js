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
});