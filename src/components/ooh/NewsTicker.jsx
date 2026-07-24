import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Radio, Loader2 } from "lucide-react";

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
  const [items, setItems] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt:
            "Return 8 recent real news headlines about outdoor advertising bans, billboard regulation, cities restricting commercial advertising in public spaces, or climate-justice activism against corporate advertising. Use real verifiable headlines from the last 18 months. Include source name and article URL.",
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              headlines: {
                type: "array",
                items: {
                  type: "object",
                  properties: { title: { type: "string" }, source: { type: "string" }, url: { type: "string" } },
                  required: ["title"],
                },
              },
            },
            required: ["headlines"],
          },
        });
        if (active) setItems(res?.headlines || []);
      } catch {
        if (active) setItems([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!items.length) {
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
      <div className="relative flex flex-1 items-center overflow-hidden">
        <div className="flex w-max animate-marquee items-center">
          <Row items={items} />
          <Row items={items} />
        </div>
      </div>
    </div>
  );
}