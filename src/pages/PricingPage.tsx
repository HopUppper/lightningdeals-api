import React from 'react';
import { ElectricNavbar } from '../components/ElectricNavbar';
import { ElectricFooter } from '../components/ElectricFooter';
import { ElectricCapacitySection } from '../components/ElectricCapacitySection';
import { ElectricReservoirSimulator } from '../components/ElectricReservoirSimulator';
import { ElectricFaqSection } from '../components/ElectricFaqSection';
import { ElectricFinalCta } from '../components/ElectricFinalCta';
import { PromotionalOfferBanner } from '../components/PromotionalOfferBanner';
import { PromotionalOfferModal } from '../components/PromotionalOfferModal';
import { SupportWidget } from '../components/SupportWidget';
import { Link } from 'react-router-dom';
import { Zap, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export const PricingPage: React.FC = () => {
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
                <Zap className="w-3 h-3 text-[#6d28d9]" />
                <span>Dedicated Token Capacity</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1c1917]">
                Model Ecosystems & Capacity Architecture
              </h1>
              <p className="text-sm text-[#57534e] leading-relaxed max-w-xl">
                Choose your AI model family (Claude, OpenAI, or Local Models), then select your billing architecture: continuous 5-hour rolling pool refills (Claude exclusive), wholesale usage credits with 7x purchasing value, or fixed consumable token packs.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link to="/trial" className="px-5 py-2.5 rounded-xl bg-[#6d28d9] hover:bg-[#581c87] text-white text-xs font-semibold shadow-plum transition-all inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Claim Free 200k Trial</span>
              </Link>
              <Link to="/request-quote" className="px-4 py-2.5 rounded-xl bg-white border border-[#e7e5e4] hover:bg-[#f5f2eb] text-[#1c1917] text-xs font-medium transition-colors shadow-xs inline-flex items-center gap-1.5">
                <span>Enterprise Custom Quote</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Real-time Dynamic Capacity Plans Section */}
        <ElectricCapacitySection />

        {/* Token Reservoir Simulator */}
        <ElectricReservoirSimulator />

        {/* Capacity & Billing FAQs */}
        <ElectricFaqSection />

        {/* Final Conversion CTA */}
        <ElectricFinalCta />
      </main>

      <ElectricFooter />
      <SupportWidget />
    </div>
  );
};

export default PricingPage;
