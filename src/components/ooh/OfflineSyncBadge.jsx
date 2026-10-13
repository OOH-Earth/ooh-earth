import { useState } from 'react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { CloudOff, Loader2, AlertTriangle, ShieldQuestion } from 'lucide-react';
import {
  AlertDialog,
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
    adoptable,
    adoptableCount,
    foreignCount,
    identity,
    adoptOne,
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
                  {adoptableCount} saved report{adoptableCount === 1 ? '' : 's'} on hold
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {adoptableCount === 1 ? 'This report was' : 'These reports were'} saved on this
                  device {signedIn ? 'before you signed in' : 'by an earlier session'} and have not
                  been sent. Choose each one separately.{' '}
                  {signedIn
                    ? 'Sending a report records your account as its contributor.'
                    : 'Sending a report submits it without an account, so you will not be able to find it afterwards.'}{' '}
                  Sent reports are not public: they wait for moderator review before they can appear
                  on the map.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <ul className="max-h-60 space-y-2 overflow-y-auto">
                {adoptable.map((draft) => (
                  <li
                    key={draft.id}
                    className="flex items-center justify-between gap-3 border border-slate2 px-3 py-2"
                  >
                    <span className="min-w-0 font-display text-sm">
                      <span className="block truncate">{draft.title}</span>
                      <span className="block font-mono text-[10px] uppercase tracking-[0.15em] text-dim">
                        Saved {new Date(draft.savedAt).toLocaleString()}
                        {draft.hasPhoto ? ' · photo' : ''}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => adoptOne(draft.id)}
                      disabled={syncing}
                      aria-label={`${signedIn ? 'Send under my account' : 'Send without an account'}: ${draft.title}`}
                      className="shrink-0 border border-ozone px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ozone transition-colors hover:bg-ozone hover:text-void disabled:opacity-50"
                    >
                      {signedIn ? 'Send under my account' : 'Send without account'}
                    </button>
                  </li>
                ))}
              </ul>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep on this device</AlertDialogCancel>
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
