import React from 'react';
import { ArrowRight, CheckCircle2, Terminal, Code2, Cpu, Wrench } from 'lucide-react';
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
    name: 'Claude Code CLI',
    category: 'Terminal Agent',
    protocol: 'Environment variables',
    howToConnect: 'export ANTHROPIC_BASE_URL="https://lightningapi.pro"',
    status: 'Verified',
    notes: 'Runs natively with your ld_live_ key set as ANTHROPIC_AUTH_TOKEN.',
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
    <section className="relative py-20 sm:py-28 lg:py-36 bg-[#F8F6F2] text-[#191719] font-sans overflow-hidden border-b border-[#E6E1E8]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* ============================================================ */}
        {/* SECTION HEADER                                               */}
        {/* ============================================================ */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#E6E1E8]/70">
          <div className="space-y-4 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7136E8]" />
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#7136E8] font-semibold">
                COMPATIBILITY & ECOSYSTEM
              </span>
            </div>

            <h2 className="section-headline text-[#191719] font-display">
              Built around your development workflow.
            </h2>

            <p className="text-base sm:text-lg text-[#68636B] leading-relaxed">
              Connect through the tools, editors, and standard libraries you already use. Verified
              against drop-in Anthropic specification standards.
            </p>
          </div>

          <Link
            to="/docs#integration"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[12px] bg-white hover:bg-black/[0.04] text-[#191719] border border-[#E6E1E8] text-xs font-semibold shadow-2xs transition-colors self-start lg:self-end"
          >
            <span>View Integration Guide</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#7136E8]" />
          </Link>
        </div>

        {/* ============================================================ */}
        {/* CLEAN TYPOGRAPHIC COMPATIBILITY DIRECTORY                     */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {VERIFIED_INTEGRATIONS.map((tool) => (
            <div
              key={tool.name}
              className="p-6 rounded-[16px] bg-white border border-[#E6E1E8] shadow-2xs space-y-4 flex flex-col justify-between hover:border-[#7136E8]/40 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#68636B] uppercase">
                    {tool.category}
                  </span>
                  <div className="inline-flex items-center gap-1 text-[11px] font-mono text-[#087F5B]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{tool.status}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-[#191719] font-display">
                  {tool.name}
                </h3>

                <p className="text-xs text-[#68636B] leading-relaxed">
                  {tool.notes}
                </p>
              </div>

              {/* Protocol Annotation Box */}
              <div className="p-3 rounded-lg bg-[#F8F6F2] border border-[#E6E1E8] font-mono text-[11px] text-[#191719] space-y-1">
                <div className="text-[#68636B] text-[10px] uppercase">CONFIGURATION</div>
                <div className="truncate select-all">{tool.howToConnect}</div>
              </div>
            </div>
          ))}

          {/* Quickstart Callout Box */}
          <div className="p-6 rounded-[16px] bg-[#EEE6FF]/40 border border-[#7136E8]/25 shadow-2xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold text-[#7136E8] uppercase tracking-wider">
                GETTING STARTED
              </span>
              <h3 className="text-base font-bold text-[#191719] font-display">
                Zero Configuration CLI
              </h3>
              <p className="text-xs text-[#68636B] leading-relaxed">
                Run our open-source onboarding CLI to detect your local environment, install sample
                scripts, and verify your API key with a single command.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-white border border-[#E6E1E8] font-mono text-xs text-[#191719] flex items-center justify-between">
              <code>npx lightningdeals</code>
              <span className="text-[10px] text-[#087F5B] uppercase font-bold">READY</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
