import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { CheckoutCartDrawer } from './components/CheckoutCartDrawer';
import { ErrorBoundary } from './components/ErrorBoundary';

const ScrollToHash: React.FC = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Send GA4 Pageview on client-side SPA route navigation
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', 'G-GBRR7YHWVM', {
        page_path: pathname + (hash || ''),
      });
    }

    if (hash) {
      setTimeout(() => {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pathname, hash]);

  return null;
};

// Public Landing Components (Electric Editorial Direction)
import { ElectricNavbar } from './components/ElectricNavbar';
import { ProductHero } from './components/ProductHero';
import { HowItWorksSection } from './components/HowItWorksSection';
import { InteractiveGatewayDemo } from './components/InteractiveGatewayDemo';
import { ElectricEditorialContrast } from './components/ElectricEditorialContrast';
import { ElectricModelObservatory } from './components/ElectricModelObservatory';
import { ElectricReservoirSimulator } from './components/ElectricReservoirSimulator';
import { ElectricDeveloperStudio } from './components/ElectricDeveloperStudio';
import { ElectricCapacitySection } from './components/ElectricCapacitySection';
import { ElectricGovernanceSla } from './components/ElectricGovernanceSla';
import { ElectricPublicReviews } from './components/ElectricPublicReviews';
import { ElectricFaqSection } from './components/ElectricFaqSection';
import { ElectricFinalCta } from './components/ElectricFinalCta';
import { ElectricFooter } from './components/ElectricFooter';
import { SupportWidget } from './components/SupportWidget';
import { PromotionalOfferBanner } from './components/PromotionalOfferBanner';
import { PromotionalOfferModal } from './components/PromotionalOfferModal';

const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-bg text-muted flex flex-col items-center justify-center space-y-3 font-mono text-xs">
    <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
    <span>Loading LightningDeals...</span>
  </div>
);

const ReferralAttributionListener: React.FC = () => {
  const [invitedNotice, setInvitedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get('ref');
    if (refParam) {
      const cleanRef = refParam.trim().toUpperCase();
      try {
        localStorage.setItem('ld_ref', cleanRef);
        sessionStorage.setItem('ld_ref', cleanRef);
        document.cookie = `ld_ref=${cleanRef}; path=/; max-age=2592000; SameSite=Lax`;

        fetch('/api/referrals/click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: cleanRef, landingPage: window.location.pathname }),
        }).catch(() => {});

        fetch(`/api/referrals/validate/${cleanRef}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.valid) {
              setInvitedNotice(data.message || `⚡ You've been invited to LightningAPI.pro! Create your account to get started.`);
            }
          })
          .catch(() => {});
      } catch {}
    }
  }, []);

  if (!invitedNotice) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-50 max-w-md bg-neutral-900 border border-amber-500/40 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-3 text-xs animate-in fade-in">
      <div className="flex items-center gap-2">
        <span className="p-1 rounded-md bg-amber-500/20 text-amber-400 font-bold">⚡</span>
        <span className="leading-snug">{invitedNotice}</span>
      </div>
      <button
        onClick={() => setInvitedNotice(null)}
        className="text-neutral-400 hover:text-white px-2 py-1 rounded-lg bg-neutral-800 text-[11px] cursor-pointer"
      >
        Dismiss
      </button>
    </div>
  );
};

