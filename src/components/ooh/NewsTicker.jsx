import { Radio, Loader2 } from "lucide-react";
import { useNewsHeadlines } from "@/hooks/useNewsHeadlines";
import DraggableTicker from "@/components/ooh/DraggableTicker";

function Row({ items }) {
  return (
    <>
      {items.map((it, i) => (
        <a
          key={i}
          href={it.url || "#"}
          target="_blank"
          rel="noreferrer"
          className="flex shrink-0 items-center gap-2 px-5"
        >
          <span className="h-1 w-1 rounded-full bg-ozone" />
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-silver/90">{it.title}</span>
          {it.source && <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">· {it.source}</span>}
          <span className="text-slate2">◆</span>
        </a>
      ))}
    </>
  );
}

export default function NewsTicker() {
  const { items, loading } = useNewsHeadlines();

  if (loading || !items.length) {
    return (
      <div className="flex h-8 items-center gap-2 border-b border-slate2/60 bg-void/90 px-5">
        <Loader2 className="h-3 w-3 animate-spin text-ozone" />
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// acquiring intel feed…</span>
      </div>
    );
  }

  return (
    <div className="flex h-8 items-center gap-3 border-b border-slate2/60 bg-void/90 px-5">
      <span className="flex shrink-0 items-center gap-1.5 border-r border-slate2/60 pr-4">
        <Radio className="h-3 w-3 animate-pulse text-ozone" />
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-ozone">Intel</span>
      </span>
      <DraggableTicker>
        <Row items={items} />
      </DraggableTicker>
    </div>
  );
}