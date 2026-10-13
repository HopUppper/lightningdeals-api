import React from 'react';
import { ElectricNavbar } from '../components/ElectricNavbar';
import { ElectricFooter } from '../components/ElectricFooter';
import { ElectricFaqSection } from '../components/ElectricFaqSection';
import { PromotionalOfferBanner } from '../components/PromotionalOfferBanner';
import { PromotionalOfferModal } from '../components/PromotionalOfferModal';
import { SupportWidget } from '../components/SupportWidget';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowRight, MessageSquare } from 'lucide-react';

export const FaqPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#fbf9f5] text-[#1c1917] flex flex-col font-sans antialiased selection:bg-[#6d28d9]/10 selection:text-[#6d28d9]">
      <PromotionalOfferBanner />
      <ElectricNavbar />
      <PromotionalOfferModal />

      <main className="flex-1">
        {/* Editorial Header */}
        <section className="py-14 sm:py-18 border-b border-[#e7e5e4] bg-white">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium uppercase tracking-wider bg-[#f5f3ff] text-[#6d28d9] border border-[#ddd6fe]">
                <HelpCircle className="w-3 h-3 text-[#6d28d9]" />
                <span>Knowledge Base & Guidance</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1c1917]">
                Frequently Asked Questions
              </h1>
              <p className="text-sm text-[#57534e] leading-relaxed max-w-xl">
                Everything you need to know about our 5-hour rolling token windows, Anthropic SDK compatibility, security, multi-supplier failover, and billing.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link to="/pricing" className="px-5 py-2.5 rounded-xl bg-[#6d28d9] hover:bg-[#581c87] text-white text-xs font-semibold shadow-plum transition-all inline-flex items-center gap-1.5">
                <span>View Capacity Plans</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link to="/docs" className="px-4 py-2.5 rounded-xl bg-white border border-[#e7e5e4] hover:bg-[#f5f2eb] text-[#1c1917] text-xs font-medium transition-colors shadow-xs inline-flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#78716c]" />
                <span>Developer Docs</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Full FAQ Section */}
        <ElectricFaqSection />
      </main>

      <ElectricFooter />
      <SupportWidget />
    </div>
  );
};

export default FaqPage;
