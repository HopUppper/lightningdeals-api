import React from 'react';
import { MessageSquare, Code2, Terminal, ArrowRight } from 'lucide-react';

export const ProductSurfaces: React.FC = () => {
  const surfaces = [
    {
      num: '01',
      title: 'Web Chat',
      desc: 'Ask, write, research, and work with any supported model available to your key in a focused, high-speed browser conversation UI.',
      link: '#chat',
      linkText: 'Learn about Web Chat',
      icon: MessageSquare,
      badge: 'Browser Native',
    },
    {
      num: '02',
      title: 'Studio',
      desc: 'Describe a website, application, or workflow in plain English, generate full project structures, and inspect code before deploying.',
      link: '#studio',
      linkText: 'Learn about Studio',
      icon: Code2,
      badge: 'Full Stack App Builder',
    },
    {
      num: '03',
      title: 'API Gateway',
      desc: 'Connect documented OpenAI-compatible and Claude-compatible endpoints to your existing CLI tools, SDKs, and enterprise workflows.',
      link: '#api',
      linkText: 'Explore the API',
      icon: Terminal,
      badge: 'OpenAI & Anthropic Compatible',
    },
  ];

  return (
    <section id="surfaces" className="border-b border-border bg-card" aria-labelledby="surfaces-title">
      <div className="mx-auto max-w-page px-5 py-16 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <p className="ui-kicker">Three ways to use ApexScale</p>
          <h2 id="surfaces-title" className="mt-4 text-3xl font-semibold tracking-[-.03em] text-fg sm:text-4xl">
            Choose a surface. Use your ApexScale key.
          </h2>
          <p className="mt-3 text-base text-muted">
            Access state-of-the-art language models through web chat, automated code synthesis, or developer API routes using a single prepaid credit balance.
          </p>
        </div>

        <div className="mt-10 border-y border-border divide-y divide-border">
          {surfaces.map((surface) => {
            const IconComponent = surface.icon;
            return (
              <article
                key={surface.num}
                className="grid gap-4 py-8 transition-colors hover:bg-subtle/40 px-2 rounded-lg md:grid-cols-[72px_180px_1fr_auto] md:items-center"
              >
                <span className="font-mono text-sm font-semibold text-accent" aria-hidden="true">
                  {surface.num}
                </span>

                <div>
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5 text-accent" />
                    <h3 className="text-xl font-semibold tracking-tight text-fg">{surface.title}</h3>
                  </div>
                  <span className="mt-1 inline-block text-[11px] font-mono text-muted uppercase tracking-wider">
                    {surface.badge}
                  </span>
                </div>

                <p className="max-w-2xl text-sm leading-6 text-muted">
                  {surface.desc}
                </p>

                <a
                  href={surface.link}
                  className="arrow-cta inline-flex min-h-11 w-fit items-center gap-1.5 rounded-control px-3 text-sm font-semibold text-accent transition-colors hover:bg-accent/5"
                >
                  <span>{surface.linkText}</span>
                  <span className="arrow-cta__icon" aria-hidden="true">→</span>
                </a>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
