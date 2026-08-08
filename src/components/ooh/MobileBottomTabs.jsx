import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Map as MapIcon, Megaphone, Tv, LayoutDashboard, ScanLine, SprayCan } from "lucide-react";

const TABS = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/map", icon: MapIcon, label: "Map", notify: true },
  { to: "/report", icon: Megaphone, label: "Report", primary: true },
  { to: "/channel", icon: Tv, label: "Channel" },
  { to: "/dashboard", icon: LayoutDashboard, label: "Console", notify: true },
];

// Camera shortcuts — compact icon-only buttons for the two field cameras
const CAMERAS = [
  { to: "/lab/scanner", icon: ScanLine, label: "Ad Scanner", accent: "ozone" },
  { to: "/lab/graffiti-cam", icon: SprayCan, label: "Graffiti Cam", accent: "flare" },
];

export default function MobileBottomTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const current = location.pathname;

  const activeIndex = TABS.findIndex((t) =>
    t.to === "/" ? current === "/" : current.startsWith(t.to)
  );
  const active = activeIndex >= 0 ? activeIndex : 0;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center lg:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 10px)" }}
      aria-label="Mobile navigation"
    >
      <div className="ooh-mobile-nav flex items-center gap-1 rounded-full border border-border bg-card px-2 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        {/* Camera shortcuts */}
        {CAMERAS.map(({ to, icon: Icon, label, accent }) => {
          const isActive = current === to;
          return (
            <button
              key={to}
              onClick={() => navigate(to)}
              aria-label={label}
              className="relative flex h-11 w-11 items-center justify-center"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                animate={{ scale: isActive ? 1.12 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border ${accent === "flare" ? "border-flare/50" : "border-ozone/50"} ${isActive ? (accent === "flare" ? "bg-flare" : "bg-ozone") : ""}`}
              >
                <Icon
                  className={`h-4 w-4 transition-colors ${isActive ? "text-void" : accent === "flare" ? "text-flare" : "text-ozone"}`}
                  strokeWidth={2.2}
                />
              </motion.div>
            </button>
          );
        })}
        {/* Divider */}
        <span className="h-7 w-px bg-border" />
        {/* Main nav tabs */}
        {TABS.map(({ to, icon: Icon, label, primary, notify }, i) => {
          const isActive = i === active;

          if (primary) {
            return (
              <button
                key={to}
                onClick={() => navigate(to)}
                aria-label={label}
                className="relative flex h-12 w-12 items-center justify-center"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className={`flex h-11 w-11 items-center justify-center rounded-full shadow-ozone-glow transition-colors duration-300 ${
                    isActive ? "bg-flare" : "bg-ozone"
                  }`}
                >
                  <Icon className="h-5 w-5 text-void" strokeWidth={2.3} />
                </motion.div>
                {notify && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
                )}
              </button>
            );
          }

          return (
            <button
              key={to}
              onClick={() => navigate(to)}
              aria-label={label}
              className="relative flex h-11 w-11 items-center justify-center"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {isActive && (
                <motion.div
                  layoutId="mobileTabActive"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute inset-0 rounded-full bg-secondary"
                />
              )}
              <motion.div
                  whileTap={{ scale: 0.85 }}
                  animate={{ scale: isActive ? 1.12 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="relative z-10"
                >
                  <Icon
                    className={`h-5 w-5 transition-colors duration-200 ${isActive ? "text-foreground" : "text-muted-foreground"}`}
                    strokeWidth={isActive ? 2.4 : 1.8}
                  />
                </motion.div>
              {notify && (
                <span className="absolute right-2 top-2 z-20 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}