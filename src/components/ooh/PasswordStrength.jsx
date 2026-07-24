import { useMemo } from "react";

function score(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const LEVELS = [
  { label: "Too short", color: "bg-dim" },
  { label: "Weak", color: "bg-destructive" },
  { label: "Fair", color: "bg-flare" },
  { label: "Good", color: "bg-ozone" },
  { label: "Strong", color: "bg-ozone" },
  { label: "Maximum", color: "bg-ozone" },
];

export default function PasswordStrength({ value }) {
  const s = useMemo(() => score(value), [value]);
  if (!value) return null;
  const level = LEVELS[s] || LEVELS[0];
  return (
    <div className="flex items-center gap-2 pt-1">
      <div className="flex flex-1 gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < s ? level.color : "bg-border"}`}
          />
        ))}
      </div>
      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
        {level.label}
      </span>
    </div>
  );
}