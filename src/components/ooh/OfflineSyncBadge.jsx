import { useState } from 'react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { CloudOff, Loader2, AlertTriangle, ShieldQuestion } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function OfflineSyncBadge() {
  const {
    pendingCount,
    failedCount,
    adoptableCount,
    foreignCount,
    identity,
    adoptHeld,
    syncing,
    flush,
    retryFailed,
  } = useOfflineSync();
  const [confirmOpen, setConfirmOpen] = useState(false);
  if (!pendingCount && !failedCount && !adoptableCount && !foreignCount) return null;
  const signedIn = identity?.id && identity.id !== 'anonymous';
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
      {adoptableCount > 0 && (
        // Reports saved on this device before this sign-in state (or by an
        // earlier session). Never sent automatically: the person decides.
        <>
          <button
            onClick={() => setConfirmOpen(true)}
            aria-label={`${adoptableCount} saved report${adoptableCount === 1 ? '' : 's'} on this device ${adoptableCount === 1 ? 'is' : 'are'} on hold. Review before sending.`}
            className="flex items-center gap-1.5 border border-ozone/60 px-2.5 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ozone transition-colors hover:bg-ozone hover:text-void"
          >
            <ShieldQuestion className="h-3.5 w-3.5" />
            <span>{adoptableCount} on hold</span>
          </button>
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Send {adoptableCount} saved report{adoptableCount === 1 ? '' : 's'}?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {adoptableCount === 1 ? 'This report was' : 'These reports were'} saved on this
                  device {signedIn ? 'before you signed in' : 'by an earlier session'}.{' '}
                  {signedIn
                    ? 'Sending will put them under the account you are signed in to now.'
                    : 'Sending will submit them without an account.'}{' '}
                  They stay on this device until you choose.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep on this device</AlertDialogCancel>
                <AlertDialogAction onClick={adoptHeld}>
                  {signedIn ? 'Send under this account' : 'Send without an account'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
      {foreignCount > 0 && (
        // Saved by a different signed-in account: kept, never sendable from here.
        <span
          role="status"
          aria-label={`${foreignCount} saved report${foreignCount === 1 ? '' : 's'} from another account ${foreignCount === 1 ? 'is' : 'are'} kept on this device`}
          className="flex items-center gap-1.5 border border-slate2 px-2.5 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-dim"
        >
          <ShieldQuestion className="h-3.5 w-3.5" />
          <span>{foreignCount} other account</span>
        </span>
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
