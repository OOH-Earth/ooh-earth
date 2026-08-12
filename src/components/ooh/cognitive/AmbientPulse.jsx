import { useEffect, useState } from 'react';

const FALLBACK = { lat: 13.75, lng: 100.5 }; // Bangkok

// WHO PM2.5 breakpoints (µg/m³) → ambient state
function categorize(pm) {
  if (pm == null) return 'calm';
  if (pm <= 15) return 'calm';
  if (pm <= 55) return 'warn';
  return 'hazard';
}

export default function AmbientPulse() {
  const [cat, setCat] = useState('calm');

  useEffect(() => {
    let cancelled = false;

    const fetchAQ = async (lat, lng) => {
      try {
        const r = await fetch(
          `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=pm2_5`,
        );
        const j = await r.json();
        const val = j?.current?.pm2_5 ?? null;
        if (cancelled) return;
        const c = categorize(val);
        setCat(c);
        document.documentElement.dataset.ambient = c;
      } catch {
        /* stay calm */
      }
    };

    const run = () => {
      // Only use geolocation if already granted — never prompt on ambient load.
      if (navigator.permissions?.query) {
        navigator.permissions
          .query({ name: 'geolocation' })
          .then((res) => {
            if (res.state === 'granted' && navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => fetchAQ(pos.coords.latitude, pos.coords.longitude),
                () => fetchAQ(FALLBACK.lat, FALLBACK.lng),
                { timeout: 6000 },
              );
            } else {
              fetchAQ(FALLBACK.lat, FALLBACK.lng);
            }
          })
          .catch(() => fetchAQ(FALLBACK.lat, FALLBACK.lng));
      } else {
        fetchAQ(FALLBACK.lat, FALLBACK.lng);
      }
    };

    run();
    const id = setInterval(run, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const glow =
    cat === 'hazard'
      ? 'rgba(255,92,0,0.12)'
      : cat === 'warn'
        ? 'rgba(237,255,0,0.07)'
        : 'rgba(31,81,255,0.035)';

  return (
    <div
      aria-hidden
      data-cat={cat}
      className="ambient-glow pointer-events-none fixed inset-0 z-30"
      style={{ background: `radial-gradient(circle at 50% 0%, ${glow}, transparent 62%)` }}
    />
  );
}
