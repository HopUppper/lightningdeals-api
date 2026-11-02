import React from 'react';
import { Layers, Terminal, Clock, ShieldCheck, CheckCircle2, ArrowRight, Sparkles, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CapabilitySection: React.FC = () => {
  return (
    <section className="relative py-16 sm:py-24 bg-white text-zinc-950 font-sans overflow-hidden border-b border-zinc-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-3 text-left">
          <div className="inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-violet-700 font-semibold">
              WHY DEVELOPERS CHOOSE LIGHTNINGAPI
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-zinc-950 font-display tracking-tight">
            Built for developers who want simplicity and savings.
          </h2>

          <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
            Everything you need to run top AI models in your tools, scripts, and apps without the typical retail markup.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Block 1: One Integration */}
          <div className="lg:col-span-7 p-7 sm:p-9 rounded-2xl bg-zinc-50 border border-zinc-200 shadow-xs flex flex-col justify-between space-y-6 hover:border-zinc-300 transition-colors">
            <div className="space-y-3">
              <span className="text-xs font-mono font-bold text-violet-600 uppercase tracking-wider">
                01 / ALL TOP MODELS IN ONE PLACE
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-zinc-950 font-display tracking-tight">
                One key for Claude, OpenAI, Gemini &amp; DeepSeek.
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed max-w-xl">
                Access Claude Sonnet 5.5, Claude Opus 5.5, OpenAI o3, GPT-4o, and DeepSeek through a single unified connection.
                No need to manage multiple billing accounts, credit cards, or separate provider keys.
              </p>
            </div>

            {/* Architecture Ingress Diagram */}
            <div className="p-4 rounded-xl bg-white border border-zinc-200 font-mono text-xs text-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span>UNIFIED INGRESS PIPELINE</span>
                <span className="text-emerald-600 font-medium">PORT 443 / HTTPS</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
                <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">Your Tools</div>
                <div className="p-2.5 rounded-lg bg-violet-50 text-violet-700 font-bold border border-violet-200">LightningAPI Gateway</div>
                <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">Target Model</div>
              </div>
            </div>

            <div className="pt-1">
              <Link
                to="/how-it-works"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors"
              >
                <span>Read how the routing engine works</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Block 2: Zero Setup Friction */}
          <div className="lg:col-span-5 p-7 sm:p-9 rounded-2xl bg-zinc-50 border border-zinc-200 shadow-xs flex flex-col justify-between space-y-6 hover:border-zinc-300 transition-colors">
            <div className="space-y-3">
              <span className="text-xs font-mono font-bold text-violet-600 uppercase tracking-wider">
                02 / ZERO SETUP FRICTION
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-zinc-950 font-display tracking-tight">
                Works in your favorite tools.
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                100% compatible with Cursor, Windsurf, Claude Code CLI, VS Code, and Python. Just paste your Base URL and API key and start coding immediately.
              </p>
            </div>

            {/* Checklist of Verified Toolchains */}
            <div className="space-y-2 pt-1 font-mono text-xs text-zinc-800">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cursor &amp; Windsurf native baseURL override</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Claude Code CLI terminal env configuration</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Python &amp; Node.js OpenAI / Anthropic SDK parity</span>
              </div>
            </div>

            <div className="pt-1">
              <Link
                to="/docs"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors"
              >
                <span>Browse developer integration guides</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default CapabilitySection;