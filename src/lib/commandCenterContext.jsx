import { createContext, useContext, useState, useCallback, lazy, Suspense } from 'react';

// Lazy, not a top-level import: CommandCenterProvider wraps the whole app
// (mounted unconditionally in App.jsx), so a static import here put
// CommandCenter's full subtree -- including GraffitiCamera, a device-camera
// capture UI nobody has opened yet -- in every page's initial bundle
// (~37KB uncompressed of app code, measured via `ANALYZE=true npm run
// build`'s bundle-analysis.html). openCommand is only ever wired to
// explicit onClick handlers (Nav/HeroConsole/SiteFooter), never called on
// mount, so nothing needs this chunk before a user actually opens it.
const CommandCenter = lazy(() => import('@/components/ooh/CommandCenter'));

const CommandCenterCtx = createContext(null);

export function useCommandCenter() {
  const ctx = useContext(CommandCenterCtx);
  return ctx ?? { openCommand: () => {}, closeCommand: () => {} };
}

export function CommandCenterProvider({ children }) {
  const [open, setOpen] = useState(false);
  // Mount CommandCenter on first open and never unmount it again -- once
  // loaded, it keeps the existing "stays mounted, toggles inert" behavior
  // relied on by useFocusTrap (KNOWN_ISSUES #38), it just isn't in the DOM
  // (or the bundle) at all before that first open.
  const [everOpened, setEverOpened] = useState(false);
  const openCommand = useCallback(() => {
    setEverOpened(true);
    setOpen(true);
  }, []);
  const closeCommand = useCallback(() => setOpen(false), []);
  return (
    <CommandCenterCtx.Provider value={{ openCommand, closeCommand }}>
      {children}
      {everOpened && (
        <Suspense fallback={null}>
          <CommandCenter open={open} onClose={closeCommand} />
        </Suspense>
      )}
    </CommandCenterCtx.Provider>
  );
}
