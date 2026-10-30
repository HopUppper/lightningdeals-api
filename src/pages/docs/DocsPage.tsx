import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Check,
  Terminal,
  FileCode,
  Globe,
  Cpu,
  Zap,
  KeyRound,
  Wrench,
  LifeBuoy,
  Copy,
  Check as CheckIcon,
  AlertTriangle,
  List,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Layers,
  HelpCircle,
  Coins,
  DollarSign,
  Sparkles,
  Code2,
} from 'lucide-react';
import { ElectricNavbar } from '../../components/ElectricNavbar';
import { ElectricFooter } from '../../components/ElectricFooter';

// Uniform Developer Workbench Code Snippet
const CodeSnippetBlock: React.FC<{
  code: string;
  language?: string;
  filename?: string;
}> = ({ code, language = 'bash', filename }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-2xl border border-neutral-800 bg-[#0c0d14] text-[#f4f4f5] shadow-xl overflow-hidden font-mono text-xs ring-1 ring-white/10">
      {/* Chrome Top Rail */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 bg-[#11131c] px-4 py-2.5 text-[11px] text-neutral-400">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57] border border-[#e0443e]/50 shadow-2xs" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e] border border-[#d8a123]/50 shadow-2xs" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840] border border-[#1aab29]/50 shadow-2xs" />
          </div>
          {filename ? (
            <span className="flex items-center gap-1.5 font-medium text-neutral-200 ml-1">
              <FileCode className="h-3.5 w-3.5 text-[#a855f7]" />
              {filename}
            </span>
          ) : (
            <span className="uppercase text-[10px] text-neutral-400 font-bold ml-1 tracking-wider">{language}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {filename && (
            <span className="uppercase text-[10px] text-neutral-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
              {language}
            </span>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1 rounded-lg bg-[#6d28d9] hover:bg-[#7c3aed] text-white text-[11px] font-mono font-semibold transition-all shadow-plum flex items-center gap-1.5 cursor-pointer"
            title="Copy to clipboard"
            aria-label="Copy to clipboard"
          >
            {copied ? (
              <>
                <CheckIcon className="h-3 w-3 text-emerald-300" />
                <span className="text-emerald-300">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Body */}
      <div className="relative p-4 sm:p-5 overflow-x-auto bg-[#08090f]">
        <pre className="leading-relaxed font-mono text-xs sm:text-[13px] selection:bg-purple-900 selection:text-white">
          {code.split('\n').map((line, idx) => {
            const trimmed = line.trim();
            const isComment = trimmed.startsWith('#') || trimmed.startsWith('//');
            const isCommand = trimmed.startsWith('npx ') || trimmed.startsWith('claude') || trimmed.startsWith('export ') || trimmed.startsWith('curl ');
            return (
              <div
                key={idx}
                className={`table-row ${isComment ? 'text-neutral-500 italic' : isCommand ? 'text-amber-300 font-bold' : 'text-neutral-200'}`}
              >
                <span className="table-cell pr-4 text-right select-none text-neutral-700 text-[11px] w-8">
                  {idx + 1}
                </span>
                <span className="table-cell">{line || ' '}</span>
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
};

export const DocsPage: React.FC = () => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeClientTab, setActiveClientTab] = useState<'claude-code' | 'cursor' | 'windsurf' | 'vscode' | 'python' | 'node' | 'curl'>('claude-code');

  const sidebarNav = [
    {
      title: 'GETTING STARTED',
      items: [
        { id: 'overview', label: '1. Overview & Architecture', icon: BookOpen },
        { id: 'quick-start', label: '2. Quick Start Guide', icon: Terminal },
        { id: 'authentication', label: '3. Authentication & API Keys', icon: KeyRound },
      ],
    },
    {
      title: 'DEVELOPER SPECIFICATION',
      items: [
        { id: 'api-reference', label: '4. Full API Reference', icon: Globe },
        { id: 'client-config', label: '5. IDE & Client Config', icon: Wrench },
        { id: 'streaming', label: '6. Streaming & SSE Events', icon: Layers },
      ],
    },
    {
      title: 'GATEWAY ENGINE',
      items: [
        { id: 'models', label: '7. Model Catalog (Claude, OpenAI, Local)', icon: Cpu },
        { id: 'quotas', label: '8. Billing Modes & Quota Engines', icon: RefreshCw },
        { id: 'errors', label: '9. Errors & Troubleshooting', icon: AlertTriangle },
        { id: 'support', label: '10. Support & Diagnostics', icon: LifeBuoy },
      ],
    },
  ];

  const sectionIds = [
    'overview',
    'quick-start',
    'authentication',
    'api-reference',
    'client-config',
    'streaming',
    'models',
    'quotas',
    'errors',
    'support',
  ];

  const isManualScrollingRef = useRef(false);
  const manualScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    isManualScrollingRef.current = true;

    if (manualScrollTimerRef.current) {
      clearTimeout(manualScrollTimerRef.current);
    }

    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      window.history.replaceState(null, '', `#${id}`);
    }

    manualScrollTimerRef.current = setTimeout(() => {
      isManualScrollingRef.current = false;
    }, 800);
  };

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (isManualScrollingRef.current) return;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isAtBottom =
            window.innerHeight + window.scrollY >=
            document.documentElement.scrollHeight - 70;

          if (isAtBottom) {
            setActiveSection(sectionIds[sectionIds.length - 1]);
            ticking = false;
            return;
          }

          const READ_THRESHOLD = Math.max(260, window.innerHeight * 0.35);
          let currentId = sectionIds[0];

          for (const id of sectionIds) {
            const el = document.getElementById(id);
            if (el) {
              const rect = el.getBoundingClientRect();
              if (rect.top <= READ_THRESHOLD) {
                currentId = id;
              }
            }
          }

          setActiveSection(currentId);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (manualScrollTimerRef.current) {
        clearTimeout(manualScrollTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && sectionIds.includes(hash)) {
      scrollToSection(hash);
    }
  }, [location.hash]);

  const activeSectionItem = sidebarNav.flatMap((g) => g.items).find((i) => i.id === activeSection);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1c1917] flex flex-col font-sans selection:bg-[#6d28d9]/10 selection:text-[#6d28d9]">
      <ElectricNavbar />

      <div className="flex-1 border-b border-[#e7e5e4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-12">
            
            {/* ------------------------------------------------------------- */}
            {/* DESKTOP STICKY SIDEBAR NAVIGATION                            */}
            {/* ------------------------------------------------------------- */}
            <aside className="hidden lg:block sticky top-[72px] h-[calc(100vh-72px)] overflow-y-auto py-8 pr-4">
              <div className="mb-6 pb-4 border-b border-[#e7e5e4] space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#6d28d9]">
                  <BookOpen className="h-4 w-4" />
                  <span>LIGHTNINGAPI SPECIFICATION</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#78716c] font-mono">
                  <span>Version 2.4.0</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE
                  </span>
                </div>
              </div>

              <nav className="space-y-6">
                {sidebarNav.map((group, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#a8a29e]">
                      {group.title}
                    </p>
                    <ul className="space-y-1 border-l-2 border-[#e7e5e4]">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => scrollToSection(item.id)}
                              className={`-ml-[2px] flex w-full items-center justify-between border-l-2 py-1.5 pl-3 pr-2 text-left text-xs transition-all cursor-pointer rounded-r-lg ${
                                isActive
                                   ? 'border-[#6d28d9] font-bold text-[#6d28d9] bg-[#f5f3ff]'
                                  : 'border-transparent text-[#57534e] hover:border-[#a8a29e] hover:text-[#1c1917]'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Icon className={`h-3.5 w-3.5 shrink-0 transition-colors ${isActive ? 'text-[#6d28d9]' : 'text-[#a8a29e]'}`} />
                                <span className="truncate">{item.label}</span>
                              </div>
                              {isActive && (
                                <span className="h-1.5 w-1.5 rounded-full bg-[#6d28d9] shrink-0" />
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </nav>

              <div className="mt-8 pt-6 border-t border-[#e7e5e4] space-y-2">
                <Link
                  to="/trial"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#e7e5e4] shadow-xs text-xs font-semibold text-[#1c1917] hover:border-[#6d28d9] transition-colors"
                >
                  <span>Claim 200k Free Trial</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#6d28d9]" />
                </Link>
                <Link
                  to="/check-key"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#e7e5e4] shadow-xs text-xs font-medium text-[#57534e] hover:text-[#1c1917] transition-colors"
                >
                  <span>Verify Key Balance</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#a8a29e]" />
                </Link>
                <Link
                  to="/pricing"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#e7e5e4] shadow-xs text-xs font-medium text-[#57534e] hover:text-[#1c1917] transition-colors"
                >
                  <span>View Capacity Plans</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#a8a29e]" />
                </Link>
              </div>
            </aside>

            {/* ------------------------------------------------------------- */}
            {/* MAIN CONTENT AREA                                             */}
            {/* ------------------------------------------------------------- */}
            <main className="min-w-0 pb-20 pt-6 lg:py-10">
              
              {/* Mobile Table of Contents Selector */}
              <div className="sticky top-[64px] z-30 -mx-4 mb-8 border-b border-[#e7e5e4] bg-[#faf8f5]/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="flex w-full items-center justify-between border border-[#e7e5e4] bg-white px-3.5 py-2 text-left rounded-xl shadow-xs cursor-pointer"
                  type="button"
                >
                  <span className="flex items-center gap-2">
                    <List className="h-4 w-4 text-[#6d28d9]" />
                    <span className="font-mono text-[10px] uppercase font-bold text-[#78716c]">DOCS INDEX:</span>
                    <span className="truncate text-xs font-bold text-[#1c1917]">{activeSectionItem?.label || activeSection.replace('-', ' ')}</span>
                  </span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-[#78716c] transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {mobileMenuOpen && (
                  <div className="mt-2 max-h-80 overflow-y-auto border border-[#e7e5e4] bg-white p-3 rounded-xl shadow-lg space-y-3">
                    {sidebarNav.map((g, idx) => (
                      <div key={idx}>
                        <p className="font-mono text-[10px] font-bold text-[#6d28d9] uppercase">{g.title}</p>
                        <div className="grid grid-cols-1 gap-1 mt-1">
                          {g.items.map((i) => (
                            <button
                              key={i.id}
                              onClick={() => scrollToSection(i.id)}
                              className="text-left text-xs py-1.5 px-2 hover:bg-[#faf8f5] rounded-lg text-[#1c1917] cursor-pointer"
                            >
                              {i.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ----------------------------------------------------------- */}
              {/* SECTION 1: OVERVIEW & ARCHITECTURE                          */}
              {/* ----------------------------------------------------------- */}
              <section id="overview" className="mb-16 scroll-mt-24 space-y-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e7e5e4] shadow-xs text-xs font-mono font-medium text-[#57534e]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#6d28d9]" />
                  <span>SECTION 01</span>
                  <span className="text-[#d6d3d1]">·</span>
                  <span className="text-[#6d28d9] font-bold">OVERVIEW &amp; ARCHITECTURE</span>
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#1c1917]">
                    Developer Documentation &amp; Gateway Specification
                  </h1>
                  <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed max-w-3xl">
                    LightningAPI.pro is a unified, high-performance AI API Gateway delivering sub-50ms routing across three major model ecosystems: <strong>Claude (Anthropic)</strong>, <strong>OpenAI Frontier</strong>, and <strong>Local &amp; Open Weights</strong>. Our gateway supports continuous 5-hour rolling pool renewal, wholesale usage credits with 7x purchasing value, and consumable token packs with 100% white-label confidentiality.
                  </p>
                </div>

                {/* 3 Model Ecosystems Ribbon */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-4 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#6d28d9]" />
                        <span className="text-xs font-bold text-[#1c1917]">Claude (Anthropic)</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-violet-100 text-[#6d28d9]">ALL 3 MODES</span>
                    </div>
                    <p className="text-[11px] text-[#57534e] leading-relaxed">
                      Sonnet 4.6, Opus 4.7, Haiku. Drop-in Anthropic Messages replacement with continuous 5-hour rolling pool refills.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs font-bold text-[#1c1917]">OpenAI Frontier</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">CREDITS &amp; TOKENS</span>
                    </div>
                    <p className="text-[11px] text-[#57534e] leading-relaxed">
                      o1, o3-mini, GPT-4o, gpt-oss-120b. Full reasoning token support, function calling parity, and Chat Completions standard.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-amber-600" />
                        <span className="text-xs font-bold text-[#1c1917]">Local &amp; Open Weights</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">7X MULTIPLIER</span>
                    </div>
                    <p className="text-[11px] text-[#57534e] leading-relaxed">
                      DeepSeek v3.2/v4, Grok-2, Qwen 2.5, GLM-4. High-throughput wholesale economy for batch evaluation and agent loops.
                    </p>
                  </div>
                </div>

                {/* 3 Billing Modes Summary */}
                <div className="p-5 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6d28d9] font-mono">
                    Three Distinct Billing Architectures
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#e7e5e4] space-y-1">
                      <div className="font-bold text-[#1c1917] flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 text-[#6d28d9]" />
                        <span>5-Hour Rolling Pool</span>
                      </div>
                      <p className="text-[#57534e] text-[11px] leading-relaxed">
                        <strong>Claude Exclusive.</strong> Quota continuously renews every 300 minutes. No month-end cutoffs. 30-day fixed duration.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#e7e5e4] space-y-1">
                      <div className="font-bold text-[#1c1917] flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                        <span>API Credits (7x Multiplier)</span>
                      </div>
                      <p className="text-[#57534e] text-[11px] leading-relaxed">
                        <strong>Universal.</strong> Deposit funds in INR and unlock 7x–8.75x in API Credits (e.g. Pay ₹100 → Receive ₹700 API Credits). Atomically deducted per token. 365-day validity.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#e7e5e4] space-y-1">
                      <div className="font-bold text-[#1c1917] flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Prepaid Consumable Tokens</span>
                      </div>
                      <p className="text-[#57534e] text-[11px] leading-relaxed">
                        <strong>No 5-Hour Resets.</strong> Fixed consumable pool (5M, 20M, 50M) that stays until depleted over 365 days.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-[#f8f5ff] border border-[#ddd6fe] text-xs text-[#5b21b6] space-y-2 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#ede9fe] text-[#6d28d9] border border-[#ddd6fe]">
                      💡 BASE URL PROTOCOL RULE
                    </span>
                  </div>
                  <p className="leading-relaxed">
                    • <strong>Rolling Window &amp; Credit Plans:</strong> Base URL is <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded-md border border-[#c4b5fd] text-[#6d28d9] shadow-2xs">https://api.lightningapi.pro/v1</code> (or <code className="font-mono bg-white px-1.5 py-0.5 rounded-md border border-[#c4b5fd] text-[#5b21b6]">https://lightningapi.pro</code> in Anthropic SDKs that auto-append <code className="font-mono">/v1/messages</code>).<br />
                    • <strong>Prepaid Token Pack Plans:</strong> Base URL is <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded-md border border-[#c4b5fd] text-[#6d28d9] shadow-2xs">https://api.lightningapi.pro/token/v1</code>.
                  </p>
                </div>
              </section>

              <hr className="my-10 border-[#e7e5e4]" />

              {/* ----------------------------------------------------------- */}
              {/* SECTION 2: QUICK START GUIDE                                */}
              {/* ----------------------------------------------------------- */}
              <section id="quick-start" className="mb-16 scroll-mt-24 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e7e5e4] shadow-xs text-xs font-mono font-medium text-[#57534e]">
                  <Terminal className="h-3.5 w-3.5 text-[#6d28d9]" />
                  <span>SECTION 02</span>
                  <span className="text-[#d6d3d1]">·</span>
                  <span className="text-[#6d28d9] font-bold">QUICK START GUIDE</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1c1917]">
                  Get Connected in 30 Seconds
                </h2>

                <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed">
                  Connect your development tools with automated shell setup scripts or our headless NPX configuration tool.
                </p>

                {/* 1-Click Shell Installers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#1c1917]">macOS &amp; Linux (Bash / Zsh)</span>
                      <span className="text-[10px] font-mono text-[#78716c]">Automated Export</span>
                    </div>
                    <CodeSnippetBlock
                      language="bash"
                      code="curl -sSL https://lightningapi.pro/setup.sh | bash"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#1c1917]">Windows (PowerShell)</span>
                      <span className="text-[10px] font-mono text-[#78716c]">Persistent User Env</span>
                    </div>
                    <CodeSnippetBlock
                      language="powershell"
                      code="irm https://lightningapi.pro/setup.ps1 | iex"
                    />
                  </div>
                </div>

                {/* Direct cURL Verification */}
                <div className="p-5 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1c1917] font-mono">
                      Direct Gateway Verification (cURL)
                    </h3>
                    <span className="text-[10px] font-mono text-[#78716c]">Sub-50ms Response</span>
                  </div>
                  <CodeSnippetBlock
                    language="bash"
                    code={`curl https://api.lightningapi.pro/v1/messages \\
  -H "x-api-key: ld_live_your_api_key_here" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "claude-sonnet-5.5",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hello LightningAPI! Confirm connection."}]
  }'`}
                  />
                </div>
              </section>

              <hr className="my-10 border-[#e7e5e4]" />

              {/* ----------------------------------------------------------- */}
              {/* SECTION 3: AUTHENTICATION & API KEYS                        */}
              {/* ----------------------------------------------------------- */}
              <section id="authentication" className="mb-16 scroll-mt-24 space-y-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e7e5e4] shadow-xs text-xs font-mono font-medium text-[#57534e]">
                  <KeyRound className="h-3.5 w-3.5 text-[#6d28d9]" />
                  <span>SECTION 03</span>
                  <span className="text-[#d6d3d1]">·</span>
                  <span className="text-[#6d28d9] font-bold">AUTHENTICATION &amp; KEYS</span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1c1917]">
                    Unified API Keys &amp; Header Authorization
                  </h2>
                  <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed">
                    LightningAPI uses unified API keys. Your active plan entitlement (Rolling Window vs. Usage Credits vs. Token Pack) is bound strictly on the server side—never requiring client-side parameter overrides.
                  </p>
                </div>

                {/* Key Types Matrix */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-mono text-[10px] font-bold">PRODUCTION KEY</span>
                      <code className="text-xs font-bold text-[#1c1917]">ld_live_...</code>
                    </div>
                    <p className="text-[11px] text-[#57534e] leading-relaxed">
                      Issued instantly upon activating any plan. Backed by your chosen billing mode (continuous rolling pool, 7x usage credits, or consumable tokens).
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-mono text-[10px] font-bold">EVALUATION KEY</span>
                      <code className="text-xs font-bold text-[#1c1917]">ld_trial_...</code>
                    </div>
                    <p className="text-[11px] text-[#57534e] leading-relaxed">
                      Issued via the free trial onboarding flow. Preloaded with 200,000 tokens for testing integration across Cursor, Windsurf, and Claude Code.
                    </p>
                  </div>
                </div>

                {/* Supported Headers */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs sm:text-sm font-bold text-[#1c1917]">Supported Authentication Headers</h3>
                  <p className="text-xs text-[#57534e]">
                    The gateway accepts authentication through standard Anthropic headers or standard RFC 6750 Bearer authorization:
                  </p>

                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-white border border-[#e7e5e4] text-xs font-mono">
                      <span className="text-[#a8a29e]">Anthropic Native Header: </span>
                      <strong className="text-[#1c1917]">x-api-key: ld_live_your_token_here</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-[#e7e5e4] text-xs font-mono">
                      <span className="text-[#a8a29e]">Bearer Authorization: </span>
                      <strong className="text-[#1c1917]">Authorization: Bearer ld_live_your_token_here</strong>
                    </div>
                  </div>
                </div>

                {/* White-Label & Supplier Privacy Assurance */}
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-950 space-y-2 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span className="font-bold">Strict White-Label &amp; Security Assurance</span>
                  </div>
                  <p className="leading-relaxed text-[11px] text-emerald-900">
                    LightningAPI operates an isolated, high-security proxy architecture. Supplier master credentials, infrastructure URLs, and upstream internal metadata are completely isolated from client terminals, headers, logs, and frontend bundles. Your requests flow securely through TLS 1.3 without intermediary prompt storage.
                  </p>
                </div>
              </section>

              <hr className="my-10 border-[#e7e5e4]" />

              {/* ----------------------------------------------------------- */}
              {/* SECTION 4: FULL API REFERENCE                               */}
              {/* ----------------------------------------------------------- */}
              <section id="api-reference" className="mb-16 scroll-mt-24 space-y-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e7e5e4] shadow-xs text-xs font-mono font-medium text-[#57534e]">
                  <Globe className="h-3.5 w-3.5 text-[#6d28d9]" />
                  <span>SECTION 04</span>
                  <span className="text-[#d6d3d1]">·</span>
                  <span className="text-[#6d28d9] font-bold">FULL API REFERENCE</span>
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1c1917]">
                    Public Endpoints &amp; Request Specifications
                  </h2>
                  <p className="text-xs sm:text-sm text-[#57534e] mt-1">
                    Every endpoint mounted on the gateway with field types, required parameters, and JSON payloads.
                  </p>
                </div>

                {/* Endpoint 1: POST /v1/messages */}
                <div className="p-5 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#6d28d9] text-white font-mono text-[11px] font-bold">POST</span>
                      <code className="text-sm font-bold text-[#1c1917]">/v1/messages</code>
                    </div>
                    <span className="text-[11px] font-mono text-[#78716c]">Anthropic Messages Standard</span>
                  </div>

                  <p className="text-xs text-[#57534e] leading-relaxed">
                    Main inference endpoint for Claude models. Generates a response or streams server-sent events for a conversational context. Supports tool calling, reasoning, and thinking tokens.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans">
                      <thead>
                        <tr className="border-b border-[#e7e5e4] text-[#78716c] font-mono text-[10px] uppercase">
                          <th className="py-2 pr-4">Parameter</th>
                          <th className="py-2 pr-4">Type</th>
                          <th className="py-2 pr-4">Required</th>
                          <th className="py-2">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f5f2eb] text-[#57534e]">
                        <tr>
                          <td className="py-2 pr-4 font-mono font-bold text-[#1c1917]">model</td>
                          <td className="py-2 pr-4 font-mono text-purple-700">string</td>
                          <td className="py-2 pr-4 font-bold text-rose-600">Yes</td>
                          <td className="py-2">Supported model ID (e.g. <code className="font-mono">claude-sonnet-5.5</code>) or alias.</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono font-bold text-[#1c1917]">messages</td>
                          <td className="py-2 pr-4 font-mono text-purple-700">array</td>
                          <td className="py-2 pr-4 font-bold text-rose-600">Yes</td>
                          <td className="py-2">Array of message objects with <code className="font-mono">role</code> ("user" | "assistant") and <code className="font-mono">content</code>.</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono font-bold text-[#1c1917]">max_tokens</td>
                          <td className="py-2 pr-4 font-mono text-purple-700">integer</td>
                          <td className="py-2 pr-4 font-bold text-rose-600">Yes</td>
                          <td className="py-2">Maximum number of completion tokens to generate.</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono font-bold text-[#1c1917]">stream</td>
                          <td className="py-2 pr-4 font-mono text-purple-700">boolean</td>
                          <td className="py-2 pr-4 text-[#78716c]">Optional</td>
                          <td className="py-2">Streams token chunks incrementally via Server-Sent Events (SSE).</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono font-bold text-[#1c1917]">tools</td>
                          <td className="py-2 pr-4 font-mono text-purple-700">array</td>
                          <td className="py-2 pr-4 text-[#78716c]">Optional</td>
                          <td className="py-2">Function declarations the model may invoke.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Endpoint 2: POST /v1/chat/completions */}
                <div className="p-5 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono text-[11px] font-bold">POST</span>
                      <code className="text-sm font-bold text-[#1c1917]">/v1/chat/completions</code>
                    </div>
                    <span className="text-[11px] font-mono text-[#78716c]">OpenAI Chat Completions Standard</span>
                  </div>

                  <p className="text-xs text-[#57534e] leading-relaxed">
                    Main inference endpoint for OpenAI Frontier (o1, o3-mini, GPT-4o) and Local Models (DeepSeek, Grok, Qwen, GLM). Drop-in replacement for OpenAI SDK clients.
                  </p>

                  <CodeSnippetBlock
                    language="bash"
                    code={`curl https://api.lightningapi.pro/v1/chat/completions \\
  -H "Authorization: Bearer ld_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "deepseek-ai/deepseek-v3",
    "messages": [{"role": "user", "content": "Explain key architectural differences between Raft and Paxos."}],
    "max_tokens": 500
  }'`}
                  />
                </div>

                {/* Endpoint 3: GET /v1/models */}
                <div className="p-5 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-mono text-[11px] font-bold">GET</span>
                      <code className="text-sm font-bold text-[#1c1917]">/v1/models</code>
                    </div>
                    <span className="text-[11px] font-mono text-[#78716c]">Live Model Catalog</span>
                  </div>
                  <p className="text-xs text-[#57534e]">
                    Returns the dynamic machine-readable list of models currently available on the gateway, context windows, and pricing metadata.
                  </p>
                </div>

                {/* Endpoint 4: GET /api/key-status */}
                <div className="p-5 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono text-[11px] font-bold">GET</span>
                      <code className="text-sm font-bold text-[#1c1917]">/api/key-status</code>
                    </div>
                    <span className="text-[11px] font-mono text-[#78716c]">Live Key Balance &amp; Telemetry</span>
                  </div>
                  <p className="text-xs text-[#57534e]">
                    Inspect active balance, current 5-hour rolling pool usage, remaining credits, and rate limits without authenticating to dashboard.
                  </p>
                  <CodeSnippetBlock
                    language="json"
                    code={`{
  "valid": true,
  "keyPrefix": "ld_live_a1b2...",
  "planName": "MAX 20X",
  "billingType": "window",
  "rollingLimit": 20000000,
  "windowUsage": 4350120,
  "remainingInWindow": 15649880,
  "windowDuration": "5h"
}`}
                  />
                </div>
              </section>

              <hr className="my-10 border-[#e7e5e4]" />

              {/* ----------------------------------------------------------- */}
              {/* SECTION 5: IDE & CLIENT CONFIGURATION                       */}
              {/* ----------------------------------------------------------- */}
              <section id="client-config" className="mb-16 scroll-mt-24 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e7e5e4] shadow-xs text-xs font-mono font-medium text-[#57534e]">
                  <Wrench className="h-3.5 w-3.5 text-[#6d28d9]" />
                  <span>SECTION 05</span>
                  <span className="text-[#d6d3d1]">·</span>
                  <span className="text-[#6d28d9] font-bold">IDE &amp; CLIENT CONFIGURATION</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1c1917]">
                  Connecting Your Development Tools (Zero Supplier Exposure)
                </h2>

                <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed">
                  Select your client environment below to inspect exact verified setup instructions and environment variables.
                </p>

                {/* Client Selector Tabs */}
                <div className="flex flex-wrap gap-2 pt-1 border-b border-[#e7e5e4] pb-3">
                  {[
                    { id: 'claude-code', label: 'Claude Code CLI' },
                    { id: 'cursor', label: 'Cursor Composer' },
                    { id: 'windsurf', label: 'Windsurf Cascade' },
                    { id: 'vscode', label: 'VS Code (Cline / Roo)' },
                    { id: 'python', label: 'Python SDK' },
                    { id: 'node', label: 'TypeScript / Node' },
                    { id: 'curl', label: 'cURL Commands' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveClientTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        activeClientTab === tab.id
                          ? 'bg-[#1c1917] text-white shadow-xs'
                          : 'bg-white text-[#57534e] border border-[#e7e5e4] hover:bg-[#f5f2eb]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab 1: Claude Code CLI */}
                {activeClientTab === 'claude-code' && (
                  <div className="p-5 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-3 animate-in fade-in">
                    <h3 className="text-sm font-bold text-[#1c1917]">Claude Code CLI Configuration</h3>
                    <p className="text-xs text-[#57534e] leading-relaxed">
                      Claude Code connects directly to LightningAPI using standard Anthropic environment variables in your terminal session or <code className="font-mono text-[#1c1917]">~/.zshrc</code> / <code className="font-mono text-[#1c1917]">~/.bashrc</code>:
                    </p>
                    <CodeSnippetBlock
                      language="bash"
                      code={`# Set Base URL directly to LightningAPI (SDK appends /v1/messages)
export ANTHROPIC_BASE_URL="https://lightningapi.pro"

# Set your active LightningAPI key
export ANTHROPIC_AUTH_TOKEN="ld_live_your_key_here"

# (Optional) Select default model
export ANTHROPIC_MODEL="claude-sonnet-5.5"

# Launch Claude Code agent
claude`}
                    />
                    <div className="p-3.5 rounded-xl bg-[#fbf9f5] border border-[#e7e5e4] space-y-1.5">
                      <p className="text-xs font-bold text-[#1c1917] flex items-center gap-1.5">
                        <Sliders className="h-3.5 w-3.5 text-[#6d28d9]" />
                        <span>Switching Models in Claude Code</span>
                      </p>
                      <p className="text-[11px] text-[#57534e]">
                        Run <code className="font-mono text-[#1c1917] font-semibold">npx lightningdeals model</code> to pick from models interactively, or launch with <code className="font-mono text-[#1c1917] font-semibold">claude --model &lt;model-id&gt;</code>.
                      </p>
                    </div>
                  </div>
                )}

                {/* Tab 2: Cursor */}
                {activeClientTab === 'cursor' && (
                  <div className="p-5 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-3 animate-in fade-in">
                    <h3 className="text-sm font-bold text-[#1c1917]">Cursor Composer Configuration</h3>
                    <p className="text-xs text-[#57534e] leading-relaxed">
                      Configure Cursor to route Claude models via Anthropic settings, or OpenAI/Local models via OpenAI settings:
                    </p>
                    <div className="space-y-3 text-xs">
                      <div className="p-4 rounded-xl bg-[#faf8f5] border border-[#e7e5e4] space-y-2">
                        <strong className="text-[#1c1917]">Method A: Claude Models (Anthropic Native)</strong>
                        <ol className="list-decimal list-inside space-y-1 text-[#57534e] pl-1">
                          <li>Open <strong className="text-[#1c1917]">Cursor Settings &rarr; Models</strong>.</li>
                          <li>In <strong className="text-[#1c1917]">Anthropic API Key</strong>, paste your key: <code className="font-mono text-[#1c1917]">ld_live_your_key_here</code>.</li>
                          <li>Toggle <strong className="text-[#1c1917]">Override Base URL</strong> on and set: <code className="font-mono font-bold text-[#1c1917]">https://lightningapi.pro</code>.</li>
                        </ol>
                      </div>

                      <div className="p-4 rounded-xl bg-[#faf8f5] border border-[#e7e5e4] space-y-2">
                        <strong className="text-[#1c1917]">Method B: OpenAI &amp; Local Models (OpenAI Compatible)</strong>
                        <ol className="list-decimal list-inside space-y-1 text-[#57534e] pl-1">
                          <li>In <strong className="text-[#1c1917]">OpenAI API Key</strong>, paste: <code className="font-mono text-[#1c1917]">ld_live_your_key_here</code>.</li>
                          <li>Toggle <strong className="text-[#1c1917]">Override Base URL</strong> and set: <code className="font-mono font-bold text-[#1c1917]">https://api.lightningapi.pro/v1</code>.</li>
                          <li>Add model: <code className="font-mono">deepseek-ai/deepseek-v3</code> or <code className="font-mono">gpt-4o</code>.</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Windsurf */}
                {activeClientTab === 'windsurf' && (
                  <div className="p-5 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-3 animate-in fade-in">
                    <h3 className="text-sm font-bold text-[#1c1917]">Windsurf Cascade Configuration</h3>
                    <p className="text-xs text-[#57534e] leading-relaxed">
                      Configure Codeium Windsurf Cascade to route all model families:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-xs text-[#57534e] pl-1">
                      <li>Open <strong className="text-[#1c1917]">Windsurf Settings &rarr; AI Providers</strong>.</li>
                      <li>Select <strong className="text-[#1c1917]">Anthropic</strong> or <strong className="text-[#1c1917]">Custom OpenAI Provider</strong>.</li>
                      <li>Set <strong className="text-[#1c1917]">Base URL</strong>: <code className="font-mono font-bold text-[#1c1917]">https://lightningapi.pro</code> (for Anthropic) or <code className="font-mono font-bold text-[#1c1917]">https://api.lightningapi.pro/v1</code> (for OpenAI).</li>
                      <li>Set <strong className="text-[#1c1917]">API Key</strong>: <code className="font-mono text-[#1c1917]">ld_live_your_key_here</code>.</li>
                    </ol>
                  </div>
                )}

                {/* Tab 4: VS Code (Cline / Roo) */}
                {activeClientTab === 'vscode' && (
                  <div className="p-5 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-3 animate-in fade-in">
                    <h3 className="text-sm font-bold text-[#1c1917]">VS Code (Cline / Roo Code / Continue)</h3>
                    <p className="text-xs text-[#57534e] leading-relaxed">
                      Configure popular VS Code autonomous extensions:
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#e7e5e4] font-mono space-y-1">
                        <div><strong>API Provider:</strong> Anthropic (or OpenAI Compatible)</div>
                        <div><strong>Base URL:</strong> https://api.lightningapi.pro/v1</div>
                        <div><strong>API Key:</strong> ld_live_your_key_here</div>
                        <div><strong>Model ID:</strong> claude-sonnet-5.5 (or deepseek-ai/deepseek-v3)</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 5: Python */}
                {activeClientTab === 'python' && (
                  <div className="p-5 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-3 animate-in fade-in">
                    <h3 className="text-sm font-bold text-[#1c1917]">Python SDK Integration (Anthropic &amp; OpenAI)</h3>
                    <div className="space-y-4">
                      <div>
                        <span className="text-xs font-bold text-[#1c1917]">1. Official Anthropic Python Client</span>
                        <CodeSnippetBlock
                          language="python"
                          code={`import anthropic

client = anthropic.Anthropic(
    api_key="ld_live_your_key_here",
    base_url="https://lightningapi.pro"
)

response = client.messages.create(
    model="claude-sonnet-5.5",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Explain raft consensus algorithm succinctly."}]
)
print(response.content[0].text)`}
                        />
                      </div>

                      <div>
                        <span className="text-xs font-bold text-[#1c1917]">2. Official OpenAI Python Client (OpenAI &amp; Local Models)</span>
                        <CodeSnippetBlock
                          language="python"
                          code={`import openai

client = openai.OpenAI(
    api_key="ld_live_your_key_here",
    base_url="https://api.lightningapi.pro/v1"
)

response = client.chat.completions.create(
    model="deepseek-ai/deepseek-v3",
    messages=[{"role": "user", "content": "Write a high-performance LRU cache in Rust."}]
)
print(response.choices[0].message.content)`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 6: Node / TypeScript */}
                {activeClientTab === 'node' && (
                  <div className="p-5 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-3 animate-in fade-in">
                    <h3 className="text-sm font-bold text-[#1c1917]">TypeScript &amp; Node.js SDK</h3>
                    <CodeSnippetBlock
                      language="typescript"
                      code={`import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.LIGHTNING_API_KEY || 'ld_live_your_key_here',
  baseURL: 'https://lightningapi.pro',
});

const response = await anthropic.messages.create({
  model: 'claude-sonnet-5.5',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Generate high-throughput Express proxy' }],
});

console.log(response.content[0]);`}
                    />
                  </div>
                )}

                {/* Tab 7: cURL */}
                {activeClientTab === 'curl' && (
                  <div className="p-5 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-3 animate-in fade-in">
                    <h3 className="text-sm font-bold text-[#1c1917]">cURL Terminal Commands</h3>
                    <CodeSnippetBlock
                      language="bash"
                      code={`# Anthropic Messages format
curl https://api.lightningapi.pro/v1/messages \\
  -H "x-api-key: ld_live_your_key_here" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "claude-sonnet-5.5",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hello!"}]
  }'

# OpenAI Chat Completions format
curl https://api.lightningapi.pro/v1/chat/completions \\
  -H "Authorization: Bearer ld_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "deepseek-ai/deepseek-v3",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 100
  }'`}
                    />
                  </div>
                )}
              </section>

              <hr className="my-10 border-[#e7e5e4]" />

              {/* ----------------------------------------------------------- */}
              {/* SECTION 6: STREAMING & SSE LIFECYCLE                        */}
              {/* ----------------------------------------------------------- */}
              <section id="streaming" className="mb-16 scroll-mt-24 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e7e5e4] shadow-xs text-xs font-mono font-medium text-[#57534e]">
                  <Layers className="h-3.5 w-3.5 text-[#6d28d9]" />
                  <span>SECTION 06</span>
                  <span className="text-[#d6d3d1]">·</span>
                  <span className="text-[#6d28d9] font-bold">STREAMING &amp; SSE LIFECYCLE</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1c1917]">
                  Real-Time Server-Sent Events (SSE)
                </h2>

                <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed">
                  When <code className="font-mono text-[#1c1917]">"stream": true</code> is specified, the gateway forwards tokens chunk-by-chunk using standard SSE formatting adhering strictly to Anthropic and OpenAI protocols.
                </p>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-[#e7e5e4] space-y-1">
                    <span className="font-mono font-bold text-[#6d28d9]">event: message_start</span>
                    <p className="text-[11px] text-[#57534e]">Emits initial metadata, message ID, role, and usage initialization.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-[#e7e5e4] space-y-1">
                    <span className="font-mono font-bold text-[#6d28d9]">event: content_block_delta</span>
                    <p className="text-[11px] text-[#57534e]">Carries incremental token text deltas or JSON argument snippets.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-[#e7e5e4] space-y-1">
                    <span className="font-mono font-bold text-[#6d28d9]">event: message_delta &amp; message_stop</span>
                    <p className="text-[11px] text-[#57534e]">Signals completion, output stop reason (<code className="font-mono">end_turn</code> | <code className="font-mono">max_tokens</code>), and final token accounting.</p>
                  </div>
                </div>
              </section>

              <hr className="my-10 border-[#e7e5e4]" />

              {/* ----------------------------------------------------------- */}
              {/* SECTION 7: MODEL CATALOG & ALIASES                          */}
              {/* ----------------------------------------------------------- */}
              <section id="models" className="mb-16 scroll-mt-24 space-y-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e7e5e4] shadow-xs text-xs font-mono font-medium text-[#57534e]">
                  <Cpu className="h-3.5 w-3.5 text-[#6d28d9]" />
                  <span>SECTION 07</span>
                  <span className="text-[#d6d3d1]">·</span>
                  <span className="text-[#6d28d9] font-bold">MODEL CATALOG (CLAUDE, OPENAI, LOCAL)</span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1c1917]">
                    Supported Models &amp; Normalization Routing
                  </h2>
                  <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed">
                    The tables below document verified models mounted on the gateway database. Requests using convenient aliases or IDE context tags are automatically normalized.
                  </p>
                </div>

                {/* Claude Table */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6d28d9] font-mono">
                    1. Claude (Anthropic) Lineup
                  </h3>
                  <div className="bg-white rounded-2xl border border-[#e7e5e4] shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-sans">
                        <thead className="bg-[#fbf9f5] border-b border-[#e7e5e4] text-[#78716c] font-mono text-[10px] uppercase">
                          <tr>
                            <th className="py-3 px-4">Model Name</th>
                            <th className="py-3 px-4">API Model ID</th>
                            <th className="py-3 px-4">Context Window</th>
                            <th className="py-3 px-4">Eligible Billing</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f5f2eb] text-[#57534e]">
                          <tr>
                            <td className="py-3 px-4 font-bold text-[#1c1917]">Claude Sonnet 5.5 / 4.6</td>
                            <td className="py-3 px-4 font-mono text-purple-700">claude-sonnet-5.5</td>
                            <td className="py-3 px-4 font-bold text-emerald-700">1,000,000 tokens</td>
                            <td className="py-3"><span className="px-2 py-0.5 rounded bg-violet-100 text-[#6d28d9] font-bold text-[10px]">Rolling, Credits, Tokens</span></td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-bold text-[#1c1917]">Claude Opus 5.5 / 4.7</td>
                            <td className="py-3 px-4 font-mono text-purple-700">claude-opus-5.5</td>
                            <td className="py-3 px-4 font-bold text-emerald-700">1,000,000 tokens</td>
                            <td className="py-3"><span className="px-2 py-0.5 rounded bg-violet-100 text-[#6d28d9] font-bold text-[10px]">Rolling, Credits, Tokens</span></td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-bold text-[#1c1917]">Claude Haiku 5.5</td>
                            <td className="py-3 px-4 font-mono text-purple-700">claude-haiku-5.5</td>
                            <td className="py-3 px-4 font-bold text-emerald-700">500,000 tokens</td>
                            <td className="py-3"><span className="px-2 py-0.5 rounded bg-violet-100 text-[#6d28d9] font-bold text-[10px]">Rolling, Credits, Tokens</span></td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-bold text-[#1c1917]">Claude Opus 5 Extended Thinking</td>
                            <td className="py-3 px-4 font-mono text-purple-700">claude-opus-5-thinking</td>
                            <td className="py-3 px-4 font-bold text-emerald-700">1,000,000 tokens</td>
                            <td className="py-3"><span className="px-2 py-0.5 rounded bg-violet-100 text-[#6d28d9] font-bold text-[10px]">Rolling, Credits, Tokens</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* OpenAI Frontier Table */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 font-mono">
                    2. OpenAI Frontier Lineup
                  </h3>
                  <div className="bg-white rounded-2xl border border-[#e7e5e4] shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-sans">
                        <thead className="bg-[#fbf9f5] border-b border-[#e7e5e4] text-[#78716c] font-mono text-[10px] uppercase">
                          <tr>
                            <th className="py-3 px-4">Model Name</th>
                            <th className="py-3 px-4">API Model ID</th>
                            <th className="py-3 px-4">Context Window</th>
                            <th className="py-3 px-4">Eligible Billing</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f5f2eb] text-[#57534e]">
                          <tr>
                            <td className="py-3 px-4 font-bold text-[#1c1917]">GPT-4o</td>
                            <td className="py-3 px-4 font-mono text-emerald-700">gpt-4o</td>
                            <td className="py-3 px-4 font-bold text-emerald-700">128,000 tokens</td>
                            <td className="py-3"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Credits, Token Packs</span></td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-bold text-[#1c1917]">o1 Reasoning</td>
                            <td className="py-3 px-4 font-mono text-emerald-700">o1</td>
                            <td className="py-3 px-4 font-bold text-emerald-700">200,000 tokens</td>
                            <td className="py-3"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Credits, Token Packs</span></td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-bold text-[#1c1917]">o3-mini High Reasoning</td>
                            <td className="py-3 px-4 font-mono text-emerald-700">o3-mini</td>
                            <td className="py-3 px-4 font-bold text-emerald-700">200,000 tokens</td>
                            <td className="py-3"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Credits, Token Packs</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Local & Open-Weights Table */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 font-mono">
                    3. Local &amp; Open-Weights Lineup
                  </h3>
                  <div className="bg-white rounded-2xl border border-[#e7e5e4] shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-sans">
                        <thead className="bg-[#fbf9f5] border-b border-[#e7e5e4] text-[#78716c] font-mono text-[10px] uppercase">
                          <tr>
                            <th className="py-3 px-4">Model Name</th>
                            <th className="py-3 px-4">API Model ID</th>
                            <th className="py-3 px-4">Context Window</th>
                            <th className="py-3 px-4">Eligible Billing</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f5f2eb] text-[#57534e]">
                          <tr>
                            <td className="py-3 px-4 font-bold text-[#1c1917]">DeepSeek-V3</td>
                            <td className="py-3 px-4 font-mono text-amber-700">deepseek-ai/deepseek-v3</td>
                            <td className="py-3 px-4 font-bold text-emerald-700">128,000 tokens</td>
                            <td className="py-3"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">Credits (7x), Token Packs</span></td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-bold text-[#1c1917]">DeepSeek-R1 (Reasoning)</td>
                            <td className="py-3 px-4 font-mono text-amber-700">deepseek-ai/deepseek-r1</td>
                            <td className="py-3 px-4 font-bold text-emerald-700">128,000 tokens</td>
                            <td className="py-3"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">Credits (7x), Token Packs</span></td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-bold text-[#1c1917]">Qwen 2.5 72B / 3.7 Flash</td>
                            <td className="py-3 px-4 font-mono text-amber-700">qwen-3.7-flash</td>
                            <td className="py-3 px-4 font-bold text-emerald-700">128,000 tokens</td>
                            <td className="py-3"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">Credits (7x), Token Packs</span></td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-bold text-[#1c1917]">GLM-4 / 5.3 Flash</td>
                            <td className="py-3 px-4 font-mono text-amber-700">glm-5.3-flash</td>
                            <td className="py-3 px-4 font-bold text-emerald-700">128,000 tokens</td>
                            <td className="py-3"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">Credits (7x), Token Packs</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </section>

              <hr className="my-10 border-[#e7e5e4]" />

              {/* ----------------------------------------------------------- */}
              {/* SECTION 8: BILLING MODES & QUOTA ENGINES                    */}
              {/* ----------------------------------------------------------- */}
              <section id="quotas" className="mb-16 scroll-mt-24 space-y-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e7e5e4] shadow-xs text-xs font-mono font-medium text-[#57534e]">
                  <RefreshCw className="h-3.5 w-3.5 text-[#6d28d9]" />
                  <span>SECTION 08</span>
                  <span className="text-[#d6d3d1]">·</span>
                  <span className="text-[#6d28d9] font-bold">BILLING MODES &amp; QUOTA ENGINES</span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1c1917]">
                    How Quotas &amp; Replenishment Work Across All 3 Architectures
                  </h2>
                  <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed">
                    Compare how token deduction, rolling renewal, and credit balances operate mathematically.
                  </p>
                </div>

                {/* 1. Rolling Window Detailed Explanation */}
                <div className="p-5 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#6d28d9]">
                    <RefreshCw className="w-4 h-4" />
                    <span>1. 5-Hour Continuous Rolling Window (Claude Exclusive)</span>
                  </div>
                  <p className="text-xs text-[#57534e] leading-relaxed">
                    Unlike traditional monthly plans with hard cutoffs, LightningAPI implements an intelligent <strong className="text-[#1c1917]">5-hour continuous sliding window</strong>:
                  </p>
                  <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#e7e5e4] font-mono text-xs text-[#6d28d9] font-bold">
                    Quota Equation: WindowUsage(t) = ∑ Tokens[t - 5 hours &rarr; t]
                  </div>
                  <p className="text-xs text-[#57534e] leading-relaxed">
                    Each consumed token has a precise millisecond timestamp. Exactly 300 minutes (5 hours) after generation, those tokens roll completely out of the sum and return to your available headroom.
                  </p>
                </div>

                {/* 2. Usage Credits Detailed Explanation */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-900 via-indigo-900 to-purple-900 text-white shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                      <Sparkles className="w-4 h-4" />
                      <span>2. Usage Credits — 7x Purchasing Power Multiplier</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-400 text-neutral-950">
                      7X VALUE MULTIPLIER
                    </span>
                  </div>
                  <p className="text-xs text-violet-200 leading-relaxed">
                    Deposit funds in INR and unlock up to <strong>8.75x</strong> in API Credits (e.g. Pay ₹100 → Receive ₹700 API Credits, Pay ₹499 → Receive ₹3,850 API Credits, Pay ₹1,999 → Receive ₹16,000 API Credits, Pay ₹3,999 → Receive ₹35,000 API Credits).
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono pt-1">
                    <div className="p-2.5 rounded-xl bg-white/10 border border-white/15">
                      <span className="text-violet-300 block">Deduction Model:</span>
                      <strong className="text-white">Atomic per-token</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/10 border border-white/15">
                      <span className="text-violet-300 block">Model Scope:</span>
                      <strong className="text-white">Universal (Claude, OpenAI, Local)</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/10 border border-white/15">
                      <span className="text-violet-300 block">Expiration:</span>
                      <strong className="text-amber-300">365 Days</strong>
                    </div>
                  </div>
                </div>

                {/* 3. Token Packs Detailed Explanation */}
                <div className="p-5 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                      <Coins className="w-4 h-4" />
                      <span>3. Prepaid Consumable Tokens (No 5-Hour Resets)</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      FIXED CONSUMABLE QUOTA
                    </span>
                  </div>
                  <p className="text-xs text-[#57534e] leading-relaxed">
                    A fixed allowance of 5M, 20M, or 50M tokens that does <strong>NOT</strong> reset every 5 hours. Spend as fast or slow as needed over 365 full days. Ideal for bulk processing, migrations, and project bursts.
                  </p>
                </div>
              </section>

              <hr className="my-10 border-[#e7e5e4]" />

              {/* ----------------------------------------------------------- */}
              {/* SECTION 9: ERRORS & TROUBLESHOOTING                         */}
              {/* ----------------------------------------------------------- */}
              <section id="errors" className="mb-16 scroll-mt-24 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e7e5e4] shadow-xs text-xs font-mono font-medium text-[#57534e]">
                  <AlertTriangle className="h-3.5 w-3.5 text-[#6d28d9]" />
                  <span>SECTION 09</span>
                  <span className="text-[#d6d3d1]">·</span>
                  <span className="text-[#6d28d9] font-bold">ERRORS &amp; TROUBLESHOOTING</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1c1917]">
                  Status Codes, JSON Error Schemas &amp; Fixes
                </h2>

                <div className="space-y-4">
                  {/* Error 401 */}
                  <div className="p-4 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-rose-600">401 Unauthorized</span>
                      <span className="text-[10px] font-mono text-[#78716c]">authentication_error</span>
                    </div>
                    <p className="text-xs text-[#57534e]">
                      Occurs when the <code className="font-mono text-[#1c1917]">x-api-key</code> or Bearer token is missing, expired, or invalid.
                    </p>
                    <CodeSnippetBlock
                      language="json"
                      code={`{
  "type": "error",
  "error": {
    "type": "authentication_error",
    "message": "Invalid API key provided. Verify your key starts with ld_live_ or ld_trial_."
  }
}`}
                    />
                  </div>

                  {/* Error 429 */}
                  <div className="p-4 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-amber-600">429 Rate Limit Exceeded</span>
                      <span className="text-[10px] font-mono text-[#78716c]">rate_limit_error</span>
                    </div>
                    <p className="text-xs text-[#57534e]">
                      Occurs when rolling window capacity is reached or credit balance is fully consumed.
                    </p>
                  </div>
                </div>
              </section>

              <hr className="my-10 border-[#e7e5e4]" />

              {/* ----------------------------------------------------------- */}
              {/* SECTION 10: SUPPORT & DIAGNOSTICS                           */}
              {/* ----------------------------------------------------------- */}
              <section id="support" className="mb-16 scroll-mt-24 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e7e5e4] shadow-xs text-xs font-mono font-medium text-[#57534e]">
                  <LifeBuoy className="h-3.5 w-3.5 text-[#6d28d9]" />
                  <span>SECTION 10</span>
                  <span className="text-[#d6d3d1]">·</span>
                  <span className="text-[#6d28d9] font-bold">SUPPORT &amp; DIAGNOSTICS</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1c1917]">
                  Developer Support &amp; Key Verification
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-2">
                    <h4 className="text-xs font-bold text-[#1c1917]">Official Contact Channels</h4>
                    <ul className="space-y-1.5 text-xs text-[#57534e]">
                      <li>
                        <strong>Support Email:</strong>{' '}
                        <a href="mailto:support@lightningapi.pro" className="text-[#6d28d9] underline">
                          support@lightningapi.pro
                        </a>
                      </li>
                      <li>
                        <strong>Key Status Checker:</strong>{' '}
                        <Link to="/check-key" className="text-[#6d28d9] underline">
                          /check-key
                        </Link>
                      </li>
                      <li>
                        <strong>Platform Status:</strong>{' '}
                        <Link to="/status" className="text-[#6d28d9] underline">
                          /status
                        </Link>
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-2">
                    <h4 className="text-xs font-bold text-[#1c1917]">Safe Issue Reporting Rules</h4>
                    <p className="text-xs text-[#57534e] leading-relaxed">
                      To safeguard your account security, <strong className="text-rose-600">never share your full API key or proprietary source code</strong> in emails or support tickets.
                    </p>
                    <p className="text-[11px] text-[#78716c]">
                      Please include only: (1) Masked key prefix (<code className="font-mono">ld_live_a1b2...</code>), (2) Timestamp, (3) Model ID, and (4) HTTP status code.
                    </p>
                  </div>
                </div>
              </section>

            </main>
          </div>
        </div>
      </div>

      <ElectricFooter />
    </div>
  );
};

export default DocsPage;
