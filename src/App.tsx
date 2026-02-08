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
import { NotificationPermissionBanner } from "@/components/notifications/NotificationPermissionBanner";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";
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
import ProviderProfile from "./pages/ProviderProfile";
import DoctorProfile from "./pages/DoctorProfile";
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

// Redirect component for old provider URLs
const ProviderRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/doctor/${id}`} replace />;
};

const queryClient = new QueryClient();

// Component to initialize message notifications
const MessageNotificationProvider = ({ children }: { children: React.ReactNode }) => {
  useMessageNotifications();
  return <>{children}</>;
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CallProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <MessageNotificationProvider>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/browse" element={<Browse />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/categories/:categoryId" element={<CategoryDetail />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/profile/edit" element={<ProfileEdit />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/referral" element={<Referral />} />
                  <Route path="/doctor/:id" element={<DoctorProfile />} />
                  <Route path="/provider/:id" element={<ProviderRedirect />} />
                  <Route path="/provider-dashboard" element={<ProviderDashboard />} />
                  <Route path="/customer-dashboard" element={<CustomerDashboard />} />
                  <Route path="/jobs" element={<JobsMarketplace />} />
                  <Route path="/job/:id" element={<JobDetails />} />
                  <Route path="/job/:id/bid" element={<SubmitBid />} />
                  <Route path="/my-jobs" element={<MyJobs />} />
                  <Route path="/my-bids" element={<MyBids />} />
                  <Route path="/my-quotes" element={<MyQuotes />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/map" element={<MapView />} />
                  <Route path="/chat/:id" element={<Chat />} />
                  <Route path="/feed" element={<SocialFeed />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/reviews" element={<Reviews />} />
                  <Route path="/services" element={<ServicesSettings />} />
                  <Route path="/services/:serviceId" element={<ServiceEditor />} />
                  <Route path="/subscription" element={<Subscription />} />
                  <Route path="/team" element={<Team />} />
                  <Route path="/integrations" element={<Integrations />} />
                  <Route path="/payouts" element={<Payouts />} />
                  <Route path="/post-job" element={<PostJob />} />
                  <Route path="/help" element={<Learn />} />
                  <Route path="/admin" element={<AdminDashboard />} />
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
);

export default App;