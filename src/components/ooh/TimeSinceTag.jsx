import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

function formatDuration(ms, compact) {
  const clamped = Math.max(0, ms);
  const totalSeconds = Math.floor(clamped / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (compact) {
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (mins > 0) return `${mins}m`;
    return `${secs}s`;
  }

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (days > 0 || hours > 0) parts.push(`${hours}h`);
  parts.push(`${mins}m`);
  if (days === 0 && hours === 0) parts.push(`${secs}s`);
  return parts.join(" ");
}

/**
 * Rolling "time since last tag" counter. Ticks live off a Location's
 * status_updated_at (set whenever a verify/reject action runs — see
 * base44/functions/moderate/entry.ts and Dashboard.jsx's admin path).
 */
export default function TimeSinceTag({ since, compact = false, className = "" }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!since) return;
    const tickMs = compact ? 60000 : 1000;
    const t = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(t);
  }, [since, compact]);

  if (!since) return null;
  const startedAt = new Date(since).getTime();
  if (!Number.isFinite(startedAt)) return null;

  const label = formatDuration(now - startedAt, compact);

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono uppercase tracking-[0.2em] tabular-nums text-dim ${className}`}
      title={new Date(since).toISOString()}
    >
      <Clock className="h-3 w-3 shrink-0" />
      {compact ? label : `tagged ${label} ago`}
    </span>
  );
}
