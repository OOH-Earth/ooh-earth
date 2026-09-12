import { useEffect, lazy, Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import PageNotFound from './lib/PageNotFound';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { SeoProvider, useSeo } from '@/lib/seoContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import CrtOverlay from '@/components/ooh/CrtOverlay';
import TvStatic from '@/components/ooh/TvStatic';
import CognitiveLayer from '@/components/ooh/cognitive/CognitiveLayer';
import MobileBottomTabs from '@/components/ooh/MobileBottomTabs';
import MatrixLoader from '@/components/ooh/MatrixLoader';
import { hydrateLoaderStyle } from '@/lib/loaderSettings';
import ProtectedRoute from '@/components/ProtectedRoute';
const Account = lazy(() => import('@/pages/Account'));
import StageBanner from '@/components/ooh/StageBanner';
import { WalkthroughProvider } from '@/lib/walkthroughContext';
import { CommandCenterProvider } from '@/lib/commandCenterContext';
import { RadioProvider } from '@/lib/radioContext';
import { LabGateProvider } from '@/components/ooh/LabGate';
import { MapStyleProvider } from '@/lib/mapStyleContext';
import LabAccessRoute from '@/components/ooh/lab/LabAccessRoute';
const LabAdmin = lazy(() => import('@/pages/LabAdmin'));
const StoreAdmin = lazy(() => import('@/pages/StoreAdmin'));
// Add page imports here
const LabHub = lazy(() => import('@/pages/LabHub'));
const Book = lazy(() => import('@/pages/Book'));
const GenesisCoin = lazy(() => import('@/pages/GenesisCoin'));
const GenesisToken = lazy(() => import('@/pages/GenesisToken'));
const HexPoster = lazy(() => import('@/pages/HexPoster'));
const CoinPoster = lazy(() => import('@/pages/CoinPoster'));
const HexSimulator = lazy(() => import('@/pages/HexSimulator'));
const HexSpec = lazy(() => import('@/pages/HexSpec'));
const HexSequencer = lazy(() => import('@/pages/HexSequencer'));
const HexCompanion = lazy(() => import('@/pages/HexCompanion'));
const HexDevice3D = lazy(() => import('@/pages/HexDevice3D'));
const Devices = lazy(() => import('@/pages/Devices'));
const NfcFieldTag = lazy(() => import('@/pages/NfcFieldTag'));
const DesktopConsole = lazy(() => import('@/pages/DesktopConsole'));
const OohWatch = lazy(() => import('@/pages/OohWatch'));
const HexCoinCube = lazy(() => import('@/pages/HexCoinCube'));
const LabStatus = lazy(() => import('@/pages/LabStatus'));
const LabStreetRunner = lazy(() => import('@/pages/LabStreetRunner'));
const AdScanLab = lazy(() => import('@/pages/AdScanLab'));
const GraffitiCam = lazy(() => import('@/pages/GraffitiCam'));
const NftCreator = lazy(() => import('@/pages/NftCreator'));
const Home = lazy(() => import('@/pages/Home'));
const EvidenceReview = lazy(() => import('@/pages/EvidenceReview'));
const Map = lazy(() => import('@/pages/Map'));
const Report = lazy(() => import('@/pages/Report'));
const MediaCorps = lazy(() => import('@/pages/MediaCorps'));
const About = lazy(() => import('@/pages/About'));
const Support = lazy(() => import('@/pages/Support'));
const Contact = lazy(() => import('@/pages/Contact'));
const Plans = lazy(() => import('@/pages/Plans'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const FdePortal = lazy(() => import('@/pages/FdePortal'));
const PortalOps = lazy(() => import('@/pages/PortalOps'));
const MissionControl = lazy(() => import('@/pages/MissionControl'));
const AtariPortfolio = lazy(() => import('@/pages/AtariPortfolio'));
const Sitemap = lazy(() => import('@/pages/Sitemap'));
const Blog = lazy(() => import('@/pages/Blog'));
const BlogArticle = lazy(() => import('@/pages/BlogArticle'));
const BlogStudio = lazy(() => import('@/pages/BlogStudio'));
const AgencyNewsroom = lazy(() => import('@/pages/AgencyNewsroom'));
const Store = lazy(() => import('@/pages/Store'));
const StoreItemDetail = lazy(() => import('@/pages/StoreItemDetail'));
const Campaign = lazy(() => import('@/pages/Campaign'));
const ArLens = lazy(() => import('@/pages/ArLens'));
const TrueCost = lazy(() => import('@/pages/TrueCost'));
const TrashId = lazy(() => import('@/pages/TrashId'));
const InHome = lazy(() => import('@/pages/InHome'));
const Zora = lazy(() => import('@/pages/Zora'));
const UiKit = lazy(() => import('@/pages/UiKit'));
const Brand = lazy(() => import('@/pages/Brand'));
const OperativeProfile = lazy(() => import('@/pages/OperativeProfile'));
const Guides = lazy(() => import('@/pages/Guides'));
const FieldId = lazy(() => import('@/pages/FieldId'));
const SuperCard = lazy(() => import('@/pages/SuperCard'));
const Channel = lazy(() => import('@/pages/Channel'));
const LocationDetail = lazy(() => import('@/pages/LocationDetail'));
const BusStops = lazy(() => import('@/pages/BusStops'));
const BusStopDetail = lazy(() => import('@/pages/BusStopDetail'));
const AccessKeys = lazy(() => import('@/pages/AccessKeys'));
const AccessKeyDetail = lazy(() => import('@/pages/AccessKeyDetail'));
const JourneyMap = lazy(() => import('@/pages/JourneyMap'));
const Categories = lazy(() => import('@/pages/Categories'));
const CategoryDirectory = lazy(() => import('@/pages/CategoryDirectory'));
const Regions = lazy(() => import('@/pages/Regions'));
const AdbustingPortal = lazy(() => import('@/pages/portals/AdbustingPortal'));
const GraffitiPortal = lazy(() => import('@/pages/portals/GraffitiPortal'));
const EcologyPortal = lazy(() => import('@/pages/portals/EcologyPortal'));
const RiversPortal = lazy(() => import('@/pages/portals/RiversPortal'));
const WarZonesPortal = lazy(() => import('@/pages/portals/WarZonesPortal'));
const Careers = lazy(() => import('@/pages/Careers'));
const CareerRole = lazy(() => import('@/pages/CareerRole'));
const CareersAdmin = lazy(() => import('@/pages/CareersAdmin'));
const RadioOps = lazy(() => import('@/pages/RadioOps'));
const Console = lazy(() => import('@/pages/Console'));
const InvestorHub = lazy(() => import('@/pages/InvestorHub'));
const InvestorAccess = lazy(() => import('@/pages/InvestorAccess'));
const CapitalLead = lazy(() => import('@/pages/CapitalLead'));
const ClientPortal = lazy(() => import('@/pages/portals/ClientPortal'));
const InvestorDashboard = lazy(() => import('@/pages/portals/InvestorDashboard'));
import InvestorRoute from '@/components/InvestorRoute';
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const OAuthConsent = lazy(() => import('@/pages/OAuthConsent'));

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();

  // Per-route SEO metadata — title, description, canonical, Open Graph,
  // Twitter card, robots, and JSON-LD. Resolves DB PageMeta records (editable
  // in Lab Admin) with a static fallback. Pages can override via useSeo().
  useSeo();

  // Hydrate the admin-controlled loading-screen style (matrix on/off) from the
  // DB on boot, so a change in Lab Admin reaches every visitor on next load.
  useEffect(() => {
    hydrateLoaderStyle();
  }, []);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return <MatrixLoader label="BOOTING" />;
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
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        <Suspense fallback={<MatrixLoader />}>
          <Routes location={location}>
            {/* Add your page Route elements here */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/oauth/consent" element={<OAuthConsent />} />
            <Route path="/" element={<Home />} />
            <Route path="/map" element={<Map />} />
            <Route path="/adbusting" element={<AdbustingPortal />} />
            <Route path="/graffiti" element={<GraffitiPortal />} />
            <Route path="/ecology" element={<EcologyPortal />} />
            <Route path="/rivers" element={<RiversPortal />} />
            <Route path="/warzones" element={<WarZonesPortal />} />
            <Route path="/report" element={<Report />} />
            <Route path="/media-corps" element={<MediaCorps />} />
            <Route path="/about" element={<About />} />
            <Route path="/support" element={<Support />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/evidence-review" element={<EvidenceReview />} />
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
            <Route path="/brand" element={<Brand />} />
            <Route path="/operative" element={<OperativeProfile />} />
            <Route path="/guides" element={<Guides />} />
            <Route path="/field-id" element={<FieldId />} />
            <Route path="/card" element={<SuperCard />} />
            <Route path="/channel" element={<Channel />} />
            <Route path="/location/:id" element={<LocationDetail />} />
            <Route path="/bus-stops" element={<BusStops />} />
            <Route path="/bus-stop/:id" element={<BusStopDetail />} />
            <Route path="/access-keys" element={<AccessKeys />} />
            <Route path="/access-keys/:slug" element={<AccessKeyDetail />} />
            <Route path="/journey" element={<JourneyMap />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/category/:slug" element={<CategoryDirectory />} />
            <Route path="/regions" element={<Regions />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/careers/:id" element={<CareerRole />} />
            <Route path="/blog" element={<Blog scope="public" />} />
            <Route path="/blog/:slug" element={<BlogArticle scope="public" />} />
            <Route path="/investor-access" element={<InvestorAccess />} />
            <Route path="/capital/:slug" element={<CapitalLead />} />
            <Route
              element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}
            >
              <Route path="/account" element={<Account />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/fde" element={<FdePortal />} />
              <Route path="/portal/ops" element={<PortalOps />} />
              <Route path="/mission-control" element={<MissionControl />} />
              <Route path="/portfolio" element={<AtariPortfolio />} />
              <Route path="/radio-ops" element={<RadioOps />} />
              <Route path="/sitemap" element={<Sitemap />} />
              <Route path="/agency" element={<AgencyNewsroom />} />
              <Route path="/agency/blog" element={<Blog scope="agency" />} />
              <Route path="/agency/blog/:slug" element={<BlogArticle scope="agency" />} />
              <Route path="/blog/studio" element={<BlogStudio />} />
              <Route path="/lab/admin" element={<LabAdmin />} />
              <Route path="/store/admin" element={<StoreAdmin />} />
              <Route path="/careers/admin" element={<CareersAdmin />} />
            </Route>
            {/* Lab — dynamic access guard (public/agency toggled per prototype via /lab/admin) */}
            <Route element={<LabAccessRoute />}>
              <Route path="/lab" element={<LabHub />} />
              <Route path="/lab/book" element={<Book />} />
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
              <Route path="/lab/streetrunner" element={<LabStreetRunner />} />
              <Route path="/lab/scanner" element={<AdScanLab />} />
              <Route path="/lab/graffiti-cam" element={<GraffitiCam />} />
            </Route>
            <Route element={<InvestorRoute />}>
              <Route path="/investor" element={<InvestorHub />} />
              <Route path="/console" element={<Console />} />
              <Route path="/portal/investor" element={<InvestorDashboard />} />
              <Route path="/portal/client" element={<ClientPortal />} />
            </Route>
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <SeoProvider>
            <MapStyleProvider>
              <RadioProvider>
                <WalkthroughProvider>
                  <CommandCenterProvider>
                    <LabGateProvider>
                      <ScrollToTop />
                      <StageBanner />
                      <ErrorBoundary>
                        <AuthenticatedApp />
                      </ErrorBoundary>
                      <CrtOverlay />
                      <TvStatic />
                      <CognitiveLayer />
                      <MobileBottomTabs />
                    </LabGateProvider>
                  </CommandCenterProvider>
                </WalkthroughProvider>
              </RadioProvider>
            </MapStyleProvider>
          </SeoProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
