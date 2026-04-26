import { ErrorBoundary } from "@/components/ErrorBoundary";
import { HIPAADisclaimer } from "@/components/compliance/HIPAADisclaimer";
import { Toaster } from "@/components/ui/toaster";
import Settings from "./pages/Settings";
import Payments from "./pages/Payments";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import { CallProvider } from "@/contexts/CallContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { NotificationPermissionBanner } from "@/components/notifications/NotificationPermissionBanner";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import BaiseHubLanding from "./components/hub/BaiseHubLanding";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Browse from "./pages/Browse";
import Categories from "./pages/Categories";
import CategoryDetail from "./pages/CategoryDetail";
import PostJob from "./pages/PostJob";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import Messages from "./pages/Messages";
import Referral from "./pages/Referral";
import DoctorProfile from "./pages/DoctorProfile";
import ProviderProfileRouter from "./pages/ProviderProfileRouter";
import ProviderDashboard from "./pages/ProviderDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import JobsMarketplace from "./pages/JobsMarketplace";
import JobDetails from "./pages/JobDetails";
import SubmitBid from "./pages/SubmitBid";
import MyJobs from "./pages/MyJobs";
import MyBids from "./pages/MyBids";
import MyQuotes from "./pages/MyQuotes";
import Favorites from "./pages/Favorites";
import Notifications from "./pages/Notifications";
import MapView from "./pages/MapView";
import Chat from "./pages/Chat";
import SocialFeed from "./pages/SocialFeed";
import Pricing from "./pages/Pricing";
import Reviews from "./pages/Reviews";
import ServicesSettings from "./pages/ServicesSettings";
import ServiceEditor from "./pages/ServiceEditor";
import Subscription from "./pages/Subscription";
import Team from "./pages/Team";
import Integrations from "./pages/Integrations";
import Payouts from "./pages/Payouts";
import Learn from "./pages/Learn";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import HandleRedirect from "./pages/HandleRedirect";
import BookAppointment from "./pages/BookAppointment";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import AuthCallback from "./pages/AuthCallback";

// Redirect component for legacy plural jobs route.
const JobsRedirect = () => {
  const { id } = useParams();
  if (!id) return <Navigate to="/jobs" replace />;
  return <Navigate to={`/job/${id}`} replace />;
};

const queryClient = new QueryClient();

// Component to initialize message notifications and session security
const MessageNotificationProvider = ({ children }: { children: React.ReactNode }) => {
  useMessageNotifications();
  useSessionTimeout();
  return <>{children}</>;
};

const App = () => (
  <ErrorBoundary>
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CallProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <HIPAADisclaimer />
            <BrowserRouter>
              <MessageNotificationProvider>
                <Routes>
                  <Route path="/" element={<BaiseHubLanding />} />
                  <Route path="/discover" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/browse" element={<Browse />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/categories/:categoryId" element={<CategoryDetail />} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/profile/edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
                  <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                  <Route path="/referral" element={<ProtectedRoute><Referral /></ProtectedRoute>} />
                  <Route path="/doctor/:id" element={<DoctorProfile />} />
                  <Route path="/provider/:id" element={<ProviderProfileRouter />} />
                  <Route path="/provider-dashboard" element={<ProtectedRoute><ProviderDashboard /></ProtectedRoute>} />
                  <Route path="/customer-dashboard" element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>} />
                  <Route path="/jobs" element={<JobsMarketplace />} />
                  <Route path="/jobs/:id" element={<JobsRedirect />} />
                  <Route path="/job/:id" element={<JobDetails />} />
                  <Route path="/job/:id/bid" element={<ProtectedRoute><SubmitBid /></ProtectedRoute>} />
                  <Route path="/book-appointment/:id" element={<ProtectedRoute><BookAppointment /></ProtectedRoute>} />
                  <Route path="/my-jobs" element={<ProtectedRoute><MyJobs /></ProtectedRoute>} />
                  <Route path="/my-bids" element={<ProtectedRoute><MyBids /></ProtectedRoute>} />
                  <Route path="/my-quotes" element={<ProtectedRoute><MyQuotes /></ProtectedRoute>} />
                  <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                  <Route path="/map" element={<MapView />} />
                  <Route path="/chat/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                  <Route path="/feed" element={<ProtectedRoute><SocialFeed /></ProtectedRoute>} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/reviews" element={<Reviews />} />
                  <Route path="/services" element={<ProtectedRoute><ServicesSettings /></ProtectedRoute>} />
                  <Route path="/services-settings" element={<ProtectedRoute><ServicesSettings /></ProtectedRoute>} />
                  <Route path="/services/:serviceId" element={<ProtectedRoute><ServiceEditor /></ProtectedRoute>} />
                  <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
                  <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
                  <Route path="/integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
                  <Route path="/payouts" element={<ProtectedRoute><Payouts /></ProtectedRoute>} />
                  <Route path="/post-job" element={<ProtectedRoute><PostJob /></ProtectedRoute>} />
                  <Route path="/help" element={<Learn />} />
                  <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/u/:handle" element={<HandleRedirect />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <NotificationPermissionBanner />
              </MessageNotificationProvider>
            </BrowserRouter>
          </TooltipProvider>
        </CallProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
  </ErrorBoundary>
);

export default App;
