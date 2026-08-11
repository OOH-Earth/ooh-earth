// OOH Earth gamification engine — badges, quests, XP/level progression.
// All state is computed client-side from contribution records (Location,
// DigitalBust, Mint, LeadClaim) plus QuestCompletion bonus claims.

import { POINTS, pointsForReport } from "../pointsConfig";

export { POINTS, pointsForReport };

// ── Level curve ──────────────────────────────────────────────────────
export const LEVELS = [
  { level: 1,  xp: 0,     title: "Newcomer" },
  { level: 2,  xp: 100,   title: "Scout" },
  { level: 3,  xp: 250,   title: "Spotter" },
  { level: 4,  xp: 500,   title: "Mapper" },
  { level: 5,  xp: 1000,  title: "Field Reporter" },
  { level: 6,  xp: 2000,  title: "Chronicler" },
  { level: 7,  xp: 3500,  title: "Veteran" },
  { level: 8,  xp: 5500,  title: "Specialist" },
  { level: 9,  xp: 8000,  title: "Organiser" },
  { level: 10, xp: 12000, title: "Champion" },
  { level: 11, xp: 18000, title: "Legend" },
  { level: 12, xp: 26000, title: "Mythic" },
];

export function levelFromXp(xp) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].xp) idx = i;
    else break;
  }
  const cur = LEVELS[idx];
  const next = LEVELS[idx + 1];
  const span = next ? next.xp - cur.xp : 1;
  const progress = next ? ((xp - cur.xp) / span) * 100 : 100;
  return {
    level: cur.level,
    title: cur.title,
    xp,
    currentXp: cur.xp,
    nextXp: next ? next.xp : cur.xp,
    xpIntoLevel: xp - cur.xp,
    xpForNext: next ? span : 0,
    progress: Math.min(100, Math.max(0, progress)),
    isMax: !next,
  };
}

// ── Badge definitions ────────────────────────────────────────────────
export const BADGES = [
  { id: "first_blood",     label: "First Report",      desc: "File your first report",        icon: "FileText",    tier: "bronze",  check: s => s.reports >= 1 },
  { id: "spotter",         label: "Spotter",           desc: "File 10 reports",               icon: "Eye",         tier: "bronze",  check: s => s.reports >= 10 },
  { id: "cartographer",    label: "Cartographer",      desc: "File 50 reports",               icon: "MapPin",      tier: "silver",  check: s => s.reports >= 50 },
  { id: "surveyor",        label: "Surveyor",          desc: "File 100 reports",              icon: "Crosshair",   tier: "gold",    check: s => s.reports >= 100 },
  { id: "truth_seeker",    label: "Truth Seeker",      desc: "Get 10 verified reports",       icon: "ShieldCheck", tier: "silver",  check: s => s.verified >= 10 },
  { id: "evidence_keeper", label: "Evidence Keeper",   desc: "Add photos to 10 reports",      icon: "Camera",      tier: "silver",  check: s => s.photos >= 10 },
  { id: "bust_master",     label: "Bust Master",       desc: "Log 5 digital busts",           icon: "Zap",         tier: "gold",    check: s => s.busts >= 5 },
  { id: "mint_pioneer",    label: "Mint Pioneer",      desc: "Mint your first location NFT",   icon: "Coins",       tier: "gold",    check: s => s.mints >= 1 },
  { id: "on_chain",        label: "On Chain",          desc: "Mint 5 location NFTs",           icon: "Coins",       tier: "diamond", check: s => s.mints >= 5 },
  { id: "lead_hunter",     label: "Lead Hunter",       desc: "Claim 5 funding leads",          icon: "Target",      tier: "silver",  check: s => s.leads >= 5 },
  { id: "week_warrior",    label: "Week Warrior",     desc: "7-day activity streak",          icon: "Flame",       tier: "gold",    check: s => s.streak >= 7 },
  { id: "monthly_devotion",label: "Monthly Devotion",  desc: "30-day activity streak",         icon: "Flame",       tier: "diamond", check: s => s.streak >= 30 },
  { id: "vanguard",        label: "Champion",          desc: "Reach 5,000 XP",                 icon: "Rocket",      tier: "diamond", check: s => s.xp >= 5000 },
];

export const TIER_STYLES = {
  bronze:   { color: "#FF5C00", glow: "rgba(255,92,0,0.25)",  label: "Bronze" },
  silver:   { color: "#ACACAC", glow: "rgba(172,172,172,0.2)",label: "Silver" },
  gold:     { color: "#EDFF00", glow: "rgba(237,255,0,0.3)",  label: "Gold" },
  diamond:  { color: "#39FF14", glow: "rgba(57,255,20,0.3)",  label: "Diamond" },
};

// ── Quest definitions ───────────────────────────────────────────────
export const QUESTS = [
  { id: "daily_report",  type: "daily",   label: "File a Report",       desc: "Log 1 spot today",          target: 1, metric: "dailyReports",  reward_xp: 50 },
  { id: "daily_photo",   type: "daily",   label: "Photo Evidence",     desc: "Add a photo to 1 report",   target: 1, metric: "dailyPhotos",   reward_xp: 50 },
  { id: "weekly_reports",type: "weekly",  label: "Field Week",          desc: "File 5 reports this week",  target: 5, metric: "weeklyReports",reward_xp: 200 },
  { id: "weekly_busts",  type: "weekly",  label: "Digital Resistance",  desc: "Log 3 digital busts",      target: 3, metric: "weeklyBusts",  reward_xp: 150 },
  { id: "weekly_mint",   type: "weekly",  label: "On-Chain Week",      desc: "Mint 1 location this week", target: 1, metric: "weeklyMints",   reward_xp: 300 },
];

// ── Time helpers ─────────────────────────────────────────────────────
export function isToday(iso) {
  if (!iso) return false;
  return new Date(iso).toDateString() === new Date().toDateString();
}

export function isThisWeek(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1);
  monday.setHours(0, 0, 0, 0);
  return d >= monday;
}

export function periodKey(type) {
  const now = new Date();
  if (type === "daily") return now.toISOString().slice(0, 10);
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const diff = (now.getTime() - start.getTime()) / 86400000;
  const week = Math.ceil((diff + start.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}