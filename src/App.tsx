import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { PlansProvider } from './context/PlansContext';
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

// Public Landing Components (The Intelligence Layer — Editorial Architecture)
import { SiteHeader } from './components/SiteHeader';
import { EditorialHero } from './components/homepage/EditorialHero';
import { ModelUniverse } from './components/homepage/ModelUniverse';
import { GatewayDemo } from './components/homepage/GatewayDemo';
import { RollingPoolAnimation } from './components/homepage/RollingPoolAnimation';
import { CapabilitySection } from './components/homepage/CapabilitySection';
import { CompatibilitySection } from './components/homepage/CompatibilitySection';
import { CapacityPlans } from './components/homepage/CapacityPlans';
import { TrustAndTransparency } from './components/homepage/TrustAndTransparency';
import { FinalCTA } from './components/homepage/FinalCTA';
import { SiteFooter } from './components/SiteFooter';
import { SupportWidget } from './components/SupportWidget';

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

// Resilient Dynamic Import Wrapper with Automatic Post-Deploy Cache Invalidation
function safeLazy<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err: any) {
      console.warn('[Vite Dynamic Import Recovery]', err);
      const isChunkFailure =
        err?.message?.includes('Failed to fetch dynamically imported module') ||
        err?.message?.includes('Importing a module script failed') ||
        err?.name === 'ChunkLoadError' ||
        String(err?.message || '').toLowerCase().includes('dynamically imported module');

      if (isChunkFailure && typeof window !== 'undefined') {
        const reloadKey = 'lightning_chunk_reload_lock';
        const lastReload = sessionStorage.getItem(reloadKey);
        const now = Date.now();
        if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
          sessionStorage.setItem(reloadKey, now.toString());
          window.location.reload();
          return new Promise<{ default: T }>(() => {});
        }
      }
      throw err;
    }
  });
}

// Lazy Loaded Public Pages
const TrialPage = safeLazy(() => import('./pages/TrialPage').then(m => ({ default: m.TrialPage })));
const QuoteRequestPage = safeLazy(() => import('./pages/QuoteRequestPage').then(m => ({ default: m.QuoteRequestPage })));
const ModelsPage = safeLazy(() => import('./pages/ModelsPage').then(m => ({ default: m.ModelsPage })));
const DocsPage = safeLazy(() => import('./pages/docs/DocsPage').then(m => ({ default: m.DocsPage })));
const StatusPage = safeLazy(() => import('./pages/StatusPage').then(m => ({ default: m.StatusPage })));
const CheckKeyPage = safeLazy(() => import('./pages/CheckKeyPage').then(m => ({ default: m.CheckKeyPage })));
const TermsPage = safeLazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const PrivacyPage = safeLazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const RefundPage = safeLazy(() => import('./pages/RefundPage').then(m => ({ default: m.RefundPage })));
const HowItWorksPage = safeLazy(() => import('./pages/HowItWorksPage').then(m => ({ default: m.HowItWorksPage })));
const WhyUsPage = safeLazy(() => import('./pages/WhyUsPage').then(m => ({ default: m.WhyUsPage })));
const DemoPage = safeLazy(() => import('./pages/DemoPage').then(m => ({ default: m.DemoPage })));
const FaqPage = safeLazy(() => import('./pages/FaqPage').then(m => ({ default: m.FaqPage })));
const PricingPage = safeLazy(() => import('./pages/PricingPage').then(m => ({ default: m.PricingPage })));
const WebsiteBuilderLanding = safeLazy(() => import('./pages/WebsiteBuilderLanding').then(m => ({ default: m.WebsiteBuilderLanding })));

