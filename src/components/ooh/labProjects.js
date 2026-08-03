import { Bike, BookOpen } from "lucide-react";

// ── Lab project registry ─────────────────────────────────────────────────────
// Single source of truth for code-defined Lab projects (pages that live in the
// codebase rather than only as LabPrototype rows).
//
// To add a new Lab project:
//   1. create the page in src/pages,
//   2. add its <Route> in App.jsx,
//   3. add one entry below.
//
// From there it is automatic:
//   • the Hub (/lab) surfaces it, and
//   • the Control Console (/lab/admin) auto-provisions a LabPrototype record for
//     it on load — so every new project appears in the control panel with no
//     manual database step, and stays fully togglable (access / status / visible).
export const LAB_PROJECTS = [
  {
    path: "/lab/streetrunner",
    title: "Streetrunner",
    icon: Bike,
    desc: "OE-1K/66 — Akira-class field-bike concept. Vector → blueprint → 3D concept art.",
    access: "restricted", // "public" | "restricted"
    status: "live",       // "live" | "in_build"
  },
  {
    path: "/lab/book",
    title: "The Guild · Book",
    icon: BookOpen,
    desc: "Subvertising & Brandalism — the field manual as a working-draft reader. Chapters 1–3 open for review.",
    access: "restricted",
    status: "live",
  },
];

export const LAB_BY_PATH = Object.fromEntries(LAB_PROJECTS.map((p) => [p.path, p]));