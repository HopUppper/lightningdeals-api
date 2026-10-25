import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Copy, Check, ArrowRight, Laptop, Server, Cpu, ExternalLink, Code2, Play, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';

type LanguageTab = 'typescript' | 'curl' | 'python' | 'claudecode';

export const GatewayDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LanguageTab>('typescript');
  const [selectedModel, setSelectedModel] = useState<string>('claude-sonnet-5.5');
  const [copied, setCopied] = useState<boolean>(false);
  const [showSimulatedResponse, setShowSimulatedResponse] = useState<boolean>(true);
  const prefersReducedMotion = useReducedMotion();

  const codeSnippets: Record<LanguageTab, string> = {
    typescript: `import Anthropic from '@anthropic-ai/sdk';

// Initialize with your LightningAPI key and gateway URL
const client = new Anthropic({
  apiKey: process.env.LIGHTNING_API_KEY, // ld_live_...
  baseURL: 'https://lightningapi.pro',
});

// Drop-in compatible with standard Anthropic Messages API
const response = await client.messages.create({
  model: '${selectedModel}',
  max_tokens: 1024,
  messages: [
    { role: 'user', content: 'Architect a low-latency caching proxy in Rust.' }
  ],
});

console.log(response.content[0].text);`,

    curl: `curl -X POST https://lightningapi.pro/v1/messages \\
  -H "x-api-key: $LIGHTNING_API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "${selectedModel}",
    "max_tokens": 1024,
    "messages": [
      { "role": "user", "content": "Explain Raft consensus invariants." }
    ]
  }'`,

    python: `import os
from anthropic import Anthropic

# Configure client with LightningAPI gateway endpoint
client = Anthropic(
    api_key=os.environ.get("LIGHTNING_API_KEY"),
    base_url="https://lightningapi.pro",
)

# Standard Anthropic messages call
message = client.messages.create(
    model="${selectedModel}",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Refactor this database query for index optimization."}
    ],
)

print(message.content[0].text)`,

    claudecode: `# 1. Configure Claude Code CLI to point to LightningAPI gateway
export ANTHROPIC_BASE_URL="https://lightningapi.pro"
export ANTHROPIC_AUTH_TOKEN="ld_live_your_api_key_here"

# 2. Run Claude Code CLI directly in your terminal
claude

# Claude Code CLI connects seamlessly through LightningAPI
# with 5-hour continuous rolling window token renewal.`,
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      id="gateway-demo"
      className="relative py-20 sm:py-28 lg:py-36 bg-[#F8F6F2] text-[#191719] font-sans overflow-hidden border-b border-[#E6E1E8]"
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* ============================================================ */}
        {/* SECTION HEADER                                               */}
        {/* ============================================================ */}
        <div className="max-w-3xl space-y-4 text-left">
          <div className="inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7136E8]" />
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#7136E8] font-semibold">
              GATEWAY DEMONSTRATION
            </span>
          </div>

          <h2 className="section-headline text-[#191719] font-display">
            Your workflow stays yours.
          </h2>

          <p className="text-base sm:text-lg text-[#68636B] leading-relaxed">
            Connect through the supported API interface and select an available model for your
            application. Zero code rewrites or proprietary wrapper SDKs.
          </p>
        </div>

        {/* ============================================================ */}
        {/* THREE-STAGE TECHNICAL FLOW COMPOSITION                        */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 relative">
          
          {/* Stage 1: Client Application */}
          <div className="p-6 rounded-[16px] bg-white border border-[#E6E1E8] shadow-2xs space-y-3 relative group hover:border-[#7136E8]/40 transition-colors text-left">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#68636B] uppercase tracking-wider font-semibold">
                STAGE 01
              </span>
              <div className="p-2 rounded-lg bg-[#EEE6FF] text-[#7136E8]">
                <Laptop className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-base font-bold text-[#191719] font-display">
              Client Application
            </h3>
            <p className="text-xs text-[#68636B] leading-relaxed">
              Claude Code CLI, Cursor, Windsurf, or your custom Python / TypeScript software stack.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-[11px] font-mono text-[#68636B]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#087F5B]" />
              <span>Standard Anthropic SDK</span>
            </div>
          </div>

          {/* Stage 2: LightningAPI Gateway */}
          <div className="p-6 rounded-[16px] bg-white border-2 border-[#7136E8] shadow-xs space-y-3 relative ring-2 ring-[#7136E8]/10 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#7136E8] font-bold uppercase tracking-wider">
                STAGE 02 · CORE
              </span>
              <div className="p-2 rounded-lg bg-[#7136E8] text-white">
                <Server className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-base font-bold text-[#191719] font-display">
              LightningAPI Gateway
            </h3>
            <p className="text-xs text-[#68636B] leading-relaxed">
              In-stream TLS 1.3 passthrough with atomic 5-hour rolling pool renewal and sub-50ms routing.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-[11px] font-mono text-[#7136E8] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7136E8] animate-pulse" />
              <span>https://lightningapi.pro</span>
            </div>
          </div>

          {/* Stage 3: Selected Model Endpoint */}
          <div className="p-6 rounded-[16px] bg-white border border-[#E6E1E8] shadow-2xs space-y-3 relative group hover:border-[#7136E8]/40 transition-colors text-left">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#68636B] uppercase tracking-wider font-semibold">
                STAGE 03
              </span>
              <div className="p-2 rounded-lg bg-[#EEE6FF] text-[#7136E8]">
                <Cpu className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-base font-bold text-[#191719] font-display">
              Selected Model Endpoint
            </h3>
            <p className="text-xs text-[#68636B] leading-relaxed">
              Frontier inference cluster serving verified Claude Opus, Sonnet, 3.7, Fable, or Haiku streams.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-[11px] font-mono text-[#68636B]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#087F5B]" />
              <span>Full SSE Streaming</span>
            </div>
          </div>

        </div>

        {/* ============================================================ */}
        {/* INTERACTIVE CODE WORKSPACE WITH ACCESSIBLE CONTROLS           */}
        {/* ============================================================ */}
        <div className="rounded-[20px] bg-[#141217] border border-[#26222C] shadow-lg overflow-hidden">
          
          {/* Top Bar: Tabs, Model Picker, Copy */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-[#1B1821] border-b border-[#26222C]">
            
            {/* Language Selection Tabs */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('typescript')}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
                  activeTab === 'typescript'
                    ? 'bg-[#7136E8] text-white'
                    : 'text-[#A39EAA] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                TypeScript
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('curl')}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
                  activeTab === 'curl'
                    ? 'bg-[#7136E8] text-white'
                    : 'text-[#A39EAA] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                cURL
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('python')}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
                  activeTab === 'python'
                    ? 'bg-[#7136E8] text-white'
                    : 'text-[#A39EAA] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                Python
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('claudecode')}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
                  activeTab === 'claudecode'
                    ? 'bg-[#7136E8] text-white'
                    : 'text-[#A39EAA] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                Claude Code CLI
              </button>
            </div>

            {/* Model Target Selector + Action Buttons */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label htmlFor="code-model-select" className="text-[11px] font-mono text-[#A39EAA] hidden sm:inline">
                  Target:
                </label>
                <select
                  id="code-model-select"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-[#121015] border border-[#2E2937] text-white text-xs font-mono rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#7136E8] cursor-pointer"
                >
                  <option value="claude-sonnet-5.5">claude-sonnet-5.5</option>
                  <option value="claude-opus-5.5">claude-opus-5.5</option>
                  <option value="claude-3-7-sonnet-20250219">claude-3-7-sonnet-20250219</option>
                  <option value="claude-fable-5">claude-fable-5</option>
                  <option value="claude-haiku-5.5">claude-haiku-5.5</option>
                </select>
              </div>

              {/* Toggle Simulated Response Preview */}
              <button
                type="button"
                onClick={() => setShowSimulatedResponse(!showSimulatedResponse)}
                className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                  showSimulatedResponse
                    ? 'bg-[#7136E8]/20 text-[#EEE6FF] border border-[#7136E8]/40'
                    : 'bg-white/[0.06] text-[#A39EAA] hover:text-white'
                }`}
              >
                <span>{showSimulatedResponse ? 'Hide Response' : 'Show Response'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs font-mono text-white transition-colors cursor-pointer"
                title="Copy code snippet to clipboard"
                aria-label="Copy code snippet"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#087F5B]" />
                    <span className="text-[#087F5B]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Code Viewer Body (Side-by-side or stacked with Simulated Preview) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#26222C]">
            
            {/* Left: Code Snippet */}
            <div className={`p-5 sm:p-7 overflow-x-auto ${showSimulatedResponse ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
              <pre className="font-mono text-xs sm:text-sm text-[#E6E1E8] leading-relaxed text-left">
                <code>{codeSnippets[activeTab]}</code>
              </pre>
            </div>

            {/* Right: Simulated Preview Box */}
            {showSimulatedResponse && (
              <div className="lg:col-span-5 p-5 sm:p-6 bg-[#100E13] flex flex-col justify-between space-y-4 text-left">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#A39EAA] uppercase tracking-wider font-semibold">
                      Simulated Response Preview
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#EEE6FF]/10 text-[#EEE6FF] border border-[#7136E8]/30 text-[10px]">
                      ANTHROPIC SPEC
                    </span>
                  </div>

                  {/* Simulated Response JSON */}
                  <div className="p-3.5 rounded-xl bg-[#16131B] border border-[#26222C] font-mono text-xs text-[#A39EAA] space-y-1.5 leading-relaxed overflow-x-auto">
                    <div className="text-[#087F5B]">// Ingress HTTP/2 200 OK</div>
                    <div className="text-white font-medium">{"{"}</div>
                    <div className="pl-3"><span className="text-[#EEE6FF]">"id"</span>: <span className="text-emerald-400">"msg_preview_018f9a"</span>,</div>
                    <div className="pl-3"><span className="text-[#EEE6FF]">"type"</span>: <span className="text-emerald-400">"message"</span>,</div>
                    <div className="pl-3"><span className="text-[#EEE6FF]">"role"</span>: <span className="text-emerald-400">"assistant"</span>,</div>
                    <div className="pl-3"><span className="text-[#EEE6FF]">"model"</span>: <span className="text-[#7136E8]">"{selectedModel}"</span>,</div>
                    <div className="pl-3"><span className="text-[#EEE6FF]">"content"</span>: [</div>
                    <div className="pl-6">{"{"} <span className="text-[#EEE6FF]">"type"</span>: <span className="text-emerald-400">"text"</span>, <span className="text-[#EEE6FF]">"text"</span>: <span className="text-white">"Analysis complete. Connection verified."</span> {"}"}</div>
                    <div className="pl-3">],</div>
                    <div className="pl-3"><span className="text-[#EEE6FF]">"stop_reason"</span>: <span className="text-emerald-400">"end_turn"</span></div>
                    <div className="text-white font-medium">{"}"}</div>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="text-[10px] font-mono text-[#68636B] pt-2 border-t border-[#26222C]">
                  Simulated preview illustrating standard Anthropic response payload format. No fabricated production metrics.
                </div>
              </div>
            )}

          </div>

          {/* Footer Note */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-[#110F14] border-t border-[#26222C] text-[11px] font-mono text-[#A39EAA]">
            <span>
              Verified against Anthropic /v1/messages API contract. Ingress base URL: https://lightningapi.pro
            </span>
            <Link
              to="/docs#integration"
              className="text-[#EEE6FF] hover:text-white inline-flex items-center gap-1"
            >
              <span>Full Integration Guide</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
};