// Lazy Loaded Auth Pages
const LoginPage = safeLazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = safeLazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const VerifyEmailPage = safeLazy(() => import('./pages/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })));
const ForgotPasswordPage = safeLazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = safeLazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const NotFoundPage = safeLazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

// Customer Dashboard Pages (Lazy Loaded)
import { UserAuthGuard } from './components/UserAuthGuard';
const UserDashboardLayout = safeLazy(() => import('./pages/dashboard/UserDashboardLayout').then(m => ({ default: m.UserDashboardLayout })));
const UserOverview = safeLazy(() => import('./pages/dashboard/UserOverview').then(m => ({ default: m.UserOverview })));
const UserKeys = safeLazy(() => import('./pages/dashboard/UserKeys').then(m => ({ default: m.UserKeys })));
const UserModels = safeLazy(() => import('./pages/dashboard/UserModels').then(m => ({ default: m.UserModels })));
const UserUsage = safeLazy(() => import('./pages/dashboard/UserUsage').then(m => ({ default: m.UserUsage })));
const UserPlan = safeLazy(() => import('./pages/dashboard/UserPlan').then(m => ({ default: m.UserPlan })));
const UserDocs = safeLazy(() => import('./pages/dashboard/UserDocs').then(m => ({ default: m.UserDocs })));
const UserOrders = safeLazy(() => import('./pages/dashboard/UserOrders').then(m => ({ default: m.UserOrders })));
const UserApiTestConsole = safeLazy(() => import('./pages/dashboard/UserApiTestConsole').then(m => ({ default: m.UserApiTestConsole })));
const UserChatStudio = safeLazy(() => import('./pages/dashboard/UserChatStudio').then(m => ({ default: m.UserChatStudio })));
const UserWebsiteBuilder = safeLazy(() => import('./pages/dashboard/UserWebsiteBuilder').then(m => ({ default: m.UserWebsiteBuilder })));
const UserSupport = safeLazy(() => import('./pages/dashboard/UserSupport').then(m => ({ default: m.UserSupport })));
const UserSettings = safeLazy(() => import('./pages/dashboard/UserSettings').then(m => ({ default: m.UserSettings })));
const UserRewards = safeLazy(() => import('./pages/dashboard/UserRewards').then(m => ({ default: m.UserRewards })));
const UserSubscriptions = safeLazy(() => import('./pages/dashboard/UserSubscriptions').then(m => ({ default: m.UserSubscriptions })));
const UserReferrals = safeLazy(() => import('./pages/dashboard/UserReferrals').then(m => ({ default: m.UserReferrals })));
const UserFeedback = safeLazy(() => import('./pages/dashboard/UserFeedback').then(m => ({ default: m.UserFeedback })));

// Admin Control Center Pages (Lazy Loaded)
import { AdminAuthGuard } from './pages/admin/AdminAuthGuard';
const AdminLoginPage = safeLazy(() => import('./pages/admin/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const AdminLayout = safeLazy(() => import('./pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminFeedback = safeLazy(() => import('./pages/admin/AdminFeedback').then(m => ({ default: m.AdminFeedback })));
const AdminOverview = safeLazy(() => import('./pages/admin/AdminOverview').then(m => ({ default: m.AdminOverview })));
const AdminFulfillment = safeLazy(() => import('./pages/admin/AdminFulfillment').then(m => ({ default: m.AdminFulfillment })));
const AdminSubscriptions = safeLazy(() => import('./pages/admin/AdminSubscriptions').then(m => ({ default: m.AdminSubscriptions })));
const AdminReferrals = safeLazy(() => import('./pages/admin/AdminReferrals').then(m => ({ default: m.AdminReferrals })));
const AdminAnalytics = safeLazy(() => import('./pages/admin/AdminAnalytics').then(m => ({ default: m.AdminAnalytics })));
const AdminProviders = safeLazy(() => import('./pages/admin/AdminProviders').then(m => ({ default: m.AdminProviders })));
const AdminPlans = safeLazy(() => import('./pages/admin/AdminPlans').then(m => ({ default: m.AdminPlans })));
const AdminCustomers = safeLazy(() => import('./pages/admin/AdminCustomers').then(m => ({ default: m.AdminCustomers })));
const AdminKeys = safeLazy(() => import('./pages/admin/AdminKeys').then(m => ({ default: m.AdminKeys })));
const AdminUsage = safeLazy(() => import('./pages/admin/AdminUsage').then(m => ({ default: m.AdminUsage })));
const AdminTokens = safeLazy(() => import('./pages/admin/AdminTokens').then(m => ({ default: m.AdminTokens })));
const AdminOrders = safeLazy(() => import('./pages/admin/AdminOrders').then(m => ({ default: m.AdminOrders })));
const AdminHealth = safeLazy(() => import('./pages/admin/AdminHealth').then(m => ({ default: m.AdminHealth })));
const AdminPricing = safeLazy(() => import('./pages/admin/AdminPricing').then(m => ({ default: m.AdminPricing })));
const AdminModels = safeLazy(() => import('./pages/admin/AdminModels').then(m => ({ default: m.AdminModels })));
const AdminRequests = safeLazy(() => import('./pages/admin/AdminRequests').then(m => ({ default: m.AdminRequests })));
const AdminSecurity = safeLazy(() => import('./pages/admin/AdminSecurity').then(m => ({ default: m.AdminSecurity })));
const AdminLogs = safeLazy(() => import('./pages/admin/AdminLogs').then(m => ({ default: m.AdminLogs })));
const AdminLeads = safeLazy(() => import('./pages/admin/AdminLeads').then(m => ({ default: m.AdminLeads })));
const AdminSupport = safeLazy(() => import('./pages/admin/AdminSupport').then(m => ({ default: m.AdminSupport })));
const AdminStatus = safeLazy(() => import('./pages/admin/AdminStatus').then(m => ({ default: m.AdminStatus })));
const AdminSettings = safeLazy(() => import('./pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));
const AdminApiTest = safeLazy(() => import('./pages/admin/AdminApiTest').then(m => ({ default: m.AdminApiTest })));
const AdminEmergencyControls = safeLazy(() => import('./pages/admin/AdminEmergencyControls').then(m => ({ default: m.AdminEmergencyControls })));
const AdminRewards = safeLazy(() => import('./pages/admin/AdminRewards').then(m => ({ default: m.AdminRewards })));
const AdminWhatsApp = safeLazy(() => import('./pages/admin/AdminWhatsApp').then(m => ({ default: m.AdminWhatsApp })));
const AdminAIControl = safeLazy(() => import('./pages/admin/AdminAIControl').then(m => ({ default: m.AdminAIControl })));
const AdminScaleMaxLive = safeLazy(() => import('./pages/admin/AdminScaleMaxLive').then(m => ({ default: m.AdminScaleMaxLive })));

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#191719] selection:bg-[#7136E8]/10 selection:text-[#7136E8] font-sans antialiased">
      <SiteHeader />
      <main id="main-content">
        <EditorialHero />
        <ModelUniverse />
        <GatewayDemo />
        <RollingPoolAnimation />
        <CapabilitySection />
        <CompatibilitySection />
        <CapacityPlans />
        <TrustAndTransparency />
        <FinalCTA />
      </main>
      <SiteFooter />
      <SupportWidget />
    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <CartProvider>
            <PlansProvider>
              <ScrollToHash />
              <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Dedicated Public Routes (Billion-Dollar Multi-Page Architecture) */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/plans" element={<PricingPage />} />
                <Route path="/checkout" element={<PricingPage />} />
                <Route path="/buy" element={<PricingPage />} />
                <Route path="/models" element={<ModelsPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/why-us" element={<WhyUsPage />} />
                <Route path="/demo" element={<DemoPage />} />
                <Route path="/faq" element={<FaqPage />} />
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
                <Route path="/studio" element={<Navigate to="/dashboard/studio" replace />} />
                <Route path="/chat" element={<Navigate to="/dashboard/studio" replace />} />
                <Route path="/builder" element={<WebsiteBuilderLanding />} />
                <Route path="/websites" element={<WebsiteBuilderLanding />} />

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
                  <Route path="models" element={<UserModels />} />
                  <Route path="subscriptions" element={<UserSubscriptions />} />
                  <Route path="usage" element={<UserUsage />} />
                  <Route path="plan" element={<UserPlan />} />
                  <Route path="rewards" element={<UserRewards />} />
                  <Route path="referrals" element={<UserReferrals />} />
                  <Route path="referral" element={<UserReferrals />} />
                  <Route path="docs" element={<UserDocs />} />
                  <Route path="orders" element={<UserOrders />} />
                  <Route path="studio" element={<UserChatStudio />} />
                  <Route path="chat" element={<UserChatStudio />} />
                  <Route path="builder" element={<UserWebsiteBuilder />} />
                  <Route path="studio/builder" element={<UserWebsiteBuilder />} />
                  <Route path="websites" element={<UserWebsiteBuilder />} />
                  <Route path="api-test" element={<UserApiTestConsole />} />
                  <Route path="support" element={<UserSupport />} />
                  <Route path="feedback" element={<UserFeedback />} />
                  <Route path="reviews" element={<UserFeedback />} />
                  <Route path="settings" element={<UserSettings />} />
                  <Route path="account" element={<UserSettings />} />
                </Route>
                <Route path="/account/*" element={<Navigate to="/dashboard" replace />} />

                {/* Private Admin Authentication Route */}
                <Route path="/deez/login" element={<AdminLoginPage />} />

                {/* Private Admin Control Center — Protected via AdminAuthGuard */}
                <Route
                  path="/deez/*"
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
                  <Route path="scalemax" element={<AdminScaleMaxLive />} />
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
          </PlansProvider>
        </CartProvider>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
