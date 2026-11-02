import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Terminal,
  FileCode,
  Globe,
  Cpu,
  Zap,
  KeyRound,
  Wrench,
  LifeBuoy,
  Copy,
  Check,
  Check as CheckIcon,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Layers,
  HelpCircle,
  Sparkles,
  Search,
  CheckCircle2,
  Lock,
  Clock,
  CreditCard,
  Laptop,
} from 'lucide-react';
import { SiteHeader } from '../../components/SiteHeader';
import { SiteFooter } from '../../components/SiteFooter';
import { MultiOsCodeBlock } from '../../components/docs/MultiOsCodeBlock';
import { SetupWizard } from '../../components/docs/SetupWizard';
import { DocSearchModal } from '../../components/docs/DocSearchModal';

interface NavItem {
  id: string;
  label: string;
}

interface NavSection {
  id: string;
  title: string;
  icon: any;
  items: NavItem[];
}

const SIDEBAR_NAV: NavSection[] = [
  {
    id: 'sec-getting-started',
    title: 'A. GETTING STARTED',
    icon: BookOpen,
    items: [
      { id: 'overview', label: '1. Introduction to LightningAPI' },
      { id: 'what-is-api-key', label: '2. What is an API Key?' },
      { id: 'how-it-works', label: '3. How LightningAPI Works' },
      { id: 'getting-your-key', label: '4. How to Get Your API Key' },
      { id: 'plan-types-overview', label: '5. Understanding Your Plan' },
      { id: 'first-request', label: '6. Your First Successful Request' },
      { id: 'check-key-status', label: '7. Checking Your Key Status' },
    ],
  },
  {
    id: 'sec-quick-setup',
    title: 'B. QUICK SETUP',
    icon: Terminal,
    items: [
      { id: 'windows-setup', label: '1. Windows Setup (PowerShell)' },
      { id: 'macos-setup', label: '2. macOS Setup (Terminal/Zsh)' },
      { id: 'linux-setup', label: '3. Linux Setup (Bash)' },
      { id: 'automatic-setup', label: '4. Automatic Setup (CLI)' },
      { id: 'manual-setup', label: '5. Manual Configuration' },
      { id: 'verify-installation', label: '6. Verifying Installation' },
      { id: 'rotate-key', label: '7. Changing / Rotating Keys' },
      { id: 'remove-config', label: '8. Removing Configurations' },
    ],
  },
  {
    id: 'sec-connect-apps',
    title: 'C. CONNECT YOUR APP',
    icon: Wrench,
    items: [
      { id: 'interactive-wizard', label: '★ Interactive Setup Wizard' },
      { id: 'guide-claude-code', label: '1. Claude Code CLI' },
      { id: 'guide-cursor', label: '2. Cursor IDE' },
      { id: 'guide-codex', label: '3. Codex CLI' },
      { id: 'guide-vscode', label: '4. Visual Studio Code' },
      { id: 'guide-windsurf', label: '5. Windsurf IDE' },
      { id: 'guide-cline', label: '6. Cline (Autonomous Agent)' },
      { id: 'guide-roo-code', label: '7. Roo Code' },
      { id: 'guide-continue', label: '8. Continue.dev' },
      { id: 'guide-trae', label: '9. TRAE SOLO' },
      { id: 'guide-claude-desktop', label: '10. Claude Desktop' },
      { id: 'guide-cherry-studio', label: '11. Cherry Studio' },
      { id: 'guide-n8n', label: '12. n8n Automation Engine' },
      { id: 'guide-python', label: '13. Python SDK' },
      { id: 'guide-node', label: '14. Node.js & TypeScript' },
    ],
  },
  {
    id: 'sec-models',
    title: 'D. MODELS & PROVIDERS',
    icon: Cpu,
    items: [
      { id: 'models-claude', label: '1. Claude Frontier Models' },
      { id: 'models-openai', label: '2. OpenAI Frontier Models' },
      { id: 'models-gemini', label: '3. Google Gemini Models' },
      { id: 'models-local', label: '4. Open-Weights & Labs' },
      { id: 'model-selection', label: '5. Model Selection Guide' },
      { id: 'model-ids', label: '6. Technical Model IDs' },
      { id: 'model-permissions', label: '7. Model Plan Permissions' },
    ],
  },
  {
    id: 'sec-api-reference',
    title: 'E. API REFERENCE',
    icon: Globe,
    items: [
      { id: 'api-authentication', label: '1. Authentication Standards' },
      { id: 'api-base-urls', label: '2. Base URLs & Protocols' },
      { id: 'api-models', label: '3. GET /v1/models' },
      { id: 'api-messages', label: '4. POST /v1/messages' },
      { id: 'api-chat-completions', label: '5. POST /v1/chat/completions' },
      { id: 'api-responses', label: '6. POST /v1/responses' },
      { id: 'api-streaming', label: '7. Server-Sent Events (SSE)' },
      { id: 'api-multimodal', label: '8. Multimodal Vision & Images' },
      { id: 'api-token-count', label: '9. Token Counting' },
      { id: 'api-rate-limits', label: '10. Rate Limits & Concurrency' },
    ],
  },
  {
    id: 'sec-usage-billing',
    title: 'F. USAGE & BILLING',
    icon: Layers,
    items: [
      { id: 'billing-architectures', label: '1. Six Billing Architectures' },
      { id: 'billing-rolling-window', label: '2. 5-Hour Rolling Windows' },
      { id: 'billing-credits', label: '3. Prepaid Credit Wallet' },
      { id: 'billing-tokens', label: '4. Consumable Token Packs' },
      { id: 'billing-dashboard', label: '5. Dashboard Telemetry' },
      { id: 'billing-expiry', label: '6. Validity & Expiry Rules' },
      { id: 'billing-guarantee', label: '7. Fair Billing Guarantee' },
    ],
  },
  {
    id: 'sec-troubleshooting',
    title: 'G. TROUBLESHOOTING',
    icon: AlertTriangle,
    items: [
      { id: 'troubleshooting-intro', label: '1. Diagnostic Assistant' },
      { id: 'error-400', label: '2. HTTP 400 — Invalid Request' },
      { id: 'error-401', label: '3. HTTP 401 — Invalid Key' },
      { id: 'error-402', label: '4. HTTP 402 — Depleted Balance' },
      { id: 'error-403-model', label: '5. HTTP 403 — Model Denied' },
      { id: 'error-403-key', label: '6. HTTP 403 — Key Inactive' },
      { id: 'error-429-quota', label: '7. HTTP 429 — Quota Reached' },
      { id: 'error-429-rpm', label: '8. HTTP 429 — Speed Limit' },
      { id: 'error-500-503', label: '9. HTTP 500/503 — Cluster Busy' },
      { id: 'client-connection-errors', label: '10. Application Issues' },
    ],
  },
  {
    id: 'sec-security-support',
    title: 'H. SECURITY & SUPPORT',
    icon: ShieldCheck,
    items: [
      { id: 'key-security', label: '1. API Key Storage Hygiene' },
      { id: 'environment-variables', label: '2. Environment Variables' },
      { id: 'emergency-rotation', label: '3. Key Rotation Procedure' },
      { id: 'faq-section', label: '4. Frequently Asked Questions' },
      { id: 'contact-support', label: '5. Engineering Support' },
    ],
  },
];

