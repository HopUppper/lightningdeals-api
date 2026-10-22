import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  ArrowRight,
  Code2,
  FileText,
  Brain,
  CheckCircle2,
  Cpu,
  Layers,
  Zap,
  Eye,
  Lock,
  ArrowUpRight,
  Terminal,
  FileCode,
  ShieldCheck,
  Check,
  Play
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const StudioFlagshipSection: React.FC = () => {
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<'canvas' | 'reasoning' | 'files'>('canvas');

  // Dynamic studio link: route to studio if authenticated, else to login with redirect
  const studioTargetUrl = user ? '/dashboard/studio' : '/login?redirect=%2Fdashboard%2Fstudio';

  const capabilities = [
    {
      id: 'canvas',
      title: 'Interactive Artifacts & Canvas',
      tag: 'Live Execution',
      icon: Code2,
      desc: 'Watch the AI generate clean React components, SVG diagrams, and scripts rendered live side-by-side with your prompt stream.',
    },
    {
      id: 'reasoning',
      title: 'Extended Thinking & Deliberation',
      tag: 'Zero Fluff',
      icon: Brain,
      desc: 'Inspect step-by-step cognitive reasoning traces, logic verification, and error boundaries with Claude 3.7 & Sonnet 5.5.',
    },
    {
      id: 'files',
      title: 'Multimodal Files & Code Review',
      tag: 'Deep Context',
      icon: FileText,
      desc: 'Upload PDF specs, SQL schemas, bug logs, and screenshots. Studio synthesizes entire repositories and outputs ready-to-run solutions.',
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-[#fbf9f5] border-t border-[#ede8e1] relative overflow-hidden">
      {/* Subtle ambient gradient mesh */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-r from-violet-200/30 via-indigo-200/20 to-amber-200/20 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-16">
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-[#f5f3ff] text-[#6d28d9] border border-[#c4b5fd]/80 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#6d28d9]" />
            <span>YOUR AI WORKSPACE</span>
          </motion.div>

          <motion.h2
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-[#1c1917] tracking-tight leading-[1.15]"
          >
            More than an API. <br className="hidden sm:inline" />
            <span className="text-[#6d28d9]">A workspace to think, create and build.</span>
          </motion.h2>

          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm sm:text-base text-[#57534e] max-w-2xl mx-auto leading-relaxed"
          >
            Explore AI Chat Studio with an eligible trial key or unlock more capacity and capabilities with a paid plan. Chat with supported models, analyze documents, write code and create downloadable work products in one workspace.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3 pt-3"
          >
            <Link
              to={studioTargetUrl}
              className="px-6 py-3 rounded-2xl bg-[#6d28d9] hover:bg-[#5b21b6] text-white text-sm font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-2 group cursor-pointer"
            >
              <Bot className="w-4 h-4 text-violet-200" />
              <span>Explore AI Chat Studio</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              to="/pricing"
              className="px-6 py-3 rounded-2xl bg-white hover:bg-[#faf8f5] text-[#1c1917] border border-[#ede8e1] text-sm font-semibold shadow-2xs hover:border-[#cbd5e1] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>View Plans</span>
              <ArrowUpRight className="w-4 h-4 text-[#78716c]" />
            </Link>
          </motion.div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-[#78716c]">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Free 200k Trial Keys Included</span>
            </span>
            <span className="hidden sm:inline text-[#d6d3d1]">•</span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-violet-600" />
              <span>Multi-Turn Threads Enabled</span>
            </span>
            <span className="hidden sm:inline text-[#d6d3d1]">•</span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero-Fluff Reasoning</span>
            </span>
          </div>
        </div>

        {/* Feature Grid & Visual Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Capability Selectors */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#78716c] px-1">
              Engineered for Production Builders
            </h3>

            <div className="space-y-3">
              {capabilities.map((cap) => {
                const Icon = cap.icon;
                const isActive = activeTab === cap.id;
                return (
                  <button
                    key={cap.id}
                    type="button"
                    onClick={() => setActiveTab(cap.id as any)}
                    className={`w-full text-left p-5 rounded-3xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white border-[#6d28d9] shadow-playful ring-1 ring-[#6d28d9]/20'
                        : 'bg-[#faf8f5]/80 hover:bg-white border-[#ede8e1] text-[#78716c]'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-3 rounded-2xl shrink-0 transition-colors ${
                          isActive
                            ? 'bg-[#f5f3ff] text-[#6d28d9]'
                            : 'bg-white text-[#78716c] border border-[#ede8e1]'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h4
                            className={`text-sm font-bold transition-colors ${
                              isActive ? 'text-[#1c1917]' : 'text-[#44403c]'
                            }`}
                          >
                            {cap.title}
                          </h4>
                          <span
                            className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                              isActive
                                ? 'bg-violet-100 text-violet-700'
                                : 'bg-[#ede8e1] text-[#78716c]'
                            }`}
                          >
                            {cap.tag}
                          </span>
                        </div>
                        <p className="text-xs text-[#78716c] leading-relaxed">
                          {cap.desc}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-[#f5f3ff]/60 border border-[#c4b5fd]/40 text-xs text-[#5b21b6] flex items-center justify-between">
              <span className="font-medium">Have an active trial key? Open Studio immediately.</span>
              <Link
                to={studioTargetUrl}
                className="font-bold underline hover:text-[#431407] shrink-0 ml-2"
              >
                Launch Studio →
              </Link>
            </div>
          </div>

          {/* Right Column: Studio Light-Mode Interactive Mockup */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-[#ede8e1] bg-white shadow-playful overflow-hidden">
              {/* Window Header */}
              <div className="h-11 bg-[#faf8f5] border-b border-[#ede8e1] px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-mono text-[#78716c] ml-2">lightning-studio // session_94b2</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-white border border-[#ede8e1] text-[10px] font-mono font-bold text-[#6d28d9]">
                    Claude Sonnet 5.5
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[10px] font-mono font-bold text-emerald-700">
                    Active • 200k Quota
                  </span>
                </div>
              </div>

              {/* Workspace Content Preview */}
              <div className="p-5 sm:p-6 space-y-4 bg-[#fbf9f5] min-h-[380px]">
                {/* User Prompt Message */}
                <div className="flex items-start gap-3 max-w-[85%] ml-auto justify-end">
                  <div className="bg-[#1c1917] text-white p-3.5 rounded-2xl rounded-tr-xs text-xs space-y-1 shadow-2xs">
                    <p className="font-medium leading-relaxed">
                      Analyze this GraphQL schema and generate a high-concurrency DataLoader cache middleware with Redis failover.
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 pt-1">
                      <span className="inline-flex items-center gap-1 bg-zinc-800 px-1.5 py-0.5 rounded">
                        <FileCode className="w-3 h-3 text-violet-400" />
                        <span>schema.graphql</span>
                      </span>
                      <span>· Just now</span>
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    U
                  </div>
                </div>

                {/* AI Response Card */}
                <div className="flex items-start gap-3 max-w-[95%]">
                  <div className="w-7 h-7 rounded-full bg-white border border-[#ede8e1] text-violet-700 flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                    ⚡
                  </div>
                  <div className="flex-1 bg-white border border-[#ede8e1] p-4 rounded-2xl rounded-tl-xs space-y-3 shadow-2xs">
                    {/* Thinking disclosure */}
                    <div className="p-2.5 rounded-xl bg-[#faf8f5] border border-[#ede8e1] text-[11px] text-[#78716c] flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Brain className="w-3.5 h-3.5 text-violet-600" />
                        <span>Thought Process (2,450 tokens • 420ms)</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        VERIFIED
                      </span>
                    </div>

                    {/* AI Message Text */}
                    <p className="text-xs text-[#1c1917] leading-relaxed">
                      I inspected <code className="bg-[#faf8f5] px-1 py-0.5 rounded text-[11px] font-mono text-[#6d28d9]">schema.graphql</code>. Below is the production-ready batching middleware featuring double-checked locking, pipelined Redis lookup, and local LRU fallback:
                    </p>

                    {/* Interactive Artifact Preview */}
                    <div className="rounded-xl border border-[#ede8e1] overflow-hidden bg-[#faf8f5]">
                      <div className="h-8 bg-[#f5f3ff] border-b border-[#ede8e1] px-3 flex items-center justify-between text-[11px]">
                        <span className="font-mono font-bold text-[#6d28d9] flex items-center gap-1.5">
                          <Code2 className="w-3.5 h-3.5" />
                          <span>dataloader-middleware.ts</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-zinc-500">TypeScript</span>
                          <span className="px-1.5 py-0.2 rounded bg-violet-600 text-white text-[9px] font-bold">
                            Artifact
                          </span>
                        </div>
                      </div>
                      <pre className="p-3 text-[11px] font-mono text-[#1c1917] overflow-x-auto leading-relaxed bg-white">
{`export class ConcurrentBatchLoader<K, V> {
  private cache = new LRUMap<K, Promise<V>>(10000);

  constructor(private batchFn: (keys: readonly K[]) => Promise<(V | Error)[]>) {}

  public async load(key: K): Promise<V> {
    const existing = this.cache.get(key);
    if (existing) return existing;
    // Pipelined batch dispatch with zero head-of-line blocking
    const promise = this.dispatchBatch(key);
    this.cache.set(key, promise);
    return promise;
  }
}`}
                      </pre>
                    </div>

                    {/* Model & Token Telemetry footer */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#ede8e1] text-[10px] font-mono text-[#78716c]">
                      <span>Model: claude-sonnet-5.5</span>
                      <span className="text-emerald-600 font-bold">3,892 tokens deducted • 196,108 remaining</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Bar */}
              <div className="p-3 bg-white border-t border-[#ede8e1] flex items-center justify-between text-xs">
                <span className="text-[#78716c] font-medium flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-violet-600 fill-current" />
                  <span>Start prompting in seconds with an instant trial key</span>
                </span>
                <Link
                  to={studioTargetUrl}
                  className="px-3 py-1.5 rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 font-bold transition-colors flex items-center gap-1"
                >
                  <span>Launch Workspace</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
