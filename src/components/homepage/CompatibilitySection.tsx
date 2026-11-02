import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface IntegrationItem {
  name: string;
  category: string;
  protocol: string;
  howToConnect: string;
  status: 'Verified';
  notes: string;
}

const VERIFIED_INTEGRATIONS: IntegrationItem[] = [
  {
    name: 'Anthropic Official SDKs',
    category: 'TypeScript & Python',
    protocol: 'Native baseURL override',
    howToConnect: "Set baseURL: 'https://lightningapi.pro' in Anthropic() constructor",
    status: 'Verified',
    notes: 'Full support for streaming, messages, system prompts, and tool calling.',
  },
  {
    name: 'OpenAI Official SDKs',
    category: 'Python & Node.js',
    protocol: 'base_url parameter',
    howToConnect: "OpenAI(base_url='https://lightningapi.pro/v1', api_key='sk_live_...')",
    status: 'Verified',
    notes: 'Direct compatibility for chat completions, reasoning tokens (o1, o3-mini), and tool calling.',
  },
  {
    name: 'Claude Code CLI',
    category: 'Terminal Agent',
    protocol: 'Environment variables',
    howToConnect: 'export ANTHROPIC_BASE_URL="https://lightningapi.pro"',
    status: 'Verified',
    notes: 'Runs natively with your sk_live_ key set as ANTHROPIC_API_KEY.',
  },
  {
    name: 'Cursor & Windsurf IDEs',
    category: 'AI Code Editors',
    protocol: 'Custom Model Gateway',
    howToConnect: 'Enter https://lightningapi.pro in Editor Settings -> Custom API Key',
    status: 'Verified',
    notes: 'Enables Sonnet 5.5 and Opus 5.5 multi-file edits directly in the IDE editor.',
  },
  {
    name: 'Universal HTTP / REST Clients',
    category: 'cURL, Axios, Fetch',
    protocol: 'Standard POST & SSE',
    howToConnect: 'POST to https://lightningapi.pro/v1/messages with x-api-key header',
    status: 'Verified',
    notes: 'Compatible with any language that can make an HTTPS POST request.',
  },
  {
    name: 'Lightningdeals CLI',
    category: 'Official Developer Tool',
    protocol: 'Automated configuration',
    howToConnect: 'Run npx lightningdeals in your terminal',
    status: 'Verified',
    notes: 'Configures your local environment, tests connectivity, and verifies key quota.',
  },
];

export const CompatibilitySection: React.FC = () => {
  return (
    <section className="relative py-16 sm:py-24 bg-[#fafaf9] text-zinc-950 font-sans overflow-hidden border-b border-zinc-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-zinc-200">
          <div className="space-y-3 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-violet-700 font-semibold">
                COMPATIBILITY &amp; ECOSYSTEM
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-zinc-950 font-display tracking-tight">
              Built around your development workflow.
            </h2>

            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
              Connect through the tools, editors, and standard libraries you already use. Verified against drop-in Anthropic and OpenAI specification standards.
            </p>
          </div>

          <Link
            to="/docs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 text-xs font-semibold shadow-2xs transition-colors self-start lg:self-end"
          >
            <span>View Integration Guide</span>
            <ArrowRight className="w-3.5 h-3.5 text-violet-600" />
          </Link>
        </div>

        {/* Integration Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {VERIFIED_INTEGRATIONS.map((item) => (
            <div
              key={item.name}
              className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-zinc-300 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-medium text-zinc-500 uppercase">
                    {item.category}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{item.status}</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-zinc-950">{item.name}</h3>
                <p className="text-xs text-zinc-600 leading-relaxed">{item.notes}</p>
              </div>

              <div className="pt-3 border-t border-zinc-100 font-mono text-[11px] text-zinc-600 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200/80 truncate">
                <span className="text-zinc-400 select-none">$ </span>
                <span className="select-all font-medium text-zinc-900">{item.howToConnect}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default CompatibilitySection;