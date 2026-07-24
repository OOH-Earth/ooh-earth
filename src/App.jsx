import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import CrtOverlay from '@/components/ooh/CrtOverlay';
import TvStatic from '@/components/ooh/TvStatic';
import CognitiveLayer from '@/components/ooh/cognitive/CognitiveLayer';
import ProtectedRoute from '@/components/ProtectedRoute';
// Add page imports here
import Home from '@/pages/Home';
import Map from '@/pages/Map';
import Report from '@/pages/Report';
import About from '@/pages/About';
import Support from '@/pages/Support';
import Plans from '@/pages/Plans';
import Dashboard from '@/pages/Dashboard';
import Campaign from '@/pages/Campaign';
import ArLens from '@/pages/ArLens';
import TrueCost from '@/pages/TrueCost';
import TrashId from '@/pages/TrashId';
import InHome from '@/pages/InHome';
import Zora from '@/pages/Zora';
import UiKit from '@/pages/UiKit';
import Guides from '@/pages/Guides';
import FieldId from '@/pages/FieldId';
import SuperCard from '@/pages/SuperCard';
import Channel from '@/pages/Channel';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

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
    <Routes>
    {/* Add your page Route elements here */}
    <Route path="/" element={<Home />} />
    <Route path="/map" element={<Map />} />
    <Route path="/report" element={<Report />} />
    <Route path="/about" element={<About />} />
    <Route path="/support" element={<Support />} />
    <Route path="/plans" element={<Plans />} />
    <Route path="/campaign" element={<Campaign />} />
    <Route path="/ar" element={<ArLens />} />
    <Route path="/scan" element={<TrueCost />} />
    <Route path="/trash" element={<TrashId />} />
    <Route path="/inhome" element={<InHome />} />
    <Route path="/zora" element={<Zora />} />
    <Route path="/kit" element={<UiKit />} />
    <Route path="/guides" element={<Guides />} />
    <Route path="/field-id" element={<FieldId />} />
    <Route path="/card" element={<SuperCard />} />
    <Route path="/channel" element={<Channel />} />
    <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
      <Route path="/dashboard" element={<Dashboard />} />
    </Route>
    <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
          <CrtOverlay />
          <TvStatic />
          <CognitiveLayer />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App