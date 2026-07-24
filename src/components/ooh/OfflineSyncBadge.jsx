import { useOfflineSync } from "@/hooks/useOfflineSync";
import { CloudOff, Loader2 } from "lucide-react";

export default function OfflineSyncBadge() {
  const { pendingCount, syncing, flush } = useOfflineSync();
  if (!pendingCount) return null;
  return (
    <button
      onClick={flush}
      disabled={syncing}
      className="flex items-center gap-1.5 border border-flare/60 px-2.5 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-flare transition-colors hover:bg-flare hover:text-void disabled:opacity-50"
    >
      {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CloudOff className="h-3.5 w-3.5" />}
      <span>{pendingCount} queued</span>
    </button>
  );
}