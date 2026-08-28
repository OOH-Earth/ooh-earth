import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { markQualifiedVisit } from '@/lib/attribution';
import { trackEvent } from '@/lib/trackEvent';

const routeEvents = [
  [/^\/location\//, 'location_viewed'],
  [/^\/support$/, 'support_viewed'],
  [/^\/plans$/, 'plans_viewed'],
  [/^\/store(?:\/|$)/, 'store_viewed'],
];

export default function FunnelObserver() {
  const location = useLocation();

  useEffect(() => {
    trackEvent('landing_view');
    const qualify = (event) => {
      if (!event.isTrusted || !markQualifiedVisit()) return;
      trackEvent('qualified_visit', { qualification: event.type });
      cleanup();
    };
    const cleanup = () => {
      window.removeEventListener('pointerdown', qualify);
      window.removeEventListener('keydown', qualify);
      window.removeEventListener('scroll', qualify);
    };
    window.addEventListener('pointerdown', qualify, { passive: true });
    window.addEventListener('keydown', qualify);
    window.addEventListener('scroll', qualify, { passive: true });
    return cleanup;
  }, [location.pathname]);

  useEffect(() => {
    const match = routeEvents.find(([pattern]) => pattern.test(location.pathname));
    if (match) trackEvent(match[1], { route: location.pathname });
  }, [location.pathname]);

  return null;
}
