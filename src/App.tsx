import { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { HIPAADisclaimer } from "@/components/compliance/HIPAADisclaimer";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import { CallProvider } from "@/contexts/CallContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { NotificationPermissionBanner } from "@/components/notifications/NotificationPermissionBanner";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { AttributionTracker } from "@/components/analytics/AttributionTracker";
import { PilotModeBanner } from "@/components/pilot/PilotModeBanner";
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
const TestCohortRedeem = lazy(() => import("./pages/TestCohortRedeem"));
const PilotRecruit = lazy(() => import("./pages/PilotRecruit"));
const PilotOnboarding = lazy(() => import("./pages/PilotOnboarding"));
const Payments = lazy(() => import("./pages/Payments"));
const Messages = lazy(() => import("./pages/Messages"));
const Referral = lazy(() => import("./pages/Referral"));
const ReferralLanding = lazy(() => import("./pages/ReferralLanding"));
const PartnerDashboard = lazy(() => import("./pages/PartnerDashboard"));
const PartnerReview = lazy(() => import("./pages/PartnerReview"));
const BaiseBioLinks = lazy(() => import("./pages/BaiseBioLinks"));
const InfluencerPartners = lazy(() => import("./pages/InfluencerPartners"));
const InfluencerApplication = lazy(() => import("./pages/InfluencerApplication"));
const GiveMonthReferralCampaign = lazy(() => import("./pages/GiveMonthReferralCampaign"));
const TestimonialRequest = lazy(() => import("./pages/TestimonialRequest"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
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
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

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

const campaignLandingPaths = new Set([
  "/influencer-partners",
  "/pt/influencer-partners",
  "/es/influencer-partners",
  "/influencer-application",
  "/pt/influencer-application",
  "/es/influencer-application",
  "/give-a-month-get-a-month",
  "/pt/give-a-month-get-a-month",
  "/es/give-a-month-get-a-month",
  "/testimonial-request",
  "/pt/testimonial-request",
  "/es/testimonial-request",
  "/links",
  "/pt/links",
  "/bio",
  "/pt/bio",
  "/pilot",
  "/pt/pilot",
  "/es/pilot",
]);

const CampaignAwareHIPAADisclaimer = () => {
  const { pathname } = useLocation();
  if (campaignLandingPaths.has(pathname) || pathname.startsWith("/ref/") || pathname.startsWith("/pt/ref/") || pathname.startsWith("/es/ref/") || pathname.startsWith("/blog") || pathname.startsWith("/pt/blog") || pathname.startsWith("/es/blog")) return null;
  return <HIPAADisclaimer />;
};

const CampaignAwareNotificationPermissionBanner = () => {
  const { pathname } = useLocation();
  if (campaignLandingPaths.has(pathname) || pathname.startsWith("/ref/") || pathname.startsWith("/pt/ref/") || pathname.startsWith("/es/ref/") || pathname.startsWith("/blog") || pathname.startsWith("/pt/blog") || pathname.startsWith("/es/blog")) return null;
  return <NotificationPermissionBanner />;
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
            <BrowserRouter>
              <AttributionTracker />
              <PilotModeBanner />
              <CampaignAwareHIPAADisclaimer />
              <MessageNotificationProvider>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<BaiseHubLanding />} />
                    <Route path="/discover" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/browse" element={<Browse />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/categories/:categoryId" element={<CategoryDetail />} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/profile/edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                    <Route path="/test-access" element={<ProtectedRoute><TestCohortRedeem /></ProtectedRoute>} />
                    <Route path="/pilot/start" element={<ProtectedRoute><PilotOnboarding /></ProtectedRoute>} />
                    <Route path="/pilot" element={<PilotRecruit defaultLocale="en" />} />
                    <Route path="/pt/pilot" element={<PilotRecruit defaultLocale="pt" />} />
                    <Route path="/es/pilot" element={<PilotRecruit defaultLocale="es" />} />
                    <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
                    <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                    <Route path="/referral" element={<ProtectedRoute><Referral /></ProtectedRoute>} />
                    <Route path="/ref/:code" element={<ReferralLanding />} />
                    <Route path="/pt/ref/:code" element={<ReferralLanding defaultLocale="pt" />} />
                    <Route path="/es/ref/:code" element={<ReferralLanding defaultLocale="es" />} />
                    <Route path="/partner-dashboard" element={<ProtectedRoute><PartnerDashboard /></ProtectedRoute>} />
                    <Route path="/partner-review" element={<ProtectedRoute><PartnerReview /></ProtectedRoute>} />
                    <Route path="/links" element={<BaiseBioLinks defaultLocale="en" />} />
                    <Route path="/pt/links" element={<BaiseBioLinks defaultLocale="pt" />} />
                    <Route path="/bio" element={<BaiseBioLinks defaultLocale="en" />} />
                    <Route path="/pt/bio" element={<BaiseBioLinks defaultLocale="pt" />} />
                    <Route path="/influencer-partners" element={<InfluencerPartners defaultLocale="en" />} />
                    <Route path="/pt/influencer-partners" element={<InfluencerPartners defaultLocale="pt" />} />
                    <Route path="/es/influencer-partners" element={<InfluencerPartners defaultLocale="es" />} />
                    <Route path="/influencer-application" element={<InfluencerApplication defaultLocale="en" />} />
                    <Route path="/pt/influencer-application" element={<InfluencerApplication defaultLocale="pt" />} />
                    <Route path="/es/influencer-application" element={<InfluencerApplication defaultLocale="es" />} />
                    <Route path="/give-a-month-get-a-month" element={<GiveMonthReferralCampaign defaultLocale="en" />} />
                    <Route path="/pt/give-a-month-get-a-month" element={<GiveMonthReferralCampaign defaultLocale="pt" />} />
                    <Route path="/es/give-a-month-get-a-month" element={<GiveMonthReferralCampaign defaultLocale="es" />} />
                    <Route path="/testimonial-request" element={<TestimonialRequest defaultLocale="en" />} />
                    <Route path="/pt/testimonial-request" element={<TestimonialRequest defaultLocale="pt" />} />
                    <Route path="/es/testimonial-request" element={<TestimonialRequest defaultLocale="es" />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/blog/:slug" element={<BlogPost />} />
                    <Route path="/pt/blog" element={<Blog />} />
                    <Route path="/pt/blog/:slug" element={<BlogPost />} />
                    <Route path="/es/blog" element={<Blog />} />
                    <Route path="/es/blog/:slug" element={<BlogPost />} />
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
                <CampaignAwareNotificationPermissionBanner />
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
