import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, Copy, ExternalLink, Cpu, Terminal, Sparkles, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ModelDefinition {
  id: string;
  name: string;
  family: string;
  contextWindow: string;
  category: 'coding' | 'reasoning' | 'velocity';
  capabilities: string[];
  summary: string;
  status: 'Operational';
  tokenPriceInput: string;
  tokenPriceOutput: string;
}

const SUPPORTED_CATALOG: ModelDefinition[] = [
  {
    id: 'claude-sonnet-5.5',
    name: 'Claude Sonnet 5.5',
    family: 'Anthropic Claude',
    contextWindow: '1,000,000 tokens',
    category: 'coding',
    capabilities: ['Autonomous Coding', 'Multi-File Refactoring', 'Tool Calling'],
    summary: 'Flagship engineering workhorse engineered for Cursor, Windsurf, and Claude Code CLI with high precision.',
    status: 'Operational',
    tokenPriceInput: '$3.00 / 1M',
    tokenPriceOutput: '$15.00 / 1M',
  },
  {
    id: 'claude-opus-5.5',
    name: 'Claude Opus 5.5',
    family: 'Anthropic Claude',
    contextWindow: '1,000,000 tokens',
    category: 'reasoning',
    capabilities: ['Formal Verification', 'Systems Architecture', 'Deep Synthesis'],
    summary: 'Pinnacle frontier intelligence model for ultra-complex architectural proofs and deep autonomous systems design.',
    status: 'Operational',
    tokenPriceInput: '$15.00 / 1M',
    tokenPriceOutput: '$75.00 / 1M',
  },
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet',
    family: 'Anthropic Claude',
    contextWindow: '200,000 tokens',
    category: 'coding',
    capabilities: ['Hybrid Reasoning', 'Extended Thinking', 'Agentic Coding'],
    summary: 'Frontier hybrid reasoning and agentic coding engine with controllable extended thinking buffers.',
    status: 'Operational',
    tokenPriceInput: '$3.00 / 1M',
    tokenPriceOutput: '$15.00 / 1M',
  },
  {
    id: 'claude-fable-5',
    name: 'Claude Fable 5',
    family: 'Anthropic Claude',
    contextWindow: '1,000,000 tokens',
    category: 'velocity',
    capabilities: ['Real-Time Completion', 'Inline Diffs', 'Sub-Second SSE'],
    summary: 'Ultra-fast response model optimized for real-time IDE completion, inline diff generation, and rapid interaction loops.',
    status: 'Operational',
    tokenPriceInput: '$0.80 / 1M',
    tokenPriceOutput: '$4.00 / 1M',
  },
  {
    id: 'claude-opus-5-thinking',
    name: 'Claude Opus 5 Extended Thinking',
    family: 'Anthropic Claude',
    contextWindow: '1,000,000 tokens',
    category: 'reasoning',
    capabilities: ['Internal Thought Buffers', 'Audit Edge Cases', 'Invariant Verification'],
    summary: 'Deep reflective reasoning engine featuring explicit internal thought buffers for auditing intricate edge-case bugs.',
    status: 'Operational',
    tokenPriceInput: '$15.00 / 1M',
    tokenPriceOutput: '$75.00 / 1M',
  },
  {
    id: 'claude-haiku-5.5',
    name: 'Claude Haiku 5.5',
    family: 'Anthropic Claude',
    contextWindow: '500,000 tokens',
    category: 'velocity',
    capabilities: ['Instant Streaming', 'High-Traffic Webhooks', 'Automated Triage'],
    summary: 'Next-generation high-velocity model delivering instant streaming completions for high-traffic developer tools.',
    status: 'Operational',
    tokenPriceInput: '$0.50 / 1M',
    tokenPriceOutput: '$2.50 / 1M',
  },
];

