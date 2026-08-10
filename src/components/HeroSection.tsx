import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowRight, CheckCircle2, Terminal, Copy, Check, Sparkles, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const TerminalMockup: React.FC<{ copiedCmd: boolean; handleCopyCmd: () => void }> = React.memo(({ copiedCmd, handleCopyCmd }) => {
  const [terminalStep, setTerminalStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTerminalStep((prev) => (prev < 5 ? prev + 1 : 0));
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-card border border-border/90 rounded-panel overflow-hidden shadow-2xl text-left relative group transform-gpu">
      {/* Terminal Window Header Bar */}
      <div className="bg-bg/90 px-4 py-3 border-b border-border/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block hover:opacity-80" />
          <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block hover:opacity-80" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block hover:opacity-80" />
          <span className="text-[11px] font-mono text-muted ml-2">bash — npx lightningdeals</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCopyCmd}
          className="flex items-center gap-1.5 text-[11px] font-mono text-muted hover:text-fg bg-bg px-3 py-1 rounded border border-border/80 transition-colors"
          title="Copy setup command"
        >
          {copiedCmd ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          <span className="font-bold">{copiedCmd ? 'Copied!' : 'npx lightningdeals'}</span>
        </motion.button>
      </div>

      {/* Terminal Body with Animated Step Typing Progress */}
      <div className="p-6 font-mono text-xs leading-relaxed space-y-3 bg-bg/50 min-h-[220px]">
        <p className="text-muted flex items-center gap-2">
          <span className="text-amber-500">$</span> npx lightningdeals
        </p>

        <AnimatePresence mode="wait">
          {terminalStep >= 1 && (
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-amber-500 font-bold"
            >
              ⚡ LIGHTNINGDEALS Setup Wizard v1.0.4
            </motion.p>
          )}
        </AnimatePresence>

        {terminalStep >= 2 && (
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-fg"
          >
            Enter your LightningDeals API key: <span className="text-muted">ld_live_••••••••••••••••</span>
          </motion.p>
        )}

        {terminalStep >= 3 && (
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-emerald-400 font-semibold flex items-center gap-1.5"
          >
            <span>✓ API key verified (5-Hour Rolling Window Active)</span>
          </motion.p>
        )}

        {terminalStep >= 4 && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1 pt-1"
          >
            <p className="text-fg font-semibold">Detecting installed AI developer tools...</p>
            <div className="pl-3 space-y-1 text-muted text-[11px]">
              <p className="text-fg font-semibold">✓ Claude Code CLI — Configured (~/.claude/settings.json)</p>
              <p className="text-fg font-semibold">✓ Cursor IDE — Configured</p>
              <p className="text-fg font-semibold">✓ Windsurf Editor — Configured</p>
            </div>
          </motion.div>
        )}

        {terminalStep >= 5 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pt-2 border-t border-border/40 space-y-1"
          >
            <p className="text-emerald-400 font-semibold">✓ Gateway Verification Success (39ms latency)</p>
            <p className="text-amber-400 font-bold">🎉 LightningDeals configuration complete. Run "claude" to start coding!</p>
          </motion.div>
        )}
      </div>
    </div>
  );
});

export const HeroSection: React.FC = () => {

  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://lightningapi.pro';
  const whatsappUrl = `https://wa.me/917695956938?text=${encodeURIComponent('Hi LightningDeals Team! I would like to get a free trial API key for testing.')}`;


  const handleCopyCmd = () => {
    navigator.clipboard.writeText('npx lightningdeals');
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(baseUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  return (
    <section className="relative overflow-hidden py-20 sm:py-28 border-b border-border bg-gradient-to-b from-card/80 via-bg to-bg selection:bg-amber-500/20">
      {/* Static Lightweight Ambient Glow */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-amber-500/10 opacity-30 blur-[100px] pointer-events-none rounded-full transform-gpu" />

      <div className="max-w-page mx-auto px-5 sm:px-6 text-center space-y-10 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Eyebrow Badge */}
          <motion.div variants={itemVariants} className="inline-block">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-mono font-bold text-amber-500 uppercase tracking-widest shadow-lg shadow-amber-500/5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>Claude Fable 5 & Sonnet 5 Live</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-7xl font-extrabold tracking-tight text-fg max-w-4xl mx-auto leading-[1.08]"
          >
            One base URL. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-fg via-amber-400 to-amber-500 bg-clip-text text-transparent">
              The whole Claude lineup.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-base sm:text-xl text-muted max-w-2xl mx-auto font-normal leading-relaxed"
          >
            Prepaid AI API Gateway for developers. Repoint your base URL to <code className="text-amber-500 font-mono font-bold bg-bg px-2 py-0.5 rounded border border-border">{baseUrl}</code> and get immediate access to top models with Claude Code, Cursor, Windsurf, and VS Code.
          </motion.p>

          {/* Primary CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-control bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/20 transition-all w-full sm:w-auto"
              >
                <WhatsAppIcon className="w-5 h-5" />
                <span>Get Trial Key on WhatsApp</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
              <Link
                to="/docs"
                className="ui-button-secondary text-sm py-4 px-8 gap-2.5 w-full sm:w-auto justify-center font-semibold hover:border-amber-500/40"
              >
                <Terminal className="w-4 h-4 text-amber-500" />
                <span>Explore the API</span>
              </Link>
            </motion.div>
          </motion.div>

          {/* Copyable Base URL Bar */}
          <motion.div variants={itemVariants} className="max-w-md mx-auto pt-2">
            <div className="flex items-stretch border border-border bg-card/90 rounded-panel overflow-hidden shadow-lg">
              <span className="flex shrink-0 items-center border-r border-border px-3 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10">
                <Server className="w-3 h-3 mr-1" />
                base url
              </span>
              <code className="flex-1 overflow-x-auto whitespace-nowrap px-3.5 py-2.5 font-mono text-xs text-fg self-center text-left">
                {baseUrl}
              </code>
              <button
                type="button"
                onClick={handleCopyUrl}
                aria-label="Copy base URL"
                className="flex shrink-0 items-center border-l border-border px-3 text-muted hover:text-fg hover:bg-card transition-colors"
                title="Copy base URL"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </motion.div>
        </motion.div>

        {/* Hero Interactive Animated Terminal Visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
          className="max-w-2xl mx-auto pt-4"
        >
          <TerminalMockup copiedCmd={copiedCmd} handleCopyCmd={handleCopyCmd} />
        </motion.div>

        {/* Animated Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-muted max-w-2xl mx-auto"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Anthropic & OpenAI Compatible</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>5-Hour Rolling Window</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>One-Command CLI Setup</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
