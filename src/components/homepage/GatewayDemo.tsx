import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Copy, Check, Terminal, ExternalLink, Play, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

type LanguageTab = 'claudecode' | 'typescript' | 'curl' | 'python';

export const GatewayDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LanguageTab>('claudecode');
  const [selectedModel, setSelectedModel] = useState<string>('claude-sonnet-5.5');
  const [copied, setCopied] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const prefersReducedMotion = useReducedMotion();

  const codeSnippets: Record<LanguageTab, string> = {
    claudecode: `# 1. Point Claude Code CLI to the LightningAPI gateway
export ANTHROPIC_BASE_URL="https://lightningapi.pro"
export ANTHROPIC_AUTH_TOKEN="ld_live_49f82d1c8e9b3a4f7e2d1c8e"

# 2. Launch Claude Code CLI directly in your terminal
claude

# Connects seamlessly with continuous 5-hour rolling pool renewal`,

    typescript: `import Anthropic from '@anthropic-ai/sdk';

// Initialize standard client with LightningAPI gateway
const client = new Anthropic({
  apiKey: process.env.LIGHTNING_API_KEY, // ld_live_...
  baseURL: 'https://lightningapi.pro',
});

// Drop-in compatible with standard Anthropic Messages API
const response = await client.messages.create({
  model: '${selectedModel}',
  max_tokens: 1024,
  messages: [
    { role: 'user', content: 'Architect a zero-copy caching proxy in Rust.' }
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

# Configure standard Anthropic client with LightningAPI
client = Anthropic(
    api_key=os.environ.get("LIGHTNING_API_KEY"),
    base_url="https://lightningapi.pro",
)

# Standard Anthropic messages call
message = client.messages.create(
    model="${selectedModel}",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Refactor database query for zero-allocation index execution."}
    ],
)

print(message.content[0].text)`,
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTriggerSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => setIsSimulating(false), 3000);
  };

  return (
    <section
      id="gateway-demo"
      className="relative py-24 sm:py-32 lg:py-40 bg-[#F8F6F2] text-[#191719] font-sans overflow-hidden border-b border-[#E6E1E8]"
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* ============================================================ */}
        {/* EDITORIAL SECTION HEADER                                     */}
        {/* ============================================================ */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#E6E1E8]">
          <div className="space-y-4 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7136E8]" />
              <span className="text-[11px] font-mono uppercase tracking-[0.24em] text-[#7136E8] font-semibold">
                INTEGRATION WORKFLOW
              </span>
            </div>

            <h2 className="section-headline text-[#191719] font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Your workflow stays yours.
            </h2>

            <p className="text-base sm:text-lg text-[#68636B] leading-relaxed max-w-xl font-normal">
              Connect your existing tools—Claude Code CLI, Cursor, Windsurf, or custom SDK clients—through
              a drop-in Anthropic connection with continuous rolling quota renewal.
            </p>
          </div>

          {/* Model Selector Bar */}
          <div className="flex items-center gap-2.5 p-1.5 rounded-xl bg-white border border-[#E6E1E8] shadow-2xs self-start lg:self-end">
            <label htmlFor="workflow-model" className="text-[11px] font-mono text-[#68636B] pl-2 hidden sm:inline">
              Target Model:
            </label>
            <select
              id="workflow-model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-[#F8F6F2] border border-[#E6E1E8] text-[#191719] text-xs font-mono rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#7136E8] cursor-pointer"
            >
              <option value="claude-sonnet-5.5">claude-sonnet-5.5</option>
              <option value="claude-opus-5.5">claude-opus-5.5</option>
              <option value="claude-sonnet-5">claude-sonnet-5</option>
              <option value="claude-fable-5">claude-fable-5</option>
              <option value="claude-haiku-5.5">claude-haiku-5.5</option>
            </select>
          </div>
        </div>

        {/* ============================================================ */}
        {/* ART-DIRECTED PRODUCT DEMONSTRATION WORKSPACE                  */}
        {/* (No Bulky Cards: Fluid Bridge between Client & Inference)     */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left: Code Client Editor Window (6 Cols) */}
          <div className="lg:col-span-6 rounded-[22px] bg-[#141217] border border-[#26222C] shadow-lg flex flex-col justify-between overflow-hidden text-left">
            
            {/* Tab Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-[#1B1821] border-b border-[#26222C]">
              <div className="flex items-center gap-1">
                {(['claudecode', 'typescript', 'curl', 'python'] as LanguageTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                      activeTab === tab
                        ? 'bg-[#7136E8] text-white font-medium'
                        : 'text-[#A39EAA] hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {tab === 'claudecode' ? 'Claude Code' : tab.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Copy Code */}
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono text-[#A39EAA] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="Copy configuration snippet"
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

            {/* Code Body */}
            <div className="p-6 overflow-x-auto flex-1 flex items-center">
              <pre className="font-mono text-xs sm:text-sm text-[#E6E1E8] leading-relaxed w-full">
                <code>{codeSnippets[activeTab]}</code>
              </pre>
            </div>

            {/* Bottom Status Ribbon */}
            <div className="px-5 py-3 bg-[#100E14] border-t border-[#26222C] flex items-center justify-between text-[11px] font-mono text-[#A39EAA]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#087F5B]" />
                Standard Anthropic Messages Contract
              </span>
              <button
                type="button"
                onClick={handleTriggerSimulate}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#7136E8] hover:bg-[#4F21B5] text-white font-semibold transition-all cursor-pointer shadow-2xs"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Simulate Flow</span>
              </button>
            </div>

          </div>

          {/* Right: Flowing Gateway Bridge & Model Inference Stream (6 Cols) */}
          <div className="lg:col-span-6 rounded-[22px] bg-white border border-[#E6E1E8] shadow-sm p-6 sm:p-8 flex flex-col justify-between space-y-6 text-left">
            
            {/* Ingress Checkpoint Telemetry */}
            <div className="space-y-4">
              <div className="flex items-center justify-between font-mono text-xs text-[#68636B] pb-3 border-b border-[#E6E1E8]">
                <span className="uppercase tracking-wider font-semibold text-[#191719] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#7136E8] animate-ping" />
                  GATEWAY ROUTING ENGINE
                </span>
                <span className="px-2 py-0.5 rounded bg-[#EEE6FF] text-[#7136E8] font-bold text-[10px]">
                  SUB-50MS LATENCY
                </span>
              </div>

              {/* Seamless In-Stream Architecture Diagram (Integrated, No Heavy Cards) */}
              <div className="p-4 rounded-xl bg-[#F8F6F2] border border-[#E6E1E8] font-mono text-xs space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-[#68636B]">
                  <span>AUTHENTICATION CHECKPOINT</span>
                  <span className="text-[#087F5B] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#087F5B]" />
                    SHA-256 PASSTHROUGH
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
                  <div className="p-2.5 rounded-lg bg-white border border-[#E6E1E8] text-[#191719]">
                    <span className="text-[10px] text-[#68636B] block">CLIENT</span>
                    <span className="font-semibold">CLI / Editor</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#EEE6FF] border border-[#7136E8]/30 text-[#7136E8]">
                    <span className="text-[10px] text-[#7136E8]/70 block">GATEWAY</span>
                    <span className="font-bold">LightningAPI</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-[#E6E1E8] text-[#191719]">
                    <span className="text-[10px] text-[#68636B] block">INFERENCE</span>
                    <span className="font-semibold">{selectedModel.split('-')[1]}</span>
                  </div>
                </div>

                {/* Quota Flow Note */}
                <div className="text-[10px] text-[#68636B] pt-1">
                  ✓ Token quota accounted against continuous 5-hour rolling pool with zero prompt logging.
                </div>
              </div>

              {/* Streamed Inference Output Console */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#68636B]">
                  <span>INFERENCE STREAM (SIMULATED PREVIEW)</span>
                  <span className="text-[#087F5B]">{selectedModel}</span>
                </div>

                <div className="p-4 rounded-xl bg-[#141217] border border-[#26222C] font-mono text-xs text-[#E6E1E8] space-y-2 min-h-[140px] flex flex-col justify-center">
                  <div className="text-[#A39EAA] text-[11px]">
                    // Server-Sent Events (SSE) Stream
                  </div>
                  <div className="text-emerald-400 font-medium">
                    {isSimulating ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="animate-pulse">Streaming response tokens...</span>
                      </span>
                    ) : (
                      <span>
                        "Here is the optimized caching proxy in Rust. Utilizing zero-copy ring buffers,
                        it minimizes syscall overhead while maintaining continuous high throughput."
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#68636B] pt-2 border-t border-[#26222C]">
                    Simulated preview illustrating standard Anthropic SSE streaming payload.
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Documentation Link */}
            <div className="pt-2 flex items-center justify-between text-xs font-mono text-[#68636B] border-t border-[#E6E1E8]">
              <span>Ingress Endpoint: https://lightningapi.pro</span>
              <Link
                to="/docs#integration"
                className="text-[#7136E8] hover:text-[#4F21B5] font-semibold inline-flex items-center gap-1"
              >
                <span>Integration Guide</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
