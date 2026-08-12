import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { LOADER_SETTING_KEY, LOADER_DEFAULT, writeLoaderCache } from '@/lib/loaderSettings';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, MonitorPlay } from 'lucide-react';

// Admin toggle for the site-wide loading-screen style. Persists to the
// SiteSetting entity (key: loader_style) and mirrors to localStorage so the
// loader picks it up synchronously. "matrix" = digital rain, "off" = minimal
// spinner. More styles can be added later.
export default function LoaderAdminPanel() {
  const { toast } = useToast();
  const [style, setStyle] = useState(null); // null = loading; "matrix" | "off"
  const [recId, setRecId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await base44.entities.SiteSetting.filter({ key: LOADER_SETTING_KEY });
        const rec = rows?.[0];
        if (!active) return;
        if (rec) {
          setRecId(rec.id);
          setStyle(rec.value?.trim() || LOADER_DEFAULT);
          // Dedup stale duplicate rows (keep the first / canonical)
          if (rows.length > 1)
            rows.slice(1).forEach((r) => base44.entities.SiteSetting.delete(r.id).catch(() => {}));
        } else {
          setStyle(LOADER_DEFAULT);
        }
      } catch {
        if (active) setStyle(LOADER_DEFAULT);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const persist = async (value) => {
    setStyle(value);
    writeLoaderCache(value); // reflect immediately in this admin's session
    setSaving(true);
    try {
      if (recId) {
        await base44.entities.SiteSetting.update(recId, { value });
      } else {
        const rec = await base44.entities.SiteSetting.create({ key: LOADER_SETTING_KEY, value });
        if (rec?.id) setRecId(rec.id);
      }
      toast({ title: `Matrix loader ${value === 'matrix' ? 'on' : 'off'}` });
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!style) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 font-mono text-[10px] text-silver/50">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-ozone" /> Loading loader settings…
      </div>
    );
  }

  const matrixOn = style === 'matrix';
  const Opt = ({ id, label }) => {
    const on = (id === 'matrix') === matrixOn;
    return (
      <button
        onClick={() => persist(id)}
        className={`flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.15em] transition-all ${
          on
            ? 'border-ozone bg-ozone text-void'
            : 'border-slate2 text-silver/50 hover:border-silver/60'
        }`}
      >
        <span className={`h-1.5 w-1.5 ${on ? 'bg-void/70' : 'bg-silver/30'}`} />
        {label}
      </button>
    );
  };

  return (
    <div className="px-4 py-3.5">
      <div className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-silver/55">
        <MonitorPlay className="h-3.5 w-3.5 text-ozone" /> Loading screen · site-wide
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Opt id="matrix" label="Matrix" />
        <Opt id="off" label="Off · minimal" />
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-ozone" />}
      </div>
      <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.15em] text-silver/40">
        matrix = digital-rain boot &amp; page loaders · off = minimal spinner · more styles coming
      </p>
    </div>
  );
}
