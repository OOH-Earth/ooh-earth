// Open roles for OOH Earth — scoped to the platform's current stage
// (public beta, community-funded, lean core team + volunteer network).

export const ROLES = [
  {
    id: "field-operative",
    title: "Field Operative",
    type: "Volunteer",
    location: "Global · your city",
    summary:
      "Document advertising and subvertising interventions in the wild. Capture photos, GPS and access-key intel, file reports from the street.",
    tags: ["Reporting", "Photography", "Field ID"],
  },
  {
    id: "regional-coordinator",
    title: "Regional Coordinator",
    type: "Part-time",
    location: "London · Bangkok",
    summary:
      "Lead the operative network in your region — triage reports, verify spots, onboard new operatives and run local campaigns.",
    tags: ["Operations", "Community", "Logistics"],
  },
  {
    id: "frontend-engineer",
    title: "Frontend Engineer",
    type: "Contract",
    location: "Remote",
    summary:
      "Build the field tools in React + Tailwind — maps, AR lens, capture flows, offline-first data entry. Open-source by default.",
    tags: ["React", "Tailwind", "Maps"],
  },
  {
    id: "platform-engineer",
    title: "Platform Engineer",
    type: "Contract",
    location: "Remote",
    summary:
      "Own the backend — entities, integrations, crypto treasury tooling and data pipelines that keep the atlas live and resilient.",
    tags: ["Backend", "Integrations", "Data"],
  },
  {
    id: "brand-designer",
    title: "Brand & UX Designer",
    type: "Contract",
    location: "Remote",
    summary:
      "Steward the platform identity and design field-ready UI that reads in sunlight, at night and under stress.",
    tags: ["Identity", "UX", "Field UI"],
  },
  {
    id: "community-manager",
    title: "Community Manager",
    type: "Part-time",
    location: "Remote",
    summary:
      "Run the operative community across channels — onboard, motivate, surface wins and keep the network coordinated and safe.",
    tags: ["Community", "Social", "Onboarding"],
  },
  {
    id: "content-curator",
    title: "Content Curator",
    type: "Volunteer",
    location: "Remote",
    summary:
      "Verify and curate incoming location reports, tag brands and access keys, and keep the atlas accurate and well-organised.",
    tags: ["Curation", "Verification", "Tagging"],
  },
  {
    id: "partnerships-lead",
    title: "Partnerships Lead",
    type: "Part-time",
    location: "Remote",
    summary:
      "Build alliances with NGOs, artist collectives and ethical brands to fund and amplify the resistance atlas.",
    tags: ["Partnerships", "Fundraising", "Outreach"],
  },
];

export const VALUES = [
  {
    icon: "Eye",
    title: "See everything",
    body: "We map what brands pay to hide in plain sight. Visibility is the weapon.",
  },
  {
    icon: "HandHeart",
    title: "Community-funded",
    body: "No ad money, no investors calling shots. The treasury and the work answer to operatives.",
  },
  {
    icon: "Zap",
    title: "Field-ready",
    body: "Every tool must work on a phone, in the street, offline, at night, under pressure.",
  },
  {
    icon: "Globe2",
    title: "Open by default",
    body: "Open-source data, open methods. What we build, anyone can fork and field.",
  },
];

export const PROCESS = [
  { step: "01", title: "Apply", body: "Send a short note — who you are, what you'd build, and a link or two." },
  { step: "02", title: "Talk", body: "A 30-minute call with the core team. No take-homes, no whiteboards." },
  { step: "03", title: "Field test", body: "A paid micro-task or a trial shift on a real piece of the atlas." },
  { step: "04", title: "Onboard", body: "Credentials, comms, and your first operative mission." },
];

export const APPLY_EMAIL = "hello@oohearth.app";