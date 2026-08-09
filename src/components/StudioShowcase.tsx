import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, FolderTree, Code2, Play } from 'lucide-react';
import { motion } from 'framer-motion';

export const StudioShowcase: React.FC = () => {
  return (
    <section id="studio" className="border-b border-border bg-[#090d16] text-white py-20 sm:py-28 relative overflow-hidden">
      {/* Radial Gradient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-amber-500/10 blur-[140px] pointer-events-none rounded-full" />

      <div className="max-w-page mx-auto px-5 sm:px-6 relative z-10">
        <div className="grid gap-12 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
          
          {/* Left Column: Description */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>LightningDeals Studio</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Turn a plain-English brief into project files.
            </h2>

            <p className="text-sm sm:text-base leading-relaxed text-slate-300">
              Describe the application or website you want to build. Studio generates complete project structures, UI components, and API routes in one workspace.
            </p>

            <ol className="space-y-3 pt-2 text-xs sm:text-sm text-slate-200 font-mono">
              <li className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs">1</span>
                <span><strong className="text-white">Describe</strong> — Write your application requirements in natural language.</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs">2</span>
                <span><strong className="text-white">Generate</strong> — Receive editable production code files automatically.</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs">3</span>
                <span><strong className="text-white">Deploy & Connect</strong> — Run your code with your LightningDeals API key.</span>
              </li>
            </ol>

            <div className="pt-2">
              <Link to="/trial" className="ui-button-primary text-xs py-3 px-6 font-bold gap-2 inline-flex">
                <span>Try LightningDeals Studio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* Right Column: Studio Project Preview Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-panel border border-white/10 bg-[#111625] shadow-2xl overflow-hidden backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5 bg-black/40 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-slate-300">studio / project preview</span>
              </div>
              <span className="text-[11px] text-amber-400 font-bold">200 OK</span>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-[.9fr_1.1fr]">
              <div className="space-y-4">
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">Natural Language Prompt</p>
                <div className="rounded-control border border-white/10 bg-black/40 p-4 text-xs leading-relaxed text-slate-200 font-mono">
                  "Build a real-time AI dashboard with token balance meters, live model selector, and responsive gateway routing."
                </div>
                <div className="rounded-control border border-emerald-500/30 bg-emerald-500/10 p-3 text-[11px] font-mono text-emerald-300 flex items-center gap-2">
                  <Play className="w-3 h-3 fill-current text-emerald-400" />
                  <span>Project plan ready • 4 files generated</span>
                </div>
              </div>

              <div className="rounded-control border border-white/10 bg-[#0a0e19] p-4 font-mono text-xs leading-relaxed text-slate-300">
                <p className="text-slate-500 text-[10px] uppercase font-bold mb-2">Generated Structure</p>
                <p><span className="text-amber-400">▾</span> src/</p>
                <p className="pl-4"><span className="text-amber-400">▾</span> components/</p>
                <p className="pl-8 text-slate-400">TokenMeter.tsx</p>
                <p className="pl-8 text-slate-400">ModelSelector.tsx</p>
                <p className="pl-4 text-slate-400">App.tsx</p>
                <p className="pl-4 text-slate-400">apiGateway.ts</p>
                <div className="mt-3 border-t border-white/10 pt-2 text-emerald-400 text-[11px] font-bold">
                  ✓ Verified against LightningDeals Gateway
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