export const DocsPage: React.FC = () => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'sec-getting-started': true,
    'sec-quick-setup': true,
    'sec-connect-apps': true,
    'sec-models': false,
    'sec-api-reference': false,
    'sec-usage-billing': false,
    'sec-troubleshooting': false,
    'sec-security-support': false,
  });
  const [copiedNpx, setCopiedNpx] = useState(false);

  const handleCopyNpx = () => {
    navigator.clipboard.writeText('npx lightningdeals');
    setCopiedNpx(true);
    setTimeout(() => setCopiedNpx(false), 2000);
  };

  const isManualScrollingRef = useRef(false);
  const manualScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleSectionExpand = (secId: string) => {
    setExpandedSections((prev) => ({ ...prev, [secId]: !prev[secId] }));
  };

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
    const hash = location.hash.replace('#', '');
    if (hash) {
      setTimeout(() => scrollToSection(hash), 150);
    }
  }, [location.hash]);

  // Keyboard shortcut Ctrl+K or / to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1c1917] selection:bg-purple-900 selection:text-white flex flex-col font-sans">
      <SiteHeader />

      {/* SEARCH MODAL */}
      <DocSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectSection={scrollToSection}
      />

      {/* TOP HERO & ONBOARDING HEADER */}
      <header className="border-b border-[#ede8e1] bg-white pt-10 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-800 text-xs font-bold font-mono">
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                <span>LightningAPI Documentation Centre</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1c1917]">
                Everything you need to get started.
              </h1>
              <p className="text-sm sm:text-base text-[#78716c] max-w-2xl leading-relaxed">
                Connect your LightningAPI key to your favourite AI tools in a few simple steps. Choose your application, follow the verified guide, and start building.
              </p>
            </div>

            {/* Global Search Button */}
            <div className="shrink-0 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="w-full md:w-72 px-4 py-2.5 rounded-2xl border border-[#ede8e1] bg-[#faf8f5] hover:bg-white text-left flex items-center justify-between gap-3 text-xs text-[#78716c] hover:border-violet-300 transition-all shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-violet-600" />
                  <span className="font-medium">Search documentation...</span>
                </div>
                <kbd className="px-2 py-0.5 rounded bg-white border border-[#ede8e1] text-[10px] font-mono text-[#a8a29e]">
                  Ctrl+K
                </kbd>
              </button>
            </div>
          </div>

          {/* THREE ENTRY PATHWAYS (TRIAGE) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <button
              type="button"
              onClick={() => scrollToSection('overview')}
              className="p-4 rounded-2xl border border-[#ede8e1] bg-white hover:border-violet-300 hover:bg-[#faf8f5] transition-all text-left group shadow-xs cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-[#1c1917] group-hover:text-violet-700 transition-colors">
                  1. I am new to APIs
                </h2>
                <p className="text-xs text-[#78716c] leading-relaxed">
                  Start with the fundamentals: what an API key is, how plans work, and your first request.
                </p>
              </div>
              <div className="pt-3 text-[11px] font-bold text-violet-700 flex items-center gap-1">
                <span>Start Beginner Guide</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('interactive-wizard')}
              className="p-4 rounded-2xl border border-violet-200 bg-violet-50/50 hover:bg-violet-50 hover:border-violet-300 transition-all text-left group shadow-xs cursor-pointer flex flex-col justify-between ring-1 ring-violet-500/20"
            >
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-[#1c1917] group-hover:text-violet-700 transition-colors">
                  2. Connect an Application
                </h2>
                <p className="text-xs text-[#78716c] leading-relaxed">
                  Interactive setup wizard for Claude Code, Cursor, Codex, Windsurf, Cline, and 14+ tools.
                </p>
              </div>
              <div className="pt-3 text-[11px] font-bold text-violet-700 flex items-center gap-1">
                <span>Open Setup Wizard</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('api-reference')}
              className="p-4 rounded-2xl border border-[#ede8e1] bg-white hover:border-violet-300 hover:bg-[#faf8f5] transition-all text-left group shadow-xs cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-[#1c1917] group-hover:text-violet-700 transition-colors">
                  3. Developer Reference
                </h2>
                <p className="text-xs text-[#78716c] leading-relaxed">
                  Full API specifications, cURL, Python & Node.js code snippets, endpoints, and streaming.
                </p>
              </div>
              <div className="pt-3 text-[11px] font-bold text-purple-700 flex items-center gap-1">
                <span>Explore Endpoints</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN DOCUMENTATION WORKSPACE */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col lg:flex-row gap-8">
        {/* MOBILE NAVIGATION TOGGLE */}
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-[#ede8e1] bg-white font-bold text-xs text-[#1c1917] shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-violet-600" />
              <span>Browse Documentation Sections</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* LEFT SIDEBAR NAVIGATION */}
        <aside
          className={`${
            mobileMenuOpen ? 'block' : 'hidden'
          } lg:block w-full lg:w-72 shrink-0 space-y-4 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto pr-2`}
        >
          <div className="space-y-3">
            {SIDEBAR_NAV.map((sec) => {
              const isExpanded = expandedSections[sec.id] ?? true;
              const SecIcon = sec.icon;
              return (
                <div key={sec.id} className="rounded-2xl border border-[#ede8e1] bg-white overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => toggleSectionExpand(sec.id)}
                    className="w-full p-3 flex items-center justify-between bg-[#faf8f5] hover:bg-stone-100/60 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2">
                      <SecIcon className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                      <span className="text-[11px] font-bold text-[#1c1917] tracking-wider uppercase font-mono">
                        {sec.title}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#78716c] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="p-2 space-y-0.5">
                      {sec.items.map((item) => {
                        const isActive = activeSection === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => scrollToSection(item.id)}
                            className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center justify-between ${
                              isActive
                                ? 'bg-violet-600 text-white font-bold shadow-xs'
                                : 'text-[#78716c] hover:text-[#1c1917] hover:bg-[#faf8f5]'
                            }`}
                          >
                            <span className="truncate">{item.label}</span>
                            {isActive && <ChevronRight className="w-3 h-3 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Support Badge */}
          <div className="p-4 rounded-2xl border border-[#ede8e1] bg-white space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#1c1917]">
              <LifeBuoy className="w-4 h-4 text-violet-600" />
              <span>Need Assistance?</span>
            </div>
            <p className="text-[11px] text-[#78716c] leading-relaxed">
              Verify your key anytime on the live checker or email engineering support.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Link
                to="/check-key"
                className="text-[11px] font-bold text-violet-700 hover:text-violet-800 underline"
              >
                Verify Key
              </Link>
              <span className="text-[#a8a29e]">•</span>
              <a
                href="mailto:support@lightningapi.pro"
                className="text-[11px] font-bold text-violet-700 hover:text-violet-800 underline"
              >
                Contact Support
              </a>
            </div>
          </div>
        </aside>

        {/* CENTRAL DOCUMENTATION CONTENT COLUMN */}
        <main className="flex-1 min-w-0 space-y-12">
          {/* ============================================================== */}
          {/* 1-COMMAND QUICK CONFIGURATION HIGHLIGHT (NPX LIGHTNINGDEALS)   */}
          {/* ============================================================== */}
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-violet-900 via-indigo-950 to-zinc-950 text-white border border-violet-700/60 shadow-lg relative overflow-hidden space-y-4">
            <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            
            <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 text-violet-200 text-xs font-bold border border-violet-400/40">
                <Terminal className="w-3.5 h-3.5 text-violet-300" />
                <span>Instant 1-Command Configuration</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                <span className="inline-flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Windows PowerShell · macOS Terminal · Linux Bash</span>
                </span>
              </div>
            </div>

            <div className="space-y-1.5 relative z-10 text-left">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex flex-wrap items-center gap-2">
                <span>Configure Everything in 1 Command:</span>
                <span className="text-emerald-400 font-mono text-lg sm:text-xl">npx lightningdeals</span>
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-3xl">
                Skip manual JSON editing! Run <code className="font-mono font-bold text-violet-200 bg-violet-900/60 px-1.5 py-0.5 rounded border border-violet-700/50">npx lightningdeals</code> in your terminal or PowerShell. The interactive CLI installer auto-detects your editors (Cursor, Claude Code, Codex, VS Code), creates configuration backups, injects your API key, sets endpoints, and tests connectivity in seconds.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-black/60 border border-zinc-800 backdrop-blur-md relative z-10 font-mono text-xs">
              <div className="flex items-center gap-2 text-zinc-300 overflow-x-auto">
                <span className="text-violet-400 font-bold select-none">$</span>
                <span className="text-emerald-400 font-bold text-sm sm:text-base select-all tracking-wide">npx lightningdeals</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyNpx}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-sans text-xs font-bold transition-all shadow-xs cursor-pointer"
                  title="Copy 1-command installer"
                >
                  {copiedNpx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Command</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-[11.5px] text-zinc-400 relative z-10">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero manual JSON editing</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Auto config file backups</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Immediate connection test</span>
              </span>
            </div>
          </div>

          {/* ============================================================== */}
          {/* CHAPTER C: INTERACTIVE SETUP WIZARD (EMBEDDED HERO FEATURE) */}
          {/* ============================================================== */}
          <section id="interactive-wizard" className="scroll-mt-24 space-y-4">
            <SetupWizard />
          </section>

          {/* ============================================================== */}
          {/* CHAPTER A: GETTING STARTED */}
          {/* ============================================================== */}
          <section id="sec-getting-started" className="space-y-8 pt-4">
            <div className="border-b border-[#ede8e1] pb-3">
              <span className="text-xs font-bold text-violet-700 uppercase tracking-widest font-mono">
                Section A
              </span>
              <h2 className="text-2xl font-bold text-[#1c1917] tracking-tight">
                Getting Started with LightningAPI
              </h2>
            </div>

            {/* A1: Overview */}
            <article id="overview" className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4">
              <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-violet-600" />
                <span>1. Introduction & System Overview</span>
              </h3>
              <p className="text-sm text-[#44403c] leading-relaxed">
                LightningAPI is a modern, unified AI API gateway that provides high-speed, enterprise-grade access to frontier intelligence models—including Anthropic Claude, OpenAI, and Google Gemini—through a single, highly available endpoint.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] space-y-1">
                  <div className="text-xs font-bold text-[#1c1917]">Unified Endpoints</div>
                  <p className="text-[11.5px] text-[#78716c]">One key connects Claude Code, Cursor, Codex, and custom scripts.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] space-y-1">
                  <div className="text-xs font-bold text-[#1c1917]">Sub-50ms Routing</div>
                  <p className="text-[11.5px] text-[#78716c]">Edge-optimized reverse proxy with automatic health failovers.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] space-y-1">
                  <div className="text-xs font-bold text-[#1c1917]">Fair Accounting</div>
                  <p className="text-[11.5px] text-[#78716c]">Zero tokens or credits billed for failed or interrupted requests.</p>
                </div>
              </div>
            </article>

            {/* A2: What is an API key */}
            <article id="what-is-api-key" className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4">
              <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-violet-600" />
                <span>2. What is an API Key?</span>
              </h3>
              <p className="text-sm text-[#44403c] leading-relaxed">
                An API key is a unique, secret password that your coding assistant (like Cursor, Claude Code, or VS Code) uses to authenticate with LightningAPI on your behalf.
              </p>
              <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] space-y-2 text-xs">
                <div className="font-bold text-[#1c1917] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Key Anatomy at LightningAPI</span>
                </div>
                <p className="text-[#64607d] leading-relaxed">
                  Every active LightningAPI key begins with the prefix <code className="font-mono font-bold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-200">ld_live_</code> (or <code className="font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">ld_trial_</code> for free trials). Treat your key like a credit card: never share it in public repositories or client-side browser code.
                </p>
              </div>
            </article>

            {/* A3: How it works */}
            <article id="how-it-works" className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4">
              <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
                <Zap className="w-5 h-5 text-violet-600" />
                <span>3. How LightningAPI Works</span>
              </h3>
              <p className="text-sm text-[#44403c] leading-relaxed">
                When your tool sends a prompt, it connects to LightningAPI's gateway. The gateway verifies your key's quota, translates the protocol if necessary, routes to the healthiest cluster, streams tokens back in real-time, and settles usage in an immutable ledger.
              </p>
              <div className="p-4 rounded-2xl bg-[#0c0d14] text-[#f4f4f5] font-mono text-xs border border-neutral-800 space-y-2">
                <div className="text-neutral-400 text-[11px] uppercase tracking-wider font-bold">Request Pipeline</div>
                <div className="text-violet-400">Your Client (Cursor / Claude Code)</div>
                <div className="text-neutral-500 pl-4">↳ HTTPS POST with ld_live_...</div>
                <div className="text-emerald-400 pl-8">↳ LightningAPI Gateway (Authentication & Rate Limiting)</div>
                <div className="text-neutral-500 pl-12">↳ Intelligent Model Cluster Routing</div>
                <div className="text-amber-300 pl-16">↳ Server-Sent Events (SSE) Stream Completion</div>
              </div>
            </article>

            {/* A4: Getting your key */}
            <article id="getting-your-key" className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4">
              <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                <span>4. How to Get Your API Key</span>
              </h3>
              <ol className="space-y-3 text-sm text-[#44403c] list-decimal list-inside leading-relaxed">
                <li>
                  <strong>Create an Account:</strong> Register at <Link to="/register" className="text-violet-700 underline font-semibold">lightningapi.pro/register</Link>.
                </li>
                <li>
                  <strong>Choose a Plan:</strong> Select a 5-Hour Rolling Window plan, Credit Wallet top-up, or Token Pack.
                </li>
                <li>
                  <strong>Copy Your Key:</strong> Go to <Link to="/dashboard/keys" className="text-violet-700 underline font-semibold">Dashboard → API Keys</Link> and copy your active key.
                </li>
              </ol>
            </article>

            {/* A5: Plan types */}
            <article id="plan-types-overview" className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4">
              <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
                <Layers className="w-5 h-5 text-violet-600" />
                <span>5. Understanding Your Plan Architecture</span>
              </h3>
              <p className="text-sm text-[#44403c] leading-relaxed">
                LightningAPI supports three distinct billing structures so you only pay for what you actually use:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/70 space-y-1.5">
                  <div className="font-bold text-purple-900 text-sm">5-Hour Rolling Window</div>
                  <p className="text-purple-800 leading-relaxed">
                    Designed for heavy coding. Your token allowance automatically regenerates continuously over every 5-hour rolling cycle.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 space-y-1.5">
                  <div className="font-bold text-emerald-900 text-sm">Prepaid Credit Wallet</div>
                  <p className="text-emerald-800 leading-relaxed">
                    Deposit credits (e.g. $15, $35, $75). Credits never expire for 365 days and work across all supported models.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-1.5">
                  <div className="font-bold text-amber-900 text-sm">Consumable Token Packs</div>
                  <p className="text-amber-800 leading-relaxed">
                    Buy high-volume token blocks (10M, 50M, 100M). Ideal for continuous agent runs and automated scripts.
                  </p>
                </div>
              </div>
            </article>

            {/* A6: First request */}
            <article id="first-request" className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4">
              <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
                <Terminal className="w-5 h-5 text-violet-600" />
                <span>6. Your First Successful Request</span>
              </h3>
              <p className="text-sm text-[#44403c] leading-relaxed">
                Copy and paste this command into your terminal to test your key immediately:
              </p>
              <MultiOsCodeBlock
                title="First API Request (Native cURL)"
                tabs={[
                  {
                    label: 'macOS / Linux (cURL)',
                    language: 'bash',
                    code: `curl -X POST "https://lightningapi.pro/v1/messages" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ld_live_your_api_key_here" \\
  -H "anthropic-version: 2023-06-01" \\
  -d '{
    "model": "claude-sonnet-5.5",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "Explain binary search in two sentences."}
    ]
  }'`,
                  },
                  {
                    label: 'Windows (PowerShell)',
                    language: 'powershell',
                    code: `$headers = @{
  "Content-Type" = "application/json"
  "x-api-key" = "ld_live_your_api_key_here"
  "anthropic-version" = "2023-06-01"
}
$body = @{
  model = "claude-sonnet-5.5"
  max_tokens = 1024
  messages = @(
    @{ role = "user"; content = "Explain binary search in two sentences." }
  )
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://lightningapi.pro/v1/messages" -Method Post -Headers $headers -Body $body`,
                  },
                ]}
              />
            </article>

            {/* A7: Check key status */}
            <article id="check-key-status" className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4">
              <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-violet-600" />
                <span>7. Checking Your Key Status & Live Consumption</span>
              </h3>
              <p className="text-sm text-[#44403c] leading-relaxed">
                You can inspect your remaining tokens, active rolling quota, and recent request activity at any time using our dedicated verification tool:
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to="/check-key"
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Open Verify Key Tool</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <span className="text-xs text-[#78716c] font-mono">lightningapi.pro/check-key</span>
              </div>
            </article>
          </section>

          {/* ============================================================== */}
          {/* CHAPTER B: QUICK SETUP */}
          {/* ============================================================== */}
          <section id="sec-quick-setup" className="space-y-8 pt-4">
            <div className="border-b border-[#ede8e1] pb-3">
              <span className="text-xs font-bold text-violet-700 uppercase tracking-widest font-mono">
                Section B
              </span>
              <h2 className="text-2xl font-bold text-[#1c1917] tracking-tight">
                Quick Setup by Operating System
              </h2>
            </div>

            {/* B1: Windows Setup */}
            <article id="windows-setup" className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4">
              <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
                <Laptop className="w-5 h-5 text-blue-600" />
                <span>1. Windows Setup (PowerShell & Command Prompt)</span>
              </h3>
              <p className="text-sm text-[#44403c] leading-relaxed">
                On Windows, configure persistent environment variables so all terminal sessions and applications recognize your LightningAPI key:
              </p>
              <MultiOsCodeBlock
                title="Windows Environment Variable Setup"
                tabs={[
                  {
                    label: 'PowerShell (Current User)',
                    language: 'powershell',
                    code: `[Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", "https://lightningapi.pro", "User")
[Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", "ld_live_your_api_key_here", "User")
[Environment]::SetEnvironmentVariable("OPENAI_BASE_URL", "https://lightningapi.pro/v1", "User")
[Environment]::SetEnvironmentVariable("OPENAI_API_KEY", "ld_live_your_api_key_here", "User")
Write-Host "Configuration saved to Windows User Environment!" -ForegroundColor Green`,
                  },
                  {
                    label: 'PowerShell (Session Only)',
                    language: 'powershell',
                    code: `$env:ANTHROPIC_BASE_URL = "https://lightningapi.pro"
$env:ANTHROPIC_AUTH_TOKEN = "ld_live_your_api_key_here"
$env:OPENAI_BASE_URL = "https://lightningapi.pro/v1"
$env:OPENAI_API_KEY = "ld_live_your_api_key_here"`,
                  },
                ]}
              />
            </article>

            {/* B2: macOS Setup */}
            <article id="macos-setup" className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4">
              <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
                <Laptop className="w-5 h-5 text-violet-600" />
                <span>2. macOS Setup (Terminal / Zsh)</span>
              </h3>
              <p className="text-sm text-[#44403c] leading-relaxed">
                On macOS (default Zsh shell), add your environment variables to <code className="font-mono text-xs bg-stone-100 px-1 py-0.5 rounded">~/.zshrc</code>:
              </p>
              <MultiOsCodeBlock
                title="macOS Persistent Setup (~/.zshrc)"
                tabs={[
                  {
                    label: 'macOS Zsh (~/.zshrc)',
                    language: 'bash',
                    code: `echo 'export ANTHROPIC_BASE_URL="https://lightningapi.pro"' >> ~/.zshrc
echo 'export ANTHROPIC_AUTH_TOKEN="ld_live_your_api_key_here"' >> ~/.zshrc
echo 'export OPENAI_BASE_URL="https://lightningapi.pro/v1"' >> ~/.zshrc
echo 'export OPENAI_API_KEY="ld_live_your_api_key_here"' >> ~/.zshrc
source ~/.zshrc`,
                  },
                ]}
              />
            </article>

            {/* B3: Linux Setup */}
            <article id="linux-setup" className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4">
              <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-600" />
                <span>3. Linux Setup (Ubuntu / Debian / Fedora)</span>
              </h3>
              <MultiOsCodeBlock
                title="Linux Persistent Setup (~/.bashrc)"
                tabs={[
                  {
                    label: 'Linux Bash (~/.bashrc)',
                    language: 'bash',
                    code: `echo 'export ANTHROPIC_BASE_URL="https://lightningapi.pro"' >> ~/.bashrc
echo 'export ANTHROPIC_AUTH_TOKEN="ld_live_your_api_key_here"' >> ~/.bashrc
source ~/.bashrc`,
                  },
                ]}
              />
            </article>

            {/* B4: Automatic setup */}
            <article id="automatic-setup" className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4">
              <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                <span>4. Automatic Setup (1-Command CLI Installer)</span>
              </h3>
              <p className="text-sm text-[#44403c] leading-relaxed">
                LightningAPI provides a one-command interactive setup tool that detects your installed AI editors, creates backups, and configures everything automatically:
              </p>
              <MultiOsCodeBlock
                title="1-Command CLI Installer"
                tabs={[
                  {
                    label: 'Universal NPX',
                    language: 'bash',
                    code: `npx lightningdeals`,
                  },
                  {
                    label: 'macOS / Linux Shell',
                    language: 'bash',
                    code: `curl -fsSL https://lightningapi.pro/setup.sh | bash`,
                  },
                  {
                    label: 'Windows PowerShell',
                    language: 'powershell',
                    code: `irm https://lightningapi.pro/setup.ps1 | iex`,
                  },
                ]}
              />
            </article>
          </section>

          {/* ============================================================== */}
          {/* CHAPTER C: CONNECT YOUR APPLICATION (DETAILED GUIDES) */}
          {/* ============================================================== */}
          <section id="sec-connect-apps" className="space-y-8 pt-4">
            <div className="border-b border-[#ede8e1] pb-3">
              <span className="text-xs font-bold text-violet-700 uppercase tracking-widest font-mono">
                Section C
              </span>
              <h2 className="text-2xl font-bold text-[#1c1917] tracking-tight">
                Connect Your Application (14+ Verified Guides)
              </h2>
            </div>

            {/* C1: Claude Code */}
            <article id="guide-claude-code" className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-violet-600" />
                  <span>1. Claude Code CLI</span>
                </h3>
                <span className="text-[10px] font-bold font-mono bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full">
                  Native Anthropic Protocol
                </span>
              </div>
              <p className="text-sm text-[#44403c] leading-relaxed">
                Claude Code is Anthropic's agentic command-line assistant. Configure your settings file or terminal environment to route requests through LightningAPI:
              </p>
              <div className="text-xs font-mono text-[#78716c] bg-stone-100 p-2.5 rounded-xl border border-stone-200">
                Configuration File: <strong>~/.claude/settings.json</strong> (macOS/Linux) or <strong>%USERPROFILE%\.claude\settings.json</strong> (Windows)
              </div>
              <MultiOsCodeBlock
                filename="~/.claude/settings.json"
                tabs={[
                  {
                    label: 'Configuration JSON',
                    language: 'json',
                    code: `{
  "env": {
    "ANTHROPIC_BASE_URL": "https://lightningapi.pro",
    "ANTHROPIC_AUTH_TOKEN": "ld_live_your_api_key_here",
    "ANTHROPIC_MODEL": "claude-sonnet-5.5",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-5.5",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-5.5",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "claude-haiku-5.5"
  },
  "model": "claude-sonnet-5.5"
}`,
                  },
                ]}
              />
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Verify by running <code className="font-mono font-bold">claude</code> in your terminal.</span>
              </div>
            </article>

            {/* C2: Cursor IDE */}
            <article id="guide-cursor" className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-violet-600" />
                  <span>2. Cursor IDE</span>
                </h3>
                <span className="text-[10px] font-bold font-mono bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
                  Anthropic & OpenAI Compatible
                </span>
              </div>
              <p className="text-sm text-[#44403c] leading-relaxed">
                In Cursor, open Settings (<kbd className="px-1.5 py-0.5 rounded bg-stone-100 border text-[11px] font-mono">Ctrl+,</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-stone-100 border text-[11px] font-mono">Cmd+,</kbd>) → Models:
              </p>
              <ul className="list-disc list-inside text-xs text-[#44403c] space-y-1.5">
                <li>Toggle on <strong>"Override Anthropic Base URL"</strong> and enter: <code className="font-mono font-bold text-violet-700">https://lightningapi.pro</code></li>
                <li>Enter your LightningAPI key in <strong>Anthropic API Key</strong>: <code className="font-mono font-bold text-violet-700">ld_live_...</code></li>
                <li>Add Model Name: <code className="font-mono font-bold text-violet-700">claude-sonnet-5.5</code> or <code className="font-mono font-bold text-violet-700">claude-opus-5.5</code></li>
              </ul>
              <MultiOsCodeBlock
                filename="settings.json (Cursor User Settings)"
                tabs={[
                  {
                    label: 'Cursor settings.json',
                    language: 'json',
                    code: `{
  "cursor.cpp.overrideAnthropicApiKey": "ld_live_your_api_key_here",
  "cursor.cpp.anthropicBaseUrl": "https://lightningapi.pro",
  "cursor.general.model": "claude-sonnet-5.5"
}`,
                  },
                ]}
              />
            </article>

            {/* C3: Codex */}
            <article id="guide-codex" className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-blue-600" />
                  <span>3. Codex CLI</span>
                </h3>
                <span className="text-[10px] font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                  OpenAI Compatible (/v1)
                </span>
              </div>
              <p className="text-sm text-[#44403c] leading-relaxed">
                Codex connects via OpenAI compatibility mode. Set your environment variables:
              </p>
              <MultiOsCodeBlock
                tabs={[
                  {
                    label: 'macOS / Linux',
                    language: 'bash',
                    code: `export OPENAI_BASE_URL="https://lightningapi.pro/v1"
export OPENAI_API_KEY="ld_live_your_api_key_here"
codex "Create a React modal component"`,
                  },
                  {
                    label: 'Windows PowerShell',
                    language: 'powershell',
                    code: `$env:OPENAI_BASE_URL="https://lightningapi.pro/v1"
$env:OPENAI_API_KEY="ld_live_your_api_key_here"
codex "Create a React modal component"`,
                  },
                ]}
              />
            </article>

            {/* C4: Cline & Roo Code */}
            <article id="guide-cline" className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-purple-600" />
                  <span>4. Cline & Roo Code (VS Code Autonomous Coding)</span>
                </h3>
                <span className="text-[10px] font-bold font-mono bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
                  Autonomous Agent
                </span>
              </div>
              <p className="text-sm text-[#44403c] leading-relaxed">
                In VS Code, install the Cline or Roo Code extension. Open extension settings:
              </p>
              <ul className="list-disc list-inside text-xs text-[#44403c] space-y-1.5">
                <li>API Provider: <strong>Anthropic</strong></li>
                <li>Base URL: <code className="font-mono font-bold text-violet-700">https://lightningapi.pro</code></li>
                <li>API Key: <code className="font-mono font-bold text-violet-700">ld_live_your_api_key_here</code></li>
                <li>Model ID: <code className="font-mono font-bold text-violet-700">claude-sonnet-5.5</code></li>
              </ul>
            </article>

            {/* C5: Continue.dev */}
            <article id="guide-continue" className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4">
              <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
                <FileCode className="w-5 h-5 text-violet-600" />
                <span>5. Continue.dev</span>
              </h3>
              <p className="text-sm text-[#44403c] leading-relaxed">
                Add this model definition to your <code className="font-mono text-xs bg-stone-100 px-1 py-0.5 rounded">~/.continue/config.json</code>:
              </p>
              <MultiOsCodeBlock
                filename="~/.continue/config.json"
                tabs={[
                  {
                    label: 'config.json',
                    language: 'json',
                    code: `{
  "models": [
    {
      "title": "Claude Sonnet 5.5 (LightningAPI)",
      "provider": "anthropic",
      "model": "claude-sonnet-5.5",
      "apiKey": "ld_live_your_api_key_here",
      "apiBase": "https://lightningapi.pro"
    }
  ]
}`,
                  },
                ]}
              />
            </article>
          </section>

          {/* ============================================================== */}
          {/* CHAPTER D: MODELS & PROVIDERS */}
          {/* ============================================================== */}
          <section id="sec-models" className="scroll-mt-24 space-y-8 pt-4">
            <div className="border-b border-[#ede8e1] pb-3">
              <span className="text-xs font-bold text-violet-700 uppercase tracking-widest font-mono">
                Section D
              </span>
              <h2 className="text-2xl font-bold text-[#1c1917] tracking-tight">
                Models & Providers
              </h2>
            </div>

            <article id="models-claude" className="bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4">
              <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
                <Cpu className="w-5 h-5 text-violet-600" />
                <span>Showcase Frontier Models Catalog</span>
              </h3>
              <p className="text-sm text-[#44403c] leading-relaxed">
                LightningAPI routes to leading frontier intelligence clusters. Use the exact technical model IDs in your configuration:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#ede8e1] bg-[#faf8f5] text-[10px] font-bold uppercase text-[#78716c]">
                      <th className="py-2.5 px-3">Technical Model ID</th>
                      <th className="py-2.5 px-3">Display Name</th>
                      <th className="py-2.5 px-3">Provider</th>
                      <th className="py-2.5 px-3">Context Window</th>
                      <th className="py-2.5 px-3">Vision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ede8e1]">
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-violet-700">claude-sonnet-5.5</td>
                      <td className="py-2.5 px-3 font-sans text-[#1c1917]">Claude Sonnet 5.5</td>
                      <td className="py-2.5 px-3 text-[#78716c]">Anthropic</td>
                      <td className="py-2.5 px-3">1,000,000</td>
                      <td className="py-2.5 px-3 text-emerald-600 font-bold">Yes</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-violet-700">claude-opus-5.5</td>
                      <td className="py-2.5 px-3 font-sans text-[#1c1917]">Claude Opus 5.5</td>
                      <td className="py-2.5 px-3 text-[#78716c]">Anthropic</td>
                      <td className="py-2.5 px-3">1,000,000</td>
                      <td className="py-2.5 px-3 text-emerald-600 font-bold">Yes</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-violet-700">claude-fable-5</td>
                      <td className="py-2.5 px-3 font-sans text-[#1c1917]">Claude Fable 5</td>
                      <td className="py-2.5 px-3 text-[#78716c]">Anthropic</td>
                      <td className="py-2.5 px-3">1,000,000</td>
                      <td className="py-2.5 px-3 text-emerald-600 font-bold">Yes</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-violet-700">claude-haiku-5.5</td>
                      <td className="py-2.5 px-3 font-sans text-[#1c1917]">Claude Haiku 5.5</td>
                      <td className="py-2.5 px-3 text-[#78716c]">Anthropic</td>
                      <td className="py-2.5 px-3">500,000</td>
                      <td className="py-2.5 px-3 text-emerald-600 font-bold">Yes</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-blue-700">gpt-4o</td>
                      <td className="py-2.5 px-3 font-sans text-[#1c1917]">GPT-4o</td>
                      <td className="py-2.5 px-3 text-[#78716c]">OpenAI</td>
                      <td className="py-2.5 px-3">128,000</td>
                      <td className="py-2.5 px-3 text-emerald-600 font-bold">Yes</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-emerald-700">gemini-4-argon</td>
                      <td className="py-2.5 px-3 font-sans text-[#1c1917]">Gemini 4 Argon</td>
                      <td className="py-2.5 px-3 text-[#78716c]">Google</td>
                      <td className="py-2.5 px-3">1,000,000</td>
                      <td className="py-2.5 px-3 text-emerald-600 font-bold">Yes</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </article>
          </section>

          {/* ============================================================== */}
          {/* CHAPTER E: API REFERENCE */}
          {/* ============================================================== */}
          <section id="sec-api-reference" className="scroll-mt-24 space-y-8 pt-4">
            <div className="border-b border-[#ede8e1] pb-3">
              <span className="text-xs font-bold text-violet-700 uppercase tracking-widest font-mono">
                Section E
              </span>
              <h2 className="text-2xl font-bold text-[#1c1917] tracking-tight">
                API Reference Specification
              </h2>
            </div>

            {/* E1: Base URLs */}
            <article id="api-base-urls" className="bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4">
              <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
                <Globe className="w-5 h-5 text-violet-600" />
                <span>Base URLs & Protocols</span>
              </h3>
              <p className="text-sm text-[#44403c] leading-relaxed">
                LightningAPI hosts dual protocol endpoints. Choose based on your SDK or tool:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] space-y-1.5">
                  <div className="text-xs font-bold text-violet-700 font-sans">Anthropic Native Base URL</div>
                  <div className="font-bold text-[#1c1917] select-all">https://lightningapi.pro</div>
                  <p className="text-[11px] text-[#78716c] font-sans">Used for Claude Code, Cursor Anthropic mode, and @anthropic-ai/sdk.</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] space-y-1.5">
                  <div className="text-xs font-bold text-blue-700 font-sans">OpenAI Compatible Base URL</div>
                  <div className="font-bold text-[#1c1917] select-all">https://lightningapi.pro/v1</div>
                  <p className="text-[11px] text-[#78716c] font-sans">Used for Codex, Windsurf, LangChain, and openai official SDKs.</p>
                </div>
              </div>
            </article>

            {/* E2: Messages Endpoint */}
            <article id="api-messages" className="bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-violet-100 text-violet-800 font-mono text-xs font-bold">POST</span>
                  <span>/v1/messages</span>
                </h3>
                <span className="text-xs text-[#78716c] font-mono">Native Anthropic Protocol</span>
              </div>
              <p className="text-sm text-[#44403c] leading-relaxed">
                Sends a structured message sequence to Claude Frontier models with streaming, tool execution, and vision support.
              </p>
              <MultiOsCodeBlock
                title="POST /v1/messages Example"
                tabs={[
                  {
                    label: 'cURL',
                    language: 'bash',
                    code: `curl -X POST "https://lightningapi.pro/v1/messages" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ld_live_your_api_key_here" \\
  -H "anthropic-version: 2023-06-01" \\
  -d '{
    "model": "claude-sonnet-5.5",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "Explain microservices in two sentences."}
    ]
  }'`,
                  },
                  {
                    label: 'Python (anthropic SDK)',
                    language: 'python',
                    code: `from anthropic import Anthropic

client = Anthropic(
    base_url="https://lightningapi.pro",
    api_key="ld_live_your_api_key_here"
)

response = client.messages.create(
    model="claude-sonnet-5.5",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Explain microservices in two sentences."}]
)
print(response.content[0].text)`,
                  },
                  {
                    label: 'Node.js (@anthropic-ai/sdk)',
                    language: 'typescript',
                    code: `import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  baseURL: 'https://lightningapi.pro',
  apiKey: 'ld_live_your_api_key_here',
});

const response = await client.messages.create({
  model: 'claude-sonnet-5.5',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Explain microservices in two sentences.' }],
});
console.log(response.content[0].text);`,
                  },
                ]}
              />
            </article>

            {/* E3: Chat Completions Endpoint */}
            <article id="api-chat-completions" className="bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 font-mono text-xs font-bold">POST</span>
                  <span>/v1/chat/completions</span>
                </h3>
                <span className="text-xs text-[#78716c] font-mono">OpenAI Compatible Protocol</span>
              </div>
              <MultiOsCodeBlock
                title="POST /v1/chat/completions Example"
                tabs={[
                  {
                    label: 'cURL',
                    language: 'bash',
                    code: `curl -X POST "https://lightningapi.pro/v1/chat/completions" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ld_live_your_api_key_here" \\
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "Explain idempotent API design."}
    ]
  }'`,
                  },
                  {
                    label: 'Python (openai SDK)',
                    language: 'python',
                    code: `from openai import OpenAI

client = OpenAI(
    base_url="https://lightningapi.pro/v1",
    api_key="ld_live_your_api_key_here"
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Explain idempotent API design."}]
)
print(response.choices[0].message.content)`,
                  },
                ]}
              />
            </article>
          </section>

          {/* ============================================================== */}
          {/* CHAPTER F: USAGE & BILLING */}
          {/* ============================================================== */}
          <section id="sec-usage-billing" className="scroll-mt-24 space-y-8 pt-4">
            <div className="border-b border-[#ede8e1] pb-3">
              <span className="text-xs font-bold text-violet-700 uppercase tracking-widest font-mono">
                Section F
              </span>
              <h2 className="text-2xl font-bold text-[#1c1917] tracking-tight">
                Usage, Billing & Quotas
              </h2>
            </div>

            <article id="billing-architectures" className="bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4">
              <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
                <Layers className="w-5 h-5 text-violet-600" />
                <span>The Six Billing Architectures Explained</span>
              </h3>
              <p className="text-sm text-[#44403c] leading-relaxed">
                LightningAPI routes all requests through immutable ledger accounting. Depending on your purchase, your key operates under one of these models:
              </p>
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#ede8e1]">
                  <span className="font-bold text-[#1c1917]">1. Claude Max (5-Hour Rolling Window):</span>
                  <span className="text-[#64607d] ml-1">Tokens continuously replenish every minute as older usage rolls past the 5-hour boundary.</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#ede8e1]">
                  <span className="font-bold text-[#1c1917]">2. OpenAI (5-Hour Rolling Window):</span>
                  <span className="text-[#64607d] ml-1">Rolling window access dedicated to OpenAI Frontier workloads.</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#ede8e1]">
                  <span className="font-bold text-[#1c1917]">3. Prepaid Credit Wallet:</span>
                  <span className="text-[#64607d] ml-1">USD balance valid for 365 days across all models. Top up anytime.</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#ede8e1]">
                  <span className="font-bold text-[#1c1917]">4. Consumable Token Packs (Claude / OpenAI / Local):</span>
                  <span className="text-[#64607d] ml-1">Bulk token blocks with zero time pressure.</span>
                </div>
              </div>
            </article>
          </section>

          {/* ============================================================== */}
          {/* CHAPTER G: TROUBLESHOOTING */}
          {/* ============================================================== */}
          <section id="sec-troubleshooting" className="scroll-mt-24 space-y-8 pt-4">
            <div className="border-b border-[#ede8e1] pb-3">
              <span className="text-xs font-bold text-violet-700 uppercase tracking-widest font-mono">
                Section G
              </span>
              <h2 className="text-2xl font-bold text-[#1c1917] tracking-tight">
                Troubleshooting & Error Library
              </h2>
            </div>

            <article id="troubleshooting-intro" className="bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4">
              <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Common Error Codes & Verified Solutions</span>
              </h3>
              <p className="text-sm text-[#44403c] leading-relaxed">
                If your tool encounters an error, use this reference to diagnose the exact cause immediately:
              </p>

              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
                  <div className="font-bold text-amber-950 font-mono">HTTP 429 — 5-Hour Rolling Allowance Reached</div>
                  <p className="text-amber-900 leading-relaxed">
                    <strong>Cause:</strong> Your active token allowance has been consumed for the current 5-hour rolling cycle.
                  </p>
                  <p className="text-amber-800 leading-relaxed">
                    <strong>Fix:</strong> Wait for window regeneration (allowance restores continuously) or add a Pay-As-You-Go Credit pack on the Plans page to continue immediately without waiting.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1">
                  <div className="font-bold text-rose-950 font-mono">HTTP 402 — Credit Wallet Depleted ($0.00 Remaining)</div>
                  <p className="text-rose-900 leading-relaxed">
                    <strong>Cause:</strong> Your credit balance has reached $0.00.
                  </p>
                  <p className="text-rose-800 leading-relaxed">
                    <strong>Fix:</strong> Recharge your credit balance from the Plans page. Your key resumes instantly without editing your editor settings.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-1">
                  <div className="font-bold text-purple-950 font-mono">HTTP 403 — Model Not Permitted on Current Plan</div>
                  <p className="text-purple-900 leading-relaxed">
                    <strong>Cause:</strong> The requested model is not authorized for your key's provisioned plan.
                  </p>
                  <p className="text-purple-800 leading-relaxed">
                    <strong>Fix:</strong> In your editor settings, switch your model to one supported by your plan (e.g. Claude Sonnet 5.5 or GPT-4o), or upgrade to Universal access.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-1">
                  <div className="font-bold text-sky-950 font-mono">HTTP 500 / 503 — Temporary Cluster Congestion</div>
                  <p className="text-sky-900 leading-relaxed">
                    <strong>Cause:</strong> Transient cluster traffic surge or network timeout.
                  </p>
                  <p className="text-sky-800 leading-relaxed">
                    <strong>Fix:</strong> Retry in 3 to 5 seconds. Zero tokens are charged for failed attempts.
                  </p>
                </div>
              </div>
            </article>
          </section>

          {/* ============================================================== */}
          {/* CHAPTER H: SECURITY & SUPPORT */}
          {/* ============================================================== */}
          <section id="sec-security-support" className="scroll-mt-24 space-y-8 pt-4 pb-12">
            <div className="border-b border-[#ede8e1] pb-3">
              <span className="text-xs font-bold text-violet-700 uppercase tracking-widest font-mono">
                Section H
              </span>
              <h2 className="text-2xl font-bold text-[#1c1917] tracking-tight">
                Security & Support
              </h2>
            </div>

            <article id="key-security" className="bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4">
              <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>API Key Hygiene & Security Standards</span>
              </h3>
              <ul className="list-disc list-inside text-sm text-[#44403c] space-y-2 leading-relaxed">
                <li>Never commit keys to public GitHub or GitLab repositories.</li>
                <li>Store keys in local <code className="font-mono text-xs bg-stone-100 px-1 py-0.5 rounded">.env</code> files and add them to your <code className="font-mono text-xs bg-stone-100 px-1 py-0.5 rounded">.gitignore</code>.</li>
                <li>If you suspect your key was compromised, immediately revoke it in your Customer Dashboard and generate a fresh key.</li>
              </ul>
            </article>

            <article id="contact-support" className="bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4">
              <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-violet-600" />
                <span>Engineering & Account Support</span>
              </h3>
              <p className="text-sm text-[#44403c] leading-relaxed">
                Our engineering team is available 24/7. Reach out via email or submit a ticket from your dashboard:
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="mailto:support@lightningapi.pro"
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  Email support@lightningapi.pro
                </a>
                <Link
                  to="/check-key"
                  className="px-4 py-2 rounded-xl border border-[#ede8e1] bg-white hover:bg-stone-50 text-[#1c1917] font-bold text-xs transition-colors"
                >
                  Verify Key Status
                </Link>
              </div>
            </article>
          </section>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
};

export default DocsPage;
