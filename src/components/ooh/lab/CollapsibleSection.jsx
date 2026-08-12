import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

// Collapsible admin section — click the header to show/hide the body.
// `defaultOpen` controls the initial state. A tone dot sits at the left
// for visual consistency with the OOH console aesthetic.
export default function CollapsibleSection({
  title,
  icon,
  led = 'ozone',
  defaultOpen = true,
  right = null,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const ledCls = led === 'ozone' ? 'bg-ozone' : led === 'flare' ? 'bg-flare' : 'bg-destructive';
  return (
    <section className="mt-6 border border-slate2 bg-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-slate2/20"
      >
        <span className={`h-1.5 w-1.5 rounded-full ${ledCls}`} />
        {icon}
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver/70">
          {title}
        </span>
        {right && <span className="ml-auto">{right}</span>}
        <ChevronDown
          className={`h-4 w-4 text-silver/40 transition-transform ${open ? '' : '-rotate-90'}`}
        />
      </button>
      {open && <div className="border-t border-slate2">{children}</div>}
    </section>
  );
}
