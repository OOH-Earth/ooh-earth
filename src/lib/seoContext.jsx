import { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { getRouteMeta } from '@/lib/routeMeta';

// Site-wide brand constants for JSON-LD
const SITE_NAME = 'OOH Earth';
const SITE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://oohearth.app';
const SITE_TWITTER = '@oohearth';

const SeoContext = createContext({ byPath: {}, loaded: false });

// Build a WebSite + Organization JSON-LD block once.
const SITE_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/map?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export function SeoProvider({ children }) {
  const [byPath, setByPath] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const recs = await base44.entities.PageMeta.list('-updated_date', 200);
        if (cancelled) return;
        const map = {};
        for (const r of recs) {
          if (r.path) map[r.path] = r;
        }
        setByPath(map);
      } catch {
        // DB not seeded yet — static fallback still works
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ byPath, loaded }), [byPath, loaded]);
  return <SeoContext.Provider value={value}>{children}</SeoContext.Provider>;
}

// Resolve metadata for a pathname: explicit override > PageMeta DB record > static routeMeta.
// override may contain any of { title, desc, description, image, noindex, jsonLd, type }.
function resolveMeta(pathname, byPath, override) {
  const db = byPath[pathname];
  const fallback = getRouteMeta(pathname);
  const o = override || {};
  const title = o.title || db?.title || fallback.title;
  const desc = o.desc || o.description || db?.description || fallback.desc;
  const image = o.image || db?.og_image || fallback.image;
  const noindex = o.noindex ?? db?.noindex ?? false;
  const type = o.type || 'website';
  return { title, desc, image, noindex, type, jsonLd: o.jsonLd || null };
}

// Applies all meta tags to <head> for the current route. Pages can pass an
// override to supply dynamic metadata (e.g. a store item title / blog post).
// Override takes priority over both the DB record and the static fallback.
export function useSeo(override) {
  const location = useLocation();
  const { byPath } = useContext(SeoContext);
  // Keep the latest override in a ref so the route effect re-applies it.
  const overrideRef = useRef(override);
  overrideRef.current = override;

  useEffect(() => {
    const meta = resolveMeta(location.pathname, byPath, overrideRef.current);
    const url = window.location.origin + location.pathname;

    const mkProp = (p) => () => {
      const m = document.createElement('meta');
      m.setAttribute('property', p);
      return m;
    };
    const mkName = (n) => () => {
      const m = document.createElement('meta');
      m.setAttribute('name', n);
      return m;
    };
    const set = (sel, make, attr, val) => {
      let el = document.head.querySelector(sel);
      if (!el) {
        el = make();
        document.head.appendChild(el);
      }
      el.setAttribute(attr, val);
    };
    const remove = (sel) => {
      document.head.querySelector(sel)?.remove();
    };

    // Canonical
    set(
      'link[rel="canonical"]',
      () => {
        const l = document.createElement('link');
        l.setAttribute('rel', 'canonical');
        return l;
      },
      'href',
      url,
    );

    // robots
    set(
      'meta[name="robots"]',
      mkName('robots'),
      'content',
      meta.noindex ? 'noindex, nofollow' : 'index, follow',
    );

    // Open Graph
    set('meta[property="og:url"]', mkProp('og:url'), 'content', url);
    set('meta[property="og:type"]', mkProp('og:type'), 'content', meta.type);
    set('meta[property="og:site_name"]', mkProp('og:site_name'), 'content', SITE_NAME);
    set('meta[property="og:title"]', mkProp('og:title'), 'content', meta.title);
    set('meta[property="og:description"]', mkProp('og:description'), 'content', meta.desc);
    set('meta[property="og:image"]', mkProp('og:image'), 'content', meta.image);
    set('meta[property="og:image:alt"]', mkProp('og:image:alt'), 'content', meta.title);
    set('meta[property="og:image:width"]', mkProp('og:image:width'), 'content', '1200');
    set('meta[property="og:image:height"]', mkProp('og:image:height'), 'content', '630');

    // Twitter
    set('meta[name="twitter:card"]', mkName('twitter:card'), 'content', 'summary_large_image');
    set('meta[name="twitter:site"]', mkName('twitter:site'), 'content', SITE_TWITTER);
    set('meta[name="twitter:title"]', mkName('twitter:title'), 'content', meta.title);
    set('meta[name="twitter:description"]', mkName('twitter:description'), 'content', meta.desc);
    set('meta[name="twitter:image"]', mkName('twitter:image'), 'content', meta.image);
    set('meta[name="twitter:image:alt"]', mkName('twitter:image:alt'), 'content', meta.title);

    // Standard meta
    set('meta[name="description"]', mkName('description'), 'content', meta.desc);

    document.title = meta.title;

    // JSON-LD: always emit the WebSite block; add a per-page block if provided.
    remove('script[data-seo="site"]');
    const siteScript = document.createElement('script');
    siteScript.type = 'application/ld+json';
    siteScript.setAttribute('data-seo', 'site');
    siteScript.textContent = JSON.stringify(SITE_JSONLD);
    document.head.appendChild(siteScript);

    remove('script[data-seo="page"]');
    if (meta.jsonLd) {
      const pageScript = document.createElement('script');
      pageScript.type = 'application/ld+json';
      pageScript.setAttribute('data-seo', 'page');
      pageScript.textContent = JSON.stringify(meta.jsonLd);
      document.head.appendChild(pageScript);
    }
  }, [location.pathname, byPath]);
}
