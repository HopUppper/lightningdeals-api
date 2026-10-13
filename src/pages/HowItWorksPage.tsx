import React from 'react';
import { ElectricNavbar } from '../components/ElectricNavbar';
import { ElectricFooter } from '../components/ElectricFooter';
import { HowItWorksSection } from '../components/HowItWorksSection';
import { ElectricDeveloperStudio } from '../components/ElectricDeveloperStudio';
import { PromotionalOfferBanner } from '../components/PromotionalOfferBanner';
import { PromotionalOfferModal } from '../components/PromotionalOfferModal';
import { SupportWidget } from '../components/SupportWidget';
import { Link } from 'react-router-dom';
import { Zap, Terminal, ShieldCheck, ArrowRight, BookOpen } from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
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
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium uppercase tracking-wider bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]">
                <Zap className="w-3 h-3 text-[#059669]" />
                <span>Zero-Friction Gateway</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1c1917]">
                How LightningAPI Works
              </h1>
              <p className="text-sm text-[#57534e] leading-relaxed max-w-xl">
                Replace your base API endpoint with <span className="font-mono text-[#1c1917] bg-[#f5f2eb] px-1.5 py-0.5 rounded">https://lightningapi.pro</span>. Stream frontier Claude Opus & Sonnet with high RPM, dynamic token pooling, and sub-50ms latency.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link to="/trial" className="px-5 py-2.5 rounded-xl bg-[#6d28d9] hover:bg-[#581c87] text-white text-xs font-semibold shadow-plum transition-all inline-flex items-center gap-1.5">
                <span>Claim Free 200k Key</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link to="/docs" className="px-4 py-2.5 rounded-xl bg-white border border-[#e7e5e4] hover:bg-[#f5f2eb] text-[#1c1917] text-xs font-medium transition-colors shadow-xs inline-flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#78716c]" />
                <span>View Documentation</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Integration Steps */}
        <HowItWorksSection />

        {/* Developer Studio (SDK Configs & Code Examples) */}
        <ElectricDeveloperStudio />
      </main>

      <ElectricFooter />
      <SupportWidget />
    </div>
  );
};

export default HowItWorksPage;
