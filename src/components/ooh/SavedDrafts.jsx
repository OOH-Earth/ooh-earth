import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { adoptCapture, removeCapture } from '@/lib/offlineQueue';
import { classifyQueueItem, getQueueIdentity } from '@/lib/queueIdentity';

/**
 * Reports saved on this device that have not been confirmed as received. Another account's
 * draft is listed without its contents. Discarding removes the local copy only.
 */
export default function SavedDrafts({ open, onOpenChange, items, onSend, returnFocusRef }) {
  const describe = (item) => {
    const kind = item.version ? classifyQueueItem(item) : 'own';
    if (kind === 'foreign') return { kind, label: 'Saved by another account', note: '' };
    if (kind === 'adoptable')
      return {
        kind,
        label: item.payload?.title || 'Saved report',
        note: item.ticket_id
          ? 'A send was already attempted. Sign in as before to confirm it.'
          : 'Saved before this sign-in. It is sent only if you choose to.',
      };
    return {
      kind,
      label: item.payload?.title || 'Saved report',
      note:
        item.status === 'failed'
          ? 'Needs attention: automatic retries have stopped.'
          : item.ticket_id
            ? 'Delivery not confirmed yet.'
            : 'Waiting to send.',
    };
  };

  const discard = async (item) => {
    const warning = item.ticket_id
      ? 'Discard this saved copy? A send was attempted, so the report may already have arrived.'
      : 'Discard this saved report? It has not been sent.';
    if (window.confirm(warning)) await removeCapture(item.id);
  };

  const send = async (item) => {
    await adoptCapture(item.id, getQueueIdentity().id);
    onSend();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocusRef.current?.focus();
        }}
        className="z-[2100] max-h-[calc(100dvh_-_1rem)] max-w-md overflow-y-auto border-slate2 bg-void p-4 [&>button]:right-1 [&>button]:top-1 [&>button]:flex [&>button]:h-11 [&>button]:w-11 [&>button]:items-center [&>button]:justify-center"
      >
        <DialogTitle className="pr-11 font-display text-lg text-silver">Saved drafts</DialogTitle>
        <DialogDescription className="text-sm text-darkgray">
          Kept on this device until the server confirms them or you discard them.
        </DialogDescription>
        {items.length === 0 && <p className="text-sm text-darkgray">No saved drafts.</p>}
        <ul className="grid gap-2">
          {items.map((item) => {
            const draft = describe(item);
            return (
              <li key={item.id} className="border border-slate2/60 bg-card p-3">
                <p className="break-words font-mono text-[11px] font-bold text-silver">
                  {draft.label}
                </p>
                <p className="mt-1 text-xs text-darkgray">
                  {new Date(item.created).toLocaleString()}
                  {draft.note ? ` · ${draft.note}` : ''}
                </p>
                <div className="mt-2 flex gap-2">
                  {draft.kind === 'adoptable' && !item.ticket_id && (
                    <button
                      type="button"
                      onClick={() => send(item)}
                      className="min-h-11 border border-ozone px-3 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-ozone"
                    >
                      Send now
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => discard(item)}
                    className="min-h-11 border border-slate2 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-darkgray hover:border-flare hover:text-flare"
                  >
                    Discard
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
