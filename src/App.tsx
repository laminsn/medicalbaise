import { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { HIPAADisclaimer } from "@/components/compliance/HIPAADisclaimer";
import { Toaster } from "@/components/ui/toaster";
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
const BaiseHubLanding = lazy(() => import("./components/hub/BaiseHubLanding"));
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Browse = lazy(() => import("./pages/Browse"));
const Categories = lazy(() => import("./pages/Categories"));
const CategoryDetail = lazy(() => import("./pages/CategoryDetail"));
const PostJob = lazy(() => import("./pages/PostJob"));
const Profile = lazy(() => import("./pages/Profile"));
const ProfileEdit = lazy(() => import("./pages/ProfileEdit"));
const Settings = lazy(() => import("./pages/Settings"));
const Payments = lazy(() => import("./pages/Payments"));
const Messages = lazy(() => import("./pages/Messages"));
const Referral = lazy(() => import("./pages/Referral"));
const DoctorProfile = lazy(() => import("./pages/DoctorProfile"));
const ProviderProfileRouter = lazy(() => import("./pages/ProviderProfileRouter"));
const ProviderDashboard = lazy(() => import("./pages/ProviderDashboard"));
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard"));
const JobsMarketplace = lazy(() => import("./pages/JobsMarketplace"));
const JobDetails = lazy(() => import("./pages/JobDetails"));
const SubmitBid = lazy(() => import("./pages/SubmitBid"));
const MyJobs = lazy(() => import("./pages/MyJobs"));
const MyBids = lazy(() => import("./pages/MyBids"));
const MyQuotes = lazy(() => import("./pages/MyQuotes"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Notifications = lazy(() => import("./pages/Notifications"));
const MapView = lazy(() => import("./pages/MapView"));
const Chat = lazy(() => import("./pages/Chat"));
const SocialFeed = lazy(() => import("./pages/SocialFeed"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Reviews = lazy(() => import("./pages/Reviews"));
const ServicesSettings = lazy(() => import("./pages/ServicesSettings"));
const ServiceEditor = lazy(() => import("./pages/ServiceEditor"));
const Subscription = lazy(() => import("./pages/Subscription"));
const Team = lazy(() => import("./pages/Team"));
const Integrations = lazy(() => import("./pages/Integrations"));
const Payouts = lazy(() => import("./pages/Payouts"));
const Learn = lazy(() => import("./pages/Learn"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const HandleRedirect = lazy(() => import("./pages/HandleRedirect"));
const BookAppointment = lazy(() => import("./pages/BookAppointment"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const NotFound = lazy(() => import("./pages/NotFound"));

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

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="text-muted-foreground">Loading...</div>
  </div>
);

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
                <Suspense fallback={<PageLoader />}>
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
                </Suspense>
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
