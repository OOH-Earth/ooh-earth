// Known advertiser ecosystem — parent/holding companies and creative agencies.
// Sourced from public advertising-industry knowledge and Clean Creatives F-List.
// Used as <datalist> suggestions so operatives can pick a known entity or type
// their own (PARENT_CORPS/AGENCIES stay flat string arrays for that -- do not
// change their shape, existing <option value={c}> call sites depend on it).
//
// PARENT_CORP_SECTOR_GROUPS additionally captures the sector each parent
// corp actually belongs to (previously only implicit in comments here) so a
// recognized parent corp can suggest Location.industry_sector when a report
// names the corp but the sector picker wasn't filled in. Values match the
// same enum used by Location.industry_sector / ReportStep2Identify's
// SECTORS / AdvertiserInfo's SECTOR_LABELS -- keep in step with those if the
// enum ever changes.

const PARENT_CORP_SECTOR_GROUPS = {
  // Holding companies (agency networks) intentionally excluded -- they're
  // the parent of an ad agency, not of an advertised sector, so they don't
  // map onto the industry_sector enum.
  fossil_fuel: [
    'Shell plc',
    'BP plc',
    'Chevron Corporation',
    'ExxonMobil',
    'TotalEnergies',
    'PTT Public Company',
    'ConocoPhillips',
    'Saudi Aramco',
    'ADNOC',
  ],
  ultra_processed_food: [
    'Yum! Brands',
    "McDonald's Corporation",
    'The Coca-Cola Company',
    'PepsiCo',
    'Nestlé',
    'Mondelez International',
    'Unilever',
    'Mars Inc.',
    'Ferrero',
    'JBS S.A.',
    ' Tyson Foods',
    'Mondelez',
    'Restaurant Brands International',
  ],
  alcohol: [
    'AB InBev',
    'Heineken',
    'Diageo',
    'Pernod Ricard',
    'Constellation Brands',
    'Carlsberg Group',
    'ThaiBev',
  ],
  tobacco: [
    'Philip Morris International',
    'British American Tobacco',
    'Japan Tobacco International',
    'Imperial Brands',
  ],
  automotive: [
    'Toyota Motor Corporation',
    'Volkswagen Group',
    'General Motors',
    'Ford Motor Company',
    'Stellantis',
    'Honda Motor',
    'Hyundai Motor Group',
    'Tesla Inc.',
    'BYD Company',
    'BMW Group',
    'Mercedes-Benz Group',
  ],
  fashion: [
    'LVMH',
    'Kering',
    'Inditex',
    'H&M Group',
    'Fast Retailing (Uniqlo)',
    'Nike Inc.',
    'Adidas AG',
    'Richemont',
    'Shein',
    'Tapestry',
  ],
  finance: [
    'JPMorgan Chase',
    'Bank of America',
    'HSBC',
    'Citigroup',
    'Goldman Sachs',
    'Morgan Stanley',
    'Visa Inc.',
    'Mastercard',
    'Bangkok Bank',
    'Kasikornbank',
    'SCB',
  ],
  surveillance: [
    'Palantir Technologies',
    'Hikvision',
    'Alphabet Inc.',
    'Meta Platforms',
    'Amazon',
    'Clearview AI',
    ' NEC Corporation',
  ],
  pharma: ['Pfizer', 'Johnson & Johnson', 'Novartis', 'Roche', 'GSK', 'Sanofi', 'Bayer'],
  real_estate: ['CBRE Group', 'JLL', 'Sansiri', 'Ananda Development', 'Raimon Land'],
  gambling: ['Entain', 'Flutter Entertainment', 'Las Vegas Sands', 'MGM Resorts'],
};

const HOLDING_COMPANIES = [
  'WPP',
  'Omnicom Group',
  'Publicis Groupe',
  'IPG (Interpublic)',
  'Dentsu',
  'Havas',
  'Stagwell',
  'S4 Capital',
];

export const PARENT_CORPS = [
  ...HOLDING_COMPANIES,
  ...Object.values(PARENT_CORP_SECTOR_GROUPS).flat(),
];

export const AGENCIES = [
  // WPP
  'Ogilvy',
  'Wunderman Thompson',
  'VML',
  'AKQA',
  'Grey',
  'BCW',
  'Hill+Knowlton',
  'GroupM',
  'Mediacom',
  'Mindshare',
  'Wavemaker',
  // Omnicom
  'BBDO',
  'DDB',
  'TBWA',
  'Goodby Silverstein & Partners',
  'Omd',
  'PHD',
  'Heartbeat',
  // Publicis
  'Publicis',
  'Leo Burnett',
  'Saatchi & Saatchi',
  'BBH',
  'Digitas',
  'Starcom',
  'Zenith',
  'Epsilon',
  // IPG
  'McCann',
  'FCB',
  'Lowe',
  'Mediaplus',
  'UM',
  'Initiative',
  'Weber Shandwick',
  'Huge',
  // Dentsu
  'Dentsu',
  'DentsuMB',
  'Carat',
  'iProspect',
  'dentsu X',
  'McGarryBowen',
  // Havas
  'Havas',
  'Havas Worldwide',
  'Arnold Worldwide',
  'Havas Media',
  'BETC',
  // Stagwell / S4
  'Anomaly',
  'Code and Theory',
  'MediaMonks',
  'Greenspace',
  // Independent / regional
  'Droga5',
  'Wieden+Kennedy',
  '72andSunny',
  'Mother',
  'The Community',
  'Hearts & Science',
  'MullenLowe',
  ' adam&eveDDB',
  'Uncommon Creative Studio',
  'Grandprime',
  'BrandConnection',
  'Plan B Creative',
  'Grey Thailand',
  'Ogilvy Thailand',
  'McCann Thailand',
  'BBDO Bangkok',
];

// name (normalized, trimmed+lowercased) -> sector enum value.
const PARENT_CORP_SECTOR_MAP = Object.entries(PARENT_CORP_SECTOR_GROUPS).reduce(
  (map, [sector, names]) => {
    for (const name of names) map[name.trim().toLowerCase()] = sector;
    return map;
  },
  {},
);

/**
 * Looks up the known industry sector for a parent corp name, exact or
 * substring match (mirrors BrandBadge.jsx's lookupBrand). Returns null for
 * unrecognized names or holding companies (which don't map onto a sector).
 * @param {string} name
 * @returns {string | null}
 */
export function lookupParentCorpSector(name) {
  const key = (name || '').trim().toLowerCase();
  if (!key) return null;
  if (PARENT_CORP_SECTOR_MAP[key]) return PARENT_CORP_SECTOR_MAP[key];
  for (const [corp, sector] of Object.entries(PARENT_CORP_SECTOR_MAP)) {
    if (key.includes(corp) || corp.includes(key)) return sector;
  }
  return null;
}
