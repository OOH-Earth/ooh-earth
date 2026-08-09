// Open roles for OOH Earth — public beta, community-funded, lean core team
// plus a global volunteer network. Volunteering is the backbone; paid contracts
// exist where the treasury allows. Each role carries full detail for its page.

export const CATEGORIES = ["Field & Community", "Build & Design", "Growth & Funding"];

export const ROLES = [
  // ─────────── Field & Community ───────────
  {
    id: "field-operative",
    title: "Field Reporter",
    type: "Volunteer",
    category: "Field & Community",
    location: "Global · your city",
    commitment: "Flexible — a few hours a week",
    comp: "Volunteer — field costs covered where funds allow",
    summary: "Document advertising and subvertising in the wild — photos, GPS and access-key intel, filed from the street.",
    tags: ["Reporting", "Photography", "Field ID"],
    about: "The eyes of the atlas. Members walk their own streets and turn corporate advertising into open, mapped, contestable data — logging billboards, bus-stop screens and illegal hoardings so the whole network can see and act on them.",
    responsibilities: [
      "Photograph and log outdoor ads and subvertising interventions in your area",
      "Capture GPS, dimensions, operator and access-key details",
      "File reports through the field tools — offline-first, from your phone",
      "Flag high-harm formats (fossil fuel, gambling, junk food) for priority",
    ],
    requirements: [
      "A phone and a willingness to walk your city with open eyes",
      "Care for accuracy — honest, verifiable reports",
      "Basic safety sense around traffic and private property",
    ],
    gain: [
      "Member credentials and a place in the global network",
      "Your reports live on the public atlas",
      "Field costs reimbursed where the treasury allows",
    ],
  },
  {
    id: "city-ambassador",
    title: "City Ambassador",
    type: "Volunteer",
    category: "Field & Community",
    location: "Global · your city",
    commitment: "Flexible — self-directed",
    comp: "Volunteer — expenses + micro-grants for local action",
    summary: "Be the face of the movement in your city — welcome new members, run meet-ups and local subvertising campaigns.",
    tags: ["Organising", "Community", "Local"],
    about: "Ambassadors turn a scatter of members into a local crew. You represent OOH Earth in your city, grow the network, and lead the actions that make the atlas matter on the ground.",
    responsibilities: [
      "Welcome and support members in your city",
      "Organise meet-ups, mapping walks and local campaigns",
      "Be a first point of contact for local press and allies",
      "Feed local intel and wins back to the wider network",
    ],
    requirements: [
      "Roots in your local community and a knack for bringing people together",
      "Comfort speaking for the movement in public",
      "Reliability — people can count on you",
    ],
    gain: [
      "Micro-grants to fund local actions and meet-ups",
      "A leadership role and a named city crew",
      "Direct line to the core team",
    ],
  },
  {
    id: "content-curator",
    title: "Content Curator",
    type: "Volunteer",
    category: "Field & Community",
    location: "Remote",
    commitment: "Flexible — a few hours a week",
    comp: "Volunteer",
    summary: "Verify and curate incoming reports, tag brands and access keys, and keep the atlas accurate and organised.",
    tags: ["Curation", "Verification", "Tagging"],
    about: "The atlas is only as good as its data. Curators are the quality layer — reviewing incoming reports, confirming details, tagging brands and offense types, and keeping everything clean and trustworthy.",
    responsibilities: [
      "Review and verify incoming location reports",
      "Tag brands, operators, offense types and access keys",
      "Merge duplicates and fix inaccurate entries",
      "Escalate high-harm or disputed spots to the core team",
    ],
    requirements: [
      "A sharp eye for detail and consistency",
      "Comfort working through a queue methodically",
      "Good judgement on what's credible",
    ],
    gain: [
      "A shaping hand on the world's open OOH atlas",
      "Curator credentials and a public contribution record",
      "Training in verification and open-data methods",
    ],
  },
  {
    id: "translator",
    title: "Translator & Localisation",
    type: "Volunteer",
    category: "Field & Community",
    location: "Remote · Global South priority",
    commitment: "Flexible — project-based",
    comp: "Volunteer",
    summary: "Open the atlas to the world — translate the platform and field guides, with a focus on Global-South languages.",
    tags: ["Translation", "Localisation", "Access"],
    about: "Resistance to advertising is global, and led from the Global South — but tools built only in English lock most of the world out. Translators make the platform, field guides and campaigns speak in more languages.",
    responsibilities: [
      "Translate interface copy, field guides and campaign material",
      "Adapt tone and examples to local context, not just words",
      "Review community translations for accuracy",
      "Flag terms and formats specific to your region",
    ],
    requirements: [
      "Fluency in English and at least one other language",
      "Care for nuance and cultural context",
      "Reliability on agreed pieces of work",
    ],
    gain: [
      "Your language on a global civic platform",
      "Named credit as a localisation contributor",
      "A hand in reaching movements the tools currently miss",
    ],
  },
  {
    id: "legal-observer",
    title: "Legal & Rights Observer",
    type: "Volunteer",
    category: "Field & Community",
    location: "Remote · any jurisdiction",
    commitment: "Flexible — project-based",
    comp: "Volunteer",
    summary: "Map the rules — advertising law, planning consent and public-space rights — so members act informed and safe.",
    tags: ["Law", "Policy", "Rights"],
    about: "Knowing the law is power. Observers research how outdoor advertising is regulated where you are, document illegal installs, and help members understand their rights before they act.",
    responsibilities: [
      "Research advertising, planning and public-space law in your jurisdiction",
      "Document unconsented or unlawful installations with the evidence to challenge them",
      "Write plain-language rights guides for members",
      "Support objections and complaints with the right references",
    ],
    requirements: [
      "A legal, planning or policy background — or the appetite to dig",
      "Precision and a habit of citing sources",
      "Commitment to lawful, non-violent methods",
    ],
    gain: [
      "Real impact turning research into removals and bans",
      "A public body of work on advertising law",
      "Collaboration with allied NGOs and lawyers",
    ],
  },
  {
    id: "regional-coordinator",
    title: "Regional Coordinator",
    type: "Part-time",
    category: "Field & Community",
    location: "London · Bangkok",
    commitment: "Part-time — regular hours",
    comp: "Part-time — paid where funded, honorarium otherwise",
    summary: "Lead the member network in your region — triage reports, verify spots, onboard members and run campaigns.",
    tags: ["Operations", "Community", "Logistics"],
    about: "Coordinators keep a whole region moving — the connective tissue between members and the core team. You run the day-to-day of the network where you are.",
    responsibilities: [
      "Triage and verify reports across your region",
      "Onboard and support new members and ambassadors",
      "Plan and run regional campaigns and actions",
      "Report regional health and needs to the core team",
    ],
    requirements: [
      "Proven operations or community-organising experience",
      "Calm under a busy, messy queue of work",
      "Deep knowledge of your region",
    ],
    gain: [
      "A paid role where funding allows, honorarium otherwise",
      "Ownership of a region and its crew",
      "A seat close to how the movement is run",
    ],
  },
  {
    id: "community-manager",
    title: "Community Manager",
    type: "Part-time",
    category: "Field & Community",
    location: "Remote",
    commitment: "Part-time — regular hours",
    comp: "Part-time — paid where funded, honorarium otherwise",
    summary: "Run the member community across channels — onboard, motivate, surface wins, keep the network coordinated and safe.",
    tags: ["Community", "Social", "Onboarding"],
    about: "You hold the community together — the voice that welcomes new members, celebrates the wins, defuses the friction and keeps thousands of people pulling the same way, safely.",
    responsibilities: [
      "Run community channels — welcome, moderate, energise",
      "Onboard new members and point them to their first field project",
      "Surface field wins and turn them into shareable stories",
      "Uphold safety and conduct norms across the network",
    ],
    requirements: [
      "Community-management experience across social channels",
      "Warm, clear, on-brand communication",
      "Steady judgement on safety and moderation",
    ],
    gain: [
      "A paid role where funding allows, honorarium otherwise",
      "Ownership of the community's health and voice",
      "A front-row view of the movement growing",
    ],
  },

  // ─────────── Build & Design ───────────
  {
    id: "frontend-engineer",
    title: "Frontend Engineer",
    type: "Contract",
    category: "Build & Design",
    location: "Remote",
    commitment: "Contract — flexible scope",
    comp: "Paid contract — rate agreed by scope",
    summary: "Build the field tools in React + Tailwind — maps, AR lens, capture flows, offline-first data entry. Open-source by default.",
    tags: ["React", "Tailwind", "Maps"],
    about: "The field tools have to work on a cheap phone, in the street, offline, at night. You'll build the interfaces members actually rely on — fast, legible and resilient.",
    responsibilities: [
      "Build capture, map and AR-lens flows in React + Tailwind",
      "Make it work offline-first and sync cleanly",
      "Ship legible, high-contrast field UI that reads in sunlight",
      "Keep everything open-source and forkable",
    ],
    requirements: [
      "Strong React + Tailwind, comfortable with maps/geospatial UI",
      "An eye for performance on low-end devices",
      "Open-source instincts",
    ],
    gain: [
      "Paid contract work on a tool people use in the wild",
      "A public portfolio of open-source civic tech",
      "Direct say in how the platform is built",
    ],
  },
  {
    id: "platform-engineer",
    title: "Platform Engineer",
    type: "Contract",
    category: "Build & Design",
    location: "Remote",
    commitment: "Contract — flexible scope",
    comp: "Paid contract — rate agreed by scope",
    summary: "Own the backend — entities, integrations, crypto treasury tooling and data pipelines that keep the atlas live and resilient.",
    tags: ["Backend", "Integrations", "Data"],
    about: "You keep the atlas standing. From data entities to payment and treasury tooling to the pipelines that feed the live map, you own the plumbing the whole platform runs on.",
    responsibilities: [
      "Design and maintain entities, APIs and data pipelines",
      "Build integrations — payments, treasury, automation",
      "Keep the platform resilient, observable and secure",
      "Protect data integrity and RLS boundaries",
    ],
    requirements: [
      "Solid backend engineering across APIs, data and integrations",
      "Security-first instincts",
      "Comfort in a fast, lean, open-source codebase",
    ],
    gain: [
      "Paid contract work on meaningful infrastructure",
      "Ownership of core platform systems",
      "Open-source credit for the plumbing that matters",
    ],
  },
  {
    id: "brand-designer",
    title: "Brand & UX Designer",
    type: "Contract",
    category: "Build & Design",
    location: "Remote",
    commitment: "Contract — flexible scope",
    comp: "Paid contract — rate agreed by scope",
    summary: "Steward the platform identity and design field-ready UI that reads in sunlight, at night and under stress.",
    tags: ["Identity", "UX", "Field UI"],
    about: "The look matters too. You steward the Orbital Perspective identity and design interfaces that stay legible and unmistakable in the hardest conditions members face.",
    responsibilities: [
      "Steward and evolve the brand system across surfaces",
      "Design field-ready, high-contrast UI for real conditions",
      "Prototype capture, map and campaign flows",
      "Keep design tokens and components consistent",
    ],
    requirements: [
      "Strong brand + product design portfolio",
      "Systems thinking — tokens, components, consistency",
      "Empathy for stressful, low-light field use",
    ],
    gain: [
      "Paid contract work on a distinctive civic brand",
      "Creative ownership of the platform's look",
      "A portfolio piece with real-world stakes",
    ],
  },
  {
    id: "data-researcher",
    title: "Data Researcher",
    type: "Volunteer",
    category: "Build & Design",
    location: "Remote",
    commitment: "Flexible — project-based",
    comp: "Volunteer",
    summary: "Investigate who owns the ad space — operators, networks and the money behind the boards — and open it up as data.",
    tags: ["Research", "OSINT", "Data"],
    about: "Behind every billboard is an owner, an operator and a client. Researchers follow that trail — mapping the companies and money behind outdoor advertising and turning it into open, structured data.",
    responsibilities: [
      "Research OOH operators, networks and ownership",
      "Structure findings into clean, sourced datasets",
      "Cross-reference field reports with company data",
      "Surface patterns — who profits from which formats",
    ],
    requirements: [
      "Research or OSINT skills and dogged curiosity",
      "Comfort with spreadsheets and structured data",
      "Rigour about sources and accuracy",
    ],
    gain: [
      "A public dataset with real accountability impact",
      "Named credit as a contributing researcher",
      "Skills in investigation and open data",
    ],
  },

  // ─────────── Growth & Funding ───────────
  {
    id: "funding-grants",
    title: "Funding & Grants Assistant",
    type: "Volunteer",
    category: "Growth & Funding",
    location: "Remote",
    commitment: "Flexible — a few hours a week",
    comp: "Volunteer — keeps the whole platform free & open",
    summary: "Help the movement fund itself without ad money — find grants, draft applications, keep the pipeline moving.",
    tags: ["Grants", "Funding", "Research"],
    about: "Everything here is free because the community funds it — no ad money. You help keep it that way: hunting down grants and fellowships, drafting applications, and keeping our funding pipeline organised and moving.",
    responsibilities: [
      "Research grants, fellowships and funds that fit the mission",
      "Draft and assemble applications with the core team",
      "Track deadlines, submissions and outcomes in one place",
      "Help report back to funders on impact",
    ],
    requirements: [
      "Clear, persuasive writing",
      "Organised and deadline-driven",
      "Belief in a community-funded, no-strings model",
    ],
    gain: [
      "Direct hand in keeping every tool free and open",
      "Grant-writing experience and a track record",
      "Named credit on funding you help win",
    ],
  },
  {
    id: "fundraising",
    title: "Fundraising Volunteer",
    type: "Volunteer",
    category: "Growth & Funding",
    location: "Remote",
    commitment: "Flexible — self-directed",
    comp: "Volunteer",
    summary: "Grow community funding — run campaigns, steward supporters, and rally small donors behind the resistance.",
    tags: ["Fundraising", "Campaigns", "Donors"],
    about: "Community funding is the whole point — every pound comes from people, not advertisers. You help grow it: running fundraising campaigns, welcoming supporters, and turning a movement into a membership.",
    responsibilities: [
      "Plan and run community fundraising campaigns",
      "Welcome and steward recurring supporters",
      "Craft honest, compelling asks that respect donors",
      "Track what works and share it back",
    ],
    requirements: [
      "Some fundraising, marketing or campaigning experience",
      "Warm, honest communication — no dark patterns",
      "Care for donors as members, not ATMs",
    ],
    gain: [
      "A direct line between your work and the treasury",
      "Fundraising and campaign experience",
      "A role at the heart of a community-funded model",
    ],
  },
  {
    id: "partnerships-lead",
    title: "Partnerships Lead",
    type: "Part-time",
    category: "Growth & Funding",
    location: "Remote",
    commitment: "Part-time — regular hours",
    comp: "Part-time — paid where funded, honorarium otherwise",
    summary: "Build alliances with NGOs, artist collectives and ethical funders to fund and amplify the resistance atlas.",
    tags: ["Partnerships", "Fundraising", "Outreach"],
    about: "The movement is bigger than us. You build the alliances that multiply it — with NGOs, adbusting collectives, academics and ethical funders who share the fight against ad saturation.",
    responsibilities: [
      "Identify and open relationships with aligned organisations",
      "Structure partnerships that fund or amplify the work",
      "Represent OOH Earth to allies and funders",
      "Keep partners close and reporting honest",
    ],
    requirements: [
      "Partnerships, BD or NGO-relations experience",
      "A network — or the skill to build one fast",
      "Strong judgement on who's genuinely aligned",
    ],
    gain: [
      "A paid role where funding allows, honorarium otherwise",
      "Ownership of the movement's alliances",
      "A widening network across civil society",
    ],
  },
  {
    id: "social-volunteer",
    title: "Social & Content Volunteer",
    type: "Volunteer",
    category: "Growth & Funding",
    location: "Remote",
    commitment: "Flexible — a few hours a week",
    comp: "Volunteer",
    summary: "Turn field wins into content that travels — posts, threads and short video that grow the network and the funding.",
    tags: ["Social", "Content", "Storytelling"],
    about: "The best subvertising deserves an audience. You turn member wins, maps and milestones into content that spreads the movement and pulls new people and funding in.",
    responsibilities: [
      "Create posts, threads and short video from field wins",
      "Keep a steady, on-brand publishing rhythm",
      "Engage the community and welcome newcomers",
      "Spot stories worth amplifying",
    ],
    requirements: [
      "A feel for social content that travels",
      "On-brand, punchy writing",
      "Basic graphics or video editing a plus",
    ],
    gain: [
      "A public content portfolio with a cause behind it",
      "Named credit and creative freedom",
      "A direct hand in growing the network",
    ],
  },
];

