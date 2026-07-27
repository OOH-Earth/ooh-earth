import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Fetches verified Location records that have field photography,
 * returning them as hero background slides. Subscribes to Location
 * create/update events so new field reports appear live in the hero.
 */
export function useHeroSlides() {
  const [slides, setSlides] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const recs = await base44.entities.Location.filter(
          { status: "verified" },
          "-created_date",
          20
        );
        if (cancelled) return;
        const fieldSlides = (recs || [])
          .filter((r) => r.image_url)
          .map((r) => ({
            src: r.image_url,
            caption: r.title || r.address || "Field dispatch",
          }));
        if (!cancelled) setSlides(fieldSlides);
      } catch {
        // silent — video base layer plays without field photos
      }
    };

    load();

    const unsub = base44.entities.Location.subscribe((event) => {
      if (event.type === "create" || event.type === "update" || event.type === "delete") {
        load();
      }
    });

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, []);

  return slides;
}