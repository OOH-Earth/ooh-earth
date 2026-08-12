import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { isAdmin } from '@/lib/clearance';
import Nav from '@/components/ooh/Nav';
import Breadcrumbs from '@/components/ooh/Breadcrumbs';
import SiteFooter from '@/components/ooh/SiteFooter';
import { useToast } from '@/components/ui/use-toast';
import StoreItemEditor from '@/components/ooh/store/StoreItemEditor';
import { CAT_META, priceLabel } from '@/components/ooh/store/catalog';
import {
  Loader2,
  Lock,
  ShoppingBag,
  Plus,
  Pencil,
  Trash2,
  Star,
  ExternalLink,
  Search,
} from 'lucide-react';

export default function StoreAdmin() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null); // record being edited (or {} for new)
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(null);
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    try {
      const recs = await base44.entities.StoreItem.list('-created_date');
      setItems(recs);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditing({});
    setOpen(true);
  };
  const openEdit = (item) => {
    setEditing(item);
    setOpen(true);
  };

  const save = async (payload) => {
    if (editing && editing.id) {
      await base44.entities.StoreItem.update(editing.id, payload);
      toast({ title: 'Item updated' });
    } else {
      await base44.entities.StoreItem.create(payload);
      toast({ title: 'Item created' });
    }
    await load();
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    setBusy(item.id);
    try {
      await base44.entities.StoreItem.delete(item.id);
      setItems((prev) => (prev || []).filter((i) => i.id !== item.id));
      toast({ title: 'Item deleted' });
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const filtered = (items || []).filter(
    (i) =>
      !q ||
      (i.title || '').toLowerCase().includes(q.toLowerCase()) ||
      (i.subtitle || '').toLowerCase().includes(q.toLowerCase()),
  );

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-void">
        <Nav />
        <div className="page-top flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-ozone" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin(user)) {
    return (
      <div className="min-h-screen bg-void text-silver">
        <Nav />
        <div className="page-top mx-auto max-w-md px-5 py-20 text-center">
          <Lock className="mx-auto h-8 w-8 text-flare" />
          <h1 className="mt-4 font-display text-2xl font-bold">Admin only</h1>
          <p className="mt-2 font-mono text-[11px] leading-relaxed text-silver/60">
            The store console is restricted to admin accounts. Log in with an admin account to
            manage store and library items.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block border border-ozone bg-ozone px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-void"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void text-silver grid-bg">
      <Nav />
      <div className="page-top mx-auto max-w-5xl px-5 py-10 md:px-8">
        <Breadcrumbs items={[{ label: 'Store', to: '/store' }, { label: 'Admin' }]} />

        {/* header */}
        <div className="mt-4 border border-slate2 bg-card">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate2 px-4 py-3">
            <ShoppingBag className="h-5 w-5 text-ozone" />
            <h1 className="font-display text-xl font-bold uppercase tracking-[0.16em]">
              Store <span className="text-ozone">Console</span>
            </h1>
            <button
              onClick={openNew}
              className="ml-auto flex items-center gap-1.5 border border-ozone bg-ozone px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-void transition-colors hover:bg-flare hover:border-flare"
            >
              <Plus className="h-3.5 w-3.5" /> New item
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className="font-mono text-lg font-bold tabular text-ozone">
              {items?.length ?? '–'}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-silver/40">
              items
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-flare">
              {items?.filter((i) => i.featured).length || 0} featured
            </span>
            <div className="ml-auto flex items-center gap-2 border border-slate2 bg-void px-2.5 py-1.5">
              <Search className="h-3 w-3 text-silver/40" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Filter…"
                className="w-32 bg-transparent font-mono text-[10px] text-silver outline-none placeholder:text-silver/30 sm:w-48"
              />
            </div>
          </div>
        </div>

        <p className="mt-4 max-w-2xl font-mono text-[11px] leading-relaxed text-silver/55">
          Create, edit, and remove store and library items. Changes publish to the live store
          immediately. Only one item can be the featured spotlight at a time — setting a new item as
          featured will not unset others here, so toggle the previous one off if needed.
        </p>

        {/* list */}
        {items === null ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-ozone" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-20 text-center font-mono text-[11px] text-silver/50">
            {q ? 'No matches.' : 'No items yet — create one.'}
          </p>
        ) : (
          <div className="mt-6 space-y-1.5">
            {filtered.map((item, i) => {
              const meta = CAT_META[item.category] || CAT_META.library;
              const Icon = meta.icon;
              return (
                <div
                  key={item.id}
                  className="border border-slate2 bg-card transition-colors hover:border-silver/30"
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="font-mono text-[10px] tabular text-silver/40">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {item.featured && <Star className="h-3.5 w-3.5 fill-ozone text-ozone" />}
                    <Icon className="h-3.5 w-3.5 text-silver/50" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-sm font-bold">{item.title}</div>
                      {item.subtitle && (
                        <div className="truncate font-mono text-[9px] uppercase tracking-[0.15em] text-silver/40">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                    <span className="hidden font-mono text-[9px] uppercase tracking-[0.15em] text-silver/40 sm:inline">
                      {meta.label}
                    </span>
                    <span className="font-mono text-[10px] font-bold tabular text-ozone">
                      {priceLabel(item)}
                    </span>
                    <Link
                      to={`/store/${item.id}`}
                      target="_blank"
                      className="text-silver/30 transition-colors hover:text-ozone"
                      title="Open on store"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    <button
                      onClick={() => openEdit(item)}
                      className="text-silver/50 transition-colors hover:text-ozone"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => remove(item)}
                      disabled={busy === item.id}
                      className="text-silver/50 transition-colors hover:text-flare disabled:opacity-40"
                      title="Delete"
                    >
                      {busy === item.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <SiteFooter />

      <StoreItemEditor item={editing} open={open} onClose={() => setOpen(false)} onSave={save} />
    </div>
  );
}
