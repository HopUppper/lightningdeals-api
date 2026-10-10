import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { ElectricNavbar } from '../../components/ElectricNavbar';
import { ElectricFooter } from '../../components/ElectricFooter';

// Copy Button Component
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
    <div className="relative my-3 rounded-xl border border-[#27272a] bg-[#18181b] text-[#f4f4f5] shadow-xs overflow-hidden font-mono text-xs">
      {filename && (
        <div className="flex items-center justify-between border-b border-[#27272a] bg-[#121214] px-4 py-2 text-[11px] text-[#a1a1aa]">
          <span className="flex items-center gap-1.5 font-medium">
            <FileCode className="h-3.5 w-3.5 text-[#a855f7]" />
            {filename}
          </span>
          <span className="uppercase text-[10px] text-[#71717a]">{language}</span>
        </div>
      )}
      <div className="relative p-4 overflow-x-auto">
        <button
          type="button"
          onClick={handleCopy}
          className="absolute right-3 top-3 p-1.5 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] text-[#a1a1aa] hover:text-white transition-colors cursor-pointer"
          title="Copy to clipboard"
          aria-label="Copy to clipboard"
        >
          {copied ? <CheckIcon className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
        <pre className="pr-10 leading-relaxed font-mono">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

export const DocsPage: React.FC = () => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeClientTab, setActiveClientTab] = useState<'claude-code' | 'cursor' | 'windsurf' | 'python' | 'node'>('claude-code');

  const sidebarNav = [
    {
      title: 'GETTING STARTED',
      items: [
        { id: 'overview', label: '1. Overview & Architecture', icon: BookOpen },
        { id: 'quick-start', label: '2. Quick Start Guide', icon: Terminal },
        { id: 'authentication', label: '3. Authentication & Keys', icon: KeyRound },
      ],
    },
    {
      title: 'DEVELOPER SPECIFICATION',
      items: [
        { id: 'api-reference', label: '4. Full API Reference', icon: Globe },
        { id: 'client-config', label: '5. SDK & Client Config', icon: Wrench },
        { id: 'streaming', label: '6. Streaming & SSE Events', icon: Layers },
      ],
    },
    {
      title: 'GATEWAY ENGINE',
      items: [
        { id: 'models', label: '7. Model Catalog & Aliases', icon: Cpu },
        { id: 'quotas', label: '8. 5-Hour Rolling Quotas', icon: RefreshCw },
        { id: 'errors', label: '9. Errors & Troubleshooting', icon: AlertTriangle },
        { id: 'support', label: '10. Support & Diagnostics', icon: LifeBuoy },
      ],
    },
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash) {
      scrollToSection(hash);
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1c1917] flex flex-col font-sans selection:bg-[#6d28d9]/10 selection:text-[#6d28d9]">
      <ElectricNavbar />

      <div className="flex-1 border-b border-[#e7e5e4]">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12">
            
            {/* ------------------------------------------------------------- */}
            {/* SIDEBAR NAVIGATION (DESKTOP)                                  */}
            {/* ------------------------------------------------------------- */}
            <aside className="hidden lg:sticky lg:block lg:h-[calc(100vh-65px)] lg:overflow-y-auto lg:py-10 top-[65px] border-r border-[#e7e5e4] pr-6">
              <div className="mb-6 pb-4 border-b border-[#e7e5e4]">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-[#6d28d9]" />
                  <span className="font-mono text-[11px] font-bold text-[#6d28d9] tracking-wider uppercase">
                    API DOCS v2.4
                  </span>
                </div>
                <p className="text-xs text-[#78716c] mt-1">
                  Anthropic Messages Gateway
                </p>
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
                              className={`-ml-[2px] flex w-full items-center gap-2 border-l-2 py-1.5 pl-3 text-left text-xs transition-colors cursor-pointer ${
                                isActive
                                  ? 'border-[#6d28d9] font-bold text-[#6d28d9] bg-[#f5f3ff]/60'
                                  : 'border-transparent text-[#57534e] hover:border-[#a8a29e] hover:text-[#1c1917]'
                              }`}
                            >
                              <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-[#6d28d9]' : 'text-[#a8a29e]'}`} />
                              <span className="truncate">{item.label}</span>
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
                  <span>Claim 1M Free Trial</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#6d28d9]" />
                </Link>
                <Link
                  to="/check-key"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#e7e5e4] shadow-xs text-xs font-medium text-[#57534e] hover:text-[#1c1917] transition-colors"
                >
                  <span>Verify Key Balance</span>
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
                  className="flex w-full items-center justify-between border border-[#e7e5e4] bg-white px-3.5 py-2 text-left rounded-xl shadow-xs"
                  type="button"
                >
                  <span className="flex items-center gap-2">
                    <List className="h-4 w-4 text-[#6d28d9]" />
                    <span className="font-mono text-[10px] uppercase font-bold text-[#78716c]">DOCS INDEX:</span>
                    <span className="truncate text-xs font-bold text-[#1c1917] capitalize">{activeSection.replace('-', ' ')}</span>
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
                              className="text-left text-xs py-1.5 px-2 hover:bg-[#faf8f5] rounded-lg text-[#1c1917]"
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
              <section id="overview" className="mb-16 scroll-mt-24 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e7e5e4] shadow-xs text-xs font-mono font-medium text-[#57534e]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#6d28d9]" />
                  <span>SECTION 01</span>
                  <span className="text-[#d6d3d1]">·</span>
                  <span className="text-[#6d28d9] font-bold">OVERVIEW &amp; ARCHITECTURE</span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#1c1917]">
                  Developer Documentation &amp; Gateway Specification
                </h1>

                <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed max-w-3xl">
                  LightningAPI.pro provides a drop-in API gateway implementing the official Anthropic Messages specification. It connects agentic developer environments (Claude Code CLI, Cursor Composer, Windsurf Cascade, and custom microservices) to cutting-edge Claude models with continuous 5-hour rolling token renewal.
                </p>

                {/* Architecture Highlights Grid */}
                <div className="grid sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-4 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-[#6d28d9]" />
                      <span className="text-xs font-bold text-[#1c1917]">Drop-in Messages API</span>
                    </div>
                    <p className="text-[11px] text-[#57534e] leading-relaxed">
                      Matches Anthropic <code className="font-mono text-[#1c1917]">/v1/messages</code> payloads, streaming chunks, tool uses, and thinking tokens.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-1.5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-bold text-[#1c1917]">Zero Prompt Logging SLA</span>
                    </div>
                    <p className="text-[11px] text-[#57534e] leading-relaxed">
                      Prompts and code stream exclusively through transient volatile server RAM via TLS 1.3 without disk persistence or AI training.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-1.5">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-amber-600" />
                      <span className="text-xs font-bold text-[#1c1917]">5-Hour Rolling Window</span>
                    </div>
                    <p className="text-[11px] text-[#57534e] leading-relaxed">
                      Continuous replenishment engine. Consumed tokens roll off precisely 5 hours after generation, eliminating calendar-month cliffs.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#f5f3ff] border border-[#ddd6fe] text-xs text-[#5b21b6] flex items-start gap-3">
                  <span className="font-bold text-sm">💡</span>
                  <div>
                    <strong className="font-bold">Base URL Protocol Rule:</strong> In standard Anthropic SDKs (Python, TypeScript, and Claude Code), the library automatically appends <code className="font-mono bg-white px-1 py-0.5 rounded border border-[#c4b5fd]">/v1/messages</code> to your base URL. Therefore, set your base URL to <code className="font-mono font-bold bg-white px-1 py-0.5 rounded border border-[#c4b5fd]">https://lightningapi.pro</code> (without trailing <code className="font-mono">/v1</code>).
                  </div>
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
                  First Request in Under 60 Seconds
                </h2>

                <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed">
                  Connect your terminal, script, or editor directly to the gateway using any of the verified methods below.
                </p>

                {/* Step 1: Automated Shell Setup */}
                <div className="space-y-2">
                  <h3 className="text-xs sm:text-sm font-bold text-[#1c1917] flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1c1917] text-white text-[10px] font-mono">1</span>
                    Automated Terminal Configuration (macOS, Linux &amp; Windows)
                  </h3>
                  <p className="text-xs text-[#57534e]">
                    Run our official terminal setup script to automatically configure your environment for Claude Code CLI and active shells:
                  </p>
                  
                  <div className="space-y-2">
                    <p className="text-[11px] font-mono font-medium text-[#78716c]">macOS &amp; Linux (Bash / Zsh):</p>
                    <CodeSnippetBlock
                      language="bash"
                      code="curl -fsSL https://lightningapi.pro/setup.sh | bash"
                    />

                    <p className="text-[11px] font-mono font-medium text-[#78716c] pt-2">Windows (PowerShell):</p>
                    <CodeSnippetBlock
                      language="powershell"
                      code="irm https://lightningapi.pro/setup.ps1 | iex"
                    />
                  </div>
                </div>

                {/* Step 2: Minimal cURL Example */}
                <div className="space-y-2 pt-4">
                  <h3 className="text-xs sm:text-sm font-bold text-[#1c1917] flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1c1917] text-white text-[10px] font-mono">2</span>
                    Standard cURL Verification Request
                  </h3>
                  <p className="text-xs text-[#57534e]">
                    Send a test payload directly to <code className="font-mono text-[#1c1917]">https://lightningapi.pro/v1/messages</code> using your API key:
                  </p>

                  <CodeSnippetBlock
                    language="bash"
                    code={`curl https://lightningapi.pro/v1/messages \\
  -H "content-type: application/json" \\
  -H "x-api-key: ld_live_your_api_key_here" \\
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-sonnet-5.5",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "Hello LightningAPI! Confirm connection."}
    ]
  }'`}
                  />
                </div>

                {/* Expected Response Payload */}
                <div className="space-y-2 pt-2">
                  <p className="text-[11px] font-mono font-medium text-[#78716c]">Expected Successful Response (HTTP 200 OK):</p>
                  <CodeSnippetBlock
                    language="json"
                    code={`{
  "id": "msg_01XyZ987AbCdEfGhIjKlMnOp",
  "type": "message",
  "role": "assistant",
  "model": "claude-sonnet-5.5",
  "content": [
    {
      "type": "text",
      "text": "Connection confirmed! LightningAPI.pro gateway is operational and routing to Claude Sonnet 5.5."
    }
  ],
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "usage": {
    "input_tokens": 14,
    "output_tokens": 22
  }
}`}
                  />
                </div>
              </section>

              <hr className="my-10 border-[#e7e5e4]" />

              {/* ----------------------------------------------------------- */}
              {/* SECTION 3: AUTHENTICATION & KEY MANAGEMENT                  */}
              {/* ----------------------------------------------------------- */}
              <section id="authentication" className="mb-16 scroll-mt-24 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e7e5e4] shadow-xs text-xs font-mono font-medium text-[#57534e]">
                  <KeyRound className="h-3.5 w-3.5 text-[#6d28d9]" />
                  <span>SECTION 03</span>
                  <span className="text-[#d6d3d1]">·</span>
                  <span className="text-[#6d28d9] font-bold">AUTHENTICATION &amp; KEYS</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1c1917]">
                  API Key Format &amp; Bearer Authentication
                </h2>

                <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed">
                  Every request sent to LightningAPI.pro must be authenticated using an active API key issued to your account.
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-mono text-[10px] font-bold">LIVE KEY</span>
                      <code className="text-xs font-bold text-[#1c1917]">ld_live_...</code>
                    </div>
                    <p className="text-[11px] text-[#57534e] leading-relaxed">
                      Issued upon purchasing a capacity tier (5x, 20x, 40x, 100x). Has full continuous 5-hour rolling allowance backed by your selected tier.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-mono text-[10px] font-bold">TRIAL KEY</span>
                      <code className="text-xs font-bold text-[#1c1917]">ld_trial_...</code>
                    </div>
                    <p className="text-[11px] text-[#57534e] leading-relaxed">
                      Issued via the free trial onboarding flow. Preloaded with 1,000,000 complimentary tokens for testing integration with Claude Code and Cursor.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h3 className="text-xs sm:text-sm font-bold text-[#1c1917]">Supported Authentication Headers</h3>
                  <p className="text-xs text-[#57534e]">
                    The gateway accepts authentication through either standard Anthropic header or standard RFC 6750 Bearer authorization:
                  </p>

                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-white border border-[#e7e5e4] text-xs font-mono">
                      <span className="text-[#a8a29e]">Standard Header: </span>
                      <strong className="text-[#1c1917]">x-api-key: ld_live_your_token_here</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-[#e7e5e4] text-xs font-mono">
                      <span className="text-[#a8a29e]">Bearer Authorization: </span>
                      <strong className="text-[#1c1917]">Authorization: Bearer ld_live_your_token_here</strong>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#fffbeb] border border-[#fef08a] text-xs text-[#92400e] space-y-1">
                  <strong className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Security Best Practice: Key Custody
                  </strong>
                  <p>
                    Never commit your API key to public git repositories or client-side web browser bundles. Store keys in local environment variables (<code className="font-mono bg-white px-1 py-0.5 rounded">.env.local</code>) or your operating system keychain. If a key is compromised, revoke it immediately via the Customer Portal.
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
                    <span className="text-[11px] font-mono text-[#78716c]">Official Messages Standard</span>
                  </div>

                  <p className="text-xs text-[#57534e] leading-relaxed">
                    Main inference endpoint. Generates a response or streams server-sent events for a conversational context.
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
                          <td className="py-2">Supported model ID (e.g., <code className="font-mono">claude-sonnet-5.5</code>) or short alias.</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono font-bold text-[#1c1917]">messages</td>
                          <td className="py-2 pr-4 font-mono text-purple-700">array</td>
                          <td className="py-2 pr-4 font-bold text-rose-600">Yes</td>
                          <td className="py-2">Array of input message objects with <code className="font-mono">role</code> ("user" | "assistant") and <code className="font-mono">content</code>.</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono font-bold text-[#1c1917]">max_tokens</td>
                          <td className="py-2 pr-4 font-mono text-purple-700">integer</td>
                          <td className="py-2 pr-4 font-bold text-rose-600">Yes</td>
                          <td className="py-2">Maximum number of completion tokens to generate before stopping.</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono font-bold text-[#1c1917]">system</td>
                          <td className="py-2 pr-4 font-mono text-purple-700">string | array</td>
                          <td className="py-2 pr-4 text-[#78716c]">Optional</td>
                          <td className="py-2">System-level instructions directing persona, code style, or constraints.</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono font-bold text-[#1c1917]">stream</td>
                          <td className="py-2 pr-4 font-mono text-purple-700">boolean</td>
                          <td className="py-2 pr-4 text-[#78716c]">Optional</td>
                          <td className="py-2">If true, streams token chunks incrementally via Server-Sent Events (SSE).</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono font-bold text-[#1c1917]">thinking</td>
                          <td className="py-2 pr-4 font-mono text-purple-700">object</td>
                          <td className="py-2 pr-4 text-[#78716c]">Optional</td>
                          <td className="py-2">Extended Thinking control for reasoning models: <code className="font-mono">{"{\"type\": \"enabled\", \"budget_tokens\": 4096}"}</code>.</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono font-bold text-[#1c1917]">tools</td>
                          <td className="py-2 pr-4 font-mono text-purple-700">array</td>
                          <td className="py-2 pr-4 text-[#78716c]">Optional</td>
                          <td className="py-2">Function definitions the model may invoke during execution.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Endpoint 2: GET /v1/models */}
                <div className="p-5 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono text-[11px] font-bold">GET</span>
                      <code className="text-sm font-bold text-[#1c1917]">/v1/models</code>
                    </div>
                    <span className="text-[11px] font-mono text-[#78716c]">Live Model Catalog</span>
                  </div>
                  <p className="text-xs text-[#57534e]">
                    Returns the dynamic machine-readable list of models currently available on the gateway, including context window capacities.
                  </p>
                  <CodeSnippetBlock
                    language="json"
                    code={`{
  "object": "list",
  "data": [
    {
      "id": "claude-opus-5.5",
      "object": "model",
      "created": 1740000000,
      "owned_by": "anthropic",
      "context_window": 1000000
    },
    {
      "id": "claude-sonnet-5.5",
      "object": "model",
      "created": 1740000000,
      "owned_by": "anthropic",
      "context_window": 1000000
    }
  ]
}`}
                  />
                </div>

                {/* Endpoint 3: POST /v1/messages/count_tokens */}
                <div className="p-5 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#6d28d9] text-white font-mono text-[11px] font-bold">POST</span>
                      <code className="text-sm font-bold text-[#1c1917]">/v1/messages/count_tokens</code>
                    </div>
                    <span className="text-[11px] font-mono text-[#78716c]">Token Estimation</span>
                  </div>
                  <p className="text-xs text-[#57534e]">
                    Counts the exact input token cost of a messages payload without executing inference.
                  </p>
                  <CodeSnippetBlock
                    language="json"
                    code={`// Response:
{
  "input_tokens": 128
}`}
                  />
                </div>

                {/* Endpoint 4: GET /api/key-status */}
                <div className="p-5 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono text-[11px] font-bold">GET</span>
                      <code className="text-sm font-bold text-[#1c1917]">/api/key-status</code>
                    </div>
                    <span className="text-[11px] font-mono text-[#78716c]">Live Reservoir Telemetry</span>
                  </div>
                  <p className="text-xs text-[#57534e]">
                    Returns the real-time balance, current 5-hour rolling token usage, total quota, and plan status for the authenticated key.
                  </p>
                  <CodeSnippetBlock
                    language="json"
                    code={`{
  "valid": true,
  "keyPrefix": "ld_live_a1b2...",
  "planName": "MAX",
  "rollingLimit": 120000000,
  "windowUsage": 4350120,
  "remainingInWindow": 115649880,
  "utilizationPercent": 3.63,
  "windowDuration": "5h"
}`}
                  />
                </div>
              </section>

              <hr className="my-10 border-[#e7e5e4]" />

              {/* ----------------------------------------------------------- */}
              {/* SECTION 5: SDK & CLIENT CONFIGURATION                       */}
              {/* ----------------------------------------------------------- */}
              <section id="client-config" className="mb-16 scroll-mt-24 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e7e5e4] shadow-xs text-xs font-mono font-medium text-[#57534e]">
                  <Wrench className="h-3.5 w-3.5 text-[#6d28d9]" />
                  <span>SECTION 05</span>
                  <span className="text-[#d6d3d1]">·</span>
                  <span className="text-[#6d28d9] font-bold">SDK &amp; CLIENT CONFIGURATION</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1c1917]">
                  Connecting Your Development Tools
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
                    { id: 'python', label: 'Python SDK' },
                    { id: 'node', label: 'TypeScript / Node' },
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
                      Claude Code is Anthropic's official terminal agent. Point it to LightningAPI.pro by exporting the standard Anthropic environment variables in your terminal session or <code className="font-mono text-[#1c1917]">~/.zshrc</code> / <code className="font-mono text-[#1c1917]">~/.bashrc</code>:
                    </p>
                    <CodeSnippetBlock
                      language="bash"
                      code={`# Set Base URL to LightningAPI.pro
export ANTHROPIC_BASE_URL="https://lightningapi.pro"

# Set your active LightningAPI key
export ANTHROPIC_API_KEY="ld_live_your_key_here"

# (Optional) Select default model
export ANTHROPIC_MODEL="claude-sonnet-5.5"

# Launch Claude Code agent
claude`}
                    />
                    <p className="text-[11px] text-[#78716c]">
                      *Note: The gateway automatically normalizes Claude Code model hints such as <code className="font-mono text-[#1c1917]">claude-sonnet-5.5[1m]</code> to ensure seamless context window handling.
                    </p>
                  </div>
                )}

                {/* Tab 2: Cursor */}
                {activeClientTab === 'cursor' && (
                  <div className="p-5 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-3 animate-in fade-in">
                    <h3 className="text-sm font-bold text-[#1c1917]">Cursor Composer Configuration</h3>
                    <p className="text-xs text-[#57534e] leading-relaxed">
                      Configure Cursor to route through LightningAPI using the native Anthropic provider settings:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-xs text-[#57534e] pl-1">
                      <li>Open <strong className="text-[#1c1917]">Cursor Settings</strong> (<code className="font-mono">Cmd + ,</code> or <code className="font-mono">Ctrl + ,</code>) &rarr; navigate to <strong className="text-[#1c1917]">Models</strong>.</li>
                      <li>Locate the <strong className="text-[#1c1917]">Anthropic API Key</strong> input.</li>
                      <li>Paste your key (<code className="font-mono text-[#1c1917]">ld_live_your_key_here</code>).</li>
                      <li>Toggle <strong className="text-[#1c1917]">Override Base URL</strong> on and enter: <code className="font-mono font-bold text-[#1c1917]">https://lightningapi.pro</code>.</li>
                      <li>In the model dropdown, ensure <code className="font-mono">claude-sonnet-5.5</code> is enabled.</li>
                    </ol>
                  </div>
                )}

                {/* Tab 3: Windsurf */}
                {activeClientTab === 'windsurf' && (
                  <div className="p-5 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-3 animate-in fade-in">
                    <h3 className="text-sm font-bold text-[#1c1917]">Windsurf Cascade Configuration</h3>
                    <p className="text-xs text-[#57534e] leading-relaxed">
                      Configure Codeium Windsurf Cascade to leverage your 5-hour rolling token capacity:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-xs text-[#57534e] pl-1">
                      <li>Navigate to <strong className="text-[#1c1917]">Windsurf Settings &rarr; AI Providers &rarr; Anthropic</strong>.</li>
                      <li>Enable custom endpoint routing.</li>
                      <li>Set <strong className="text-[#1c1917]">Base URL</strong>: <code className="font-mono font-bold text-[#1c1917]">https://lightningapi.pro</code>.</li>
                      <li>Input your API key (<code className="font-mono text-[#1c1917]">ld_live_your_key_here</code>).</li>
                    </ol>
                  </div>
                )}

                {/* Tab 4: Python */}
                {activeClientTab === 'python' && (
                  <div className="p-5 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-3 animate-in fade-in">
                    <h3 className="text-sm font-bold text-[#1c1917]">Python Official Anthropic SDK</h3>
                    <p className="text-xs text-[#57534e] leading-relaxed">
                      Use the official <code className="font-mono text-[#1c1917]">anthropic</code> Python library without modifications:
                    </p>
                    <CodeSnippetBlock
                      language="python"
                      code={`import os
from anthropic import Anthropic

client = Anthropic(
    api_key=os.environ.get("LIGHTNING_API_KEY", "ld_live_your_key_here"),
    # Point directly to LightningAPI gateway (SDK handles /v1/messages)
    base_url="https://lightningapi.pro",
)

message = client.messages.create(
    model="claude-sonnet-5.5",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Explain raft consensus algorithm succinctly."}
    ]
)

print(message.content[0].text)`}
                    />
                  </div>
                )}

                {/* Tab 5: Node / TypeScript */}
                {activeClientTab === 'node' && (
                  <div className="p-5 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-3 animate-in fade-in">
                    <h3 className="text-sm font-bold text-[#1c1917]">TypeScript &amp; Node.js SDK</h3>
                    <p className="text-xs text-[#57534e] leading-relaxed">
                      Initialize <code className="font-mono text-[#1c1917]">@anthropic-ai/sdk</code> with the custom base URL:
                    </p>
                    <CodeSnippetBlock
                      language="typescript"
                      code={`import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.LIGHTNING_API_KEY || 'ld_live_your_key_here',
  baseURL: 'https://lightningapi.pro',
});

async function run() {
  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-5.5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Generate high-throughput Express proxy' }],
  });

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      process.stdout.write(chunk.delta.text);
    }
  }
}

run();`}
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
                  When <code className="font-mono text-[#1c1917]">"stream": true</code> is specified, the gateway forwards tokens chunk-by-chunk using standard SSE formatting. The connection transmits low-overhead events adhering to the Anthropic lifecycle:
                </p>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-[#e7e5e4] space-y-1">
                    <span className="font-mono font-bold text-[#6d28d9]">event: message_start</span>
                    <p className="text-[11px] text-[#57534e]">Emits initial metadata, message ID, role, and usage initialization.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-[#e7e5e4] space-y-1">
                    <span className="font-mono font-bold text-[#6d28d9]">event: content_block_start</span>
                    <p className="text-[11px] text-[#57534e]">Marks the commencement of a text block or tool use block.</p>
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
              <section id="models" className="mb-16 scroll-mt-24 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e7e5e4] shadow-xs text-xs font-mono font-medium text-[#57534e]">
                  <Cpu className="h-3.5 w-3.5 text-[#6d28d9]" />
                  <span>SECTION 07</span>
                  <span className="text-[#d6d3d1]">·</span>
                  <span className="text-[#6d28d9] font-bold">MODEL CATALOG &amp; ALIASES</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1c1917]">
                  Supported Models &amp; Normalization Routing
                </h2>

                <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed">
                  The table below documents verified models mounted on the gateway database. Upstream requests using convenient short aliases or Claude Code context tags are automatically normalized.
                </p>

                <div className="bg-white rounded-2xl border border-[#e7e5e4] shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans">
                      <thead className="bg-[#fbf9f5] border-b border-[#e7e5e4] text-[#78716c] font-mono text-[10px] uppercase">
                        <tr>
                          <th className="py-3 px-4">Model Name</th>
                          <th className="py-3 px-4">Canonical Model ID</th>
                          <th className="py-3 px-4">Short Aliases</th>
                          <th className="py-3 px-4">Context Window</th>
                          <th className="py-3 px-4">Best Suited For</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f5f2eb] text-[#57534e]">
                        <tr>
                          <td className="py-3 px-4 font-bold text-[#1c1917]">Claude Opus 5.5</td>
                          <td className="py-3 px-4 font-mono text-purple-700">claude-opus-5.5</td>
                          <td className="py-3 px-4 font-mono">opus-5.5, opus</td>
                          <td className="py-3 px-4 font-bold text-emerald-700">1,000,000 tokens</td>
                          <td className="py-3">Cognitive frontier, deep scientific analysis, architectural synthesis</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-bold text-[#1c1917]">Claude Sonnet 5.5</td>
                          <td className="py-3 px-4 font-mono text-purple-700">claude-sonnet-5.5</td>
                          <td className="py-3 px-4 font-mono">sonnet-5.5, sonnet</td>
                          <td className="py-3 px-4 font-bold text-emerald-700">1,000,000 tokens</td>
                          <td className="py-3">Flagship multi-file coding, autonomous agent execution, refactoring</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-bold text-[#1c1917]">Claude Opus 5</td>
                          <td className="py-3 px-4 font-mono text-purple-700">claude-opus-5</td>
                          <td className="py-3 px-4 font-mono">opus-5</td>
                          <td className="py-3 px-4 font-bold text-emerald-700">1,000,000 tokens</td>
                          <td className="py-3">Formal verification, mathematical proofs, system invariants</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-bold text-[#1c1917]">Claude Sonnet 5</td>
                          <td className="py-3 px-4 font-mono text-purple-700">claude-sonnet-5</td>
                          <td className="py-3 px-4 font-mono">sonnet-5</td>
                          <td className="py-3 px-4 font-bold text-emerald-700">1,000,000 tokens</td>
                          <td className="py-3">High-speed production software engineering, automated workflows</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-bold text-[#1c1917]">Claude Fable 5</td>
                          <td className="py-3 px-4 font-mono text-purple-700">claude-fable-5</td>
                          <td className="py-3 px-4 font-mono">fable-5, fable</td>
                          <td className="py-3 px-4 font-bold text-emerald-700">1,000,000 tokens</td>
                          <td className="py-3">Ultra-fast IDE copilot, creative prose, rapid code synthesis</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-bold text-[#1c1917]">Claude Fable 5 Flash</td>
                          <td className="py-3 px-4 font-mono text-purple-700">claude-fable-5-flash</td>
                          <td className="py-3 px-4 font-mono">fable-flash</td>
                          <td className="py-3 px-4 font-bold text-emerald-700">500,000 tokens</td>
                          <td className="py-3">Sub-second bot loops, instant completions, interactive CLI tools</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-bold text-[#1c1917]">Claude Opus 5 Extended Thinking</td>
                          <td className="py-3 px-4 font-mono text-purple-700">claude-opus-5-thinking</td>
                          <td className="py-3 px-4 font-mono">opus-thinking</td>
                          <td className="py-3 px-4 font-bold text-emerald-700">1,000,000 tokens</td>
                          <td className="py-3">Exhaustive reasoning traces, compiler optimization, complex bug trees</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-bold text-[#1c1917]">Claude Sonnet 5 Extended Thinking</td>
                          <td className="py-3 px-4 font-mono text-purple-700">claude-sonnet-5-thinking</td>
                          <td className="py-3 px-4 font-mono">sonnet-thinking</td>
                          <td className="py-3 px-4 font-bold text-emerald-700">1,000,000 tokens</td>
                          <td className="py-3">Hybrid verification, test generation, formal spec evaluation</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-bold text-[#1c1917]">Claude Haiku 5.5</td>
                          <td className="py-3 px-4 font-mono text-purple-700">claude-haiku-5.5</td>
                          <td className="py-3 px-4 font-mono">haiku-5.5, haiku</td>
                          <td className="py-3 px-4 font-bold text-emerald-700">500,000 tokens</td>
                          <td className="py-3">High-throughput streaming, low-latency triage, real-time embeddings</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-bold text-[#1c1917]">Claude Haiku 5</td>
                          <td className="py-3 px-4 font-mono text-purple-700">claude-haiku-5</td>
                          <td className="py-3 px-4 font-mono">haiku-5</td>
                          <td className="py-3 px-4 font-bold text-emerald-700">500,000 tokens</td>
                          <td className="py-3">Background classification, CI/CD parsing, webhook data transform</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              <hr className="my-10 border-[#e7e5e4]" />

              {/* ----------------------------------------------------------- */}
              {/* SECTION 8: 5-HOUR ROLLING QUOTAS                            */}
              {/* ----------------------------------------------------------- */}
              <section id="quotas" className="mb-16 scroll-mt-24 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e7e5e4] shadow-xs text-xs font-mono font-medium text-[#57534e]">
                  <RefreshCw className="h-3.5 w-3.5 text-[#6d28d9]" />
                  <span>SECTION 08</span>
                  <span className="text-[#d6d3d1]">·</span>
                  <span className="text-[#6d28d9] font-bold">5-HOUR ROLLING QUOTA MATHEMATICS</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1c1917]">
                  How the 5-Hour Continuous Rolling Window Works
                </h2>

                <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed">
                  Traditional API platforms lock you into monthly allotments where an intense morning of debugging can exhaust your entire month's budget. LightningAPI.pro uses an intelligent <strong className="text-[#1c1917]">5-hour continuous sliding window</strong> implemented directly in Redis &amp; PostgreSQL:
                </p>

                <div className="p-4 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-2">
                  <div className="font-mono text-xs text-[#6d28d9] font-bold">
                    Quota Equation: WindowUsage(t) = ∑ Tokens[t - 5 hours &rarr; t]
                  </div>
                  <p className="text-xs text-[#57534e] leading-relaxed">
                    Tokens are not reset at midnight or the 1st of the month. Instead, each token consumed has a precise millisecond timestamp. Exactly 300 minutes (5 hours) after generation, those tokens roll completely out of the sum and return to your available headroom.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-[#1c1917]">Concrete Lifecycle Scenario</h4>
                  <ul className="space-y-1.5 text-xs text-[#57534e] pl-1 list-disc list-inside">
                    <li><strong className="text-[#1c1917]">09:00 AM:</strong> You perform a large multi-file codebase indexing consuming 4,000,000 tokens on a 20M plan. Active balance: 16,000,000 remaining.</li>
                    <li><strong className="text-[#1c1917]">11:00 AM:</strong> You run several unit test refactors consuming an additional 6,000,000 tokens. Active balance: 10,000,000 remaining.</li>
                    <li><strong className="text-[#1c1917]">02:00 PM (14:00):</strong> Exactly 5 hours after 09:00 AM, the first 4,000,000 tokens fully expire out of the window. Your available balance immediately increases back to 14,000,000 tokens.</li>
                    <li><strong className="text-[#1c1917]">04:00 PM (16:00):</strong> Exactly 5 hours after 11:00 AM, the second 6,000,000 tokens expire. Your reservoir returns to full 20,000,000 capacity.</li>
                  </ul>
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

                <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed">
                  When a request cannot be fulfilled, the gateway returns standard HTTP status codes with an actionable error object:
                </p>

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
                    <p className="text-[11px] text-[#78716c]">
                      <strong>Fix:</strong> Confirm key format on our <Link to="/check-key" className="text-[#6d28d9] underline">Check Key Tool</Link> or ensure environment variable is loaded.
                    </p>
                  </div>

                  {/* Error 429 */}
                  <div className="p-4 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-amber-600">429 Rate Limit Exceeded</span>
                      <span className="text-[10px] font-mono text-[#78716c]">rate_limit_error</span>
                    </div>
                    <p className="text-xs text-[#57534e]">
                      Occurs when your token consumption has reached your plan's active 5-hour rolling capacity limit.
                    </p>
                    <CodeSnippetBlock
                      language="json"
                      code={`{
  "type": "error",
  "error": {
    "type": "rate_limit_error",
    "message": "5-hour rolling token capacity exceeded (20,000,000 / 20,000,000 tokens). Usage begins replenishing in 38 minutes.",
    "retry_after_seconds": 2280
  }
}`}
                    />
                    <p className="text-[11px] text-[#78716c]">
                      <strong>Fix:</strong> Wait for your oldest tokens to expire out of the 5-hour window, or upgrade to a higher tier plan (e.g. 40x or 100x).
                    </p>
                  </div>

                  {/* Error 502 / 503 */}
                  <div className="p-4 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-orange-600">502 / 503 Bad Gateway</span>
                      <span className="text-[10px] font-mono text-[#78716c]">api_error</span>
                    </div>
                    <p className="text-xs text-[#57534e]">
                      Occurs when an upstream foundational provider experiences temporary downtime, rate limits, or connectivity interruptions.
                    </p>
                    <p className="text-[11px] text-[#78716c]">
                      <strong>Fix:</strong> Requests that fail due to upstream errors do not deduct tokens from your quota. Check real-time provider telemetry at <Link to="/status" className="text-[#6d28d9] underline">status.lightningapi.pro</Link>.
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
                  Developer Support &amp; Safe Issue Diagnostics
                </h2>

                <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed">
                  If you encounter unexpected latency, quota discrepancies, or integration issues, our engineering support team is available to assist:
                </p>

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
                        <strong>Customer Portal:</strong> Authenticated ticket submission via Dashboard
                      </li>
                      <li>
                        <strong>Status Telemetry:</strong>{' '}
                        <Link to="/status" className="text-[#6d28d9] underline">
                          /status
                        </Link>
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-2">
                    <h4 className="text-xs font-bold text-[#1c1917]">Safe Issue Reporting Rules</h4>
                    <p className="text-xs text-[#57534e] leading-relaxed">
                      To safeguard your account security, <strong className="text-rose-600">NEVER send your full secret API key or proprietary source code</strong> in emails or support tickets.
                    </p>
                    <p className="text-[11px] text-[#78716c]">
                      Please include: (1) Your masked key prefix (e.g. <code className="font-mono">ld_live_a1b2...</code>), (2) Exact UTC timestamp, (3) Model ID invoked, and (4) HTTP status code.
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
