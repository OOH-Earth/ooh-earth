// Curated radio signals — news + ad-free / non-commercial music.
// Each station carries geographic coordinates so it can be rendered as a
// signal beacon on the OOH Earth map (Radio Garden-style).
// category: "news" = journalism / public radio · "music" = ad-free music
export const RADIO_STATIONS = [
  // ── NEWS ───────────────────────────────────────────────
  { id: "npr-news", name: "NPR News 24h", genre: "Global News", category: "news", stream: "https://npr-ice.streamguys1.com/npr-live.mp3", city: "Washington", country: "USA", lat: 38.9072, lng: -77.0369 },
  { id: "bbc-world", name: "BBC World Service", genre: "Global News", category: "news", stream: "https://stream.live.vc.bbcmedia.co.uk/bbc_world_service", city: "London", country: "UK", lat: 51.5074, lng: -0.1278 },
  { id: "rte-radio1", name: "RTÉ Radio 1", genre: "Public News", category: "news", stream: "https://icecast.rte.ie/radio1", city: "Dublin", country: "Ireland", lat: 53.3498, lng: -6.2603 },
  { id: "wnyc", name: "WNYC 93.9 FM", genre: "Public News", category: "news", stream: "https://stream.wnyc.org/wnycfm", city: "New York", country: "USA", lat: 40.7128, lng: -74.006 },
  { id: "abc-news-au", name: "ABC News Australia", genre: "News", category: "news", stream: "https://abc-mp3-128.streamguys1.com/news.mp3", city: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
  { id: "rfi-monde", name: "RFI Monde", genre: "Global News", category: "news", stream: "https://icecast.radiofrance.fr/rfi-monde", city: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  { id: "rnz-news", name: "RNZ National", genre: "Public News", category: "news", stream: "https://rnz-stream-01.streamguys1.com/rnz_mp3", city: "Wellington", country: "NZ", lat: -41.2865, lng: 174.7762 },
  { id: "cspan", name: "C-SPAN Radio", genre: "Civic · Politics", category: "news", stream: "https://playerservices.streamtheworld.com/api/livestream-redirect/CSPANRADIO.mp3", city: "Washington", country: "USA", lat: 38.8951, lng: -77.0364 },

  // ── MUSIC (non-commercial / ad-free FM + internet) ─────
  { id: "kexp", name: "KEXP 90.3", genre: "Independent · FM", category: "music", stream: "https://kexp-mp3-128.streamguys1.com/kexp128.mp3", city: "Seattle", country: "USA", lat: 47.6062, lng: -122.3321 },
  { id: "wwoz", name: "WWOZ 90.7 FM", genre: "Jazz · Heritage", category: "music", stream: "https://wwoz-sc.streamguys1.com/wwoz-hi", city: "New Orleans", country: "USA", lat: 29.9511, lng: -90.0715 },
  { id: "kcrw", name: "KCRW 89.9", genre: "Eclectic · FM", category: "music", stream: "https://kcrw.streamguys1.com/kcrw_192k_mp3", city: "Santa Monica", country: "USA", lat: 34.0195, lng: -118.4912 },
  { id: "wbgo", name: "WBGO 88.3 FM", genre: "Jazz", category: "music", stream: "https://wbgo.streamguys1.com/wbgo", city: "Newark", country: "USA", lat: 40.7357, lng: -74.1724 },
  { id: "wfmu", name: "WFMU 91.1 FM", genre: "Freeform Radio", category: "music", stream: "https://stream0.wfmu.org/freeform-128k", city: "Jersey City", country: "USA", lat: 40.7282, lng: -74.0776 },
  { id: "dublab", name: "dublab", genre: "Eclectic · Independent", category: "music", stream: "https://dublab.out.airtime.pro/dublab_b", city: "Los Angeles", country: "USA", lat: 34.0522, lng: -118.2437 },
  { id: "nts", name: "NTS Radio", genre: "Underground · Eclectic", category: "music", stream: "https://stream-relay-geo.ntslive.net/stream", city: "London", country: "UK", lat: 51.5074, lng: -0.1278 },
  { id: "worldwide-fm", name: "Worldwide FM", genre: "Global Music", category: "music", stream: "https://streamer.radio.co/s24825aa1e/listen", city: "London", country: "UK", lat: 51.5074, lng: -0.1278 },
  { id: "resonance", name: "Resonance FM", genre: "Experimental · Arts", category: "music", stream: "https://stream.resonancefm.com/", city: "London", country: "UK", lat: 51.5074, lng: -0.1278 },
  { id: "fip", name: "FIP", genre: "Eclectic · Public", category: "music", stream: "https://icecast.radiofrance.fr/fiphifi", city: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  { id: "radio-nova", name: "Radio Nova", genre: "Eclectic · World", category: "music", stream: "https://novazz.ice.infomaniak.ch/novazz-128.mp3", city: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  { id: "tsf-jazz", name: "TSF Jazz", genre: "Jazz", category: "music", stream: "https://tsfjazz.ice.infomaniak.ch/tsfjazz-128.mp3", city: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  { id: "dlf", name: "Deutschlandfunk", genre: "Culture · Public", category: "music", stream: "https://st01.stream-drl.de/dlf/01/high/mp3/stream.mp3", city: "Cologne", country: "Germany", lat: 50.9375, lng: 6.9603 },
  { id: "sr-p3", name: "SR P3", genre: "Pop · Public", category: "music", stream: "https://http-live.sr.se/p3-mp3-192", city: "Stockholm", country: "Sweden", lat: 59.3293, lng: 18.0686 },
  { id: "dr-p3", name: "DR P3", genre: "Pop · Public", category: "music", stream: "https://dr-p3.live-ssl.dr.dk/p3", city: "Copenhagen", country: "Denmark", lat: 55.6761, lng: 12.5683 },
  { id: "triple-j", name: "Triple J", genre: "Independent · Public", category: "music", stream: "https://abc-mj-chch-mp3-128.streamguys1.com/triplej.mp3", city: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
  { id: "rnz-music", name: "RNZ Music", genre: "Eclectic · Public", category: "music", stream: "https://rnz-stream-02.streamguys1.com/rnz_music_mp3", city: "Wellington", country: "NZ", lat: -41.2865, lng: 174.7762 },
  { id: "ckua", name: "CKUA Radio", genre: "Eclectic · Non-profit", category: "music", stream: "https://stream.ckua.com:8000/ckua-256.mp3", city: "Edmonton", country: "Canada", lat: 53.5461, lng: -113.4938 },
  { id: "radio-paradise", name: "Radio Paradise", genre: "Eclectic · Mix", category: "music", stream: "https://stream.radioparadise.com/aac-320", city: "Forest", country: "USA", lat: 37.3, lng: -79.3 },

  // ── SomaFM (ad-free internet radio, San Francisco) ─────
  { id: "groove-salad", name: "Groove Salad", genre: "Ambient · Electronic", category: "music", stream: "https://ice1.somafm.com/groovesalad-128-mp3", city: "San Francisco", country: "USA", lat: 37.7749, lng: -122.4194 },
  { id: "drone-zone", name: "Drone Zone", genre: "Ambient · Drone", category: "music", stream: "https://ice1.somafm.com/dronezone-128-mp3", city: "San Francisco", country: "USA", lat: 37.7749, lng: -122.4194 },
  { id: "space-station", name: "Space Station", genre: "Electronic · Space", category: "music", stream: "https://ice1.somafm.com/spacestation-128-mp3", city: "San Francisco", country: "USA", lat: 37.7749, lng: -122.4194 },
  { id: "secret-agent", name: "Secret Agent", genre: "Downtempo · Lounge", category: "music", stream: "https://ice1.somafm.com/secretagent-128-mp3", city: "San Francisco", country: "USA", lat: 37.7749, lng: -122.4194 },
  { id: "deep-space-one", name: "Deep Space One", genre: "Ambient · Deep", category: "music", stream: "https://ice1.somafm.com/deepspaceone-128-mp3", city: "San Francisco", country: "USA", lat: 37.7749, lng: -122.4194 },
];