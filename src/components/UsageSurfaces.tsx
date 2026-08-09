import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, LayoutGrid, Terminal, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const UsageSurfaces: React.FC = () => {
  const surfaces = [
    {
      num: '01',
      icon: MessageSquare,
      title: 'Web Chat Surface',
      tagline: 'Browser Conversations & Research',
      desc: 'Ask questions, review code, research technical documentation, and collaborate directly with supported models in a clean browser chat interface.',
      cta: 'Try Web Chat',
      link: '/trial',
    },
    {
      num: '02',
      icon: LayoutGrid,
      title: 'Studio Workspace',
      tagline: 'Prompt to Code Project Generator',
      desc: 'Describe a website, web app, or API backend in plain English. Studio generates inspectable project files and editable code components.',
      cta: 'Open Studio',
      link: '/trial',
    },
    {
      num: '03',
      icon: Terminal,
      title: 'API Gateway',
      tagline: 'Anthropic & OpenAI Drop-In Routes',
      desc: 'Connect Claude Code, Cursor, Windsurf, Continue, or your own Python / Node.js applications with transparent token usage accounting.',
      cta: 'Explore API Gateway',
      link: '/docs',
    },
  ];

  return (
    <section id="surfaces" className="py-20 sm:py-28 border-b border-border bg-card">
      <div className="max-w-page mx-auto px-5 sm:px-6 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            Three Surfaces • One Account
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
            Choose a surface. Use your LightningDeals key.
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            Move seamlessly between browser web chat, project studio generation, and IDE API gateway connections with a single prepaid token balance.
          </p>
        </div>

        {/* 3 Surfaces Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {surfaces.map((s, idx) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                whileHover={{ y: -6 }}
                className="rounded-panel border border-border bg-subtle p-7 flex flex-col justify-between hover:border-amber-500/40 hover:shadow-xl transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-500">{s.num}</span>
                    <div className="p-2.5 rounded-control bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-fg">{s.title}</h3>
                    <p className="text-xs font-mono text-amber-500 font-semibold mt-0.5">{s.tagline}</p>
                  </div>

                  <p className="text-xs text-muted leading-relaxed min-h-[56px]">{s.desc}</p>
                </div>

                <div className="pt-6 border-t border-border/60">
                  <Link
                    to={s.link}
                    className="arrow-cta w-full justify-between inline-flex items-center text-xs font-bold text-amber-500 hover:text-amber-400 py-2"
                  >
                    <span>{s.cta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
