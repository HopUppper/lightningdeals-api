import React, { useState, useEffect } from 'react';
import { Cpu, ArrowRight, Check, Layers, Sparkles, Server, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ModelCard {
  id: string;
  name: string;
  family: string;
  provider: string;
  tier: string;
  type: 'flagship' | 'fast' | 'reasoning';
  context: string;
  inputPrice: string;
  outputPrice: string;
  strengths: string;
  latency: string;
}

const STATIC_MODELS: ModelCard[] = [
  // OpusMax Claude Models
  {
    id: 'claude-opus-5.5',
    name: 'Claude Opus 5.5',
    family: 'claude',
    provider: 'OpusMax',
    tier: 'Cognitive Frontier',
    type: 'flagship',
    context: '1,000,000 Tokens',
    inputPrice: '$3.00',
    outputPrice: '$15.00',
    strengths: 'Pinnacle frontier intelligence for mission-critical architectural proofs, distributed consensus, and formal logic synthesis.',
    latency: '38ms TTFT',
  },
  {
    id: 'claude-sonnet-5.5',
    name: 'Claude Sonnet 5.5',
    family: 'claude',
    provider: 'OpusMax',
    tier: 'Flagship Engineering',
    type: 'flagship',
    context: '1,000,000 Tokens',
    inputPrice: '$3.00',
    outputPrice: '$15.00',
    strengths: 'Benchmark model for autonomous multi-file code synthesis, agent loops in Claude Code CLI, Cursor, and Windsurf.',
    latency: '28ms TTFT',
  },
  {
    id: 'claude-opus-5',
    name: 'Claude Opus 5',
    family: 'claude',
    provider: 'OpusMax',
    tier: 'Cognitive Heavyweight',
    type: 'flagship',
    context: '1,000,000 Tokens',
    inputPrice: '$3.00',
    outputPrice: '$15.00',
    strengths: 'Deep reasoning depth for distributed systems architecture, complex legal contracts, and enterprise system designs.',
    latency: '40ms TTFT',
  },
  {
    id: 'claude-sonnet-5',
    name: 'Claude Sonnet 5',
    family: 'claude',
    provider: 'OpusMax',
    tier: 'Production Workhorse',
    type: 'flagship',
    context: '1,000,000 Tokens',
    inputPrice: '$3.00',
    outputPrice: '$15.00',
    strengths: 'Daily engineering workhorse combining fast generation velocity with deep multi-modal software comprehension.',
    latency: '29ms TTFT',
  },
  {
    id: 'claude-fable-5',
    name: 'Claude Fable 5',
    family: 'claude',
    provider: 'OpusMax',
    tier: 'Ultra-Fast IDE Specialist',
    type: 'fast',
    context: '1,000,000 Tokens',
    inputPrice: '$1.00',
    outputPrice: '$5.00',
    strengths: 'Highly tuned response model for real-time IDE completion, inline git diff generation, and rapid developer interaction.',
    latency: '22ms TTFT',
  },
  {
    id: 'claude-haiku-5.5',
    name: 'Claude Haiku 5.5',
    family: 'claude',
    provider: 'OpusMax',
    tier: 'High-Throughput Streaming',
    type: 'fast',
    context: '500,000 Tokens',
    inputPrice: '$0.80',
    outputPrice: '$4.00',
    strengths: 'Next-gen high-velocity streaming model delivering rapid completions for high-traffic developer tools and webhooks.',
    latency: '18ms TTFT',
  },

  // ScaleMax Models
  {
    id: 'gpt-4o',
    name: 'OpenAI GPT-4o',
    family: 'openai',
    provider: 'ScaleMax',
    tier: 'Multimodal Frontier',
    type: 'flagship',
    context: '128,000 Tokens',
    inputPrice: '$2.50',
    outputPrice: '$10.00',
    strengths: 'Omni-channel reasoning powerhouse combining high-velocity generation with state-of-the-art vision and tool comprehension.',
    latency: '25ms TTFT',
  },
  {
    id: 'gpt-4o-mini',
    name: 'OpenAI GPT-4o Mini',
    family: 'openai',
    provider: 'ScaleMax',
    tier: 'High-Velocity Efficiency',
    type: 'fast',
    context: '128,000 Tokens',
    inputPrice: '$0.15',
    outputPrice: '$0.60',
    strengths: 'Fractional-cost intelligence engineered for high-concurrency bot pipelines, semantic cache, and real-time streaming.',
    latency: '14ms TTFT',
  },
  {
    id: 'o1',
    name: 'OpenAI o1 Reasoning',
    family: 'openai',
    provider: 'ScaleMax',
    tier: 'Formal Reasoning Engine',
    type: 'reasoning',
    context: '200,000 Tokens',
    inputPrice: '$15.00',
    outputPrice: '$60.00',
    strengths: 'Pinnacle deliberative chain-of-thought logic designed for advanced mathematics, competitive programming, and algorithm proofs.',
    latency: '55ms TTFT',
  },
  {
    id: 'o3-mini',
    name: 'OpenAI o3-mini',
    family: 'openai',
    provider: 'ScaleMax',
    tier: 'High-Speed Deliberation',
    type: 'reasoning',
    context: '200,000 Tokens',
    inputPrice: '$1.10',
    outputPrice: '$4.40',
    strengths: 'High-velocity STEM reasoning model delivering benchmark performance in competitive coding at responsive latencies.',
    latency: '28ms TTFT',
  },
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek R1 (Reasoner)',
    family: 'deepseek',
    provider: 'ScaleMax',
    tier: 'Open Reasoning Pioneer',
    type: 'reasoning',
    context: '64,000 Tokens',
    inputPrice: '$0.55',
    outputPrice: '$2.19',
    strengths: 'Breakthrough reinforcement-learning reasoning architecture featuring transparent thought traces and competitive math proofs.',
    latency: '34ms TTFT',
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek V3 (Chat)',
    family: 'deepseek',
    provider: 'ScaleMax',
    tier: 'MoE Code & Chat',
    type: 'flagship',
    context: '64,000 Tokens',
    inputPrice: '$0.14',
    outputPrice: '$0.28',
    strengths: '671B Mixture-of-Experts architecture delivering top-tier code synthesis and instruction following at ultra-low costs.',
    latency: '22ms TTFT',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Google Gemini 2.5 Pro',
    family: 'gemini',
    provider: 'ScaleMax',
    tier: '2M Long-Context Leader',
    type: 'flagship',
    context: '2,000,000 Tokens',
    inputPrice: '$1.25',
    outputPrice: '$5.00',
    strengths: 'Massive 2,000,000 token context window capable of ingesting entire code repositories, hours of audio, or video logs in a single prompt.',
    latency: '35ms TTFT',
  },
  {
    id: 'grok-2',
    name: 'xAI Grok 2',
    family: 'grok',
    provider: 'ScaleMax',
    tier: 'Autonomous Reasoning',
    type: 'flagship',
    context: '128,000 Tokens',
    inputPrice: '$2.00',
    outputPrice: '$10.00',
    strengths: 'Cutting-edge real-time synthesis combining deep vision perception with direct mathematical proofing.',
    latency: '30ms TTFT',
  },
];

