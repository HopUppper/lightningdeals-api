import React, { useState } from 'react';
import { RefreshCw, Lock, Zap, ArrowRight, ChevronDown, Check } from 'lucide-react';

export const ContextVisualizer: React.FC = () => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  return (
    <section id="gateway" className="py-16 lg:py-24 border-b border-[#e5e7eb] bg-[#fbfbfa] font-sans">
      <div className="max-w-page mx-auto px-4 sm:px-6 space-y-16">
        
        {/* Section Header */}
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center px-2.5 py-1 rounded bg-[#f4f4f0] border border-[#e5e7eb] text-xs font-medium text-[#4b5563] tracking-wider uppercase">
            Platform Architecture
          </div>
          
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#111827]">
            Predictable rolling quotas. Zero data retention.
          </h2>

          <p className="text-sm sm:text-base text-[#4b5563] leading-relaxed">
            Designed for continuous development without surprise monthly cloud bills, sudden quota lockouts, or prompt logging.
          </p>
        </div>

        {/* 2-Column Editorial Split */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Column 1: Rolling Token Window Engine */}
          <div className="lg:col-span-6 bg-white border border-[#e5e7eb] rounded-xl p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-[#eff6ff] text-[#1e40af]">
                <RefreshCw className="w-5 h-5" />
              </span>
              <span className="text-xs font-semibold text-[#1e40af] bg-[#eff6ff] px-2.5 py-1 rounded">
                Automatic Replenishment
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#111827]">
                Continuous 5-Hour Rolling Token Windows
              </h3>
              <p className="text-sm text-[#4b5563] leading-relaxed">
                Unlike standard API providers that enforce monthly hard cutoffs or expensive pay-as-you-go overages, LightningAPI allocates tokens across a continuous 5-hour rolling cycle. Tokens used earlier replenish as they exit the 5-hour window, providing consistent daily throughput.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#e5e7eb]">
              <div className="p-3 rounded-lg bg-[#fbfbfa] border border-[#e5e7eb]">
                <div className="text-[10px] text-[#6b7280] uppercase font-semibold">Cycle Length</div>
                <div className="text-base font-bold text-[#111827] mt-0.5">5 Hours</div>
                <div className="text-[11px] text-[#6b7280]">Rolling window</div>
              </div>
              <div className="p-3 rounded-lg bg-[#fbfbfa] border border-[#e5e7eb]">
                <div className="text-[10px] text-[#6b7280] uppercase font-semibold">Context Window</div>
                <div className="text-base font-bold text-[#111827] mt-0.5">200K / 1M</div>
                <div className="text-[11px] text-[#6b7280]">Full model depth</div>
              </div>
              <div className="p-3 rounded-lg bg-[#fbfbfa] border border-[#e5e7eb]">
                <div className="text-[10px] text-[#6b7280] uppercase font-semibold">Prompt Cache</div>
                <div className="text-base font-bold text-emerald-700 mt-0.5">0 Cost</div>
                <div className="text-[11px] text-[#6b7280]">Cache hits free</div>
              </div>
            </div>
          </div>

          {/* Column 2: Zero Retention Privacy Guarantee */}
          <div className="lg:col-span-6 bg-white border border-[#e5e7eb] rounded-xl p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-[#f0fdf4] text-emerald-700">
                <Lock className="w-5 h-5" />
              </span>
              <span className="text-xs font-semibold text-emerald-800 bg-[#f0fdf4] px-2.5 py-1 rounded">
                Strict Privacy SLA
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#111827]">
                Zero Prompt Retention (100% Direct Passthrough)
              </h3>
              <p className="text-sm text-[#4b5563] leading-relaxed">
                Your prompts, proprietary source code, and AI completions stream token-by-token directly to your client. LightningAPI maintains zero disk persistence, zero database logging of content, and zero data sharing for model training.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#e5e7eb]">
              <div className="flex items-start gap-2.5 text-xs text-[#4b5563]">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Zero prompt or response storage in persistent databases</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-[#4b5563]">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Encrypted transit via HTTP/2 and modern TLS 1.3 standards</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-[#4b5563]">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Strict isolation between user environments and proxy routing nodes</span>
              </div>
            </div>
          </div>

        </div>

        {/* Technical Specs Expandable Row */}
        <div className="border border-[#e5e7eb] rounded-lg bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#f9fafb] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-[#1e40af]" />
              <span className="text-xs sm:text-sm font-semibold text-[#111827]">
                Developer Specifications (Protocol, Headers, and Rate Limiting)
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#1e40af]">
              <span>{showTechnicalDetails ? 'Hide Details' : 'Show Details'}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showTechnicalDetails ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {showTechnicalDetails && (
            <div className="px-6 py-5 border-t border-[#e5e7eb] bg-[#fbfbfa] text-xs text-[#4b5563] space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <div className="font-semibold text-[#111827] mb-1">Header Authentication</div>
                  <code className="bg-white border border-[#e5e7eb] px-2 py-1 rounded text-[11px] block text-[#111827]">
                    x-api-key: ld_live_...
                  </code>
                </div>
                <div>
                  <div className="font-semibold text-[#111827] mb-1">Anthropic Version Header</div>
                  <code className="bg-white border border-[#e5e7eb] px-2 py-1 rounded text-[11px] block text-[#111827]">
                    anthropic-version: 2023-06-01
                  </code>
                </div>
                <div>
                  <div className="font-semibold text-[#111827] mb-1">Streaming Endpoint</div>
                  <code className="bg-white border border-[#e5e7eb] px-2 py-1 rounded text-[11px] block text-[#111827]">
                    POST /v1/messages
                  </code>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};
