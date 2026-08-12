// @ts-nocheck -- intentionally excluded from typecheck (jsconfig.json), see TECHNICAL_DEBT_REGISTER.md
// ─────────────────────────────────────────────────────────────
// OOH RADIO — Ops integration config (self-hosted AzuraCast engine)
//
// Single control point. Until AZURACAST_BASE + OOH_STREAM_URL are set,
// RADIO_OPS_ENABLED stays false and NOTHING appears in the app:
//   • the OOH broadcast channel stays hidden from the player list
//   • now-playing polling is off
//   • /radio-ops shows a clean "not connected" state
//
// TO GO LIVE: paste your AzuraCast base URL + station listen URL below.
// Full setup: OOH-Radio-Ops-Plan.md
// ─────────────────────────────────────────────────────────────

// e.g. "https://radio.ooh.earth"  (no trailing slash)
export const AZURACAST_BASE = '';

// AzuraCast station shortcode (Station → Profile → "URL Stub")
export const OOH_SHORTCODE = 'ooh';

// e.g. "https://radio.ooh.earth/listen/ooh/radio.mp3"
export const OOH_STREAM_URL = '';

// Derived: the OOH channel is live only once a stream URL is set.
export const RADIO_OPS_ENABLED = Boolean(OOH_STREAM_URL);

// The OOH broadcast channel, shaped exactly like a RADIO_STATIONS entry
// so the existing player treats it as just another station.
export const OOH_STATION = {
  id: 'ooh-radio',
  name: 'OOH Radio',
  genre: 'Ad-Free Broadcast',
  category: 'ooh',
  stream: OOH_STREAM_URL,
  city: 'Everywhere',
  country: 'Global',
  lat: 51.5074,
  lng: -0.1278,
};

const trimBase = () => AZURACAST_BASE.replace(/\/$/, '');

// AzuraCast now-playing endpoint for the OOH station.
export function nowPlayingUrl() {
  if (!AZURACAST_BASE) return null;
  return `${trimBase()}/api/nowplaying/${OOH_SHORTCODE}`;
}

// Deep link to the AzuraCast admin dashboard (the real CMS).
export function azuracastAdminUrl() {
  if (!AZURACAST_BASE) return null;
  return `${trimBase()}/`;
}

// Fetch + normalise the AzuraCast now-playing payload into a small, stable
// shape for the UI. Returns null on any failure (offline / CORS / not set).
export async function fetchNowPlaying(signal) {
  const url = nowPlayingUrl();
  if (!url) return null;
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const data = await res.json();
    const np = Array.isArray(data) ? data[0] : data;
    if (!np) return null;
    const song = np.now_playing?.song || {};
    const joined = [song.artist, song.title].filter(Boolean).join(' — ');
    return {
      title: song.title || '',
      artist: song.artist || '',
      text: song.text || joined,
      art: song.art || '',
      elapsed: np.now_playing?.elapsed ?? 0,
      duration: np.now_playing?.duration ?? 0,
      isLive: Boolean(np.live?.is_live),
      streamerName: np.live?.is_live ? np.live?.streamer_name || 'Live DJ' : '',
      listeners: np.listeners?.current ?? 0,
      playingNext: np.playing_next?.song?.text || '',
      recentHistory: Array.isArray(np.song_history)
        ? np.song_history.slice(0, 6).map((h) => ({
            text: h.song?.text || [h.song?.artist, h.song?.title].filter(Boolean).join(' — '),
            art: h.song?.art || '',
          }))
        : [],
      stationName: np.station?.name || 'OOH Radio',
    };
  } catch {
    return null;
  }
}
