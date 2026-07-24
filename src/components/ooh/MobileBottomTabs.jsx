import { NavLink } from "react-router-dom";
import { Home, Map as MapIcon, Megaphone, Tv, LayoutDashboard } from "lucide-react";

const TABS = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/map", icon: MapIcon, label: "Map" },
  { to: "/report", icon: Megaphone, label: "Report", primary: true },
  { to: "/channel", icon: Tv, label: "Channel" },
  { to: "/dashboard", icon: LayoutDashboard, label: "Console" },
];

export default function MobileBottomTabs() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate2/70 bg-void/90 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-5 items-end gap-1 px-2 pb-1 pt-2">
        {TABS.map(({ to, icon: Icon, label, primary }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className="flex flex-col items-center gap-1.5 pb-1.5"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {({ isActive }) => {
              const on = isActive || primary;
              return (
                <div className={primary ? "-translate-y-3" : ""}>
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all duration-200 ${
                      primary
                        ? "border-ozone bg-ozone shadow-[0_0_22px_rgba(237,255,0,0.45)]"
                        : isActive
                        ? "border-ozone/60 bg-slate2/60"
                        : "border-slate2/50"
                    }`}
                  >
                    <Icon
                      className="h-6 w-6"
                      strokeWidth={on ? 2.4 : 1.7}
                      style={{ color: primary ? "#000" : isActive ? "rgb(var(--c-ozone))" : "rgb(var(--c-dim))" }}
                    />
                  </div>
                  <span
                    className="mt-1 block text-center font-mono text-[8px] uppercase tracking-[0.12em]"
                    style={{ color: isActive || primary ? "rgb(var(--c-ozone))" : "rgb(var(--c-dim))" }}
                  >
                    {label}
                  </span>
                </div>
              );
            }}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}