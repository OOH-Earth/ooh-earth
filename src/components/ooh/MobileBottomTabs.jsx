import { NavLink } from "react-router-dom";
import { Home, Map as MapIcon, Megaphone, LayoutDashboard } from "lucide-react";

const TABS = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/map", icon: MapIcon, label: "Map" },
  { to: "/report", icon: Megaphone, label: "Report" },
  { to: "/dashboard", icon: LayoutDashboard, label: "Console" },
];

export default function MobileBottomTabs() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate2/70 bg-void/90 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-4">
        {TABS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className="flex flex-col items-center justify-center gap-1 py-2.5 transition-colors"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {({ isActive }) => (
              <>
                <Icon
                  className="h-5 w-5"
                  strokeWidth={isActive ? 2.4 : 1.6}
                  style={{ color: isActive ? "#EDFF00" : "#8c8c8c" }}
                />
                <span
                  className="font-mono text-[8px] uppercase tracking-[0.2em]"
                  style={{ color: isActive ? "#EDFF00" : "#8c8c8c" }}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}