// Lazy Loaded Public Pages
const TrialPage = lazy(() => import('./pages/TrialPage').then(m => ({ default: m.TrialPage })));
const QuoteRequestPage = lazy(() => import('./pages/QuoteRequestPage').then(m => ({ default: m.QuoteRequestPage })));
const ModelsPage = lazy(() => import('./pages/ModelsPage').then(m => ({ default: m.ModelsPage })));
const DocsPage = lazy(() => import('./pages/docs/DocsPage').then(m => ({ default: m.DocsPage })));
const StatusPage = lazy(() => import('./pages/StatusPage').then(m => ({ default: m.StatusPage })));
const CheckKeyPage = lazy(() => import('./pages/CheckKeyPage').then(m => ({ default: m.CheckKeyPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const RefundPage = lazy(() => import('./pages/RefundPage').then(m => ({ default: m.RefundPage })));

// Lazy Loaded Auth Pages
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

// Customer Dashboard Pages (Lazy Loaded)
import { UserAuthGuard } from './components/UserAuthGuard';
const UserDashboardLayout = lazy(() => import('./pages/dashboard/UserDashboardLayout').then(m => ({ default: m.UserDashboardLayout })));
const UserOverview = lazy(() => import('./pages/dashboard/UserOverview').then(m => ({ default: m.UserOverview })));
const UserKeys = lazy(() => import('./pages/dashboard/UserKeys').then(m => ({ default: m.UserKeys })));
const UserUsage = lazy(() => import('./pages/dashboard/UserUsage').then(m => ({ default: m.UserUsage })));
const UserPlan = lazy(() => import('./pages/dashboard/UserPlan').then(m => ({ default: m.UserPlan })));
const UserDocs = lazy(() => import('./pages/dashboard/UserDocs').then(m => ({ default: m.UserDocs })));
const UserOrders = lazy(() => import('./pages/dashboard/UserOrders').then(m => ({ default: m.UserOrders })));
const UserApiTestConsole = lazy(() => import('./pages/dashboard/UserApiTestConsole').then(m => ({ default: m.UserApiTestConsole })));
const UserSupport = lazy(() => import('./pages/dashboard/UserSupport').then(m => ({ default: m.UserSupport })));
const UserSettings = lazy(() => import('./pages/dashboard/UserSettings').then(m => ({ default: m.UserSettings })));
const UserRewards = lazy(() => import('./pages/dashboard/UserRewards').then(m => ({ default: m.UserRewards })));
const UserSubscriptions = lazy(() => import('./pages/dashboard/UserSubscriptions').then(m => ({ default: m.UserSubscriptions })));
const UserReferrals = lazy(() => import('./pages/dashboard/UserReferrals').then(m => ({ default: m.UserReferrals })));
const UserFeedback = lazy(() => import('./pages/dashboard/UserFeedback').then(m => ({ default: m.UserFeedback })));

// Admin Control Center Pages (Lazy Loaded)
import { AdminAuthGuard } from './pages/admin/AdminAuthGuard';
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminFeedback = lazy(() => import('./pages/admin/AdminFeedback').then(m => ({ default: m.AdminFeedback })));
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview').then(m => ({ default: m.AdminOverview })));
const AdminFulfillment = lazy(() => import('./pages/admin/AdminFulfillment').then(m => ({ default: m.AdminFulfillment })));
const AdminSubscriptions = lazy(() => import('./pages/admin/AdminSubscriptions').then(m => ({ default: m.AdminSubscriptions })));
const AdminReferrals = lazy(() => import('./pages/admin/AdminReferrals').then(m => ({ default: m.AdminReferrals })));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics').then(m => ({ default: m.AdminAnalytics })));
const AdminProviders = lazy(() => import('./pages/admin/AdminProviders').then(m => ({ default: m.AdminProviders })));
const AdminPlans = lazy(() => import('./pages/admin/AdminPlans').then(m => ({ default: m.AdminPlans })));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers').then(m => ({ default: m.AdminCustomers })));
const AdminKeys = lazy(() => import('./pages/admin/AdminKeys').then(m => ({ default: m.AdminKeys })));
const AdminUsage = lazy(() => import('./pages/admin/AdminUsage').then(m => ({ default: m.AdminUsage })));
const AdminTokens = lazy(() => import('./pages/admin/AdminTokens').then(m => ({ default: m.AdminTokens })));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders').then(m => ({ default: m.AdminOrders })));
const AdminHealth = lazy(() => import('./pages/admin/AdminHealth').then(m => ({ default: m.AdminHealth })));
const AdminPricing = lazy(() => import('./pages/admin/AdminPricing').then(m => ({ default: m.AdminPricing })));
const AdminModels = lazy(() => import('./pages/admin/AdminModels').then(m => ({ default: m.AdminModels })));
const AdminRequests = lazy(() => import('./pages/admin/AdminRequests').then(m => ({ default: m.AdminRequests })));
const AdminSecurity = lazy(() => import('./pages/admin/AdminSecurity').then(m => ({ default: m.AdminSecurity })));
const AdminLogs = lazy(() => import('./pages/admin/AdminLogs').then(m => ({ default: m.AdminLogs })));
const AdminLeads = lazy(() => import('./pages/admin/AdminLeads').then(m => ({ default: m.AdminLeads })));
const AdminSupport = lazy(() => import('./pages/admin/AdminSupport').then(m => ({ default: m.AdminSupport })));
const AdminStatus = lazy(() => import('./pages/admin/AdminStatus').then(m => ({ default: m.AdminStatus })));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));
const AdminApiTest = lazy(() => import('./pages/admin/AdminApiTest').then(m => ({ default: m.AdminApiTest })));
const AdminEmergencyControls = lazy(() => import('./pages/admin/AdminEmergencyControls').then(m => ({ default: m.AdminEmergencyControls })));
const AdminRewards = lazy(() => import('./pages/admin/AdminRewards').then(m => ({ default: m.AdminRewards })));
const AdminWhatsApp = lazy(() => import('./pages/admin/AdminWhatsApp').then(m => ({ default: m.AdminWhatsApp })));
const AdminAIControl = lazy(() => import('./pages/admin/AdminAIControl').then(m => ({ default: m.AdminAIControl })));

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#fbf9f5] text-[#1c1917] selection:bg-[#6d28d9]/10 selection:text-[#6d28d9] font-sans antialiased">
      <PromotionalOfferBanner />
      <ElectricNavbar />
      <PromotionalOfferModal />
      <main id="main-content">
        {/* Section A: Hero (Product introduction & visual gateway concept) */}
        <ProductHero />

        {/* Section B: Supported Model Ecosystem (Top 10 latest Claude models & direct link to /models) */}
        <ElectricModelObservatory />

        {/* Section C: How It Works (3 clear, verified integration steps) */}
        <HowItWorksSection />

        {/* Section D: Why LightningAPI (Architectural contrast & Zero-logging SLA) */}
        <ElectricEditorialContrast />
        <ElectricGovernanceSla />

        {/* Section E: Interactive Gateway Demonstration (Conduit simulator & real-time SSE stream playground) */}
        <InteractiveGatewayDemo />

        {/* Section F: Capacity & Plans (The 4 verified plans & Token reservoir simulator) */}
        <ElectricCapacitySection />
        <ElectricReservoirSimulator />

        {/* Section G: Developer Resources, Reviews & FAQ */}
        <ElectricDeveloperStudio />
        <ElectricPublicReviews />
        <ElectricFaqSection />

        {/* Section H: Final Call to Action */}
        <ElectricFinalCta />
      </main>
      <ElectricFooter />
      <SupportWidget />
    </div>
  );
};

