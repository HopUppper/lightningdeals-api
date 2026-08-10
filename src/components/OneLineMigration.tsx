import React from 'react';
import { motion } from 'framer-motion';

export const OneLineMigration: React.FC = () => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://lightningapi.pro';


  return (
    <section className="py-16 md:py-24 bg-card/90 text-fg border-y border-border/80 relative overflow-hidden">
      <div className="max-w-page mx-auto px-5 sm:px-6 relative z-10">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              03 — MIGRATION
            </span>
            <h2 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl text-fg">
              One line changes.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted max-w-md">
              No SDK fork, no wrapper library, no rewrite. Repoint the base URL and every request, stream, and tool call keeps working exactly as it did.
            </p>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {/* Before Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="overflow-hidden rounded-panel border border-red-500/30 bg-bg"
            >
              <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-2 text-[11px]">
                <span className="h-2 w-2 rounded-full bg-red-500/80"></span>
                <span className="font-mono font-bold uppercase tracking-wider text-red-500">Before</span>
              </div>
              <div className="p-4 font-mono text-xs overflow-x-auto text-fg">
                <span className="text-muted">base_url = </span>
                <span className="text-red-400">"https://api.anthropic.com"</span>
              </div>
            </motion.div>

            {/* After Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="overflow-hidden rounded-panel border border-emerald-500/40 bg-bg shadow-xl shadow-emerald-500/5"
            >
              <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-2 text-[11px]">
                <span className="h-2 w-2 rounded-full bg-emerald-500/80"></span>
                <span className="font-mono font-bold uppercase tracking-wider text-emerald-500">After</span>
              </div>
              <div className="p-4 font-mono text-xs overflow-x-auto text-fg">
                <span className="text-muted">base_url = </span>
                <span className="text-emerald-400">"{baseUrl}"</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
