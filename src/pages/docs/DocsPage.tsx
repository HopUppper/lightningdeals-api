import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Terminal,
  Globe,
  Cpu,
  Wrench,
  LifeBuoy,
  Copy,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Layers,
  Sparkles,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { SiteHeader } from '../../components/SiteHeader';
import { SiteFooter } from '../../components/SiteFooter';
import { DocSearchModal } from '../../components/docs/DocSearchModal';
import { DocsSectionA } from '../../components/docs/sections/DocsSectionA';
import { DocsSectionB } from '../../components/docs/sections/DocsSectionB';
import { DocsSectionC } from '../../components/docs/sections/DocsSectionC';
import { DocsSectionD } from '../../components/docs/sections/DocsSectionD';
import { DocsSectionE } from '../../components/docs/sections/DocsSectionE';
import { DocsSectionF } from '../../components/docs/sections/DocsSectionF';
import { DocsSectionG } from '../../components/docs/sections/DocsSectionG';
import { DocsSectionH } from '../../components/docs/sections/DocsSectionH';

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
  const [activeCategory, setActiveCategory] = useState('sec-getting-started');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'sec-getting-started': true,
    'sec-quick-setup': true,
    'sec-connect-apps': true,
    'sec-models': true,
    'sec-api-reference': true,
    'sec-usage-billing': true,
    'sec-troubleshooting': true,
    'sec-security-support': true,
  });
  const [copiedNpx, setCopiedNpx] = useState(false);

  const isManualScrollingRef = useRef(false);
  const manualScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopyNpx = () => {
    navigator.clipboard.writeText('npx lightningdeals');
    setCopiedNpx(true);
    setTimeout(() => setCopiedNpx(false), 2000);
  };

  const toggleSectionExpand = (secId: string) => {
    setExpandedSections((prev) => ({ ...prev, [secId]: !prev[secId] }));
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const parentSec = SIDEBAR_NAV.find((sec) => sec.items.some((item) => item.id === id));
    if (parentSec) {
      setActiveCategory(parentSec.id);
      setExpandedSections((prev) => ({ ...prev, [parentSec.id]: true }));
    }

    setMobileMenuOpen(false);
    isManualScrollingRef.current = true;

    if (manualScrollTimerRef.current) {
      clearTimeout(manualScrollTimerRef.current);
    }

    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    manualScrollTimerRef.current = setTimeout(() => {
      window.history.replaceState(null, '', `#${id}`);
      isManualScrollingRef.current = false;
    }, 700);
  };

  // ScrollSpy listener: track active section and category on scroll
  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (isManualScrollingRef.current) return;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const allItemIds: string[] = [];
          SIDEBAR_NAV.forEach((sec) => {
            sec.items.forEach((item) => allItemIds.push(item.id));
          });

          // Offset from viewport top to trigger active state
          const scrollPosition = window.scrollY + 130;

          let currentActiveId = allItemIds[0];
          for (let i = 0; i < allItemIds.length; i++) {
            const el = document.getElementById(allItemIds[i]);
            if (el) {
              const top = el.offsetTop;
              if (scrollPosition >= top) {
                currentActiveId = allItemIds[i];
              }
            }
          }

          if (currentActiveId) {
            setActiveSection(currentActiveId);
            const parentSec = SIDEBAR_NAV.find((sec) =>
              sec.items.some((item) => item.id === currentActiveId)
            );
            if (parentSec) {
              setActiveCategory(parentSec.id);
              // Ensure the active category is expanded in the sidebar
              setExpandedSections((prev) =>
                prev[parentSec.id] ? prev : { ...prev, [parentSec.id]: true }
              );
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // Run initially
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Bring active category into view within sidebar
  useEffect(() => {
    if (activeCategory) {
      const navEl = document.getElementById('nav-' + activeCategory);
      if (navEl) {
        navEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [activeCategory]);

  // Handle URL hash on initial load
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
      } else if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
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
              onClick={() => scrollToSection('api-base-urls')}
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
                  Full API specifications, cURL, Python &amp; Node.js code snippets, endpoints, and streaming.
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
            <ChevronDown
              className={`w-4 h-4 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`}
            />
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
              const isCategoryActive = activeCategory === sec.id;
              const SecIcon = sec.icon;

              return (
                <div
                  key={sec.id}
                  id={'nav-' + sec.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-2xs ${
                    isCategoryActive
                      ? 'border-violet-400 ring-2 ring-violet-500/20 bg-white'
                      : 'border-[#ede8e1] bg-white'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSectionExpand(sec.id)}
                    className={`w-full p-3 flex items-center justify-between transition-colors cursor-pointer text-left ${
                      isCategoryActive
                        ? 'bg-violet-50/80 text-violet-950 font-bold'
                        : 'bg-[#faf8f5] hover:bg-stone-100/60 text-[#1c1917]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <SecIcon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isCategoryActive ? 'text-violet-600' : 'text-[#78716c]'
                        }`}
                      />
                      <span
                        className={`text-[11px] tracking-wider uppercase font-mono truncate ${
                          isCategoryActive
                            ? 'font-extrabold text-violet-900'
                            : 'font-bold text-[#1c1917]'
                        }`}
                      >
                        {sec.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isCategoryActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse" />
                      )}
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${
                          isCategoryActive ? 'text-violet-600' : 'text-[#78716c]'
                        } ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
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
                            className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between ${
                              isActive
                                ? 'bg-violet-600 text-white font-bold shadow-xs'
                                : 'text-[#78716c] hover:text-[#1c1917] hover:bg-[#faf8f5] font-medium'
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
                <span className="text-emerald-400 font-mono text-lg sm:text-xl">
                  npx lightningdeals
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-3xl">
                Skip manual JSON editing! Run{' '}
                <code className="font-mono font-bold text-violet-200 bg-violet-900/60 px-1.5 py-0.5 rounded border border-violet-700/50">
                  npx lightningdeals
                </code>{' '}
                in your terminal or PowerShell. The interactive CLI installer auto-detects your editors (Cursor, Claude Code, Codex, VS Code), creates configuration backups, injects your API key, sets endpoints, and tests connectivity in seconds.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-black/60 border border-zinc-800 backdrop-blur-md relative z-10 font-mono text-xs">
              <div className="flex items-center gap-2 text-zinc-300 overflow-x-auto">
                <span className="text-violet-400 font-bold select-none">$</span>
                <span className="text-emerald-400 font-bold text-sm sm:text-base select-all tracking-wide">
                  npx lightningdeals
                </span>
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

          {/* ALL 8 DOCUMENTATION SECTIONS (EVERY SINGLE ITEM GUARANTEED DEDICATED ARTICLE) */}
          <DocsSectionA />
          <DocsSectionB />
          <DocsSectionC />
          <DocsSectionD />
          <DocsSectionE />
          <DocsSectionF />
          <DocsSectionG />
          <DocsSectionH />
        </main>
      </div>

      <SiteFooter />
    </div>
  );
};

export default DocsPage;
