import { useRef, useState } from 'react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { CloudOff, Loader2, AlertTriangle, ShieldQuestion } from 'lucide-react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

// This dialog is composed locally (not via the shared AlertDialogContent) so it
// can sit ABOVE the app's fixed chrome: the shared dialog is z-50, while the
// mobile bottom tabs are z-[1000] and the bottom nudge bar z-[70] -- without this
// they draw over the dialog and stay clickable while it is open. The shared
// component's layering is deliberately left untouched. The content is capped to
// the visible height and scrolls inside, so nothing is clipped in short landscape.
/** @param {{ className?: string, children?: any, [key: string]: any }} props */
function HeldDraftsDialogContent({ className, ...props }) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay className="z-[2090]" />
      <AlertDialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-[2100] grid max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto border bg-background p-4 shadow-lg sm:p-6',
          className,
        )}
        {...props}
      />
    </AlertDialogPortal>
  );
}

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
  // Radix only restores focus to a <Trigger>; this dialog is opened by a plain
  // button, so return focus to it explicitly when the dialog closes.
  const holdButtonRef = useRef(null);
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
            ref={holdButtonRef}
            onClick={() => setConfirmOpen(true)}
            aria-label={`${adoptableCount} saved report${adoptableCount === 1 ? '' : 's'} on this device ${adoptableCount === 1 ? 'is' : 'are'} on hold. Review before sending.`}
            className="flex items-center gap-1.5 border border-ozone/60 px-2.5 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ozone transition-colors hover:bg-ozone hover:text-void"
          >
            <ShieldQuestion className="h-3.5 w-3.5" />
            <span>{adoptableCount} on hold</span>
          </button>
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <HeldDraftsDialogContent
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                holdButtonRef.current?.focus();
              }}
            >
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
              <ul className="max-h-[32dvh] space-y-2 overflow-y-auto">
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
            </HeldDraftsDialogContent>
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
