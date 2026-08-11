import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

// Reusable breadcrumb trail. Pass an ordered array of crumbs:
//   [{ label: "Blog", to: "/blog" }, { label: "Some article" }]
// The first Home crumb is added automatically; the last crumb renders as
// current (no link). Keeps the Orbital Perspective mono-label look.
export default function Breadcrumbs({ items = [], className = "" }) {
  const trail = [{ label: "Home", to: "/", home: true }, ...items];
  return (
    <nav aria-label="Breadcrumb" className={`flex flex-wrap items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] ${className}`}>
      {trail.map((c, i) => {
        const last = i === trail.length - 1;
        const content = c.home ? <Home className="h-3 w-3" /> : c.label;
        return (
          <span key={`${c.label}-${i}`} className="flex items-center gap-1.5">
            {last || !c.to ? (
              <span className={last ? "text-ozone" : "text-dim"} aria-current={last ? "page" : undefined}>{content}</span>
            ) : (
              <Link
                to={c.to}
                aria-label={c.home ? "Home" : undefined}
                className="text-dim transition-colors hover:text-ozone"
              >
                {content}
              </Link>
            )}
            {!last && <ChevronRight className="h-3 w-3 text-slate2" />}
          </span>
        );
      })}
    </nav>
  );
}