export const ModelCatalog: React.FC = () => {
  const [familyFilter, setFamilyFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<'all' | 'OpusMax' | 'ScaleMax'>('all');

  const filtered = STATIC_MODELS.filter((m) => {
    if (providerFilter !== 'all' && m.provider !== providerFilter) return false;
    if (familyFilter !== 'all' && m.family !== familyFilter) return false;
    return true;
  });

  return (
    <section id="models" className="border-b border-[#e7e5e4] bg-[#faf8f5] py-16 sm:py-24 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#e7e5e4] pb-6">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e7e5e4] shadow-xs text-xs font-mono font-medium text-[#57534e]">
              <Cpu className="h-3.5 w-3.5 text-[#6d28d9]" />
              <span>MULTI-PROVIDER MODEL INTELLIGENCE</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#1c1917] sm:text-4xl">
              Frontier Model Catalog
            </h2>
            <p className="text-sm text-[#57534e] leading-relaxed">
              Independently routed across dedicated upstream suppliers: <strong>OpusMax</strong> (Anthropic Claude rolling windows) and <strong>ScaleMax</strong> (OpenAI, Gemini, DeepSeek, and Grok).
            </p>
          </div>

          {/* Provider Filter Tabs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="inline-flex rounded-xl bg-white border border-[#e7e5e4] p-1 text-xs font-semibold shadow-xs">
              <button
                type="button"
                onClick={() => setProviderFilter('all')}
                className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                  providerFilter === 'all' ? 'bg-[#1c1917] text-white shadow-xs' : 'text-[#78716c] hover:text-[#1c1917]'
                }`}
              >
                All Providers ({STATIC_MODELS.length})
              </button>
              <button
                type="button"
                onClick={() => setProviderFilter('OpusMax')}
                className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer flex items-center gap-1.5 ${
                  providerFilter === 'OpusMax' ? 'bg-[#6d28d9] text-white shadow-plum' : 'text-[#78716c] hover:text-[#1c1917]'
                }`}
              >
                <span>OpusMax (Claude)</span>
              </button>
              <button
                type="button"
                onClick={() => setProviderFilter('ScaleMax')}
                className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer flex items-center gap-1.5 ${
                  providerFilter === 'ScaleMax' ? 'bg-blue-600 text-white shadow-xs' : 'text-[#78716c] hover:text-[#1c1917]'
                }`}
              >
                <span>ScaleMax (OpenAI/DeepSeek)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Model Family Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFamilyFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              familyFilter === 'all' ? 'bg-white border-2 border-[#6d28d9] text-[#6d28d9] font-bold shadow-xs' : 'bg-white border border-[#e7e5e4] text-[#78716c] hover:text-[#1c1917]'
            }`}
          >
            All Families
          </button>
          <button
            onClick={() => setFamilyFilter('claude')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              familyFilter === 'claude' ? 'bg-white border-2 border-[#6d28d9] text-[#6d28d9] font-bold shadow-xs' : 'bg-white border border-[#e7e5e4] text-[#78716c] hover:text-[#1c1917]'
            }`}
          >
            Anthropic Claude
          </button>
          <button
            onClick={() => setFamilyFilter('openai')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              familyFilter === 'openai' ? 'bg-white border-2 border-blue-600 text-blue-700 font-bold shadow-xs' : 'bg-white border border-[#e7e5e4] text-[#78716c] hover:text-[#1c1917]'
            }`}
          >
            OpenAI (o1, GPT-4o, o3-mini)
          </button>
          <button
            onClick={() => setFamilyFilter('deepseek')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              familyFilter === 'deepseek' ? 'bg-white border-2 border-blue-600 text-blue-700 font-bold shadow-xs' : 'bg-white border border-[#e7e5e4] text-[#78716c] hover:text-[#1c1917]'
            }`}
          >
            DeepSeek (R1, V3)
          </button>
          <button
            onClick={() => setFamilyFilter('gemini')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              familyFilter === 'gemini' ? 'bg-white border-2 border-blue-600 text-blue-700 font-bold shadow-xs' : 'bg-white border border-[#e7e5e4] text-[#78716c] hover:text-[#1c1917]'
            }`}
          >
            Google Gemini (2.5 Pro)
          </button>
          <button
            onClick={() => setFamilyFilter('grok')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              familyFilter === 'grok' ? 'bg-white border-2 border-blue-600 text-blue-700 font-bold shadow-xs' : 'bg-white border border-[#e7e5e4] text-[#78716c] hover:text-[#1c1917]'
            }`}
          >
            xAI Grok
          </button>
        </div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((m) => {
            const isOpus = m.provider === 'OpusMax';
            return (
              <div
                key={m.id}
                className="group relative rounded-2xl border border-[#e7e5e4] bg-white p-6 shadow-xs transition-all hover:border-[#6d28d9]/40 hover:shadow-warm flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[#1c1917] group-hover:text-[#6d28d9] transition-colors">
                          {m.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                            isOpus
                              ? 'bg-[#f5f3ff] text-[#6d28d9] border border-[#ddd6fe]'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {m.provider}
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-[#78716c] mt-0.5">ID: {m.id}</p>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-[#faf8f5] text-[#57534e] border border-[#e7e5e4] shrink-0">
                      {m.tier}
                    </span>
                  </div>

                  <p className="text-xs text-[#57534e] leading-relaxed">
                    {m.strengths}
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#f5f2eb] text-[11px] font-mono">
                    <div>
                      <span className="text-[#a8a29e] block text-[10px]">Context</span>
                      <span className="font-semibold text-[#1c1917]">{m.context}</span>
                    </div>
                    <div>
                      <span className="text-[#a8a29e] block text-[10px]">Rates (In/Out)</span>
                      <span className="font-semibold text-[#1c1917]">{m.inputPrice}/{m.outputPrice}</span>
                    </div>
                    <div>
                      <span className="text-[#a8a29e] block text-[10px]">TTFT Speed</span>
                      <span className="font-semibold text-emerald-700">{m.latency}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#f5f2eb] flex items-center justify-between">
                  <span className="text-[11px] text-[#78716c] font-medium">
                    {isOpus ? '5h Rolling Window Plan' : 'Pay-As-You-Go Credits (₹1 = $7)'}
                  </span>
                  <Link
                    to="/pricing"
                    className="text-xs font-semibold text-[#6d28d9] hover:text-[#581c87] inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>View Plans</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
