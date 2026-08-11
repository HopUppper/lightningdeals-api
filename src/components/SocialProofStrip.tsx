import React from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export const SocialProofStrip: React.FC = () => {
  return (
    <section className="border-b border-border/80 bg-white/90 py-8 px-5 sm:px-6 backdrop-blur-md">
      <div className="max-w-page mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Active Trust Counter */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-4"
        >
          <div className="flex -space-x-2 overflow-hidden">
            <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center font-mono shadow-sm">
              CC
            </div>
            <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-900 text-white font-bold text-xs flex items-center justify-center font-mono shadow-sm">
              CR
            </div>
            <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-cyan-600 text-white font-bold text-xs flex items-center justify-center font-mono shadow-sm">
              WS
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-fg">Powering Active Developers Worldwide</p>
            <p className="text-[11px] text-muted font-mono">Claude Code CLI · Cursor · Windsurf · VS Code</p>
          </div>
        </motion.div>

        {/* IDE Compatibility Badges */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="flex flex-wrap items-center gap-6 text-xs font-mono font-semibold text-muted"
        >
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-violet-600" />
            <span>Drop-in Anthropic /v1 Protocol</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-violet-600" />
            <span>99.9% Production Uptime</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-600" />
            <span>Zero Prompt Data Storage</span>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
