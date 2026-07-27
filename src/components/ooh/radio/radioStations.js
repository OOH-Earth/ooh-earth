// Curated radio signals — news + ad-free / non-commercial music.
// All stream URLs verified working via radio-browser.info API (Jan 2026).
// SomaFM streams updated to ice5/ice6 servers (ice1 is deprecated).
export const RADIO_STATIONS = [
  // ── NEWS ───────────────────────────────────────────────
  { id: "npr-news", name: "NPR News 24h", genre: "Global News", category: "news", stream: "http://npr-ice.streamguys1.com/live.mp3", city: "Washington", country: "USA", lat: 38.9072, lng: -77.0369 },
  { id: "bbc-world", name: "BBC World Service", genre: "Global News", category: "news", stream: "http://stream.live.vc.bbcmedia.co.uk/bbc_world_service", city: "London", country: "UK", lat: 51.5074, lng: -0.1278 },
  { id: "cnn", name: "CNN", genre: "Global News", category: "news", stream: "https://tunein.cdnstream1.com/2868_96.mp3", city: "Atlanta", country: "USA", lat: 33.749, lng: -84.388 },
  { id: "fox-news", name: "Fox News Radio", genre: "News · Politics", category: "news", stream: "https://live.amperwave.net/direct/foxnewsradio-foxnewsradioaac-imc?source=fnr.web", city: "New York", country: "USA", lat: 40.7128, lng: -74.006 },
  { id: "dlf", name: "Deutschlandfunk", genre: "Culture · Public", category: "news", stream: "https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3?aggregator=web", city: "Berlin", country: "Germany", lat: 52.4803, lng: 13.3348 },
  { id: "europe1", name: "Europe 1", genre: "News · Talk", category: "news", stream: "https://stream.europe1.fr/europe1.aac", city: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  { id: "radio-popolare", name: "Radio Popolare", genre: "Independent News", category: "news", stream: "http://livex.radiopopolare.it/radiopop", city: "Milan", country: "Italy", lat: 45.4642, lng: 9.19 },

  // ── MUSIC (non-commercial / ad-free) ───────────────────
  { id: "kexp", name: "KEXP 90.3", genre: "Independent · FM", category: "music", stream: "https://kexp-mp3-128.streamguys1.com/kexp128.mp3", city: "Seattle", country: "USA", lat: 47.6062, lng: -122.3321 },
  { id: "wwoz", name: "WWOZ 90.7 FM", genre: "Jazz · Heritage", category: "music", stream: "http://wwoz-sc.streamguys.com/wwoz-hi.mp3", city: "New Orleans", country: "USA", lat: 29.9511, lng: -90.0715 },
  { id: "rp-main", name: "Radio Paradise", genre: "Eclectic · Mix", category: "music", stream: "http://stream-uk1.radioparadise.com/aac-320", city: "Paradise", country: "USA", lat: 40.785, lng: -124.184 },
  { id: "rp-mellow", name: "RP Mellow Mix", genre: "Eclectic · Mellow", category: "music", stream: "http://stream.radioparadise.com/mellow-320", city: "Paradise", country: "USA", lat: 40.785, lng: -124.184 },
  { id: "rp-rock", name: "RP Rock Mix", genre: "Eclectic · Rock", category: "music", stream: "http://stream.radioparadise.com/rock-320", city: "Paradise", country: "USA", lat: 40.785, lng: -124.184 },
  { id: "ambient-modern", name: "Ambient Modern", genre: "Ambient · Chillout", category: "music", stream: "http://radio.stereoscenic.com/mod-h", city: "Online", country: "USA", lat: 37.7749, lng: -122.4194 },
  { id: "ambient-sleep", name: "Ambient Sleeping Pill", genre: "Ambient · Sleep", category: "music", stream: "http://radio.stereoscenic.com/asp-h", city: "Ohio", country: "USA", lat: 40.4173, lng: -82.9071 },
  { id: "deep-house", name: "Deep House Lounge", genre: "Deep House · Lounge", category: "music", stream: "http://198.15.94.34:8006/stream", city: "Philadelphia", country: "USA", lat: 39.9526, lng: -75.1652 },
  { id: "jazz-blues", name: "Jazz Radio Blues", genre: "Jazz · Blues", category: "music", stream: "http://jazzblues.ice.infomaniak.ch/jazzblues-high.mp3", city: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  { id: "classic-vinyl", name: "Classic Vinyl HD", genre: "Big Band · Lounge", category: "music", stream: "https://icecast.walmradio.com:8443/classic", city: "New York", country: "USA", lat: 40.7517, lng: -73.9754 },
  { id: "jazz-underground", name: "Jazz Underground", genre: "Jazz · Avant-garde", category: "music", stream: "https://icecast.walmradio.com:8443/jazz", city: "New York", country: "USA", lat: 40.7517, lng: -73.9754 },

  // ── SomaFM (ad-free internet radio, San Francisco) ─────
  { id: "groove-salad", name: "Groove Salad", genre: "Ambient · Electronic", category: "music", stream: "https://ice5.somafm.com/groovesalad-128-mp3", city: "San Francisco", country: "USA", lat: 37.8098, lng: -121.2863 },
  { id: "drone-zone", name: "Drone Zone", genre: "Ambient · Drone", category: "music", stream: "https://ice5.somafm.com/dronezone-128-mp3", city: "San Francisco", country: "USA", lat: 37.8098, lng: -121.2863 },
  { id: "space-station", name: "Space Station", genre: "Electronic · Space", category: "music", stream: "https://ice5.somafm.com/spacestation-128-mp3", city: "San Francisco", country: "USA", lat: 37.8098, lng: -121.2863 },
  { id: "secret-agent", name: "Secret Agent", genre: "Downtempo · Lounge", category: "music", stream: "https://ice5.somafm.com/secretagent-128-mp3", city: "San Francisco", country: "USA", lat: 37.8098, lng: -121.2863 },
  { id: "deep-space-one", name: "Deep Space One", genre: "Ambient · Deep", category: "music", stream: "https://ice5.somafm.com/deepspaceone-128-mp3", city: "San Francisco", country: "USA", lat: 37.8098, lng: -121.2863 },
];