import React from 'react';
import { ArrowRight, Terminal, Laptop, Code2, Layers, Cpu, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DeveloperEcosystem: React.FC = () => {
  const tools = [
    { name: 'Cursor IDE', category: 'AI Code Editor', icon: Laptop, path: '/docs' },
    { name: 'Claude Code CLI', category: 'Agent Terminal', icon: Terminal, path: '/docs' },
    { name: 'Windsurf Editor', category: 'AI IDE', icon: Laptop, path: '/docs' },
    { name: 'VS Code Extension', category: 'Code Editor', icon: Code2, path: '/docs' },
    { name: 'Anthropic Python SDK', category: 'Python Library', icon: Layers, path: '/docs' },
    { name: 'Anthropic Node SDK', category: 'TypeScript Library', icon: Layers, path: '/docs' },
    { name: 'Cline / Roo Code', category: 'Autonomous Coding Agent', icon: Wrench, path: '/docs' },
    { name: 'Custom HTTP Services', category: 'Universal REST / SSE', icon: Cpu, path: '/docs' },
  ];

  return (
    <section id="tools" className="border-b border-[#e5e7eb] bg-[#fbfbfa] py-16 lg:py-24 font-sans" aria-labelledby="clients-title">
      <div className="max-w-page mx-auto px-4 sm:px-6 space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#e5e7eb] pb-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center px-2.5 py-1 rounded bg-[#f4f4f0] border border-[#e5e7eb] text-xs font-medium text-[#4b5563] uppercase tracking-wider">
              Tool Ecosystem
            </div>
            <h2 id="clients-title" className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#111827]">
              Works natively with your existing setup.
            </h2>
            <p className="text-xs sm:text-sm text-[#4b5563]">
              Because LightningAPI implements standard Anthropic REST specifications, every compatible client connects without changes.
            </p>
          </div>

          <Link
            to="/docs"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1e40af] hover:text-[#1d4ed8] transition-colors"
          >
            <span>View all client configuration guides</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Clean Tools Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {tools.map((tool, idx) => {
            const Icon = tool.icon;
            return (
              <Link
                key={idx}
                to={tool.path}
                className="bg-white p-5 rounded-lg border border-[#e5e7eb] hover:border-[#9ca3af] transition-colors space-y-2 group shadow-xs"
              >
                <div className="p-2 w-fit rounded bg-[#f4f4f0] text-[#111827] group-hover:bg-[#eff6ff] group-hover:text-[#1e40af] transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#111827]">
                    {tool.name}
                  </p>
                  <p className="text-[11px] text-[#6b7280]">
                    {tool.category}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
};
