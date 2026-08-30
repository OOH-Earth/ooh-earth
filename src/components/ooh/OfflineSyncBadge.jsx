import { useOfflineSync } from '@/hooks/useOfflineSync';
import { CloudOff, Loader2, AlertTriangle } from 'lucide-react';

export default function OfflineSyncBadge() {
  const { pendingCount, failedCount, syncing, flush, retryFailed } = useOfflineSync();
  if (!pendingCount && !failedCount) return null;
  return (
    <div className="flex items-center gap-1.5">
      {pendingCount > 0 && (
        <button
          onClick={flush}
          disabled={syncing}
          aria-label={`${pendingCount} report${pendingCount === 1 ? '' : 's'} waiting to sync`}
          className="flex items-center gap-1.5 border border-flare/60 px-2.5 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-flare transition-colors hover:bg-flare hover:text-void disabled:opacity-50"
        >
          {syncing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CloudOff className="h-3.5 w-3.5" />
          )}
          <span>{pendingCount} queued</span>
        </button>
      )}
      {failedCount > 0 && (
        // Distinct from "queued" -- these stopped retrying automatically
        // (see useOfflineSync's flush()) and need an explicit tap. The
        // label says the evidence is safe and gives the next action,
        // rather than exposing the internal retry-exhaustion mechanism.
        <button
          onClick={retryFailed}
          disabled={syncing}
          aria-label={`${failedCount} report${failedCount === 1 ? '' : 's'} could not sync automatically. Your evidence is saved. Tap to retry sending.`}
          className="flex items-center gap-1.5 border border-red-500/60 px-2.5 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-red-400 transition-colors hover:bg-red-500 hover:text-void disabled:opacity-50"
        >
          {syncing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5" />
          )}
          <span>{failedCount} needs attention</span>
        </button>
      )}
    </div>
  );
}
