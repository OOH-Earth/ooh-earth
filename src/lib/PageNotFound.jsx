import { useLocation, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import BrandMark from '@/components/ooh/BrandMark';

// OOH Earth — 404 / catch-all. Orbital Perspective (void / ozone / flare), with the
// animated brandmark as the centrepiece. Keeps the auth check + admin note.
export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);

  const { data: authData, isFetched } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        return { user, isAuthenticated: true };
      } catch (error) {
        return { user: null, isAuthenticated: false };
      }
    },
  });

  const isAdmin = isFetched && authData?.isAuthenticated && authData.user?.role === 'admin';

  return (
    <div className="grid-bg flex min-h-screen items-center justify-center bg-void px-6 py-16 text-silver">
      <div className="w-full max-w-md text-center">
        <div
          className="mx-auto mb-8 flex h-24 w-24 items-center justify-center"
          style={{ filter: 'drop-shadow(0 0 20px rgba(237,255,0,0.25))' }}
        >
          <BrandMark className="h-20 w-20" />
        </div>

        <div className="font-mono text-[11px] uppercase tracking-[0.35em] text-flare">
          // Signal lost
        </div>
        <h1 className="mt-4 font-display text-7xl font-black leading-none tracking-[-0.03em] text-silver md:text-8xl">
          404
        </h1>
        <div className="mx-auto mt-4 h-px w-16 bg-ozone/50" />

        <h2 className="mt-6 font-display text-2xl font-bold tracking-[-0.01em] text-silver">
          Off the map.
        </h2>
        <p className="mt-3 font-mono text-xs leading-relaxed text-darkgray">
          The coordinate <span className="text-ozone">&ldquo;/{pageName}&rdquo;</span> isn&rsquo;t
          on the atlas. It may have moved, or never existed.
        </p>

        {isAdmin && (
          <div className="mt-8 border border-slate2/60 bg-ozone/[0.03] p-4 text-left">
            <div className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-flare" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver/80">
                  Admin note
                </p>
                <p className="mt-1 font-mono text-[11px] leading-relaxed text-darkgray">
                  This route may not be implemented yet — ask the builder to add it in chat.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="border-2 border-ozone bg-ozone px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:border-flare hover:bg-flare"
          >
            Return to base
          </Link>
          <Link
            to="/map"
            className="border border-slate2 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-silver transition-colors hover:border-ozone hover:text-ozone"
          >
            Open field map
          </Link>
        </div>
      </div>
    </div>
  );
}
