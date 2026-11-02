import React, { useState, useEffect } from 'react';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { ModelCatalog } from '../components/ModelCatalog';
import { DeveloperEcosystem } from '../components/DeveloperEcosystem';
import { Link } from 'react-router-dom';
import { Sparkles, Cpu, Layers, ShieldCheck } from 'lucide-react';

export const ModelsPage: React.FC = () => {
  const [modelCount, setModelCount] = useState<number>(74);

  useEffect(() => {
    async function loadCount() {
      try {
        const res = await fetch('/v1/models');
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.data) && json.data.length > 0) {
            setModelCount(json.data.length);
          }
        }
      } catch (e) {
        // Fallback default
      }
    }
    loadCount();
  }, []);

  return (
    <div className="min-h-screen bg-[#fafaf9] text-zinc-950 flex flex-col font-sans antialiased selection:bg-violet-500/10 selection:text-violet-700">
      <SiteHeader />

      <main className="flex-1">
        {/* Editorial Header */}
        <section className="py-14 sm:py-18 border-b border-zinc-200 bg-white">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium uppercase tracking-wider bg-violet-50 text-violet-700 border border-violet-200">
                <Sparkles className="w-3 h-3 text-violet-600" />
                <span>Unified Model Repertoire · {modelCount} Verified Models</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-950">
                Frontier &amp; Open-Weights Model Catalog
              </h1>
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-xl">
                Access {modelCount} verified frontier and open-weights models across Anthropic Claude, OpenAI, DeepSeek, GLM, Google Gemini, xAI Grok, Alibaba Qwen, and multimodal reasoning engines.
              </p>

              {/* Quick Spec Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-zinc-600">
                <span className="px-2.5 py-1 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-violet-600" />
                  <span>13 Provider Families</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Up to 1,048,576 Context</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Anthropic &amp; OpenAI Native Protocols</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <Link
                to="/pricing"
                className="px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-xs transition-all text-center"
              >
                View Plans &amp; Pricing
              </Link>
              <Link
                to="/docs"
                className="px-4 py-3 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-900 text-xs font-medium transition-colors shadow-2xs text-center"
              >
                Developer API Docs
              </Link>
            </div>
          </div>
        </section>

        {/* Dynamic Model Catalog Component */}
        <section className="py-12 sm:py-16">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <ModelCatalog />
          </div>
        </section>

        {/* Developer Ecosystem Integration Section */}
        <DeveloperEcosystem />
      </main>

      <SiteFooter />
    </div>
  );
};

export default ModelsPage;