// Status of each role — the single source of truth until the admin panel lands.
// "live" = open now · "future" = a real need we'll open as we grow/fund ·
// "filled" = closed · "draft" = hidden from the public page.
const ROLE_STATUS = {
  "field-operative": "live",
  "content-curator": "live",
  "city-ambassador": "live",
  "funding-grants": "live",
  "fundraising": "live",
  "social-volunteer": "live",
  "translator": "live",
  "regional-coordinator": "future",
  "community-manager": "future",
  "frontend-engineer": "future",
  "platform-engineer": "future",
  "brand-designer": "future",
  "data-researcher": "future",
  "partnerships-lead": "future",
  "legal-observer": "future",
};
ROLES.forEach((r) => { r.status = ROLE_STATUS[r.id] || "future"; });

export const STATUS_META = {
  live: { label: "Live role", cls: "border-[#39FF14]/50 text-[#39FF14]", dot: "bg-[#39FF14]", cta: "Apply" },
  future: { label: "Future need", cls: "border-flare/50 text-flare", dot: "bg-flare", cta: "Register interest" },
  filled: { label: "Filled", cls: "border-slate2/60 text-dim", dot: "bg-dim/60", cta: "Filled" },
  draft: { label: "Draft", cls: "border-slate2/60 text-dim", dot: "bg-dim/60", cta: "" },
};

