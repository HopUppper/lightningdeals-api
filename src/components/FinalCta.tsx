import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const FinalCta: React.FC = () => {
  return (
    <section className="relative border-b border-border bg-slate-950 py-20 text-white overflow-hidden">
      
      {/* Background Animated Gradient Light Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.2, 0.35, 0.2],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-600/30 via-indigo-600/10 to-transparent pointer-events-none"
      />

      <div className="relative mx-auto max-w-page px-5 text-center sm:px-6 z-10 space-y-6">
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider"
        >
          <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
          <span>Ready to start building?</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl max-w-2xl mx-auto leading-tight"
        >
          Power your AI tools with <span className="animated-gradient-text">LightningDeals</span>.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="max-w-xl mx-auto text-xs sm:text-sm leading-relaxed text-slate-400 font-sans"
        >
          Claim a trial API key or request custom 5-hour rolling window package quotes. Connect your favorite tools in seconds with <code className="font-mono text-cyan-400 font-bold bg-white/10 px-2 py-0.5 rounded">npx lightningdeals</code>.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-2"
        >
          <Link
            to="/trial"
            className="ui-button-primary text-xs py-3 px-6 font-bold gap-2"
          >
            <span>Claim Free 1M Token Trial Key</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/request-quote"
            className="ui-button-secondary border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs py-3 px-6 font-semibold"
          >
            <span>Request Custom Enterprise Quote</span>
          </Link>
        </motion.div>

      </div>
    </section>
  );
};