export const PublicPricingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#fbf9f5] text-[#1c1917] selection:bg-[#6d28d9]/10 selection:text-[#6d28d9] flex flex-col font-sans antialiased">
      <PromotionalOfferBanner />
      <ElectricNavbar />
      <PromotionalOfferModal />
      <main className="flex-1">
        <ElectricCapacitySection />
      </main>
      <ElectricFooter />
    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <CartProvider>
            <ScrollToHash />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/pricing" element={<PublicPricingPage />} />
                <Route path="/plans" element={<PublicPricingPage />} />
                <Route path="/checkout" element={<PublicPricingPage />} />
                <Route path="/buy" element={<PublicPricingPage />} />
                <Route path="/models" element={<ModelsPage />} />
                <Route path="/docs" element={<DocsPage />} />
                <Route path="/status" element={<StatusPage />} />
                <Route path="/check-key" element={<CheckKeyPage />} />
                <Route path="/trial" element={<TrialPage />} />
                <Route path="/request-quote" element={<QuoteRequestPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/terms-and-conditions" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/privacy-policy" element={<PrivacyPage />} />
                <Route path="/refund" element={<RefundPage />} />
                <Route path="/refund-policy" element={<RefundPage />} />
                <Route path="/rewards" element={<Navigate to="/dashboard/rewards" replace />} />

                {/* Authentication & Verification Routes (Lazy Loaded) */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Customer Dashboard Routes — Protected via UserAuthGuard */}
                <Route
                  path="/dashboard/*"
                  element={
                    <UserAuthGuard>
                      <UserDashboardLayout />
                    </UserAuthGuard>
                  }
                >
                  <Route index element={<UserOverview />} />
                  <Route path="keys" element={<UserKeys />} />
                  <Route path="api-keys" element={<UserKeys />} />
                  <Route path="subscriptions" element={<UserSubscriptions />} />
                  <Route path="usage" element={<UserUsage />} />
                  <Route path="plan" element={<UserPlan />} />
                  <Route path="rewards" element={<UserRewards />} />
                  <Route path="referrals" element={<UserReferrals />} />
                  <Route path="referral" element={<UserReferrals />} />
                  <Route path="docs" element={<UserDocs />} />
                  <Route path="orders" element={<UserOrders />} />
                  <Route path="api-test" element={<UserApiTestConsole />} />
                  <Route path="support" element={<UserSupport />} />
                  <Route path="feedback" element={<UserFeedback />} />
                  <Route path="reviews" element={<UserFeedback />} />
                  <Route path="settings" element={<UserSettings />} />
                  <Route path="account" element={<UserSettings />} />
                </Route>
                <Route path="/account/*" element={<Navigate to="/dashboard" replace />} />

                {/* Admin Authentication Route */}
                <Route path="/admin/login" element={<AdminLoginPage />} />

                {/* Admin Control Center — Protected via AdminAuthGuard */}
                <Route
                  path="/admin/*"
                  element={
                    <AdminAuthGuard>
                      <AdminLayout />
                    </AdminAuthGuard>
                  }
                >
                  <Route index element={<AdminOverview />} />
                  <Route path="fulfillment" element={<AdminFulfillment />} />
                  <Route path="feedback" element={<AdminFeedback />} />
                  <Route path="reviews" element={<AdminFeedback />} />
                  <Route path="subscriptions" element={<AdminSubscriptions />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="rewards" element={<AdminRewards />} />
                  <Route path="referrals" element={<AdminReferrals />} />
                  <Route path="whatsapp" element={<AdminWhatsApp />} />
                  <Route path="ai-control" element={<AdminAIControl />} />
                  <Route path="whatsapp-ai" element={<AdminAIControl />} />
                  <Route path="providers" element={<AdminProviders />} />
                  <Route path="plans" element={<AdminPlans />} />
                  <Route path="customers" element={<AdminCustomers />} />
                  <Route path="keys" element={<AdminKeys />} />
                  <Route path="usage" element={<AdminUsage />} />
                  <Route path="tokens" element={<AdminTokens />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="health" element={<AdminHealth />} />
                  <Route path="pricing" element={<AdminPricing />} />
                  <Route path="models" element={<AdminModels />} />
                  <Route path="requests" element={<AdminRequests />} />
                  <Route path="security" element={<AdminSecurity />} />
                  <Route path="logs" element={<AdminLogs />} />
                  <Route path="leads" element={<AdminLeads />} />
                  <Route path="support" element={<AdminSupport />} />
                  <Route path="status" element={<AdminStatus />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="api-test" element={<AdminApiTest />} />
                  <Route path="emergency" element={<AdminEmergencyControls />} />
                </Route>

                {/* Catch-all 404 Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
              <CheckoutCartDrawer />
              <ReferralAttributionListener />
            </Suspense>
          </CartProvider>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
