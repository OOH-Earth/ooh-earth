// NFT Creator presets — casing types, finishes, label colours, premade
// adbusting themes, and per-casing layer manifests. Aligned to OOH Earth's
// subvertising / right-to-respond protocol objectives.

export const CASING_TYPES = [
  { id: 'slab', name: 'Slab', desc: 'Rigid black frame · top label slot' },
  { id: 'screwdown', name: 'Screwdown', desc: 'Clear case · four gold corner screws' },
  { id: 'magnetic', name: 'Magnetic', desc: 'Black frame · magnetic closure stud' },
  { id: 'toploader', name: 'Toploader', desc: 'Clear rigid sleeve' },
  { id: 'sleeve', name: 'Sleeve', desc: 'Soft transparent pouch' },
];

export const FINISHES = [
  { id: 'clear', name: 'Clear' },
  { id: 'frosted', name: 'Frosted' },
];

export const LABEL_COLORS = [
  { id: 'ozone', name: 'Ozone', bg: '#EDFF00', fg: '#000000' },
  { id: 'flare', name: 'Flare', bg: '#FF5C00', fg: '#000000' },
  { id: 'alert', name: 'Alert', bg: '#FF0033', fg: '#FFFFFF' },
  { id: 'signal', name: 'Signal', bg: '#1F51FF', fg: '#FFFFFF' },
  { id: 'mint', name: 'Mint', bg: '#D4AF37', fg: '#000000' },
  { id: 'stealth', name: 'Stealth', bg: '#1A1A1A', fg: '#EDFF00' },
];

export const PREMADE_DESIGNS = [
  {
    id: 'cleancity',
    title: 'Clean City',
    grade: '10',
    labelColor: 'ozone',
    desc: 'São Paulo-inspired ad-free metropolis',
  },
  {
    id: 'reclaim',
    title: 'Reclaim',
    grade: '9.5',
    labelColor: 'flare',
    desc: 'Public-space reclamation directive',
  },
  {
    id: 'greenwash',
    title: 'Greenwash',
    grade: '9',
    labelColor: 'alert',
    desc: 'Anti-greenwashing intervention',
  },
  {
    id: 'subvert',
    title: 'Subvert',
    grade: '9.5',
    labelColor: 'signal',
    desc: 'Culture-jamming protocol',
  },
  {
    id: 'respond',
    title: 'Right to Respond',
    grade: '10',
    labelColor: 'mint',
    desc: 'Free expression in public space',
  },
  {
    id: 'commons',
    title: 'Visual Commons',
    grade: '9',
    labelColor: 'stealth',
    desc: 'Open access · shared surface',
  },
];

export const LAYERS = {
  slab: ['Reflection', 'Window', 'Card', 'Artwork', 'Label', 'Frame'],
  screwdown: ['Reflection', 'Screws', 'Case', 'Card', 'Artwork'],
  magnetic: ['Artwork', 'Card', 'Window', 'Magnet', 'Frame'],
  toploader: ['Artwork', 'Card', 'Sleeve'],
  sleeve: ['Artwork', 'Card', 'Sleeve'],
};
