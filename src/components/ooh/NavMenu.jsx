import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Link } from "react-router-dom";

const LINKS = [
  { to: "/#mandate", label: "Mandate" },
  { to: "/#atlas", label: "Atlas" },
  { to: "/map", label: "Maps" },
  { to: "/inhome", label: "In-Home" },
  { to: "/zora", label: "Zora" },
  { to: "/report", label: "Report" },
  { to: "/ar", label: "AR Lens" },
  { to: "/scan", label: "TrueCost" },
  { to: "/trash", label: "Trash ID" },
  { to: "/campaign", label: "Fund" },
  { to: "/about", label: "About" },
  { to: "/plans", label: "Plans" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/support", label: "Support" },
];

export default function NavMenu({ open, onClose }) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-[300px] border-slate2 bg-void p-0">
        <SheetHeader className="border-b border-slate2/60 px-5 py-4">
          <SheetTitle className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Navigation</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col py-2">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={onClose}
              className="border-b border-slate2/30 px-5 py-3 font-display text-sm font-semibold text-silver transition-colors hover:bg-card hover:text-ozone"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}