// REAL DATA — RUNTIME-VERIFIED. These 12 records are the complete set of
// production Location rows (app 6a62213cff3ccbca88c04ff5) with a non-empty
// brand_name, read via a non-privileged, bounded, field-projected Base44
// query on 2026-08-28 (see branded-values-recon-query.js in this folder,
// same file re-runnable to reproduce). brand_name/parent_corp/
// industry_sector/campaign_name describe a public advertisement in public
// space, not personal/contributor data — no identity field, image, or
// --privileged read was ever used to obtain this. This is the entire real
// population, not a sample: production's brand_name field coverage is
// 12/969 (1.2%).
export const REAL_BRANDED_RECORDS = [
  {
    type: 'digital',
    status: 'verified',
    brand_name: 'Chanel',
    parent_corp: null,
    industry_sector: 'fashion',
    campaign_name: 'Coco Crush',
  },
  {
    type: 'billboard',
    status: 'verified',
    brand_name: 'Leo Beer / Singha Sparkling Water',
    parent_corp: 'Boon Rawd Brewery',
    industry_sector: 'alcohol',
    campaign_name: 'คิดจริง ทำจริง สิโว / เครื่องดื่มฟีลใหม่ ไบรท์ซา สดชื่น',
  },
  {
    type: 'billboard',
    status: 'verified',
    brand_name: 'Honda',
    parent_corp: 'Honda Motor Co., Ltd.',
    industry_sector: 'automotive',
    campaign_name: 'New City / New City Hatchback – Quake Em Up',
  },
  {
    type: 'billboard',
    status: 'verified',
    brand_name: 'MEA (Metropolitan Electricity Authority)',
    parent_corp: null,
    industry_sector: 'other',
    campaign_name: 'eMEA Service - พลังดีดี ที่เจิดจ้า',
  },
  {
    type: 'digital',
    status: 'verified',
    brand_name: 'Chery',
    parent_corp: 'Chery Automobile Co., Ltd.',
    industry_sector: 'automotive',
    campaign_name: 'Born to Play Ever More',
  },
  {
    type: 'billboard',
    status: 'verified',
    brand_name: 'Zontes',
    parent_corp: null,
    industry_sector: 'automotive',
    campaign_name: '150X FOR THE NEXT',
  },
  {
    type: 'digital',
    status: 'verified',
    brand_name: 'KFC',
    parent_corp: 'Yum! Brands',
    industry_sector: 'ultra_processed_food',
    campaign_name: 'คริสปี้บักเก็ต 199',
  },
  {
    type: 'billboard',
    status: 'verified',
    brand_name: 'Zontes',
    parent_corp: null,
    industry_sector: 'automotive',
    campaign_name: 'FOR THE NEXT',
  },
  {
    type: 'digital',
    status: 'verified',
    brand_name: 'Coca-Cola',
    parent_corp: 'The Coca-Cola Company',
    industry_sector: 'ultra_processed_food',
    campaign_name: null,
  },
  {
    type: 'digital',
    status: 'verified',
    brand_name: 'Sprite',
    parent_corp: null,
    industry_sector: null,
    campaign_name: null,
  },
  {
    type: 'billboard',
    status: 'verified',
    brand_name: "McDonald's Corporation",
    parent_corp: null,
    industry_sector: null,
    campaign_name: null,
  },
  {
    type: 'billboard',
    status: 'verified',
    brand_name: 'Nike Inc.',
    parent_corp: null,
    industry_sector: 'fashion',
    campaign_name: null,
  },
];
