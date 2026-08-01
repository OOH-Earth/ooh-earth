import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { getRouteMeta } from '@/lib/routeMeta';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import CrtOverlay from '@/components/ooh/CrtOverlay';
import TvStatic from '@/components/ooh/TvStatic';
import CognitiveLayer from '@/components/ooh/cognitive/CognitiveLayer';
import MobileBottomTabs from '@/components/ooh/MobileBottomTabs';
import ProtectedRoute from '@/components/ProtectedRoute';
import Account from '@/pages/Account';
import StageBanner from '@/components/ooh/StageBanner';
import { WalkthroughProvider } from '@/lib/walkthroughContext';
import { RadioProvider } from '@/lib/radioContext';
import { LabGateProvider } from '@/components/ooh/LabGate';
import LabAccessRoute from '@/components/ooh/lab/LabAccessRoute';
import LabAdmin from '@/pages/LabAdmin';
// Add page imports here
import LabHub from '@/pages/LabHub';
import GenesisCoin from '@/pages/GenesisCoin';
import GenesisToken from '@/pages/GenesisToken';
import HexPoster from '@/pages/HexPoster';
import CoinPoster from '@/pages/CoinPoster';
import HexSimulator from '@/pages/HexSimulator';
import HexSpec from '@/pages/HexSpec';
import HexSequencer from '@/pages/HexSequencer';
import HexCompanion from '@/pages/HexCompanion';
import HexDevice3D from '@/pages/HexDevice3D';
import Devices from '@/pages/Devices';
import NfcFieldTag from '@/pages/NfcFieldTag';
import DesktopConsole from '@/pages/DesktopConsole';
import OohWatch from '@/pages/OohWatch';
import HexCoinCube from '@/pages/HexCoinCube';
import LabStatus from '@/pages/LabStatus';
import NftCreator from '@/pages/NftCreator';
import Home from '@/pages/Home';
import Map from '@/pages/Map';
import Report from '@/pages/Report';
import About from '@/pages/About';
import Support from '@/pages/Support';
import Plans from '@/pages/Plans';
import Dashboard from '@/pages/Dashboard';
import FdePortal from '@/pages/FdePortal';
import PortalOps from '@/pages/PortalOps';
import AtariPortfolio from '@/pages/AtariPortfolio';
import Sitemap from '@/pages/Sitemap';
import Blog from '@/pages/Blog';
import BlogArticle from '@/pages/BlogArticle';
import AgencyNewsroom from '@/pages/AgencyNewsroom';
import Store from '@/pages/Store';
import StoreItemDetail from '@/pages/StoreItemDetail';
import Campaign from '@/pages/Campaign';
import ArLens from '@/pages/ArLens';
import TrueCost from '@/pages/TrueCost';
import TrashId from '@/pages/TrashId';
import InHome from '@/pages/InHome';
import Zora from '@/pages/Zora';
import UiKit from '@/pages/UiKit';
import OperativeProfile from '@/pages/OperativeProfile';
import Guides from '@/pages/Guides';
import FieldId from '@/pages/FieldId';
import SuperCard from '@/pages/SuperCard';
import Channel from '@/pages/Channel';
import LocationDetail from '@/pages/LocationDetail';
import BusStops from '@/pages/BusStops';
import BusStopDetail from '@/pages/BusStopDetail';
import JourneyMap from '@/pages/JourneyMap';
import Categories from '@/pages/Categories';
import CategoryDirectory from '@/pages/CategoryDirectory';
import Regions from '@/pages/Regions';
import AdbustingPortal from '@/pages/portals/AdbustingPortal';
import EcologyPortal from '@/pages/portals/EcologyPortal';
import RiversPortal from '@/pages/portals/RiversPortal';
import WarZonesPortal from '@/pages/portals/WarZonesPortal';
import Careers from '@/pages/Careers';
import RadioOps from '@/pages/RadioOps';
import Console from '@/pages/Console';
import InvestorHub from '@/pages/InvestorHub';
import InvestorAccess from '@/pages/InvestorAccess';
import CapitalLead from '@/pages/CapitalLead';
import ClientPortal from '@/pages/portals/ClientPortal';
import InvestorDashboard from '@/pages/portals/InvestorDashboard';
import InvestorRoute from '@/components/InvestorRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();

  // Per-route canonical + og:url. Without this, the static homepage canonical in
  // index.html applies to every route (tells crawlers each page duplicates the
  // homepage). JS-executing crawlers pick this up; non-JS link-preview bots still
  // need server prerendering for full per-route OG (platform-level).
  useEffect(() => {
    const url = window.location.origin + location.pathname;
    const meta = getRouteMeta(location.pathname);
    const mkProp = (p) => () => { const m = document.createElement("meta"); m.setAttribute("property", p); return m; };
    const mkName = (n) => () => { const m = document.createElement("meta"); m.setAttribute("name", n); return m; };
    const set = (sel, make, attr, val) => {
      let el = document.head.querySelector(sel);
      if (!el) { el = make(); document.head.appendChild(el); }
      el.setAttribute(attr, val);
    };
    set('link[rel="canonical"]', () => { const l = document.createElement("link"); l.setAttribute("rel", "canonical"); return l; }, "href", url);
    set('meta[property="og:url"]', mkProp("og:url"), "content", url);
    set('meta[property="og:title"]', mkProp("og:title"), "content", meta.title);
    set('meta[property="og:description"]', mkProp("og:description"), "content", meta.desc);
    set('meta[property="og:image"]', mkProp("og:image"), "content", meta.image);
    set('meta[property="og:image:alt"]', mkProp("og:image:alt"), "content", meta.title);
    set('meta[name="twitter:title"]', mkName("twitter:title"), "content", meta.title);
    set('meta[name="twitter:description"]', mkName("twitter:description"), "content", meta.desc);
    set('meta[name="twitter:image"]', mkName("twitter:image"), "content", meta.image);
    set('meta[name="twitter:image:alt"]', mkName("twitter:image:alt"), "content", meta.title);
    document.title = meta.title;
  }, [location.pathname]);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <AnimatePresence mode="wait">
    <motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: 'easeOut' }}>
    <Routes location={location}>
    {/* Add your page Route elements here */}
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/" element={<Home />} />
    <Route path="/map" element={<Map />} />
    <Route path="/adbusting" element={<AdbustingPortal />} />
    <Route path="/ecology" element={<EcologyPortal />} />
    <Route path="/rivers" element={<RiversPortal />} />
    <Route path="/warzones" element={<WarZonesPortal />} />
    <Route path="/report" element={<Report />} />
    <Route path="/about" element={<About />} />
    <Route path="/support" element={<Support />} />
    <Route path="/plans" element={<Plans />} />
    <Route path="/campaign" element={<Campaign />} />
    <Route path="/store" element={<Store />} />
    <Route path="/store/:id" element={<StoreItemDetail />} />
    <Route path="/ar" element={<ArLens />} />
    <Route path="/scan" element={<TrueCost />} />
    <Route path="/trash" element={<TrashId />} />
    <Route path="/inhome" element={<InHome />} />
    <Route path="/zora" element={<Zora />} />
    <Route path="/kit" element={<UiKit />} />
    <Route path="/operative" element={<OperativeProfile />} />
    <Route path="/guides" element={<Guides />} />
    <Route path="/field-id" element={<FieldId />} />
    <Route path="/card" element={<SuperCard />} />
    <Route path="/channel" element={<Channel />} />
    <Route path="/location/:id" element={<LocationDetail />} />
    <Route path="/bus-stops" element={<BusStops />} />
    <Route path="/bus-stop/:id" element={<BusStopDetail />} />
    <Route path="/journey" element={<JourneyMap />} />
    <Route path="/categories" element={<Categories />} />
    <Route path="/category/:slug" element={<CategoryDirectory />} />
    <Route path="/regions" element={<Regions />} />
    <Route path="/careers" element={<Careers />} />
    <Route path="/blog" element={<Blog scope="public" />} />
    <Route path="/blog/:slug" element={<BlogArticle scope="public" />} />
    <Route path="/investor-access" element={<InvestorAccess />} />
    <Route path="/capital/:slug" element={<CapitalLead />} />
    <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
      <Route path="/account" element={<Account />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/fde" element={<FdePortal />} />
      <Route path="/portal/ops" element={<PortalOps />} />
      <Route path="/portfolio" element={<AtariPortfolio />} />
      <Route path="/radio-ops" element={<RadioOps />} />
      <Route path="/sitemap" element={<Sitemap />} />
      <Route path="/agency" element={<AgencyNewsroom />} />
      <Route path="/agency/blog" element={<Blog scope="agency" />} />
      <Route path="/agency/blog/:slug" element={<BlogArticle scope="agency" />} />
      <Route path="/lab/admin" element={<LabAdmin />} />
    </Route>
    {/* Lab — dynamic access guard (public/agency toggled per prototype via /lab/admin) */}
    <Route element={<LabAccessRoute />}>
      <Route path="/lab" element={<LabHub />} />
      <Route path="/lab/poster" element={<HexPoster />} />
      <Route path="/lab/coin-poster" element={<CoinPoster />} />
      <Route path="/lab/sequencer" element={<HexSequencer />} />
      <Route path="/lab/nft" element={<NftCreator />} />
      <Route path="/lab/coin" element={<GenesisCoin />} />
      <Route path="/lab/token" element={<GenesisToken />} />
      <Route path="/lab/simulator" element={<HexSimulator />} />
      <Route path="/lab/spec" element={<HexSpec />} />
      <Route path="/lab/companion" element={<HexCompanion />} />
      <Route path="/lab/devices" element={<Devices />} />
      <Route path="/lab/devices/field-tag" element={<NfcFieldTag />} />
      <Route path="/lab/devices/desktop" element={<DesktopConsole />} />
      <Route path="/lab/devices/watch" element={<OohWatch />} />
      <Route path="/lab/device" element={<HexDevice3D />} />
      <Route path="/lab/livingcoin" element={<HexCoinCube />} />
      <Route path="/lab/status" element={<LabStatus />} />
    </Route>
    <Route element={<InvestorRoute />}>
      <Route path="/investor" element={<InvestorHub />} />
      <Route path="/console" element={<Console />} />
      <Route path="/portal/investor" element={<InvestorDashboard />} />
      <Route path="/portal/client" element={<ClientPortal />} />
    </Route>
    <Route path="*" element={<PageNotFound />} />
    </Routes>
    </motion.div>
    </AnimatePresence>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <RadioProvider>
            <WalkthroughProvider>
              <LabGateProvider>
                <ScrollToTop />
                <StageBanner />
                <AuthenticatedApp />
                <CrtOverlay />
                <TvStatic />
                <CognitiveLayer />
                <MobileBottomTabs />
              </LabGateProvider>
            </WalkthroughProvider>
          </RadioProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App