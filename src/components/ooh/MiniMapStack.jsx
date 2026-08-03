import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";
import { useMapStyle } from "@/lib/mapStyleContext";
import { base44 } from "@/api/base44Client";
import { ArrowUpRight, Map as MapIcon, Loader2 } from "lucide-react";

const TYPE_LABEL = {
  billboard: "Billboard",
  digital: "Digital",
  painted: "Painted",
  projection: "Projection",
  sticker: "Sticker",
  mural: "Mural",
  other: "Other",
};

const pinIcon = L.divIcon({
  className: "ooh-pin",
  html: `<span style="display:block;width:9px;height:9px;border-radius:50%;background:#EDFF00;border:1px solid #000;box-shadow:0 0 0 2px rgba(237,255,0,0.2),0 0 8px rgba(237,255,0,0.5)"></span>`,
  iconSize: [9, 9],
  iconAnchor: [4.5, 4.5],
  popupAnchor: [0, -6],
});

function FitBounds({ markers }) {
  const map = useMap();
  useEffect(() => {
    if (!markers.length) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 14 });
  }, [markers, map]);
  return null;
}

export default function MiniMapStack() {
  const { style } = useMapStyle();
  const [items, setItems] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const recs = await base44.entities.Location.list("-created_date", 8);
        if (!cancelled) {
          const list = (recs || []).filter((r) => r.status !== "rejected" && isFinite(r.lat) && isFinite(r.lng));
          setItems(list.length ? list : []);
        }
      } catch (e) {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const markers = useMemo(() => items || [], [items]);

  return (
    <section className="border-t border-slate2/60 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// live field map</span>
            <h2 className="mt-3 font-display text-3xl font-black uppercase tracking-tight text-silver md:text-5xl">
              The terrain, <span className="text-ozone text-glow-ozone">now</span>
            </h2>
            <p className="mt-3 max-w-md font-body text-sm text-darkgray">A live cross-section of documented advertising offenses, streamed straight from the field.</p>
          </div>
          <Link
            to="/map"
            className="group flex items-center gap-2 border border-slate2 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-silver transition-colors hover:border-ozone hover:text-ozone"
          >
            <MapIcon className="h-3.5 w-3.5" /> Open full map
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {!items ? (
          <div className="flex h-64 items-center justify-center border border-slate2/60 bg-card">
            <Loader2 className="h-5 w-5 animate-spin text-ozone" />
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <div className="relative h-[320px] border border-slate2/60 bg-card md:h-[420px]">
              <MapContainer
                center={[13.746, 100.55]}
                zoom={12}
                zoomControl={false}
                attributionControl={false}
                className={`h-full w-full ${style.tint ? "ooh-map-style-matrix" : ""}`}
                style={{ background: style.bg }}
              >
                <TileLayer
                  attribution={style.attribution}
                  url={style.url}
                  subdomains={style.subdomains || "abc"}
                  maxZoom={style.maxZoom}
                />
                <FitBounds markers={markers} />
                {markers.map((m, i) => (
                  <Marker key={m.id || i} position={[m.lat, m.lng]} icon={pinIcon}>
                    <Popup>
                      <div style={{ fontFamily: "Inter Tight, sans-serif", minWidth: 160 }}>
                        <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 700, color: "#EDFF00" }}>
                          {TYPE_LABEL[m.type] || m.type}
                        </span>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "hsl(var(--foreground))", marginTop: 2 }}>{m.title}</div>
                        {m.address && <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginTop: 2 }}>{m.address}</div>}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
              <div className="pointer-events-none absolute left-3 top-3 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">
                // {markers.length} logged
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              {markers.slice(0, 5).map((m, i) => (
                <Link
                  key={m.id}
                  to="/map"
                  className="group flex items-center gap-3 border border-slate2/60 bg-card p-3 transition-colors hover:border-ozone"
                  style={{ transform: `translateX(${i * 6}px)` }}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-slate2/60 font-mono text-[10px] text-dim group-hover:border-ozone group-hover:text-ozone">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ozone">{TYPE_LABEL[m.type] || m.type}</span>
                      <span className={`h-1.5 w-1.5 rounded-full ${m.status === "verified" ? "bg-[#39FF14]" : "bg-flare"}`} />
                    </span>
                    <span className="mt-0.5 block truncate font-display text-sm font-bold text-silver">{m.title}</span>
                    {m.address && <span className="block truncate font-mono text-[10px] text-dim">{m.address}</span>}
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-dim transition-colors group-hover:text-ozone" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}