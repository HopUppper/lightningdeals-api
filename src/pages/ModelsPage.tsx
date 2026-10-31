import React from 'react';
import { ElectricNavbar } from '../components/ElectricNavbar';
import { ElectricFooter } from '../components/ElectricFooter';
import { ModelCatalog } from '../components/ModelCatalog';
import { DeveloperEcosystem } from '../components/DeveloperEcosystem';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Cpu, Layers, ShieldCheck } from 'lucide-react';

export const ModelsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#fbf9f5] text-[#1c1917] flex flex-col font-sans antialiased selection:bg-[#6d28d9]/10 selection:text-[#6d28d9]">
      <ElectricNavbar />

      <main className="flex-1">
        {/* Editorial Header */}
        <section className="py-14 sm:py-18 border-b border-[#e7e5e4] bg-white">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium uppercase tracking-wider bg-[#f5f3ff] text-[#6d28d9] border border-[#ddd6fe]">
                <Sparkles className="w-3 h-3 text-[#6d28d9]" />
                <span>Unified Model Repertoire · 74 Models</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1c1917]">
                Frontier &amp; Open-Weights Model Catalog
              </h1>
              <p className="text-sm sm:text-base text-[#57534e] leading-relaxed max-w-xl">
                Access 74+ frontier and open-weights models across Anthropic Claude, OpenAI, DeepSeek, GLM, Google Gemini, xAI Grok, Alibaba Qwen, Moonshot Kimi, MiniMax, Image Generation, Video Generation, and Vector Embeddings.
              </p>

              {/* Quick Spec Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-[#57534e]">
                <span className="px-2.5 py-1 rounded-lg bg-[#faf8f5] border border-[#e7e5e4] flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#6d28d9]" />
                  <span>13 Provider Families</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#faf8f5] border border-[#e7e5e4] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Up to 1,000,000 Context</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#faf8f5] border border-[#e7e5e4] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Anthropic &amp; OpenAI Native Protocols</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <Link
                to="/pricing"
                className="px-5 py-3 rounded-xl bg-[#6d28d9] hover:bg-[#581c87] text-white text-xs font-semibold shadow-plum transition-all text-center"
              >
                View Plans &amp; Pricing
              </Link>
              <Link
                to="/docs"
                className="px-4 py-3 rounded-xl bg-white border border-[#e7e5e4] hover:bg-[#f5f2eb] text-[#1c1917] text-xs font-medium transition-colors shadow-xs text-center"
              >
                Developer API Docs
              </Link>
            </div>
          </div>
        </section>

        {/* Comprehensive Model Catalog Grid & Filters */}
        <ModelCatalog />

        {/* Supported Developer Stack */}
        <DeveloperEcosystem />
      </main>

      <ElectricFooter />
    </div>
  );
};

export default ModelsPage;
