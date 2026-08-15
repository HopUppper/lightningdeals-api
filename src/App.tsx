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

// Public Pages
import { TrialPage } from './pages/TrialPage';
import { QuoteRequestPage } from './pages/QuoteRequestPage';
import { ModelsPage } from './pages/ModelsPage';
import { DocsPage } from './pages/docs/DocsPage';
import { StatusPage } from './pages/StatusPage';
import { CheckKeyPage } from './pages/CheckKeyPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Customer Dashboard Pages
import { UserDashboardLayout } from './pages/dashboard/UserDashboardLayout';
import { UserOverview } from './pages/dashboard/UserOverview';
import { UserKeys } from './pages/dashboard/UserKeys';
import { UserUsage } from './pages/dashboard/UserUsage';
import { UserOrders } from './pages/dashboard/UserOrders';
import { UserApiTestConsole } from './pages/dashboard/UserApiTestConsole';
import { UserSupport } from './pages/dashboard/UserSupport';
import { UserSettings } from './pages/dashboard/UserSettings';

// Admin Control Center Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminAuthGuard } from './pages/admin/AdminAuthGuard';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminProviders } from './pages/admin/AdminProviders';
import { AdminPlans } from './pages/admin/AdminPlans';
import { AdminCustomers } from './pages/admin/AdminCustomers';

import { AdminKeys } from './pages/admin/AdminKeys';
import { AdminTokens } from './pages/admin/AdminTokens';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminPricing } from './pages/admin/AdminPricing';
import { AdminModels } from './pages/admin/AdminModels';
import { AdminRequests } from './pages/admin/AdminRequests';
import { AdminSecurity } from './pages/admin/AdminSecurity';
import { AdminLogs } from './pages/admin/AdminLogs';
import { AdminLeads } from './pages/admin/AdminLeads';
import { AdminSupport } from './pages/admin/AdminSupport';
import { AdminStatus } from './pages/admin/AdminStatus';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminApiTest } from './pages/admin/AdminApiTest';
import { AdminUsage } from './pages/admin/AdminUsage';
import { AdminEmergencyControls } from './pages/admin/AdminEmergencyControls';

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
            <Route path="/privacy" element={<PrivacyPage />} />
            {/* Authentication & Verification Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/dashboard/*" element={<Navigate to="/" replace />} />

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
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}


export default App;
