// Snapshot of the live oohearth.app/location directory (captured 2026-07).
// Bangkok spots are listed FIRST (prioritised), then London confirmed sites.
// Used as a fallback when the backend can't reach the live feed (the oohearth.app
// directory sits behind SiteGround bot-protection that blocks server-side
// fetches). The moment a JSON feed is published, the map goes live automatically.
// Detail-page data (brand, sub-type, context) is folded into `notes`.

// Branded surface placeholder — a self-contained inline SVG data-URI (Orbital
// Perspective: void grid + reticle + surface label). No external host, so it can
// never 404. Replaces the old stock/legacy media so the map renders clean off
// fixtures whenever the live Location entity is empty (e.g. the stage build).
const tile = (type) => {
  const label = String(type || 'location').toUpperCase();
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'>" +
    "<defs><pattern id='g' width='40' height='40' patternUnits='userSpaceOnUse'>" +
    "<path d='M40 0H0V40' fill='none' stroke='rgba(255,255,255,0.06)' stroke-width='1'/></pattern></defs>" +
    "<rect width='800' height='500' fill='#0A0A0A'/>" +
    "<rect width='800' height='500' fill='url(#g)'/>" +
    "<g fill='none' stroke='#EDFF00' stroke-width='3' opacity='0.85'>" +
    "<path d='M40 70V40H70'/><path d='M730 40H760V70'/><path d='M40 430V460H70'/><path d='M730 460H760V430'/></g>" +
    "<circle cx='400' cy='222' r='30' fill='none' stroke='#EDFF00' stroke-width='2' opacity='0.55'/>" +
    "<path d='M400 186V258M364 222H436' stroke='#EDFF00' stroke-width='2' opacity='0.55'/>" +
    "<text x='400' y='312' text-anchor='middle' font-family='monospace' font-size='24' letter-spacing='6' fill='#EDFF00' opacity='0.85'>" +
    label +
    '</text>' +
    "<text x='400' y='340' text-anchor='middle' font-family='monospace' font-size='12' letter-spacing='4' fill='rgba(255,255,255,0.4)'>OOH \u00b7 EARTH</text>" +
    '</svg>';
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
};
const img = (t) => tile(t);