export const ModelUniverse: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'coding' | 'reasoning' | 'velocity'>('all');
  const [selectedModelId, setSelectedModelId] = useState<string>('claude-sonnet-5.5');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const filteredModels = SUPPORTED_CATALOG.filter(
    (m) => activeCategory === 'all' || m.category === activeCategory
  );

  const selectedModel =
    SUPPORTED_CATALOG.find((m) => m.id === selectedModelId) || SUPPORTED_CATALOG[0];

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section 
      id="models-universe" 
      className="relative py-20 sm:py-28 lg:py-36 bg-[#141217] text-[#F8F6F2] font-sans overflow-hidden border-b border-[#26222C]"
    >
      {/* Subtle Restrained Ambient Violet Lighting */}
      <div 
        className="absolute top-0 right-1/4 w-[600px] h-[350px] bg-[#7136E8]/10 blur-[120px] pointer-events-none rounded-full" 
        aria-hidden="true"
      />
      <div 
        className="absolute bottom-0 left-1/4 w-[500px] h-[300px] bg-[#4F21B5]/10 blur-[100px] pointer-events-none rounded-full" 
        aria-hidden="true"
      />

      <div className="relative max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* ============================================================ */}
        {/* SECTION HEADER                                               */}
        {/* ============================================================ */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#26222C]">
          <div className="space-y-4 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7136E8]" />
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#EEE6FF]/70">
                MODEL CATALOGUE
              </span>
            </div>

            <h2 className="section-headline text-white font-display">
              One connection.
              <br />
              <span className="text-white/80">Multiple model possibilities.</span>
            </h2>

            <p className="text-base sm:text-lg text-[#A39EAA] leading-relaxed">
              Explore the models available through LightningAPI and choose the ones that fit your
              workflow.
            </p>
          </div>

          {/* Directory Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#1C1920] border border-[#2A2631] self-start lg:self-end">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-[#7136E8] text-white shadow-xs'
                  : 'text-[#A39EAA] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              All Models
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('coding')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeCategory === 'coding'
                  ? 'bg-[#7136E8] text-white shadow-xs'
                  : 'text-[#A39EAA] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              Coding & Synthesis
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('reasoning')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeCategory === 'reasoning'
                  ? 'bg-[#7136E8] text-white shadow-xs'
                  : 'text-[#A39EAA] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              Frontier Reasoning
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('velocity')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeCategory === 'velocity'
                  ? 'bg-[#7136E8] text-white shadow-xs'
                  : 'text-[#A39EAA] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              High-Velocity
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* STRUCTURED EDITORIAL DIRECTORY + INSPECTOR LAYOUT             */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Structured Model List (7 Cols) */}
          <div className="lg:col-span-7 space-y-2.5">
            {filteredModels.map((model) => {
              const isSelected = model.id === selectedModel.id;
              return (
                <div
                  key={model.id}
                  onClick={() => setSelectedModelId(model.id)}
                  className={`p-4 sm:p-5 rounded-xl border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-[#1D1923] border-[#7136E8] shadow-sm ring-1 ring-[#7136E8]/40'
                      : 'bg-[#18161D] border-[#26222C] hover:border-[#3D3746] hover:bg-[#1A1820]'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedModelId(model.id);
                    }
                  }}
                  aria-pressed={isSelected}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    
                    {/* Model Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base font-bold text-white tracking-tight">
                          {model.name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-[#A39EAA]">
                          {model.contextWindow}
                        </span>
                      </div>

                      {/* Actual Model Identifier with Copy */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <code className="text-xs font-mono text-[#EEE6FF]/80 bg-[#121015] px-2 py-0.5 rounded border border-[#26222C]">
                          {model.id}
                        </code>
                        <button
                          type="button"
                          onClick={(e) => handleCopyId(model.id, e)}
                          className="p-1 rounded text-[#A39EAA] hover:text-[#EEE6FF] transition-colors"
                          title={`Copy identifier: ${model.id}`}
                          aria-label={`Copy identifier: ${model.id}`}
                        >
                          {copiedId === model.id ? (
                            <Check className="w-3.5 h-3.5 text-[#087F5B]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Operational Indicator & Capability Tags */}
                    <div className="flex sm:flex-col sm:items-end justify-between sm:justify-center gap-2">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#087F5B]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#087F5B] animate-pulse" />
                        <span>{model.status}</span>
                      </div>

                      <span className="text-xs text-[#A39EAA] font-mono">
                        {model.tokenPriceInput}
                      </span>
                    </div>

                  </div>
                </div>
              );
            })}

            {/* Direct Model Catalogue Link */}
            <div className="pt-2">
              <Link
                to="/models"
                className="inline-flex items-center gap-2 text-xs font-medium text-[#EEE6FF] hover:text-white hover:underline transition-colors"
              >
                <span>View Complete Model Specification & Benchmark Matrices</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: Live Model Inspector Pane (5 Cols) */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="p-6 rounded-2xl bg-[#18161D] border border-[#2A2631] space-y-6 shadow-md">
              
              {/* Header */}
              <div className="space-y-1.5 pb-4 border-b border-[#26222C]">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#A39EAA]">
                  <span>MODEL INSPECTOR</span>
                  <span className="text-[#087F5B] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#087F5B]" />
                    VERIFIED INGRESS
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white font-display">
                  {selectedModel.name}
                </h3>
                <p className="text-xs text-[#A39EAA] font-mono">
                  Family: {selectedModel.family} · Context: {selectedModel.contextWindow}
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-[#68636B] uppercase tracking-wider">
                  Summary
                </span>
                <p className="text-sm text-[#E6E1E8] leading-relaxed">
                  {selectedModel.summary}
                </p>
              </div>

              {/* Verified Capabilities */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-[#68636B] uppercase tracking-wider">
                  Verified Capabilities
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedModel.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="px-2.5 py-1 rounded-md bg-[#221E29] border border-[#2E2838] text-xs font-mono text-[#EEE6FF]"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              {/* Live Request Snippet Preview */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-[#68636B] uppercase tracking-wider">
                  Ingress Request Header Preview
                </span>
                <div className="p-3 rounded-lg bg-[#110F14] border border-[#26222C] font-mono text-xs text-[#A39EAA] space-y-1">
                  <div><span className="text-[#7136E8]">POST</span> https://lightningapi.pro/v1/messages</div>
                  <div><span className="text-[#68636B]">x-api-key:</span> ld_live_••••••••••••</div>
                  <div><span className="text-[#68636B]">model:</span> <span className="text-emerald-400 font-semibold">{selectedModel.id}</span></div>
                </div>
              </div>

              {/* Footer CTA in Inspector */}
              <div className="pt-2 flex items-center justify-between">
                <Link
                  to="/docs#models"
                  className="text-xs font-medium text-[#EEE6FF] hover:text-white inline-flex items-center gap-1.5"
                >
                  <span>Model docs</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#7136E8] hover:bg-[#4F21B5] text-white text-xs font-semibold transition-colors"
                >
                  <span>Use Model in Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
