import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { handleScanAd } from './handler.ts';

// ── Advertising Detection Engine ────────────────────────────────────────────
// Receives an uploaded image file_url, passes it to a vision-capable LLM, and
// returns structured advertising metadata (brand, agency, parent corp, sector,
// harm tags, etc.) ready to catalog into a Location record.

const DETECTION_SCHEMA = {
  type: 'object',
  properties: {
    is_advertising: {
      type: 'boolean',
      description: 'Whether advertising/branding/promotional content is visible in the image',
    },
    brand_name: {
      type: 'string',
      description:
        "Brand or advertiser being promoted, e.g. Shell, McDonald's. Empty string if unknown.",
    },
    campaign_name: {
      type: 'string',
      description:
        "Campaign or tagline text visible, e.g. 'Drive the Future'. Empty string if none.",
    },
    ad_agency: {
      type: 'string',
      description: 'Creative agency if identifiable from the ad. Empty string if unknown.',
    },
    parent_corp: {
      type: 'string',
      description: 'Parent / holding company of the brand if known. Empty string if unknown.',
    },
    ooh_operator: {
      type: 'string',
      description:
        'OOH media company that owns the structure if visible (e.g. JCDecaux). Empty if unknown.',
    },
    surface_type: {
      type: 'string',
      enum: [
        'billboard',
        'digital',
        'transit',
        'painted',
        'sticker',
        'mural',
        'projection',
        'other',
      ],
      description: 'Type of OOH surface',
    },
    industry_sector: {
      type: 'string',
      enum: [
        'fossil_fuel',
        'tobacco',
        'alcohol',
        'gambling',
        'ultra_processed_food',
        'surveillance',
        'finance',
        'real_estate',
        'fashion',
        'automotive',
        'pharma',
        'other',
      ],
      description: 'Industry sector of the advertiser',
    },
    harm_tags: {
      type: 'array',
      items: { type: 'string' },
      description:
        'Harm classification tags, e.g. greenwashing, child_targeting, body_image, predatory_lending',
    },
    description: { type: 'string', description: 'Brief description of what the ad shows and says' },
    visible_text: { type: 'string', description: 'All text/copy visible in the ad, transcribed' },
    confidence: { type: 'number', description: 'Confidence score 0.0 to 1.0' },
  },
  required: ['is_advertising', 'brand_name', 'confidence'],
};

const PROMPT = `You are an advertising detection system for OOH Earth — a public-space art, mapping, and adbusting platform.

Analyze the provided image and detect any outdoor advertising, logos, branding, or promotional content visible.

Extract:
- Whether advertising is present (is_advertising)
- Brand name being promoted
- Campaign name or tagline text
- Creative agency (if identifiable)
- Parent corporation / holding company
- OOH structure operator (if visible on the physical unit, e.g. JCDecaux label)
- Surface type (billboard, digital screen, transit, painted, sticker, mural, projection, other)
- Industry sector (fossil_fuel, tobacco, alcohol, gambling, ultra_processed_food, surveillance, finance, real_estate, fashion, automotive, pharma, other)
- Harm tags (greenwashing, child_targeting, body_image, predatory_lending, etc.)
- Brief description of the ad creative
- All visible text/copy transcribed
- Confidence score (0.0–1.0)

If no advertising is present, set is_advertising=false and leave string fields empty, confidence high.
If you can identify the brand but not the agency or parent corp, leave those empty — do not guess.`;

export default async function (req) {
  return handleScanAd(req, { createClientFromRequest }, DETECTION_SCHEMA, PROMPT);
}
