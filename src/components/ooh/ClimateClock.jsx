import { useState, useEffect } from "react";

// Climate Clock homage — deadline countdown + carbon-budget lifeline.
// Reference window: 2020 budget start → 1.5°C exhaustion deadline.
const DEADLINE = new Date("2029-07-08T00:00:00Z").getTime();
const BUDGET_START = new Date("2020-01-01T00:00:00Z").getTime();
const YEAR_S = 31557600;

function parts(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    years: Math.floor(s / YEAR_S),
    days: Math.floor((s % YEAR_S) / 86400),
    hours: Math.floor((s % 86400) / 3600),
    mins: Math.floor((s % 3600) / 60),
    secs: s % 60,
  };
}

const pad = (n) => String(n).padStart(2, "0");

export default function ClimateClock({ onClick, className = "" }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const time = new Date(now).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Bangkok",
  });
  const { years, days, hours, mins, secs } = parts(DEADLINE - now);
  const lifeline = Math.max(0, Math.min(100, ((DEADLINE - now) / (DEADLINE - BUDGET_START)) * 100));

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Climate clock — open dashboard"
      className={`group flex flex-col items-start leading-none transition-opacity hover:opacity-90 ${className}`}
    >
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[13px] font-bold tabular tracking-[0.1em] text-silver">{time}</span>
        <span className="font-mono text-[7px] uppercase tracking-[0.3em] text-dim">BKK</span>
      </div>
      <div className="mt-0.5 flex items-center gap-1.5">
        <span className="font-mono text-[8px] font-bold uppercase tracking-[0.25em] text-flare">1.5°C</span>
        <span className="font-mono text-[8px] tabular tracking-[0.08em] text-darkgray">
          {years}y {days}d {pad(hours)}:{pad(mins)}:{pad(secs)}
        </span>
      </div>
      <div className="mt-1 h-[3px] w-32 overflow-hidden bg-slate2">
        <div
          className="h-full bg-flare transition-[width] duration-1000 ease-linear"
          style={{ width: `${lifeline}%` }}
        />
      </div>
    </button>
  );
}