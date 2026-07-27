import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import CrtOverlay from '@/components/ooh/CrtOverlay';
import TvStatic from '@/components/ooh/TvStatic';
import CognitiveLayer from '@/components/ooh/cognitive/CognitiveLayer';
import MobileBottomTabs from '@/components/ooh/MobileBottomTabs';
import ProtectedRoute from '@/components/ProtectedRoute';
import { WalkthroughProvider } from '@/lib/walkthroughContext';
// Add page imports here
import Home from '@/pages/Home';
import Map from '@/pages/Map';
import Report from '@/pages/Report';
import About from '@/pages/About';
import Support from '@/pages/Support';
import Plans from '@/pages/Plans';
import Dashboard from '@/pages/Dashboard';
import FdePortal from '@/pages/FdePortal';
import AtariPortfolio from '@/pages/AtariPortfolio';
import Sitemap from '@/pages/Sitemap';
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
import AdbustingPortal from '@/pages/portals/AdbustingPortal';
import EcologyPortal from '@/pages/portals/EcologyPortal';
import RiversPortal from '@/pages/portals/RiversPortal';
import WarZonesPortal from '@/pages/portals/WarZonesPortal';
import Careers from '@/pages/Careers';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();

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
    <Route path="/careers" element={<Careers />} />
    <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/fde" element={<FdePortal />} />
      <Route path="/portfolio" element={<AtariPortfolio />} />
      <Route path="/sitemap" element={<Sitemap />} />
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
          <WalkthroughProvider>
            <ScrollToTop />
            <AuthenticatedApp />
            <CrtOverlay />
            <TvStatic />
            <CognitiveLayer />
            <MobileBottomTabs />
          </WalkthroughProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App