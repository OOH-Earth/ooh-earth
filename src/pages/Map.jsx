import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { usePersistentState } from '@/hooks/usePersistentState';
import { base44 } from '@/api/base44Client';
import Nav from '@/components/ooh/Nav';
import LocationMap from '@/components/ooh/LocationMap';
import MapToolbar from '@/components/ooh/map/MapToolbar';
import MapSidebar from '@/components/ooh/map/MapSidebar';
import MapSearch from '@/components/ooh/map/MapSearch';
import LocationCard from '@/components/ooh/map/LocationCard';
import seedMarkers from '@/components/ooh/mapSeed';
import { toMarker } from '@/components/ooh/map/markerUtils';
import { computeFreshness } from '@/lib/fieldCheckFreshness';
import {
  Loader2,
  FileDown,
  Megaphone,
  Map as MapIcon,
  Globe,
  ScanSearch,
  Camera,
  Key,
  Crosshair,
  SprayCan,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Fingerprint,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWalkthrough } from '@/lib/walkthroughContext';
import UnitFinder from '@/components/ooh/UnitFinder';
import QuickCapture from '@/components/ooh/QuickCapture';
import GraffitiCamera from '@/components/ooh/GraffitiCamera';
import Globe3D from '@/components/ooh/Globe3D';
import MapAlertTicker from '@/components/ooh/map/MapAlertTicker';
import MapLayerToggle, { DEFAULT_LAYERS } from '@/components/ooh/map/MapLayerToggle';
import PullToRefresh from '@/components/ooh/PullToRefresh';
import ClaimLeadDialog from '@/components/ooh/map/ClaimLeadDialog';
import SpecsBar from '@/components/ooh/uikit/pinlab/SpecsBar';
import { OOH_FUTURES } from '@/components/ooh/map/futures';
import { useMushroomData } from '@/components/ooh/map/layers/useMushroomData';
import { useFloraData } from '@/components/ooh/map/layers/useFloraData';
import { useWarZoneData } from '@/components/ooh/map/layers/useWarZoneData';
import { RIVER_SOURCES } from '@/components/ooh/map/layers/riverData';
import LayerResultCard from '@/components/ooh/map/LayerResultCard';
import MapStyleSwitcher from '@/components/ooh/map/MapStyleSwitcher';
import MapBottomSheet from '@/components/ooh/map/MapBottomSheet';
import FieldTallyWidget from '@/components/ooh/map/FieldTallyWidget';
import { useMapStyle } from '@/lib/mapStyleContext';
import RadioStationCard from '@/components/ooh/map/RadioStationCard';
import { RADIO_STATIONS } from '@/components/ooh/radio/radioStations';

const TOUR = [
  {
    title: 'Welcome to OOH Map',
    body: 'The live field map of corporate advertising spots — documented by members worldwide.',
  },
  {
    target: '[data-tour="layout"]',
    title: 'Layout modes',
    body: 'Switch between Split, Map-dominant, and List views to control how much of the map you see.',
  },
  {
    target: '[data-tour="filters"]',
    title: 'Filter by type',
    body: 'Isolate billboards, digital screens, painted takeovers, and more.',
  },
  {
    target: '[data-tour="search"]',
    title: 'Search & reset',
    body: 'Find a location by street or city, then reset filters in one tap.',
  },
  {
    target: '[data-tour="cards"]',
    title: 'The record',
    body: 'Every card is a logged spot. Click one to fly the map to its pin.',
  },
  {
    target: '[data-tour="map"]',
    title: 'Field map',
    body: 'Pan and zoom to explore. Popups show photo, status, and directions.',
  },
  {
    target: '[data-tour="report"]',
    title: 'Log a spot',
    body: 'File a new field report — GPS + photo, no login. Reports appear here instantly.',
  },
  {
    target: '[data-tour="theme"]',
    title: 'Light / Dark',
    body: 'Toggle the Solar Smoke light mode or the signature black canvas anytime.',
  },
  {
    target: '[data-tour="hud-tel"]',
    title: 'Orbital telemetry',
    body: 'Switch to Globe view — live coordinates, bearing, pitch and view-span stream as you fly.',
  },
  {
    target: '[data-tour="hud-pm25"]',
    title: 'Air Commons intel',
    body: 'Live PM2.5 from global-south monitoring stations, benchmarked against WHO limits.',
  },
  {
    target: '[data-tour="map"]',
    title: 'OOH Futures — Global South roadmap',
    body: 'Dashed markers scattered among live spots are futures: placeholder expansion pillars across Lagos, Nairobi, Jakarta, São Paulo, Manila, Dhaka and beyond. Hover one to preview its phase.',
  },
  {
    target: '[data-tour="map"]',
    title: 'Roadmap phases',
    body: 'Each future carries a target quarter — Q3 2026 through 2028. When a phase opens, members can claim a future to seed the local network and convert it into live locations.',
  },
  { title: 'Ready to go', body: "You're all set. File your first report.", cta: true },
];

