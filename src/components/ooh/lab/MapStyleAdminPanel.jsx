import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { MAP_STYLES, MAP_STYLE_DEFAULT_KEY } from "@/lib/mapStyleContext";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Map as MapIcon } from "lucide-react";

export default function MapStyleAdminPanel() {
  const { toast } = useToast();
  const [current, setCurrent] = useState(null); // null = loading
  const [recId, setRecId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await base44.entities.SiteSetting.filter({ key: MAP_STYLE_DEFAULT_KEY });
        const rec = rows?.[0];
        if (!active) return;
        if (rec) { setRecId(rec.id); setCurrent(rec.value || "dark"); }
        else setCurrent("dark");
      } catch {
        if (active) setCurrent("dark");
      }
    })();
    return () => { active = false; };
  }, []);

  const pick = async (id) => {
    setCurrent(id);
    setSaving(true);
    try {
      if (recId) {
        await base44.entities.SiteSetting.update(recId, { value: id });
      } else {
        const rec = await base44.entities.SiteSetting.create({ key: MAP_STYLE_DEFAULT_KEY, value: id });
        if (rec?.id) setRecId(rec.id);
      }
      toast({ title: "Map default saved" });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!current) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 font-mono text-[10px] text-silver/50">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-ozone" /> Loading map default…
      </div>
    );
  }

  return (
    <div className="px-4 py-3.5">
      <div className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-silver/55">
        <MapIcon className="h-3.5 w-3.5 text-ozone" /> Map style default · site-wide
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {MAP_STYLES.map((s) => {
          const on = s.id === current;
          return (
            <button
              key={s.id}
              onClick={() => pick(s.id)}
              className={`flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.15em] transition-all ${on ? "border-ozone bg-ozone text-void" : "border-slate2 text-silver/50 hover:border-silver/60"}`}
            >
              <span className={`h-1.5 w-1.5 ${on ? "bg-void/70" : "bg-silver/30"}`} />
              {s.label}
            </button>
          );
        })}
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-ozone" />}
      </div>
      <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.15em] text-silver/40">
        Sets the default map tile style for every visitor · users can still override locally from the map switcher
      </p>
    </div>
  );
}