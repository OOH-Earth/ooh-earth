import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

// Consistent mobile back-header for detail pages.
export default function MobileHeader({ to = '/map', label = 'Back' }) {
  return (
    <div
      className="sticky top-0 z-40 border-b border-slate2/60 bg-void/85 backdrop-blur-md lg:hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex items-center gap-2 px-4 py-3">
        <Link
          to={to}
          aria-label={label}
          className="flex h-8 w-8 items-center justify-center border border-slate2 text-silver transition-colors hover:border-ozone hover:text-ozone"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">{label}</span>
      </div>
    </div>
  );
}