export default function Map() {
  const [raw, setRaw] = useState(null);
  const [user, setUser] = useState(null);
  const [mode, setMode] = usePersistentState('ooh-map-mode', 'split');
  const [searchCollapsed, setSearchCollapsed] = usePersistentState(
    'ooh-map-search-collapsed',
    false,
  );
  const [resultsCollapsed, setResultsCollapsed] = usePersistentState(
    'ooh-map-results-collapsed',
    false,
  );
  const [typeFilter, setTypeFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const [view, setView] = usePersistentState('ooh-map-view', 'globe');
  const [bounds, setBounds] = useState(null);
  const [followViewport, setFollowViewport] = usePersistentState('ooh-map-follow', true);
  const [userLoc, setUserLoc] = useState(null);
  const { startTour, registerSteps } = useWalkthrough();
  const [finderOpen, setFinderOpen] = useState(false);
  const [flyTo, setFlyTo] = useState(null);
  const [activeLayers, setActiveLayers] = usePersistentState('ooh-map-layers-v2', DEFAULT_LAYERS);
  const [layerFilter, setLayerFilter] = useState('all');
  const { style: mapStyle } = useMapStyle();
  const { spots: mushrooms, loading: mushLoading } = useMushroomData();
  const { spots: floraSpots, loading: floraLoading } = useFloraData();
  const { zones: warZones, loading: warLoading } = useWarZoneData();

  const toggleLayer = (id) => {
    setActiveLayers((prev) => (prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]));
  };

  useEffect(() => {
    registerSteps(TOUR);
  }, [registerSteps]);

  // Lightweight identity check for the "My Discoveries" layer -- deliberately
  // not useGamification() here, which would trigger its own full
  // base44.listAllLocations() fetch duplicating the one reloadLocations()
  // already does below for the exact same records.
  useEffect(() => {
    let cancelled = false;
    base44.auth
      .me()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Dispatch a resize event after panel transitions so Leaflet/MapLibre
  // recalculate their container dimensions (fixes gray tiles / misalignment).
  useEffect(() => {
    const t = setTimeout(() => window.dispatchEvent(new Event('resize')), 320);
    return () => clearTimeout(t);
  }, [searchCollapsed, resultsCollapsed, mode]);

  // City deep-link: /map?area=london geocodes the city and flies the map there.
  // Does NOT set the text filter — that would hide every pin for cities with
  // no field data yet (the map should still show the city location).
  useEffect(() => {
    const area = new URLSearchParams(window.location.search).get('area');
    if (!area) return;
    let cancelled = false;
    (async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=en&q=${encodeURIComponent(area)}`;
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        const results = res.ok ? await res.json() : [];
        if (!cancelled && results.length) {
          const r = results[0];
          setFlyTo({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), zoom: 12, nonce: Date.now() });
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [captureOpen, setCaptureOpen] = useState(false);
  const [graffitiCamOpen, setGraffitiCamOpen] = useState(false);
  const [claims, setClaims] = useState([]);
  const [claimTarget, setClaimTarget] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [sheetSnap, setSheetSnap] = useState('peek');
  const [detailItem, setDetailItem] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [globeClusters, setGlobeClusters] = useState(0);
  const viewportTimerRef = useRef(null);
  const viewportRequestRef = useRef(0);
  const requestedViewportRef = useRef('');

  // Mobile detection — lg breakpoint (1024px) separates the mobile sheet
  // layout from the desktop split layout.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Fullscreen body class — hides the global mobile bottom tabs.
  useEffect(() => {
    if (fullscreen) document.body.classList.add('map-fullscreen');
    else document.body.classList.remove('map-fullscreen');
    return () => document.body.classList.remove('map-fullscreen');
  }, [fullscreen]);

  // Expand a pin's compact popup into the full detail in the bottom sheet.
  const handleExpandPin = useCallback((m) => {
    setDetailItem(m);
    setSelectedId(m.id);
    setSheetSnap('half');
  }, []);

  const reloadLocations = useCallback(async () => {
    try {
      // One global query, no status filter -- RLS already limits what
      // comes back to all verified checks plus the caller's own
      // pending/rejected ones, same as it always did for the "living
      // record" flag below. Widened (not duplicated) so the same fetch
      // also covers the freshness signal (src/lib/fieldCheckFreshness.js,
      // shared with FieldCheckPanel), which needs pending checks too, to
      // detect a genuinely newer unverified re-check.
      const [recs, checks] = await Promise.all([
        base44.listAllLocations(),
        base44.entities.FieldCheck.filter({}, '-created_date', 2000, 0, [
          'location_id',
          'status',
          'created_date',
        ]).catch(() => []),
      ]);
      // Plain object, not `new Map()` -- this component is itself named
      // `Map`, which shadows the global Map constructor in this scope.
      const checksByLocation = {};
      for (const c of checks || []) {
        const key = String(c.location_id);
        (checksByLocation[key] ??= []).push(c);
      }
      // "Living record" = has at least one verified re-check, i.e. the same
      // eligibility PR #56's before/after comparison already uses. Computed
      // as one extra global query, not per-marker — a FieldCheck getting
      // verified doesn't fire a Location realtime event, so this flag only
      // refreshes on reload/pull-to-refresh, not instantly.
      const livingRecordIds = new Set(
        (checks || []).filter((c) => c.status === 'verified').map((c) => String(c.location_id)),
      );
      const markers = (recs || [])
        .filter((r) => r.status !== 'rejected')
        .map((r) => ({
          ...toMarker(r),
          livingRecord: livingRecordIds.has(String(r.id)),
          freshness: computeFreshness(r, checksByLocation[String(r.id)] || []),
        }));
      setRaw(markers.length ? { markers, live: true } : { markers: seedMarkers, live: false });
    } catch (e) {
      setRaw({ markers: seedMarkers, live: false });
    }
  }, []);

  const loadViewportLocations = useCallback(async (viewport) => {
    const viewportKey = JSON.stringify(viewport);
    if (requestedViewportRef.current === viewportKey) return;
    requestedViewportRef.current = viewportKey;
    const requestId = ++viewportRequestRef.current;
    try {
      const recs = await /** @type {any} */ (base44).listViewportLocations(viewport);
      const ids = (recs || []).map((r) => String(r.id)).filter(Boolean);
      const checks = ids.length
        ? await base44.entities.FieldCheck.filter(
            { location_id: { $in: ids } },
            '-created_date',
            2000,
            0,
            ['location_id', 'status', 'created_date'],
          ).catch(() => [])
        : [];
      if (requestId !== viewportRequestRef.current) return;
      const checksByLocation = {};
      for (const c of checks || []) {
        const key = String(c.location_id);
        (checksByLocation[key] ??= []).push(c);
      }
      const livingRecordIds = new Set(
        (checks || []).filter((c) => c.status === 'verified').map((c) => String(c.location_id)),
      );
      const markers = (recs || [])
        .filter((r) => r.status !== 'rejected')
        .map((r) => ({
          ...toMarker(r),
          livingRecord: livingRecordIds.has(String(r.id)),
          freshness: computeFreshness(r, checksByLocation[String(r.id)] || []),
        }));
      setRaw({ markers, live: true });
    } catch {
      if (requestId === viewportRequestRef.current) setRaw({ markers: [], live: false });
    }
  }, []);

  useEffect(() => {
    if (view === 'flat' && bounds) loadViewportLocations(bounds);
  }, [bounds, loadViewportLocations, view]);

  const handleBoundsChange = useCallback(
    (nextBounds) => {
      setBounds(nextBounds);
      if (view !== 'flat') return;
      if (viewportTimerRef.current) clearTimeout(viewportTimerRef.current);
      viewportTimerRef.current = setTimeout(() => {
        loadViewportLocations(nextBounds);
      }, 250);
    },
    [loadViewportLocations, view],
  );

  useEffect(() => {
    return () => {
      if (viewportTimerRef.current) clearTimeout(viewportTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (view === 'globe') reloadLocations().then(() => {});
    else {
      viewportRequestRef.current += 1;
      setRaw({ markers: [], live: false });
    }

    const unsub = base44.entities.Location.subscribe((event) => {
      setRaw((cur) => {
        if (!cur || !cur.live) return cur;
        let markers = cur.markers;
        const m = toMarker(event.data);
        if (event.type === 'create')
          markers = [
            { ...m, livingRecord: false, freshness: null },
            ...markers.filter((x) => x.id !== m.id),
          ];
        else if (event.type === 'update') {
          if (m.status === 'rejected') markers = markers.filter((x) => x.id !== m.id);
          else
            markers = markers.map((x) =>
              x.id === m.id ? { ...m, livingRecord: x.livingRecord, freshness: x.freshness } : x,
            );
        } else if (event.type === 'delete') markers = markers.filter((x) => x.id !== m.id);
        return { ...cur, markers };
      });
    });
    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, [reloadLocations, view]);

  // Contribution deep-link: /map?highlight=<locationId>, used by the report
  // wizard's and AR's "View on map" links so a user's own new submission is
  // immediately obvious, not just a generic map open. Reuses the same
  // select+detail-sheet action a normal pin click already triggers
  // (handleExpandPin) -- LocationMap.jsx and Globe3D.jsx both already fly to
  // and visually distinguish whatever selectedId names, so no new map
  // architecture is needed. Applied once per page load (a later background
  // marker refresh shouldn't snap a user back after they've selected
  // something else) once the freshly reloaded marker list actually contains
  // the target id (a just-created record needs the post-navigation fetch to
  // complete first).
  const highlightAppliedRef = useRef(false);
  useEffect(() => {
    if (highlightAppliedRef.current) return;
    const id = new URLSearchParams(window.location.search).get('highlight');
    if (!id || !raw?.markers?.length) return;
    const m = raw.markers.find((x) => String(x.id) === id);
    if (m) {
      handleExpandPin(m);
      highlightAppliedRef.current = true;
    }
  }, [raw, handleExpandPin]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!cancelled) setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadClaims = async () => {
      try {
        const recs = await base44.entities.LeadClaim.list('-created_date', 500, 0, [
          'location_id',
          'status',
          'created_date',
        ]);
        if (!cancelled) setClaims(recs || []);
      } catch {
        if (!cancelled) setClaims([]);
      }
    };
    loadClaims();
    const unsub = base44.entities.LeadClaim.subscribe(() => loadClaims());
    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, []);

  const claimsByLoc = useMemo(() => {
    const map = {};
    claims.forEach((c) => {
      if (c.status === 'released') return;
      const ex = map[c.location_id];
      if (!ex || new Date(c.created_date) > new Date(ex.created_date)) map[c.location_id] = c;
    });
    return map;
  }, [claims]);

  // "My Discoveries" (Intelligence group) -- an ownership filter on the
  // exact same markers already loaded for every other layer, not a second
  // Location fetch. Malformed/missing coordinates are excluded rather than
  // ever placed at a fallback point.
  const mineOnly = activeLayers.includes('mine');

  const filtered = useMemo(() => {
    const list = raw?.markers || [];
    const q = query.trim().toLowerCase();
    return list
      .filter(
        (m) =>
          (typeFilter === 'all' || m.type === typeFilter) &&
          (!mineOnly ||
            (user && m.created_by_id === user.id && isFinite(m.lat) && isFinite(m.lng))) &&
          (!q ||
            `${m.title} ${m.address} ${m.brand_name || ''} ${m.parent_corp || ''}`
              .toLowerCase()
              .includes(q)),
      )
      .sort((a, b) => {
        const aPhoto = a.status === 'verified' && !!a.image ? 2 : a.image ? 1 : 0;
        const bPhoto = b.status === 'verified' && !!b.image ? 2 : b.image ? 1 : 0;
        return bPhoto - aPhoto;
      });
  }, [raw, typeFilter, query, mineOnly, user]);

  // Street layers are overlapping views of the Location entity.
  // "ads" is the superset (all markers); "adbusting" and "graffiti" are
  // subsets. When multiple street layers are active we show the union,
  // with "ads" absorbing the others since it contains every marker.
  const { primaryLayer, layerFiltered } = useMemo(() => {
    const hasAds = activeLayers.includes('ads');
    const hasAdbust = activeLayers.includes('adbusting');
    const hasGraffiti = activeLayers.includes('graffiti');

    let streetLayer = null;
    let lf = [];

    if (hasAds) {
      streetLayer = 'ads';
      lf = filtered;
    } else if (hasAdbust || hasGraffiti) {
      streetLayer = hasAdbust ? 'adbusting' : 'graffiti';
      lf = filtered.filter((m) => {
        const isAdbust = hasAdbust && m.adbust_type && m.adbust_type !== 'none';
        const isGraffiti =
          hasGraffiti &&
          (m.graffiti_medium ||
            ['painted', 'mural', 'sticker'].includes(m.type) ||
            ['painted_over', 'wheatpasted'].includes(m.adbust_type));
        return isAdbust || isGraffiti;
      });
    }

    // External layers (mushrooms, rivers, etc.) take priority for the sidebar
    // only when no street layer is active. They render their own map markers
    // via LayerManager, so Location pins are cleared to avoid clutter.
    if (!streetLayer) {
      const ext = ['rivers', 'mushrooms', 'flora', 'war', 'radio'].find((l) =>
        activeLayers.includes(l),
      );
      // Heat is built from the same Location data as the street layers, not
      // a separate decorative layer -- it shouldn't be starved of markers
      // just because no street sub-filter happens to also be active.
      const heatOnly = !ext && activeLayers.includes('heat');
      return { primaryLayer: ext || null, layerFiltered: heatOnly ? filtered : [] };
    }

    return { primaryLayer: streetLayer, layerFiltered: lf };
  }, [activeLayers, filtered]);

  // Results feed follows the map viewport (flat view): only spots inside the
  // visible bounds, nearest-to-centre first — the "search this area" pattern.
  const adsInView = useMemo(() => {
    if (view !== 'flat' || !followViewport || !bounds) return layerFiltered;
    const { n, s, e, w } = bounds;
    const inLng = (lng) => (w <= e ? lng >= w && lng <= e : lng >= w || lng <= e);
    const cLat = (n + s) / 2;
    const cLng = (w + e) / 2;
    return layerFiltered
      .filter((m) => isFinite(m.lat) && isFinite(m.lng) && m.lat <= n && m.lat >= s && inLng(m.lng))
      .sort(
        (a, b) =>
          (a.lat - cLat) ** 2 + (a.lng - cLng) ** 2 - ((b.lat - cLat) ** 2 + (b.lng - cLng) ** 2),
      );
  }, [layerFiltered, view, followViewport, bounds]);

  useEffect(() => {
    setLayerFilter('all');
  }, [primaryLayer]);

  const layerLoading =
    primaryLayer === 'mushrooms'
      ? mushLoading
      : primaryLayer === 'flora'
        ? floraLoading
        : primaryLayer === 'war'
          ? warLoading
          : false;

  const layerResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (text) => !q || text.toLowerCase().includes(q);
    switch (primaryLayer) {
      case 'ads':
      case 'adbusting':
      case 'graffiti':
        return adsInView;
      case 'mushrooms':
        return mushrooms.filter(
          (s) =>
            (layerFilter === 'all' || s.region === layerFilter) &&
            matches(`${s.species} ${s.region} ${s.habitat} ${s.note || ''}`),
        );
      case 'flora':
        return floraSpots.filter(
          (s) =>
            (layerFilter === 'all' || s.ecosystem === layerFilter) &&
            matches(`${s.species} ${s.region} ${s.ecosystem} ${s.note || ''}`),
        );
      case 'war':
        return warZones.filter(
          (z) =>
            (layerFilter === 'all' ||
              (layerFilter === 'critical'
                ? z.severity === 'critical'
                : z.severity !== 'critical')) &&
            matches(`${z.title} ${z.region} ${z.advisory} ${z.source || ''}`),
        );
      case 'rivers':
        return RIVER_SOURCES.filter(
          (s) =>
            (layerFilter === 'all' || s.pollution === layerFilter) &&
            matches(`${s.name} ${s.river} ${s.notes}`),
        );
      case 'radio':
        return RADIO_STATIONS.filter(
          (s) =>
            isFinite(s.lat) &&
            isFinite(s.lng) &&
            (layerFilter === 'all' || s.category === layerFilter) &&
            matches(`${s.name} ${s.city} ${s.country} ${s.genre}`),
        );
      default:
        return [];
    }
  }, [primaryLayer, filtered, adsInView, mushrooms, floraSpots, warZones, layerFilter, query]);

  const counts = useMemo(() => {
    const c = {};
    (raw?.markers || []).forEach((m) => {
      c[m.type] = (c[m.type] || 0) + 1;
    });
    return c;
  }, [raw]);

  const exportGeoJSON = () => {
    const fc = {
      type: 'FeatureCollection',
      features: filtered.map((m) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [m.lng, m.lat] },
        properties: {
          title: m.title,
          address: m.address,
          type: m.type,
          status: m.status,
          link: m.link,
          image: m.image,
        },
      })),
    };
    const blob = new Blob([JSON.stringify(fc, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ooh-earth-locations.geojson';
    a.click();
    URL.revokeObjectURL(url);
  };

  const leads = adsInView.filter((m) => !m.image && m.status !== 'verified').length;
  const isStreet =
    primaryLayer === 'ads' || primaryLayer === 'adbusting' || primaryLayer === 'graffiti';

  // Mobile: map always visible, cards always hidden (bottom sheet replaces).
  // Desktop: mode controls split/list/map as before.
  const sidebarHidden = mode === 'map';
  const searchWrapClass = sidebarHidden
    ? 'hidden'
    : `hidden lg:block shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${searchCollapsed ? 'w-0' : 'w-[300px]'}`;
  const cardsWidth = mode === 'split' && resultsCollapsed ? 'lg:w-0' : 'lg:w-[340px]';
  const cardsClass = sidebarHidden
    ? 'hidden'
    : mode === 'list'
      ? 'hidden lg:flex lg:flex-1'
      : `hidden lg:flex ${cardsWidth} min-h-0 flex-col overflow-hidden transition-all duration-300 ease-in-out border-r ${resultsCollapsed ? 'border-transparent' : 'border-slate2/60'}`;
  const mapClass = mode === 'list' ? 'flex-1 lg:hidden' : 'flex-1';

  // Shared results list — rendered in the desktop cards panel and the mobile
  // bottom sheet so both stay in sync from the same state.
  const renderResultsContent = () => (
    <PullToRefresh onRefresh={reloadLocations} className="min-h-0 flex-1">
      <div className="space-y-px">
        {!primaryLayer ? (
          <div className="p-6 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
            // No active layers — toggle a layer above
          </div>
        ) : layerLoading ? (
          <div className="p-6 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
            // Loading {primaryLayer} data…
          </div>
        ) : layerResults.length ? (
          isStreet ? (
            layerResults.map((m) => (
              <LocationCard
                key={m.id}
                m={m}
                selected={selectedId === m.id}
                onSelect={(x) => setSelectedId(x.id)}
                onHover={(x) => setHoverId(x.id)}
                onHoverEnd={() => setHoverId(null)}
                claim={claimsByLoc[m.id]}
                onClaim={setClaimTarget}
              />
            ))
          ) : primaryLayer === 'radio' ? (
            layerResults.map((s) => <RadioStationCard key={s.id} station={s} />)
          ) : (
            layerResults.map((item, i) => (
              <LayerResultCard key={`${primaryLayer}-${i}`} item={item} layer={primaryLayer} />
            ))
          )
        ) : mineOnly && filtered.length === 0 ? (
          <div className="p-6 text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
              // No field discoveries yet
            </div>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-dim/60">
              File a report to begin your personal intelligence layer
            </p>
            <Link
              to="/report"
              className="mt-3 inline-flex items-center gap-1 border border-ozone bg-ozone px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:bg-flare"
            >
              Log a spot
            </Link>
          </div>
        ) : isStreet && followViewport && view === 'flat' ? (
          <div className="p-6 text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
              // No spots in this view
            </div>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-dim/60">
              Pan or zoom out to widen the sweep
            </p>
            {filtered.length > 0 && (
              <button
                onClick={() => setFollowViewport(false)}
                className="mt-3 inline-flex items-center gap-1 border border-slate2 px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone"
              >
                Show all {filtered.length}
              </button>
            )}
          </div>
        ) : (
          <div className="p-6 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
            // No {primaryLayer} matches{query ? ` for "${query}"` : ''}
          </div>
        )}
      </div>
    </PullToRefresh>
  );

  return (
    <div
      className={`fixed inset-0 flex flex-col overflow-hidden bg-void ${fullscreen ? 'pt-0 pb-0' : 'pt-[calc(7rem_+_env(safe-area-inset-top))] md:pt-[calc(8rem_+_env(safe-area-inset-top))] pb-[calc(76px_+_env(safe-area-inset-bottom))] lg:pb-0'}`}
    >
      {!fullscreen && <Nav />}
      {!fullscreen && (
        <div className="hidden lg:block">
          <MapToolbar
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            mode={mode}
            setMode={setMode}
            count={layerResults.length}
            live={raw?.live}
            counts={counts}
            total={raw?.markers?.length || 0}
            activeLayers={activeLayers}
            primaryLayer={primaryLayer}
            layerFilter={layerFilter}
            setLayerFilter={setLayerFilter}
          />
        </div>
      )}
      {!fullscreen && (
        <div className="hidden lg:block">
          <MapLayerToggle
            activeLayers={activeLayers}
            onToggle={toggleLayer}
            hiddenLayerIds={user ? [] : ['mine']}
          />
        </div>
      )}

      {/* Mobile compact bar — search + fullscreen toggle */}
      {!fullscreen && (
        <div className="flex items-center gap-1.5 border-b border-slate2/60 bg-void/95 px-2 py-1.5 backdrop-blur-md lg:hidden">
          <div className="min-w-0 flex-1">
            <MapSearch
              query={query}
              setQuery={setQuery}
              onFlyTo={(f) => setFlyTo({ ...f, nonce: Date.now() })}
              onReset={() => {
                setQuery('');
                setTypeFilter('all');
                setLayerFilter('all');
              }}
            />
          </div>
          {/* The desktop layer toggle bar above is lg:hidden on mobile
              (true for every layer, not something this feature changes) --
              this is a dedicated mobile-reachable control for just this
              one new layer rather than reworking mobile chrome for all of
              them. */}
          {user && (
            <button
              onClick={() => toggleLayer('mine')}
              aria-label="My Discoveries"
              aria-pressed={mineOnly}
              className={`flex h-8 w-8 shrink-0 items-center justify-center border transition-colors ${
                mineOnly
                  ? 'border-ozone bg-ozone text-void'
                  : 'border-slate2/60 text-dim hover:border-ozone hover:text-ozone'
              }`}
            >
              <Fingerprint className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => setFullscreen(true)}
            aria-label="Fullscreen map"
            className="flex h-8 w-8 shrink-0 items-center justify-center border border-ozone/60 text-ozone transition-colors hover:bg-ozone hover:text-void"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {!raw ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-ozone" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
              Acquiring coordinates…
            </span>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {mode !== 'map' && (
            <div className={searchWrapClass}>
              <MapSidebar
                query={query}
                setQuery={setQuery}
                onFlyTo={(f) => setFlyTo({ ...f, nonce: Date.now() })}
                onReset={() => {
                  setQuery('');
                  setTypeFilter('all');
                  setLayerFilter('all');
                }}
                onBeginTour={startTour}
                onCollapse={mode === 'split' ? () => setSearchCollapsed(true) : undefined}
              />
            </div>
          )}

          <div data-tour="cards" className={`min-h-0 flex-col ${cardsClass}`}>
            <div className="flex items-center justify-between border-b border-slate2/60 px-4 py-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
                // {layerResults.length}
                {isStreet && followViewport && view === 'flat' ? (
                  <>
                    {' '}
                    in view<span className="text-dim/60"> · {filtered.length} total</span>
                  </>
                ) : (
                  ' results'
                )}
                {isStreet && leads > 0 && <span className="text-flare/80"> · {leads} leads</span>}
              </span>
              <div className="flex items-center gap-2">
                {isStreet && view === 'flat' && (
                  <button
                    onClick={() => setFollowViewport((v) => !v)}
                    title="Results feed follows the map view"
                    className={`flex items-center gap-1 border px-1.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] transition-colors ${followViewport ? 'border-ozone/60 bg-ozone/10 text-ozone' : 'border-slate2 text-darkgray hover:border-ozone/60 hover:text-ozone'}`}
                  >
                    <Crosshair className="h-3 w-3" /> Follow map
                  </button>
                )}
                {mode === 'split' && (
                  <button
                    onClick={() => setResultsCollapsed(true)}
                    aria-label="Collapse results panel"
                    title="Collapse results"
                    className="flex h-6 w-6 shrink-0 items-center justify-center border border-slate2/60 text-dim transition-colors hover:border-ozone hover:text-ozone"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            {renderResultsContent()}
          </div>

          <div data-tour="map" className={`relative min-h-0 isolate ${mapClass}`}>
            {/* Expand tabs — terminal edge tabs for collapsed panels */}
            {mode === 'split' && (searchCollapsed || resultsCollapsed) && (
              <div className="absolute left-0 top-1/2 z-[1001] flex -translate-y-1/2 flex-col gap-1">
                {searchCollapsed && (
                  <button
                    onClick={() => setSearchCollapsed(false)}
                    aria-label="Expand search panel"
                    title="Expand search"
                    className="flex h-16 w-5 items-center justify-center border-y border-r border-slate2 bg-void/90 text-dim backdrop-blur-md transition-colors hover:border-ozone hover:text-ozone"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
                {resultsCollapsed && (
                  <button
                    onClick={() => setResultsCollapsed(false)}
                    aria-label="Expand results panel"
                    title="Expand results"
                    className="flex h-16 w-5 items-center justify-center border-y border-r border-slate2 bg-void/90 text-dim backdrop-blur-md transition-colors hover:border-ozone hover:text-ozone"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
            <div className="absolute left-3 top-3 z-[1000] flex border border-slate2 bg-void/80 backdrop-blur-md">
              <button
                onClick={() => setView('flat')}
                aria-label="Flat map"
                className={`flex items-center gap-1.5 px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] transition-colors ${view === 'flat' ? 'bg-ozone text-void' : 'text-darkgray hover:text-ozone'}`}
              >
                <MapIcon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Flat</span>
              </button>
              <button
                onClick={() => setView('globe')}
                aria-label="Globe view"
                className={`flex items-center gap-1.5 px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] transition-colors ${view === 'globe' ? 'bg-ozone text-void' : 'text-darkgray hover:text-ozone'}`}
              >
                <Globe className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Globe</span>
              </button>
            </div>
            {view === 'globe' ? (
              <Globe3D
                key={mapStyle.id}
                markers={layerFiltered}
                selectedId={selectedId}
                hoverId={hoverId}
                onSelect={setSelectedId}
                userLoc={userLoc}
                activeLayers={activeLayers}
                flyTo={flyTo}
                onError={() => setView('flat')}
                onCounts={(c) => setGlobeClusters(c.clusters)}
              />
            ) : (
              <LocationMap
                markers={layerFiltered}
                selectedId={selectedId}
                hoverId={hoverId}
                onSelect={setSelectedId}
                userLoc={userLoc}
                futures={OOH_FUTURES}
                activeLayers={activeLayers}
                onBoundsChange={handleBoundsChange}
                fitBounds={false}
                flyTo={flyTo}
                compactPopup={isMobile}
                onExpandPin={handleExpandPin}
              />
            )}
            <FieldTallyWidget
              markers={layerFiltered}
              clusters={view === 'globe' ? globeClusters : 0}
              className={view === 'flat' ? 'bottom-[60px]' : 'bottom-3'}
            />
            <div className="pointer-events-none absolute left-3 right-3 top-12 z-[900] md:top-14">
              <MapAlertTicker />
            </div>
            {view === 'flat' && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[900]">
                <SpecsBar counts={counts} total={raw?.markers?.length || 0} />
              </div>
            )}
            <div className="absolute right-3 top-3 z-[1000] flex items-center gap-1.5">
              <div className="hidden md:flex items-center gap-1.5">
                <MapStyleSwitcher />
                <button
                  onClick={() => setFinderOpen(true)}
                  aria-label="Find units"
                  className="hidden md:flex items-center gap-1.5 border border-ozone/60 bg-void/80 px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-ozone backdrop-blur-md transition-colors hover:bg-ozone hover:text-void"
                >
                  <ScanSearch className="h-3.5 w-3.5" />{' '}
                  <span className="hidden sm:inline">Find</span>
                </button>
                <button
                  onClick={exportGeoJSON}
                  aria-label="Export GeoJSON"
                  className="hidden md:flex items-center gap-1.5 border border-slate2 bg-void/80 px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-darkgray backdrop-blur-md transition-colors hover:border-ozone hover:text-ozone"
                >
                  <FileDown className="h-3.5 w-3.5" />{' '}
                  <span className="hidden sm:inline">GeoJSON</span>
                </button>
                <a
                  href="https://oohearth.app/access-keys/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Access keys reference"
                  className="hidden md:flex items-center gap-1.5 border border-slate2 bg-void/80 px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-darkgray backdrop-blur-md transition-colors hover:border-ozone hover:text-ozone"
                >
                  <Key className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Keys</span>
                </a>
              </div>
              <div className="hidden md:block h-8 w-px bg-slate2/60" />
              <button
                onClick={() => setGraffitiCamOpen(true)}
                aria-label="Graffiti camera"
                className="flex items-center gap-1.5 border border-flare bg-flare px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-ozone hover:border-ozone"
              >
                <SprayCan className="h-3.5 w-3.5" />{' '}
                <span className="hidden sm:inline">Graffiti</span>
              </button>
              <button
                onClick={() => setCaptureOpen(true)}
                aria-label="Capture photo"
                className="flex items-center gap-1.5 border border-ozone bg-ozone px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare"
              >
                <Camera className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Capture</span>
              </button>
              <Link
                data-tour="report"
                to="/report"
                aria-label="Report"
                className="flex items-center gap-1.5 border border-ozone bg-ozone px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare"
              >
                <Megaphone className="h-3.5 w-3.5" />{' '}
                <span className="hidden sm:inline">Report</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom sheet — outside map isolate so z-index works above bottom nav */}
      {raw && (
        <MapBottomSheet
          count={layerResults.length}
          layerLabel={primaryLayer}
          detailMode={!!detailItem}
          onCloseDetail={() => setDetailItem(null)}
          snap={sheetSnap}
          onSnapChange={setSheetSnap}
          fullscreen={fullscreen}
          onToggleFullscreen={() => setFullscreen((f) => !f)}
        >
          {detailItem ? (
            <div className="p-3">
              <LocationCard
                m={detailItem}
                selected
                onSelect={() => {}}
                onHover={() => {}}
                onHoverEnd={() => {}}
                claim={claimsByLoc[detailItem.id]}
                onClaim={setClaimTarget}
              />
            </div>
          ) : (
            renderResultsContent()
          )}
        </MapBottomSheet>
      )}

      <ClaimLeadDialog
        open={!!claimTarget}
        onClose={() => setClaimTarget(null)}
        location={claimTarget}
      />
      <UnitFinder open={finderOpen} onClose={() => setFinderOpen(false)} />
      <QuickCapture open={captureOpen} onClose={() => setCaptureOpen(false)} />
      <GraffitiCamera open={graffitiCamOpen} onClose={() => setGraffitiCamOpen(false)} />
    </div>
  );
}