export default [
  // ---- Bangkok, Thailand (prioritised) ----
  {
    id: '1777896004',
    type: 'billboard',
    title: 'Billboard · 1039 ถนนเพลินจิต',
    address: '1039 ถนนเพลินจิต, 10330, Pathum Wan, Bangkok, Thailand',
    lat: 13.74305,
    lng: 100.54899,
    link: 'https://oohearth.app/location/1777896004/',
    image: img('billboard'),
    notes: "McDonald's advertising · local-sized billboard",
  },
  {
    id: '1777667192',
    type: 'painted',
    title: 'Painted · 778 ถนนสุขุมวิท',
    address: '778 ถนนสุขุมวิท, 10110, Vadhana, Bangkok, Thailand',
    lat: 13.72565,
    lng: 100.57698,
    link: 'https://oohearth.app/location/1777667192/',
    image: img('painted'),
    notes: 'Painted takeover · subverted',
  },
  {
    id: '1777649595',
    type: 'digital',
    title: 'Digital · 28 ถนนชิดลม',
    address: '28 ถนนชิดลม, 10330, Pathum Wan, Bangkok, Thailand',
    lat: 13.74676,
    lng: 100.54441,
    link: 'https://oohearth.app/location/1777649595/',
    image: img('digital'),
    notes: 'Digital screen · advertising reported',
  },
  {
    id: '1777649423',
    type: 'digital',
    title: 'Digital · 25 ถนนชิดลม',
    address: '25 ถนนชิดลม, 10330, Pathum Wan, Bangkok, Thailand',
    lat: 13.74741,
    lng: 100.5444,
    link: 'https://oohearth.app/location/1777649423/',
    image: img('digital'),
    notes: 'Digital screen · advertising reported',
  },
  {
    id: '1777648896',
    type: 'other',
    title: 'Location · ถนนเพชรบุรี',
    address: 'ถนนเพชรบุรี, 10400, Ratchathewi, Bangkok, Thailand',
    lat: 13.74959,
    lng: 100.54777,
    link: 'https://oohearth.app/location/1777648896/',
    image: img('other'),
    notes: 'Site along ถนนเพชรบุรี (Phetchaburi Rd)',
  },
  {
    id: '1777635751',
    type: 'digital',
    title: 'Digital · 111 ถนนสุขุมวิท',
    address: '111 ถนนสุขุมวิท, 10110, Khlong Toei, Bangkok, Thailand',
    lat: 13.74145,
    lng: 100.55382,
    link: 'https://oohearth.app/location/1777635751/',
    image: img('digital'),
    notes: 'Digital screen · advertising reported',
  },
  {
    id: '1777635450',
    type: 'digital',
    title: 'Digital · 164 ถนนสุขุมวิท',
    address: '164 ถนนสุขุมวิท, 10110, Khlong Toei, Bangkok, Thailand',
    lat: 13.74041,
    lng: 100.55541,
    link: 'https://oohearth.app/location/1777635450/',
    image: img('digital'),
    notes: 'Digital screen · advertising reported',
  },
  {
    id: '1777635124',
    type: 'digital',
    title: 'Digital · 189 ถนนสุขุมวิท',
    address: '189 ถนนสุขุมวิท, 10110, Khlong Toei, Bangkok, Thailand',
    lat: 13.73905,
    lng: 100.55741,
    link: 'https://oohearth.app/location/1777635124/',
    image: img('digital'),
    notes: 'Digital screen · advertising reported',
  },
  {
    id: '1777432401',
    type: 'digital',
    title: 'Digital · 898 ถนนเพลินจิต',
    address: '898 ถนนเพลินจิต, 10330, Pathum Wan, Bangkok, Thailand',
    lat: 13.74374,
    lng: 100.54512,
    link: 'https://oohearth.app/location/1777432401/',
    image: img('digital'),
    notes: 'Digital screen · advertising reported',
  },
  {
    id: '1777432241',
    type: 'billboard',
    title: 'Billboard · 900 ถนนเพลินจิต',
    address: '900 ถนนเพลินจิต, 10330, Pathum Wan, Bangkok, Thailand',
    lat: 13.74358,
    lng: 100.54547,
    link: 'https://oohearth.app/location/1777432241/',
    image: img('billboard'),
    notes: 'Billboard · advertising reported',
  },

  // ---- London, United Kingdom (confirmed sites) ----
  {
    id: '1773075390',
    type: 'billboard',
    title: 'Billboard · Chilver Street',
    address: 'Chilver Street, Greenwich, London, SE10 0RH, United Kingdom',
    lat: 51.48684,
    lng: 0.0139,
    link: 'https://oohearth.app/location/1773075390/',
    image: img('billboard'),
    notes: 'Shell AGM 2024 — Brandalism billboard takeover. Large format.',
  },
  {
    id: '1769671479',
    type: 'other',
    title: 'Other · 310 St. Helier Avenue',
    address: '310 St. Helier Avenue, Merton, Morden, SM4 6JU, United Kingdom',
    lat: 51.38725,
    lng: -0.18935,
    link: 'https://oohearth.app/location/1769671479/',
    image: img('other'),
    notes: 'Confirmed oohearth.app site',
  },
  {
    id: '04135601914',
    type: 'painted',
    title: 'Painted · 164 Clapham Park Road',
    address: '164 Clapham Park Road, Lambeth, London, SW4 7EE, United Kingdom',
    lat: 51.45963,
    lng: -0.13081,
    link: 'https://oohearth.app/location/04135601914/',
    image: img('painted'),
    notes: 'Painted takeover · advertising reported',
  },
  {
    id: '03126112035',
    type: 'other',
    title: 'Other · Lendal Terrace',
    address: 'Lendal Terrace, Lambeth, London, SW4 7UU, United Kingdom',
    lat: 51.46449,
    lng: -0.12985,
    link: 'https://oohearth.app/location/03126112035/',
    image: img('other'),
    notes: 'Confirmed oohearth.app site',
  },
  {
    id: 'culting-of-brands',
    type: 'billboard',
    title: "Billboard · King's Cross St. Pancras",
    address:
      "King's Cross St. Pancras London Underground Station, Euston Rd, London, N1C 4AP, United Kingdom",
    lat: 51.53048,
    lng: -0.12312,
    link: 'https://oohearth.app/location/culting-of-brands/',
    image: img('billboard'),
    notes: "Underground station billboard · 'Culting of Brands'",
  },
  {
    id: '1168581456',
    type: 'other',
    title: 'Other · Hyde Park Corner',
    address: 'Hyde Park Corner, Park Ln, London, W1J 7DR, United Kingdom',
    lat: 51.50291,
    lng: -0.152,
    link: 'https://oohearth.app/location/1168581456/',
    image: img('other'),
    notes: 'Confirmed oohearth.app site',
  },
  {
    id: 'not-even-a-working-phonebox',
    type: 'other',
    title: 'Other · Austin Road (phonebox)',
    address: 'Austin Road, Wandsworth, London, SW11 5JP, United Kingdom',
    lat: 51.47358,
    lng: -0.1551,
    link: 'https://oohearth.app/location/not-even-a-working-phonebox/',
    image: img('other'),
    notes: "Defunct phonebox · 'Not even a working phonebox'",
  },
  {
    id: '1064861026',
    type: 'digital',
    title: 'Digital · Tesco, Austin Road',
    address: 'Tesco, Austin Road, Wandsworth, London, SW11 5JP, United Kingdom',
    lat: 51.47358,
    lng: -0.1551,
    link: 'https://oohearth.app/location/1064861026/',
    image: img('digital'),
    notes: 'Digital screen at Tesco · advertising reported',
  },
  {
    id: '1063800344',
    type: 'billboard',
    title: 'Billboard · 11 Clapham Park Road',
    address: '11 Clapham Park Road, Lambeth, London, SW4 7EE, United Kingdom',
    lat: 51.46192,
    lng: -0.13739,
    link: 'https://oohearth.app/location/1063800344/',
    image: img('billboard'),
    notes: 'Billboard · advertising reported',
  },
  {
    id: '0362800402',
    type: 'billboard',
    title: "Billboard · 2 Nelson's Row",
    address: "2 Nelson's Row, Lambeth, London, SW4 7JT, United Kingdom",
    lat: 51.46255,
    lng: -0.13534,
    link: 'https://oohearth.app/location/0362800402/',
    image: img('billboard'),
    notes: 'Billboard · advertising reported',
  },
  {
    id: '1062750357',
    type: 'transit',
    title: 'Transit · 57 Eccles Road',
    address: '57 Eccles Road, Wandsworth, London, SW11 1LZ, United Kingdom',
    lat: 51.46109,
    lng: -0.16303,
    link: 'https://oohearth.app/location/1062750357/',
    image: img('transit'),
    notes: 'Transit shelter · confirmed site',
  },
  {
    id: '1726419100',
    type: 'other',
    title: 'Other · 37 Clapham Common North Side',
    address: '37 Clapham Common North Side, Lambeth, London, SW4 0RW, United Kingdom',
    lat: 51.46139,
    lng: -0.1473,
    link: 'https://oohearth.app/location/1726419100/',
    image: img('other'),
    notes: 'Confirmed oohearth.app site · advertising reported',
  },
  {
    id: '1058070526',
    type: 'billboard',
    title: 'Billboard · 4 College Road',
    address: '4 College Road, Merton, London, SW19 2BS, United Kingdom',
    lat: 51.41963,
    lng: -0.17679,
    link: 'https://oohearth.app/location/1058070526/',
    image: img('billboard'),
    notes: 'Billboard · confirmed site',
  },
  {
    id: '0958050440',
    type: 'transit',
    title: 'Transit · 3 Clapham Common North Side',
    address: '3 Clapham Common North Side, Lambeth, London, SW4 0QW, United Kingdom',
    lat: 51.46307,
    lng: -0.14268,
    link: 'https://oohearth.app/location/0958050440/',
    image: img('transit'),
    notes: 'Transit shelter · confirmed site',
  },
];
