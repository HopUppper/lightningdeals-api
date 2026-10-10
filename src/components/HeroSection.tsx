import React, { useState } from 'react';
import { ArrowRight, Copy, Check, CheckCircle2, Terminal, PenTool, BookOpen, Activity, Lock, Cpu, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HeroSection: React.FC = () => {
  const [activePersona, setActivePersona] = useState<'creators' | 'engineers' | 'founders'>('creators');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const baseUrl = 'https://lightningapi.pro/v1';

  const personas = {
    creators: {
      label: 'Creators & Writers',
      icon: PenTool,
      accent: 'text-[#6d28d9]',
      accentBg: 'bg-[#f5f3ff]',
      accentBorder: 'border-[#ddd6fe]',
      model: 'Claude Sonnet 5.5',
      latency: '34ms',
      tokens: '1,420 tokens',
      prompt: 'Synthesize the 40-page technical whitepaper into 3 narrative takeaways for non-technical executives.',
      response: '1. Autonomous routing eliminates cold-starts by multiplexing Anthropic sessions.\n2. The 5-hour rolling renewal prevents project halts during deep creative sprints.\n3. Zero disk persistence ensures proprietary IP remains strictly confidential.',
      focus: 'Long-form editorial drafting & document synthesis',
    },
    engineers: {
      label: 'Software Engineers',
      icon: Terminal,
      accent: 'text-[#2563eb]',
      accentBg: 'bg-[#eff6ff]',
      accentBorder: 'border-[#bfdbfe]',
      model: 'Claude Sonnet 5.5 & Haiku 5.5',
      latency: '28ms',
      tokens: '840 tokens',
      prompt: 'Refactor express gateway middleware to stream chunked SSE deltas directly to Cursor IDE.',
      response: 'export async function streamProxy(req: Request, res: Response) {\n  const stream = await anthropic.messages.stream({ ...req.body });\n  res.setHeader("Content-Type", "text/event-stream");\n  return stream.pipe(res); // Sub-30ms first-token latency\n}',
      focus: 'Claude Code CLI, Cursor IDE, Windsurf agentic loops',
    },
    founders: {
      label: 'Students & Founders',
      icon: BookOpen,
      accent: 'text-[#ea580c]',
      accentBg: 'bg-[#fff7ed]',
      accentBorder: 'border-[#fed7aa]',
      model: 'Claude Opus 5 & Sonnet',
      latency: '42ms',
      tokens: '1,890 tokens',
      prompt: 'Audit current monthly cloud API expenditures vs LightningAPI prepaid 5-hour rolling quotas.',
      response: 'Analysis: Replacing pay-as-you-go metering with 5-hour rolling renewal caps monthly expenditure at ₹2,499 with 0 risk of runaway invoice spikes during automated evaluation runs.',
      focus: 'Prepaid fixed budgets with zero surprise cloud overages',
    },
  };

  const current = personas[activePersona];
  const PersonaIcon = current.icon;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(baseUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <section className="relative bg-[#fbf9f5] border-b border-[#e7e5e4] pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* Asymmetrical 2-Column Editorial Hero Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Proposition & Direct Actions */}
          <div className="md:col-span-7 space-y-6">
            
            {/* Subtle Brand Kicker */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5f3ff] border border-[#ddd6fe] text-xs font-medium text-[#6d28d9]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6d28d9]" />
              <span>The Claude-Compatible AI Gateway</span>
            </div>

            {/* Monumental Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-bold tracking-tight text-[#1c1917] leading-[1.08]">
              Intelligence without interruption.
            </h1>

            {/* Plain-Language Narrative */}
            <p className="text-base sm:text-lg text-[#57534e] leading-relaxed font-normal max-w-xl">
              One master key for Claude Opus 5.5, Sonnet 5.5, and Haiku 5.5. Dedicated 5-hour rolling token renewal so your creative flow, research, and coding workflows never hit sudden billing walls.
            </p>

            {/* Core Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <Link
                to="/trial"
                className="px-6 py-3.5 rounded-xl bg-[#6d28d9] hover:bg-[#581c87] text-white font-semibold text-sm transition-all shadow-plum flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Start Free Trial (1M Tokens)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="#pricing"
                className="px-6 py-3.5 rounded-xl bg-white hover:bg-[#f5f2eb] border border-[#e7e5e4] text-[#1c1917] font-medium text-sm transition-colors flex items-center justify-center cursor-pointer shadow-xs"
              >
                <span>View Capacity & Plans</span>
              </a>
            </div>

            {/* Copyable Base URL Bar */}
            <div className="pt-1 flex items-center gap-2 max-w-md min-w-0">
              <div className="flex-1 flex items-center border border-[#e7e5e4] bg-white rounded-lg overflow-hidden shadow-xs min-w-0">
                <span className="px-2.5 py-1.5 text-[10px] font-mono text-[#78716c] bg-[#f5f2eb] border-r border-[#e7e5e4] shrink-0 font-semibold">
                  BASE URL
                </span>
                <code className="flex-1 px-3 py-1.5 font-mono text-xs text-[#1c1917] overflow-x-auto whitespace-nowrap min-w-0">
                  {baseUrl}
                </code>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="px-2.5 py-1.5 text-xs text-[#57534e] hover:text-[#1c1917] hover:bg-[#f5f2eb] border-l border-[#e7e5e4] transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                  title="Copy base URL"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 text-[11px] font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Trust Reassurance Row */}
            <div className="pt-1 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-[#78716c]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                <span>Instant 60s activation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                <span>Zero prompt retention SLA</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                <span>No credit card required</span>
              </div>
            </div>

          </div>

          {/* Right Column: Authentic Product Experience Preview */}
          <div className="md:col-span-5 space-y-4">
            
            {/* Live Gateway Telemetry Console (Replaces generic AI artwork) */}
            <div className="rounded-2xl border border-[#e7e5e4] bg-white shadow-warm overflow-hidden">
              
              {/* Console Window Header */}
              <div className="px-4 py-2.5 border-b border-[#e7e5e4] bg-[#fdfbf7] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#fca5a5]/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#fcd34d]/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#86efac]/80" />
                  <span className="ml-2 font-mono text-[11px] text-[#78716c] font-medium truncate">
                    gateway.lightningapi.pro
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-[10px] font-mono text-[#047857]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
                  <span>{current.latency} TTFT</span>
                </div>
              </div>

              {/* Persona Selector Tabs */}
              <div className="p-1.5 bg-[#f5f2eb] border-b border-[#e7e5e4] flex items-center gap-1">
                {(['creators', 'engineers', 'founders'] as const).map((key) => {
                  const p = personas[key];
                  const Icon = p.icon;
                  const isActive = activePersona === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActivePersona(key)}
                      className={`flex-1 py-1 px-1.5 sm:px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        isActive
                          ? 'bg-white text-[#1c1917] shadow-xs font-semibold'
                          : 'text-[#78716c] hover:text-[#1c1917] hover:bg-white/60'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? p.accent : 'text-[#78716c]'}`} />
                      <span className="truncate">{key === 'creators' ? 'Creators' : key === 'engineers' ? 'Engineers' : 'Founders'}</span>
                    </button>
                  );
                })}
              </div>

              {/* Live Request & Response Streaming Simulation */}
              <div className="p-4 sm:p-5 space-y-3.5 font-mono text-xs">
                
                {/* Simulated Request */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-[#78716c]">
                    <span className="font-semibold text-[#6d28d9]">POST /v1/messages</span>
                    <span>{current.model}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#fdfbf7] border border-[#e7e5e4] text-[#57534e] text-[11px] leading-relaxed">
                    <span className="text-[#a8a29e] mr-1">&gt;</span> {current.prompt}
                  </div>
                </div>

                {/* Simulated Streaming Response */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-[#78716c]">
                    <span className="text-[#059669] flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      <span>200 Streaming Chunk</span>
                    </span>
                    <span>{current.tokens}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#1c1917] text-[#e7e5e4] text-[11px] leading-relaxed overflow-x-auto min-w-0 max-h-36">
                    <pre className="whitespace-pre-wrap font-mono">{current.response}</pre>
                  </div>
                </div>

                {/* Persona Recommendation Subtext */}
                <div className="pt-2 border-t border-[#f5f2eb] flex items-center justify-between text-[11px] text-[#78716c]">
                  <span className="font-medium text-[#1c1917]">Target Workflow:</span>
                  <span className="truncate max-w-[200px] text-right font-sans">{current.focus}</span>
                </div>

              </div>

            </div>

            {/* Quick 3-Pillar Verification Stats */}
            <div className="grid grid-cols-3 gap-2 text-center font-sans">
              <div className="p-2.5 rounded-xl bg-white border border-[#e7e5e4] shadow-xs space-y-0.5">
                <p className="text-base font-bold text-[#1c1917]">200,000</p>
                <p className="text-[10px] text-[#78716c]">Tokens Context</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[#e7e5e4] shadow-xs space-y-0.5">
                <p className="text-base font-bold text-[#6d28d9]">5 Hours</p>
                <p className="text-[10px] text-[#78716c]">Rolling Renewal</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[#e7e5e4] shadow-xs space-y-0.5">
                <p className="text-base font-bold text-[#059669]">0 Retention</p>
                <p className="text-[10px] text-[#78716c]">Private Memory</p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
