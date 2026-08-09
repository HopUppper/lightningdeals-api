import React from 'react';
import { Cpu, Server, ShieldCheck, Zap, ArrowRight, Database, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const ApiArchitectureFlow: React.FC = () => {
  const nodes = [
    {
      title: 'Your Application / IDE',
      subtitle: 'Claude Code, Cursor, Windsurf, Custom App',
      icon: Cpu,
      accent: 'text-fg',
      border: 'border-border',
    },
    {
      title: 'LightningDeals Gateway',
      subtitle: 'Anthropic Drop-In API Gateway (Port 3001)',
      icon: Zap,
      accent: 'text-amber-500',
      border: 'border-amber-500/40',
    },
    {
      title: 'Token Validation',
      subtitle: 'Key Hash Check & 5-Hour Rolling Window Ledger',
      icon: ShieldCheck,
      accent: 'text-emerald-500',
      border: 'border-emerald-500/40',
    },
    {
      title: 'Model Router',
      subtitle: 'Supports Claude Fable 5, Sonnet 5, Opus 5, 3.5 Sonnet',
      icon: Server,
      accent: 'text-cyan-500',
      border: 'border-cyan-500/40',
    },

    {
      title: 'Supplier Credentials',
      subtitle: 'Encrypted Upstream Vendor Master Connection',
      icon: Database,
      accent: 'text-amber-500',
      border: 'border-amber-500/40',
    },
  ];

  return (
    <section className="py-24 border-b border-border bg-bg relative overflow-hidden">
      <div className="max-w-page mx-auto px-5 sm:px-6 space-y-14 relative z-10">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Secure Infrastructure Gateway</span>
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-fg tracking-tight"
          >
            How the API Gateway Works
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base text-muted leading-relaxed"
          >
            LightningDeals acts as an isolated, high-performance proxy layer. Your application communicates with standard Anthropic SDK endpoints while master supplier credentials remain 100% hidden.
          </motion.p>
        </div>

        {/* Architecture Flow Diagram with Animated Signal Pulses */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-card/90 border border-border p-6 sm:p-10 rounded-hero shadow-2xl relative overflow-hidden backdrop-blur-xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10 items-center">
            {nodes.map((node, idx) => (
              <React.Fragment key={node.title}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -4 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className={`bg-bg/90 border ${node.border} p-5 rounded-panel text-center space-y-3 flex flex-col items-center justify-center hover:shadow-xl transition-all group backdrop-blur-md cursor-pointer`}
                >
                  <div className={`p-3 rounded-full bg-card border border-border ${node.accent} group-hover:scale-110 transition-transform shadow-md`}>
                    <node.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-fg leading-tight group-hover:text-amber-400 transition-colors">{node.title}</h3>
                    <p className="text-[10px] text-muted font-mono mt-1 leading-tight">{node.subtitle}</p>
                  </div>
                </motion.div>

                {idx < nodes.length - 1 && (
                  <div className="hidden md:flex justify-center items-center text-muted relative">
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3], x: [0, 6, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <ArrowRight className="w-5 h-5 text-amber-500" />
                    </motion.div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-border/60 flex flex-wrap justify-between items-center text-xs font-mono text-muted gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>AES-256 Encrypted Supplier Key</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Sub-50ms Gateway Routing Latency</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Exact Token Accounting & Audit Ledger</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
