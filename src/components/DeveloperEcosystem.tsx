import React from 'react';
import { ArrowRight, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export const DeveloperEcosystem: React.FC = () => {
  const tools = [
    { name: 'Claude Code', category: 'CLI Agent', path: '/docs/setup/claude-code' },
    { name: 'Codex', category: 'AI Assistant', path: '/docs' },
    { name: 'Cursor IDE', category: 'Editor Extension', path: '/docs' },
    { name: 'Windsurf Editor', category: 'IDE Editor', path: '/docs' },
    { name: 'VS Code', category: 'Editor Extension', path: '/docs' },
    { name: 'Continue', category: 'VS Code Extension', path: '/docs' },
    { name: 'Cherry Client', category: 'Desktop Workspace', path: '/docs' },
    { name: 'OpenCode', category: 'Open Source', path: '/docs' },
    { name: 'Roo Code', category: 'Developer Tool', path: '/docs' },
    { name: 'Cline', category: 'Autonomous Coding', path: '/docs' },
    { name: 'OpenClaw', category: 'CLI Client', path: '/docs' },
    { name: 'Hermes', category: 'Agent System', path: '/docs' },
    { name: 'n8n', category: 'Workflow Automation', path: '/docs' },
    { name: 'Claude Desktop', category: 'Native App', path: '/docs' },
    { name: 'TRAE SOLO', category: 'Autonomous Bot', path: '/docs' },
    { name: 'API Code', category: 'Standard SDK', path: '/docs' },
  ];

  const marqueeTools = [
    'Claude Code',
    'Cursor',
    'VS Code',
    'Windsurf',
    'Cline',
    'Roo Code',
    'Zed',
    'Anthropic SDK',
    'OpenAI SDK',
    'Continue Extension',
  ];

  return (
    <section id="tools" className="border-b border-border bg-card/40 py-16 sm:py-24 relative overflow-hidden" aria-labelledby="clients-title">
      {/* Infinite Auto-Scrolling Marquee Strip */}
      <div className="border-b border-border bg-card/70 py-4 mb-12">
        <div className="flex items-center gap-4 max-w-page mx-auto px-5 sm:px-6">
          <p className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-widest text-amber-500">
            Works where you already work
          </p>
          <div className="flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_2.5rem,black_calc(100%-2.5rem),transparent)]">
            <motion.div
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              className="flex w-max gap-6"
            >
              {[...marqueeTools, ...marqueeTools].map((item, idx) => (
                <span key={idx} className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-muted">
                  <Terminal className="h-3.5 w-3.5 text-amber-500/70" />
                  <span>{item}</span>
                  <span className="h-1 w-1 rounded-full bg-border" />
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-page mx-auto px-5 sm:px-6 space-y-10 relative z-10">
        {/* Header */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-xl space-y-3"
          >
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 flex items-center gap-1.5 w-fit">
              <Terminal className="h-3.5 w-3.5 text-amber-500" />
              <span>Works with your stack</span>
            </span>
            <h2 id="clients-title" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
              Bring the client you already use.
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              LightningDeals publishes step-by-step setup guides and zero-config CLI setup for all major AI clients and IDE extensions.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Link
              to="/docs"
              className="ui-button-secondary text-xs py-2.5 px-4 font-bold gap-2 whitespace-nowrap hover:border-amber-500/40"
            >
              <span>See configuration guides</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
            </Link>
          </motion.div>
        </div>

        {/* 16 Supported Client Badges Grid */}
        <div className="flex flex-wrap gap-3" aria-label="Supported developer tools">
          {tools.map((tool, idx) => (
            <motion.div
              key={tool.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.03 }}
              whileHover={{ scale: 1.05, y: -2 }}
            >
              <Link
                to={tool.path}
                className="inline-flex items-center gap-2.5 rounded-full border border-border/80 bg-bg px-4 py-2 text-xs font-bold text-fg transition-all hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 group"
              >
                <span className="group-hover:text-amber-400 transition-colors">{tool.name}</span>
                <span className="text-[10px] font-mono uppercase text-muted bg-card px-2 py-0.5 rounded-full border border-border/60">
                  {tool.category}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