// What we genuinely look for in people — traits over credentials. Real, not fluff.
export const LOOK_FOR = [
  { title: "You'd rather do than debate", body: "You'd rather map the billboard than argue about it. The people who flourish here move first — file the report, run the action, ship the fix, then talk about it." },
  { title: "You work like an open book", body: "Our data, code and methods are public and forkable. You're at ease in the open — sharing the credit, leaving the receipts, building things anyone can inspect and borrow." },
  { title: "You'd rather be right than loud", body: "The atlas lives or dies on accuracy. You cite your sources, check before you claim, and never let a good story outrun the facts." },
  { title: "You're in it for the right reasons", body: "Community-funded, no ad money. The reward isn't a windfall — it's public space reclaimed and a movement that outgrows you." },
  { title: "You look out for everyone", body: "We centre the Global South, the overlooked, the advertised-at. You bring real care for people into the work — not just polish for the product." },
];

// Honest support offered to volunteers — no false promises of a salary, but real
// backing so contributing never costs you money.
export const SUPPORT = [
  { title: "Field costs, not out of pocket", body: "Where the community treasury allows, we reimburse reasonable field costs — transport, printing, access tools — so volunteering never costs you money to do." },
  { title: "Micro-grants for local action", body: "Small grants for members and ambassadors running local campaigns, subvertising actions or city meet-ups. Apply through your coordinator." },
  { title: "Real credentials & references", body: "Member credentials, a public record of your contributions, and honest references for jobs, grants or study." },
  { title: "Skills, not just labour", body: "Hands-on mentoring in mapping, investigation, organising and open-source tools — you leave sharper than you arrived." },
];

export const VALUES = [
  { icon: "Eye", title: "See everything", body: "We map what brands pay to hide in plain sight. Visibility is the point." },
  { icon: "HandHeart", title: "Community-funded", body: "No ad money. The treasury and the work answer to members." },
  { icon: "Zap", title: "Field-ready", body: "Every tool must work on a phone, in the street, offline, at night, under pressure." },
  { icon: "Globe2", title: "Open by default", body: "Open-source data, open methods. What we build, anyone can fork and field." },
];

export const PROCESS = [
  { step: "01", title: "Apply", body: "Send a short note — who you are, what you'd build, and a link or two." },
  { step: "02", title: "Talk", body: "A 30-minute call with the core team. No take-homes, no whiteboards." },
  { step: "03", title: "Field test", body: "A paid micro-task or a trial shift on a real piece of the atlas." },
  { step: "04", title: "Onboard", body: "Credentials, comms, and your first field project." },
];

export const APPLY_EMAIL = "hello@ooh.earth";