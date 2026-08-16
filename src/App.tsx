import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
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


// Public Landing Components
import { HeroSection } from './components/HeroSection';
import { ContextVisualizer } from './components/ContextVisualizer';
import { OneCommandSetup } from './components/OneCommandSetup';
import { ApiArchitectureFlow } from './components/ApiArchitectureFlow';
import { TrustEvidence } from './components/TrustEvidence';
import { WhyChooseUs } from './components/WhyChooseUs';
import { ApiQuickStart } from './components/ApiQuickStart';
import { ModelCatalog } from './components/ModelCatalog';
import { PricingSection } from './components/PricingSection';
import { DeveloperEcosystem } from './components/DeveloperEcosystem';
import { OneLineMigration } from './components/OneLineMigration';
import { FaqAccordion } from './components/FaqAccordion';

import { FinalCta } from './components/FinalCta';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { SupportWidget } from './components/SupportWidget';

import { lazy, Suspense } from 'react';

const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-bg text-muted flex flex-col items-center justify-center space-y-3 font-mono text-xs">
    <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
    <span>Loading LightningDeals...</span>
  </div>
);

// Public Pages
const TrialPage = lazy(() => import('./pages/TrialPage').then(m => ({ default: m.TrialPage })));
const QuoteRequestPage = lazy(() => import('./pages/QuoteRequestPage').then(m => ({ default: m.QuoteRequestPage })));
const ModelsPage = lazy(() => import('./pages/ModelsPage').then(m => ({ default: m.ModelsPage })));
const DocsPage = lazy(() => import('./pages/docs/DocsPage').then(m => ({ default: m.DocsPage })));
const StatusPage = lazy(() => import('./pages/StatusPage').then(m => ({ default: m.StatusPage })));
const CheckKeyPage = lazy(() => import('./pages/CheckKeyPage').then(m => ({ default: m.CheckKeyPage })));
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { NotFoundPage } from './pages/NotFoundPage';

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

// Admin Control Center Pages (Lazy Loaded)
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
import { AdminAuthGuard } from './pages/admin/AdminAuthGuard';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview').then(m => ({ default: m.AdminOverview })));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics').then(m => ({ default: m.AdminAnalytics })));
const AdminProviders = lazy(() => import('./pages/admin/AdminProviders').then(m => ({ default: m.AdminProviders })));
const AdminPlans = lazy(() => import('./pages/admin/AdminPlans').then(m => ({ default: m.AdminPlans })));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers').then(m => ({ default: m.AdminCustomers })));
const AdminKeys = lazy(() => import('./pages/admin/AdminKeys').then(m => ({ default: m.AdminKeys })));
const AdminTokens = lazy(() => import('./pages/admin/AdminTokens').then(m => ({ default: m.AdminTokens })));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders').then(m => ({ default: m.AdminOrders })));
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
const AdminUsage = lazy(() => import('./pages/admin/AdminUsage').then(m => ({ default: m.AdminUsage })));
const AdminEmergencyControls = lazy(() => import('./pages/admin/AdminEmergencyControls').then(m => ({ default: m.AdminEmergencyControls })));
const AdminHealth = lazy(() => import('./pages/admin/AdminHealth').then(m => ({ default: m.AdminHealth })));

// LightningDeals Homepage Component



import { SocialProofStrip } from './components/SocialProofStrip';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { RefundPage } from './pages/RefundPage';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg text-fg selection:bg-amber-500/20 selection:text-amber-500 font-sans antialiased">
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <SocialProofStrip />
        <ContextVisualizer />
        <OneCommandSetup />

        <TrustEvidence />
        <WhyChooseUs />

        <ApiQuickStart />
        <ModelCatalog />
        <PricingSection />
        <DeveloperEcosystem />
        <OneLineMigration />
        <FaqAccordion />

        <FinalCta />
      </main>
      <Footer />
      <SupportWidget />
    </div>
  );
};


export const PublicPricingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans">
      <Navbar />
      <main className="flex-1">
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
};


// Protected Guards
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-bg text-muted flex items-center justify-center text-xs">Loading LightningDeals...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Protected Admin Guard
const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-bg text-muted flex items-center justify-center text-xs">Loading Control Center...</div>;
  if (!user || user.role !== 'admin') return <LoginPage />;
  return children;
};

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToHash />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/pricing" element={<PublicPricingPage />} />
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
              {/* Authentication & Verification Routes */}
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
                <Route path="usage" element={<UserUsage />} />
                <Route path="plan" element={<UserPlan />} />
                <Route path="docs" element={<UserDocs />} />
                <Route path="orders" element={<UserOrders />} />
                <Route path="api-test" element={<UserApiTestConsole />} />
                <Route path="support" element={<UserSupport />} />
                <Route path="settings" element={<UserSettings />} />
                <Route path="account" element={<UserSettings />} />
              </Route>
              <Route path="/account/*" element={<Navigate to="/dashboard" replace />} />

              {/* Admin Authentication Route */}
              <Route path="/admin/login" element={<AdminLoginPage />} />

              {/* Admin Control Center — Secret route protected via AdminAuthGuard */}
              <Route
                path="/admin/*"
                element={
                  <AdminAuthGuard>
                    <AdminLayout />
                  </AdminAuthGuard>
                }
              >
                <Route index element={<AdminOverview />} />
                <Route path="analytics" element={<AdminAnalytics />} />
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
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}


export default App;
