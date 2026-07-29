// Shared category switcher — the row of type chips that lets every directory
// cross-link to every other, "in similar fashion". Used by the category index,
// each /category/:slug directory, and the bus-stops directory.
import { Link } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import { CATEGORIES } from "@/components/ooh/categories";

const chip = (on) =>
  `inline-flex items-center gap-1.5 border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors ${
    on
      ? "border-ozone bg-ozone text-void"
      : "border-slate2/60 text-darkgray hover:border-ozone/60 hover:text-ozone"
  }`;

export default function CategoryNav({ current = "all" }) {
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Categories">
      <Link to="/categories" className={chip(current === "all")}>
        <LayoutGrid className="h-3 w-3" /> All
      </Link>
      {CATEGORIES.map((c) => {
        const Icon = c.icon;
        return (
          <Link key={c.slug} to={c.to} className={chip(current === c.slug)}>
            <Icon className="h-3 w-3" /> {c.label}
          </Link>
        );
      })}
    </div>
  );
}
