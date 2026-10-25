import React from 'react';
import { ElectricNavbar } from '../components/ElectricNavbar';
import { ElectricFooter } from '../components/ElectricFooter';
import { ModelCatalog } from '../components/ModelCatalog';
import { DeveloperEcosystem } from '../components/DeveloperEcosystem';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

export const ModelsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#fbf9f5] text-[#1c1917] flex flex-col font-sans antialiased selection:bg-[#6d28d9]/10 selection:text-[#6d28d9]">
      <ElectricNavbar />

      <main className="flex-1">
        {/* Editorial Header */}
        <section className="py-14 sm:py-18 border-b border-[#e7e5e4] bg-white">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium uppercase tracking-wider bg-[#f5f3ff] text-[#6d28d9] border border-[#ddd6fe]">
                <Sparkles className="w-3 h-3 text-[#6d28d9]" />
                <span>Multi-Provider Model Intelligence</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1c1917]">
                Supported Multi-Provider Models
              </h1>
              <p className="text-sm text-[#57534e] leading-relaxed max-w-xl">
                From deep-thinking Claude Opus 5.5 on OpusMax to OpenAI o1, GPT-4o, DeepSeek R1, and Gemini 2.5 on ScaleMax, select the ideal model for your programming, agentic loops, and production workflows.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link to="/trial" className="px-5 py-2.5 rounded-xl bg-[#6d28d9] hover:bg-[#581c87] text-white text-xs font-semibold shadow-plum transition-all">
                Claim Free 200k Trial
              </Link>
              <Link to="/pricing" className="px-4 py-2.5 rounded-xl bg-white border border-[#e7e5e4] hover:bg-[#f5f2eb] text-[#1c1917] text-xs font-medium transition-colors shadow-xs">
                View Plans
              </Link>
            </div>
          </div>
        </section>

        {/* Model Catalog Grid & Filters */}
        <ModelCatalog />

        {/* Supported Developer Stack */}
        <DeveloperEcosystem />
      </main>

      <ElectricFooter />
    </div>
  );
};

export default ModelsPage;
