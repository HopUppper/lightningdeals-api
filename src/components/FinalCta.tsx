import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

export const FinalCta: React.FC = () => {
  const whatsappUrl = `https://wa.me/917695956938?text=${encodeURIComponent('Hi LightningDeals Team! I would like to get a free trial API key for testing.')}`;

  return (
    <section className="relative border-b border-border bg-[#090d16] py-24 text-white overflow-hidden">
      {/* Background Radial Glow */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent pointer-events-none"
      />

      <div className="relative mx-auto max-w-page px-5 text-center sm:px-6 z-10 space-y-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-mono font-bold text-amber-400 uppercase tracking-widest"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
          <span>Ready to start building?</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl max-w-3xl mx-auto leading-tight"
        >
          Power your AI tools with <span className="text-amber-400">LightningDeals</span>.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto text-base sm:text-lg leading-relaxed text-slate-300 font-sans"
        >
          Get a trial API key on WhatsApp or request a custom 5-hour rolling window package quote. Connect your favorite AI tools in seconds using <code className="font-mono text-amber-400 font-bold bg-white/10 px-2 py-0.5 rounded">npx lightningdeals</code>.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-4 sm:flex-row sm:justify-center pt-2"
        >
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-control bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-2xl shadow-emerald-600/20 transition-all"
            >
              <WhatsAppIcon className="w-5 h-5" />
              <span>Get Trial Key on WhatsApp (+91 7695956938)</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>

          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <Link
              to="/request-quote"
              className="ui-button-secondary justify-center border-white/20 bg-white/10 text-white hover:bg-white/20 text-sm py-4 px-8 font-semibold"
            >
              <span>Request Custom Package Quote</span>
            </Link>
          </motion.div>
        </motion.div>

        <p className="text-xs text-slate-400 font-mono pt-2">
          5-Hour Rolling Window • WhatsApp Support (+91 7695956938) • One-Command Setup
        </p>

      </div>
    </section>
  );
};
