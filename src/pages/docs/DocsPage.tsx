import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Check,
  Terminal,
  FileBraces,
  Globe,
  Cpu,
  Zap,
  KeyRound,
  Wrench,
  LifeBuoy,
  Copy,
  Check as CheckIcon,
  TriangleAlert,
  List,
  ChevronDown
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';

// Copy Button
const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="absolute right-2 top-2 border border-border bg-bg p-1.5 opacity-0 transition-opacity hover:bg-card focus-visible:opacity-100 group-hover:opacity-100 rounded"
      title="Copy to clipboard"
    >
      {copied ? <CheckIcon className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-muted" />}
    </button>
  );
};

export const DocsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Available models from catalog
  const modelsList = [
    { name: 'Claude Fable 5', id: 'claude-fable-5', context: '1M', tag: 'New' },
    { name: 'Claude Opus 5', id: 'claude-opus-5', context: '1M', tag: 'New' },
    { name: 'Claude Sonnet 5', id: 'claude-sonnet-5', context: '1M', tag: 'New' },
    { name: 'Claude Opus 4.8', id: 'claude-opus-4-8', context: '1M' },
    { name: 'Claude Opus 4.7', id: 'claude-opus-4-7', context: '1M' },
    { name: 'Claude Opus 4.6', id: 'claude-opus-4-6', context: '1M' },
    { name: 'Claude Sonnet 4.6', id: 'claude-sonnet-4-6', context: '1M' },
    { name: 'Claude Opus 4.5', id: 'claude-opus-4-5', context: '200K' },
    { name: 'Claude Sonnet 4.5', id: 'claude-sonnet-4-5-20250929', context: '200K' },
    { name: 'Claude Haiku 4.5', id: 'claude-haiku-4-5-20251001', context: '200K' },
    { name: 'Claude Opus 4.1', id: 'claude-opus-4-1-20250805', context: '200K' },
    { name: 'Claude Opus 4', id: 'claude-opus-4-20250514', context: '200K' },
    { name: 'Claude Sonnet 4', id: 'claude-sonnet-4-20250514', context: '200K' },
  ];

  const sidebarNav = [
    {
      title: 'Getting started',
      items: [
        { id: 'overview', label: 'Overview', icon: BookOpen },
        { id: 'prerequisites', label: 'Prerequisites', icon: Check },
      ],
    },
    {
      title: 'Installation',
      items: [
        { id: 'quick-install', label: 'Quick install', icon: Terminal },
        { id: 'windows-install', label: 'Windows', icon: FileBraces },
        { id: 'mac-install', label: 'macOS / Linux', icon: FileBraces },
      ],
    },
    {
      title: 'IDE configuration',
      items: [
        { id: 'ide-claude-code', label: 'Claude Code CLI' },
        { id: 'ide-vscode', label: 'VS Code' },
        { id: 'ide-cursor', label: 'Cursor' },
        { id: 'ide-windsurf', label: 'Windsurf' },
        { id: 'ide-cline', label: 'Cline' },
        { id: 'ide-roo', label: 'Roo Code' },
      ],
    },
    {
      title: 'API reference',
      items: [
        { id: 'api-authentication', label: 'Authentication', icon: KeyRound },
        { id: 'api-messages', label: 'Messages', icon: Globe },
        { id: 'api-5h-rolling-window', label: '5h Rolling Window', icon: Zap },
        { id: 'api-models', label: 'Models', icon: Cpu },
        { id: 'api-token-counting', label: 'Token counting', icon: Zap },
        { id: 'api-key-status', label: 'Key status', icon: KeyRound },

        { id: 'api-web-search', label: 'Web search', icon: Globe },
        { id: 'api-image-analysis', label: 'Image analysis', icon: Globe },
      ],
    },
    {
      title: 'Resources',
      items: [
        { id: 'built-in-tools', label: 'Built-in tools', icon: Wrench },
        { id: 'models', label: 'Available models', icon: Cpu },
        { id: 'troubleshooting', label: 'Troubleshooting', icon: LifeBuoy },
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
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 pt-6">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
            {/* Sidebar Navigation */}
            <aside className="hidden lg:sticky lg:block lg:h-[calc(100vh-88px)] lg:overflow-y-auto lg:py-8 top-[88px]">
              <nav className="py-2">
                {sidebarNav.map((group, idx) => (
                  <div key={idx} className="mb-6">
                    <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-fg font-bold">
                      {group.title}
                    </p>
                    <ul className="border-l border-border">
                      {group.items.map((item: { id: string; label: string; icon?: React.ComponentType<{ className?: string }> }) => {
                        const Icon = item.icon;

                        const isActive = activeSection === item.id;
                        return (
                          <li key={item.id}>
                            <button
                              onClick={() => scrollToSection(item.id)}
                              className={`-ml-px flex w-full items-center gap-2.5 border-l py-1.5 pl-3 text-left text-[12.5px] transition-colors ${
                                isActive
                                  ? 'border-amber-500 font-semibold text-amber-500'
                                  : 'border-transparent text-muted hover:border-border hover:text-fg'
                              }`}
                            >
                              {Icon && (
                                <span className={isActive ? 'text-amber-500' : 'text-muted/60'}>
                                  <Icon className="h-3.5 w-3.5" />
                                </span>
                              )}
                              <span>{item.label}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </nav>
            </aside>

            {/* Main Content Area */}
            <main className="min-w-0 pb-16 pt-4 lg:py-8">
              {/* Mobile Table of Contents Selector */}
              <div className="sticky top-[64px] z-30 -mx-4 mb-8 border-b border-border bg-bg/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="flex w-full items-center justify-between border border-border bg-card px-3 py-2.5 text-left rounded-control"
                  type="button"
                >
                  <span className="flex items-center gap-2.5">
                    <List className="h-4 w-4 text-amber-500" />
                    <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">Contents</span>
                    <span className="truncate text-[13px] font-medium text-fg uppercase">{activeSection.replace('-', ' ')}</span>
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
                </button>

                {mobileMenuOpen && (
                  <div className="mt-2 max-h-60 overflow-y-auto border border-border bg-card p-3 rounded-panel space-y-3">
                    {sidebarNav.map((g, idx) => (
                      <div key={idx}>
                        <p className="font-mono text-[10px] font-bold text-amber-500 uppercase">{g.title}</p>
                        <div className="grid grid-cols-2 gap-1 mt-1">
                          {g.items.map((i) => (
                            <button
                              key={i.id}
                              onClick={() => scrollToSection(i.id)}
                              className="text-left text-xs py-1 px-2 hover:bg-bg rounded text-fg"
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

              {/* OVERVIEW SECTION */}
              <section id="overview" className="mb-16 scroll-mt-24">
                <div>
                  <p className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-amber-500">Documentation</p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-[-0.025em] text-fg sm:text-4xl">Setup guide</h1>
                  <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
                    Everything you need to point a client at LightningDeals: install, configure your IDE, and call the API. If you already have a key, the whole thing takes about a minute.
                  </p>
                </div>

                <div className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-2 rounded-panel overflow-hidden">
                  <div className="flex items-center gap-3 bg-card p-4">
                    <Zap className="h-4 w-4 shrink-0 text-amber-500" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-fg">Drop-in compatible</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">No SDK changes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-card p-4">
                    <KeyRound className="h-4 w-4 shrink-0 text-amber-500" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-fg">Permanent Prepaid Balance</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">No Expiry Reset</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-card p-4">
                    <Globe className="h-4 w-4 shrink-0 text-amber-500" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-fg">Built-in tools</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Search and image analysis</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-card p-4">
                    <Cpu className="h-4 w-4 shrink-0 text-amber-500" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-fg">13 models</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">One base URL</p>
                    </div>
                  </div>
                </div>
              </section>

              <div className="my-12 h-px bg-border"></div>

              {/* PREREQUISITES */}
              <section id="prerequisites" className="mb-16 scroll-mt-24">
                <h2 className="mb-5 flex items-center gap-2.5 text-xl font-semibold tracking-tight text-fg">Prerequisites</h2>
                <div className="border-t border-border">
                  <div className="flex items-start gap-3 border-b border-border py-4">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border border-amber-500/40 text-amber-500 rounded">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    <p className="text-sm text-muted">
                      <span className="font-semibold text-fg">Node.js 18 or newer</span> —{' '}
                      <a href="https://nodejs.org" target="_blank" rel="noopener noreferrer" className="text-amber-500 underline hover:underline">
                        Download from nodejs.org
                      </a>
                    </p>
                  </div>
                  <div className="flex items-start gap-3 border-b border-border py-4">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border border-amber-500/40 text-amber-500 rounded">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    <p className="text-sm text-muted">
                      <span className="font-semibold text-fg">A LightningDeals API key</span> — Issued by your admin or reseller
                    </p>
                  </div>
                  <div className="flex items-start gap-3 border-b border-border py-4">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border border-amber-500/40 text-amber-500 rounded">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    <p className="text-sm text-muted">
                      <span className="font-semibold text-fg">A supported client</span> — Claude Code, VS Code, Cursor, Windsurf, Cline, or Roo Code
                    </p>
                  </div>
                </div>
              </section>

              {/* QUICK INSTALL */}
              <section id="quick-install" className="mb-16 scroll-mt-24">
                <h2 className="mb-5 flex items-center gap-2.5 text-xl font-semibold tracking-tight text-fg">
                  <Terminal className="h-5 w-5 text-amber-500" />
                  Quick install
                </h2>
                <p className="text-sm leading-relaxed text-muted">
                  The fastest path. The wizard asks for your key, configures the clients you pick, and verifies the connection before it exits.
                </p>

                <div className="group relative my-4 max-w-full border border-border bg-card rounded-control overflow-hidden">
                  <div className="border-b border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">terminal</div>
                  <CopyButton text="npx lightningdeals" />
                  <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-fg"><code>npx lightningdeals</code></pre>
                </div>

                <div className="mt-6 border border-amber-500/20 bg-amber-500/[0.03] p-5 rounded-panel">
                  <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-amber-500">What it does</p>
                  <ol className="mt-3 space-y-2">
                    <li className="flex items-center gap-3">
                      <span className="font-mono text-[11px] tabular-nums text-amber-500 font-bold">01</span>
                      <span className="text-sm text-muted">Asks for your API key</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="font-mono text-[11px] tabular-nums text-amber-500 font-bold">02</span>
                      <span className="text-sm text-muted">Lets you choose which clients to configure</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="font-mono text-[11px] tabular-nums text-amber-500 font-bold">03</span>
                      <span className="text-sm text-muted">Writes the correct settings for each one</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="font-mono text-[11px] tabular-nums text-amber-500 font-bold">04</span>
                      <span className="text-sm text-muted">Verifies the connection</span>
                    </li>
                  </ol>
                  <p className="mt-4 text-sm text-muted">Web search and image analysis need no setup at all — they run server-side.</p>
                </div>
              </section>

              {/* WINDOWS INSTALL */}
              <section id="windows-install" className="mb-16 scroll-mt-24">
                <h2 className="mb-5 flex items-center gap-2.5 text-xl font-semibold tracking-tight text-fg">Windows — PowerShell</h2>
                <p className="text-sm leading-relaxed text-muted">If you would rather run the setup script directly:</p>

                <div className="group relative my-4 max-w-full border border-border bg-card rounded-control overflow-hidden">
                  <div className="border-b border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">powershell (administrator)</div>
                  <CopyButton text={`Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser\nirm https://lightningapi.pro/setup.ps1 | iex`} />
                  <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-fg"><code>Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser{'\n'}irm https://lightningapi.pro/setup.ps1 | iex</code></pre>
                </div>
              </section>

              {/* MAC / LINUX INSTALL */}
              <section id="mac-install" className="mb-16 scroll-mt-24">
                <h2 className="mb-5 flex items-center gap-2.5 text-xl font-semibold tracking-tight text-fg">macOS and Linux</h2>
                <p className="text-sm leading-relaxed text-muted">The shell equivalent:</p>

                <div className="group relative my-4 max-w-full border border-border bg-card rounded-control overflow-hidden">
                  <div className="border-b border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">terminal</div>
                  <CopyButton text="curl -fsSL https://lightningapi.pro/setup.sh | bash" />
                  <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-fg"><code>curl -fsSL https://lightningapi.pro/setup.sh | bash</code></pre>
                </div>
              </section>

              <div className="my-12 h-px bg-border"></div>

              {/* IDE: CLAUDE CODE CLI */}
              <section id="ide-claude-code" className="mb-16 scroll-mt-24">
                <h2 className="mb-5 flex items-center gap-2.5 text-xl font-semibold tracking-tight text-fg">Claude Code CLI</h2>
                <p className="text-sm leading-relaxed text-muted">Point the Claude Code CLI at LightningDeals and every model in the lineup becomes selectable from the same session.</p>

                <h3 className="mb-3 mt-6 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-fg font-bold">Automatic — recommended</h3>
                <p className="text-sm text-muted">Run <code className="bg-card border border-border px-1.5 py-0.5 font-mono text-[12px] text-fg rounded">npx lightningdeals</code> and select Claude Code CLI.</p>

                <h3 className="mb-3 mt-6 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-fg font-bold">Manual configuration</h3>
                <p className="mb-2 text-sm leading-relaxed text-muted">Create or edit <code className="bg-card border border-border px-1.5 py-0.5 font-mono text-[12px] text-fg rounded">~/.claude/settings.json</code>:</p>

                <div className="group relative my-4 max-w-full border border-border bg-card rounded-control overflow-hidden">
                  <div className="border-b border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">~/.claude/settings.json</div>
                  <CopyButton text={`{\n  "env": {\n    "ANTHROPIC_AUTH_TOKEN": "YOUR_API_KEY",\n    "ANTHROPIC_BASE_URL": "https://lightningapi.pro",\n    "ANTHROPIC_MODEL": "claude-fable-5[1m]",\n    "ANTHROPIC_SMALL_FAST_MODEL": "claude-haiku-4-5-20251001",\n    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-5",\n    "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-4-8[1m]",\n    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "claude-haiku-4-5-20251001",\n    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"\n  },\n  "hasCompletedOnboarding": true\n}`} />
                  <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-fg"><code>{`{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "YOUR_API_KEY",
    "ANTHROPIC_BASE_URL": "https://lightningapi.pro",
    "ANTHROPIC_MODEL": "claude-fable-5[1m]",
    "ANTHROPIC_SMALL_FAST_MODEL": "claude-haiku-4-5-20251001",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-5",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-4-8[1m]",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "claude-haiku-4-5-20251001",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  },
  "hasCompletedOnboarding": true
}`}</code></pre>
                </div>

                <div className="mt-4 flex items-start gap-3 border border-amber-500/25 bg-amber-500/[0.04] p-4 rounded-control">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <p className="text-sm leading-relaxed text-muted">
                    Replace <code className="bg-card border border-border px-1.5 py-0.5 font-mono text-[12px] text-fg rounded">YOUR_API_KEY</code> with your actual key. The <code className="bg-card border border-border px-1.5 py-0.5 font-mono text-[12px] text-fg rounded">[1m]</code> suffix asks for the 1M-token context tier — drop it to use the model's standard window.
                  </p>
                </div>
              </section>

              {/* IDE: VS CODE */}
              <section id="ide-vscode" className="mb-16 scroll-mt-24">
                <h2 className="mb-5 flex items-center gap-2.5 text-xl font-semibold tracking-tight text-fg">VS Code</h2>
                <p className="text-sm leading-relaxed text-muted">The VS Code Claude extension reads the same configuration as the CLI.</p>
                <h3 className="mb-3 mt-6 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-fg font-bold">Automatic — recommended</h3>
                <p className="text-sm text-muted">Run <code className="bg-card border border-border px-1.5 py-0.5 font-mono text-[12px] text-fg rounded">npx lightningdeals</code> and select VS Code.</p>
                <h3 className="mb-3 mt-6 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-fg font-bold">Manual configuration</h3>
                <p className="mb-2 text-sm leading-relaxed text-muted">Same file as Claude Code CLI above. Restart VS Code once you have saved it.</p>
              </section>

              {/* IDE: CURSOR */}
              <section id="ide-cursor" className="mb-16 scroll-mt-24">
                <h2 className="mb-5 flex items-center gap-2.5 text-xl font-semibold tracking-tight text-fg">Cursor</h2>
                <p className="text-sm leading-relaxed text-muted">Route Cursor's AI features through LightningDeals.</p>
                <h3 className="mb-3 mt-6 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-fg font-bold">Automatic — recommended</h3>
                <p className="text-sm text-muted">Run <code className="bg-card border border-border px-1.5 py-0.5 font-mono text-[12px] text-fg rounded">npx lightningdeals</code> and select Cursor.</p>
                <h3 className="mb-3 mt-6 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-fg font-bold">API routing</h3>
                <p className="mb-2 text-sm leading-relaxed text-muted">Open Settings → Models → add a Claude-compatible model with:</p>

                <ul className="ml-1 list-inside list-disc space-y-1.5 text-sm text-muted">
                  <li>Base URL: <code className="bg-card border border-border px-1.5 py-0.5 font-mono text-[12px] text-fg rounded">https://lightningapi.pro/v1</code></li>
                  <li>API key: your LightningDeals key</li>
                  <li>Model: <code className="bg-card border border-border px-1.5 py-0.5 font-mono text-[12px] text-fg rounded">claude-sonnet-5</code></li>
                </ul>
              </section>

              {/* IDE: WINDSURF */}
              <section id="ide-windsurf" className="mb-16 scroll-mt-24">
                <h2 className="mb-5 flex items-center gap-2.5 text-xl font-semibold tracking-tight text-fg">Windsurf</h2>
                <p className="text-sm leading-relaxed text-muted">Route Windsurf's AI provider through LightningDeals.</p>
                <h3 className="mb-3 mt-6 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-fg font-bold">Automatic — recommended</h3>
                <p className="text-sm text-muted">Run <code className="bg-card border border-border px-1.5 py-0.5 font-mono text-[12px] text-fg rounded">npx lightningdeals</code> and select Windsurf.</p>
                <h3 className="mb-3 mt-6 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-fg font-bold">API routing</h3>
                <p className="mb-2 text-sm leading-relaxed text-muted">Open Settings → AI Provider → set the base URL to:</p>
                <div className="group relative my-4 max-w-full border border-border bg-card rounded-control overflow-hidden">
                  <div className="border-b border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Base URL</div>
                  <CopyButton text="https://lightningapi.pro/v1" />
                  <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-fg"><code>https://lightningapi.pro/v1</code></pre>
                </div>
              </section>

              {/* IDE: CLINE */}
              <section id="ide-cline" className="mb-16 scroll-mt-24">
                <h2 className="mb-5 flex items-center gap-2.5 text-xl font-semibold tracking-tight text-fg">Cline</h2>
                <p className="text-sm leading-relaxed text-muted">Configure the Cline VS Code extension to use LightningDeals.</p>
                <h3 className="mb-3 mt-6 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-fg font-bold">Automatic — recommended</h3>
                <p className="text-sm text-muted">Run <code className="bg-card border border-border px-1.5 py-0.5 font-mono text-[12px] text-fg rounded">npx lightningdeals</code> and select Cline.</p>
                <h3 className="mb-3 mt-6 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-fg font-bold">Manual configuration</h3>
                <p className="mb-2 text-sm leading-relaxed text-muted">Add to your VS Code <code className="bg-card border border-border px-1.5 py-0.5 font-mono text-[12px] text-fg rounded">settings.json</code>:</p>
                <div className="group relative my-4 max-w-full border border-border bg-card rounded-control overflow-hidden">
                  <div className="border-b border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">settings.json</div>
                  <CopyButton text={`{\n  "cline.apiProvider": "anthropic",\n  "cline.anthropicBaseUrl": "https://lightningapi.pro",\n  "cline.apiKey": "YOUR_API_KEY"\n}`} />
                  <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-fg"><code>{`{\n  "cline.apiProvider": "anthropic",\n  "cline.anthropicBaseUrl": "https://lightningapi.pro",\n  "cline.apiKey": "YOUR_API_KEY"\n}`}</code></pre>
                </div>
              </section>

              {/* IDE: ROO CODE */}
              <section id="ide-roo" className="mb-16 scroll-mt-24">
                <h2 className="mb-5 flex items-center gap-2.5 text-xl font-semibold tracking-tight text-fg">Roo Code</h2>
                <p className="text-sm leading-relaxed text-muted">Configure the Roo Code VS Code extension to use LightningDeals.</p>
                <h3 className="mb-3 mt-6 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-fg font-bold">Automatic — recommended</h3>
                <p className="text-sm text-muted">Run <code className="bg-card border border-border px-1.5 py-0.5 font-mono text-[12px] text-fg rounded">npx lightningdeals</code> and select Roo Code.</p>
                <h3 className="mb-3 mt-6 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-fg font-bold">Manual configuration</h3>
                <p className="mb-2 text-sm leading-relaxed text-muted">Add to your VS Code <code className="bg-card border border-border px-1.5 py-0.5 font-mono text-[12px] text-fg rounded">settings.json</code>:</p>
                <div className="group relative my-4 max-w-full border border-border bg-card rounded-control overflow-hidden">
                  <div className="border-b border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">settings.json</div>
                  <CopyButton text={`{\n  "roo-cline.apiProvider": "anthropic",\n  "roo-cline.anthropicBaseUrl": "https://lightningapi.pro",\n  "roo-cline.apiKey": "YOUR_API_KEY"\n}`} />
                  <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-fg"><code>{`{\n  "roo-cline.apiProvider": "anthropic",\n  "roo-cline.anthropicBaseUrl": "https://lightningapi.pro",\n  "roo-cline.apiKey": "YOUR_API_KEY"\n}`}</code></pre>
                </div>
              </section>


              <div className="my-12 h-px bg-border"></div>

              {/* API REFERENCE - AUTHENTICATION */}
              <section id="api-authentication" className="mb-16 scroll-mt-24">
                <h2 className="mb-5 flex items-center gap-2.5 text-xl font-semibold tracking-tight text-fg">API Reference — Authentication</h2>
                <p className="text-sm leading-relaxed text-muted">
                  All requests to the LightningDeals Gateway require a valid assigned API key passed in the <code className="font-mono text-amber-500">x-api-key</code> or <code className="font-mono text-amber-500">Authorization: Bearer</code> HTTP headers.
                </p>
              </section>

              {/* API REFERENCE - MESSAGES */}
              <section id="api-messages" className="mb-16 scroll-mt-24">
                <h2 className="mb-5 flex items-center gap-2.5 text-xl font-semibold tracking-tight text-fg">API Reference — Messages</h2>
                <div className="my-4 space-y-4 border border-border bg-card p-5 rounded-panel">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] border-blue-500/30 text-blue-500 rounded">POST</span>
                    <code className="break-all font-mono text-[13px] font-semibold text-fg">/v1/messages</code>
                    <span className="border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted rounded">API key</span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted">Primary Anthropic-compatible message completion endpoint.</p>
                </div>
              </section>

              {/* API REFERENCE - MODELS */}
              <section id="api-models" className="mb-16 scroll-mt-24">
                <h2 className="mb-5 flex items-center gap-2.5 text-xl font-semibold tracking-tight text-fg">API Reference — Models</h2>
                <div className="my-4 space-y-4 border border-border bg-card p-5 rounded-panel">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] border-emerald-500/30 text-emerald-500 rounded">GET</span>
                    <code className="break-all font-mono text-[13px] font-semibold text-fg">/v1/models</code>
                    <span className="border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted rounded">API key</span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted">Returns active LLM model catalog supported by LightningDeals.</p>
                </div>
              </section>

              {/* API REFERENCE - 5H ROLLING WINDOW */}
              <section id="api-5h-rolling-window" className="mb-16 scroll-mt-24">
                <h2 className="mb-5 flex items-center gap-2.5 text-xl font-semibold tracking-tight text-fg">API Reference — 5-Hour Rolling Token Window & First-Request Activation</h2>
                <div className="my-4 space-y-4 border border-border bg-card p-5 rounded-panel">
                  <p className="text-sm leading-relaxed text-muted">
                    Every LightningDeals API key operates on an automated 5-hour rolling token allowance system. Your full token quota (e.g. 20M tokens for Claude Max 20x) automatically refreshes every 5 hours for the validity duration of your plan.
                  </p>
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-control text-xs text-amber-500 font-mono space-y-1.5">
                    <p className="font-bold uppercase tracking-wider">⚡ First-Request Activation Rule:</p>
                    <p>
                      Your 5-hour usage window begins when your API key makes its first successful API request. Before that, the window remains inactive (<code className="text-fg bg-bg px-1.5 py-0.5 rounded">Window Inactive — Starts on 1st API request</code>). Creating a key in the admin panel does not start the timer.
                    </p>
                  </div>
                </div>
              </section>

              {/* API REFERENCE - TOKEN COUNTING */}

              <section id="api-token-counting" className="mb-16 scroll-mt-24">
                <h2 className="mb-5 flex items-center gap-2.5 text-xl font-semibold tracking-tight text-fg">API Reference — Token counting</h2>
                <div className="my-4 space-y-4 border border-border bg-card p-5 rounded-panel">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] border-blue-500/30 text-blue-500 rounded">POST</span>
                    <code className="break-all font-mono text-[13px] font-semibold text-fg">/v1/messages/count_tokens</code>
                  </div>
                  <p className="text-sm leading-relaxed text-muted">Calculates input token count before sending full completions.</p>
                </div>
              </section>

              {/* API REFERENCE - KEY STATUS */}
              <section id="api-key-status" className="mb-16 scroll-mt-24">
                <h2 className="mb-5 flex items-center gap-2.5 text-xl font-semibold tracking-tight text-fg">API Reference — Key status</h2>
                <div className="my-4 space-y-4 border border-border bg-card p-5 rounded-panel">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] border-emerald-500/30 text-emerald-500 rounded">GET</span>
                    <code className="break-all font-mono text-[13px] font-semibold text-fg">/api/key-status</code>
                  </div>
                  <p className="text-sm leading-relaxed text-muted">Returns token balance, expiration date, and status for any assigned API key.</p>
                </div>
              </section>

              {/* API REFERENCE - WEB SEARCH */}
              <section id="api-web-search" className="mb-16 scroll-mt-24">
                <h2 className="mb-5 flex items-center gap-2.5 text-xl font-semibold tracking-tight text-fg">Web search</h2>
                <div className="my-4 space-y-4 border border-border bg-card p-5 rounded-panel">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] border-blue-500/30 text-blue-500 rounded">POST</span>
                    <code className="break-all font-mono text-[13px] font-semibold text-fg">/tools/web_search</code>
                    <span className="border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted rounded">API key</span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted">Search the web for current information. Three to five keywords works best.</p>
                </div>
              </section>

              {/* API REFERENCE - IMAGE ANALYSIS */}
              <section id="api-image-analysis" className="mb-16 scroll-mt-24">
                <h2 className="mb-5 flex items-center gap-2.5 text-xl font-semibold tracking-tight text-fg">Image analysis</h2>
                <div className="my-4 space-y-4 border border-border bg-card p-5 rounded-panel">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] border-blue-500/30 text-blue-500 rounded">POST</span>
                    <code className="break-all font-mono text-[13px] font-semibold text-fg">/tools/understand_image</code>
                    <span className="border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted rounded">API key</span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted">Analyse an image. Accepts an HTTP URL, a local path, or a base64 data URL. 18MB maximum.</p>
                </div>
              </section>

              <div className="my-12 h-px bg-border"></div>

              {/* RESOURCES - BUILT-IN TOOLS */}
              <section id="built-in-tools" className="mb-16 scroll-mt-24">
                <h2 className="mb-5 flex items-center gap-2.5 text-xl font-semibold tracking-tight text-fg">Built-in tools</h2>
                <p className="text-sm leading-relaxed text-muted">Both tools run server-side. There is nothing to install on your machine and no MCP server to configure.</p>
                <div className="mt-5 grid gap-px bg-border sm:grid-cols-2 rounded-panel overflow-hidden">
                  <div className="bg-card p-5">
                    <span className="border border-amber-500/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-amber-500 rounded">Web search</span>
                    <p className="mt-3 text-sm leading-relaxed text-muted">Live web results for up-to-date information. Available automatically in every connected client.</p>
                  </div>
                  <div className="bg-card p-5">
                    <span className="border border-amber-500/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-amber-500 rounded">Image analysis</span>
                    <p className="mt-3 text-sm leading-relaxed text-muted">Understands JPEG, PNG and WebP. Works out of the box with no extra configuration.</p>
                  </div>
                </div>
              </section>

              {/* RESOURCES - MODELS CATALOG */}
              <section id="models" className="mb-16 scroll-mt-24">
                <h2 className="mb-5 flex items-center gap-2.5 text-xl font-semibold tracking-tight text-fg">Available models</h2>
                <p className="mb-5 text-sm leading-relaxed text-muted">Every model below answers on the same key and the same base URL. Pass the ID exactly as written.</p>
                <div className="border-t border-border">
                  {modelsList.map((m, i) => (
                    <div key={i} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-border py-3">
                      <span className="w-full text-sm font-semibold text-fg sm:w-44 flex items-center gap-2">
                        {m.name}
                        {m.tag && <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-amber-500 font-bold">{m.tag}</span>}
                      </span>
                      <code className="flex-1 font-mono text-[12px] text-muted">{m.id}</code>
                      <span className="font-mono text-[12px] tabular-nums text-fg">{m.context}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 space-y-3 border border-border bg-card p-4 rounded-control">
                  <p className="text-sm leading-relaxed text-muted">
                    <strong className="font-semibold text-fg">Context tier.</strong> Append <code className="bg-bg border border-border px-1.5 py-0.5 font-mono text-[12px] text-fg rounded">[1m]</code> to a model ID — e.g. <code className="bg-bg border border-border px-1.5 py-0.5 font-mono text-[12px] text-fg rounded">claude-opus-4-8[1m]</code> — to request the 1M-token window.
                  </p>
                </div>
              </section>

              {/* RESOURCES - TROUBLESHOOTING */}
              <section id="troubleshooting" className="mb-16 scroll-mt-24">
                <h2 className="mb-5 flex items-center gap-2.5 text-xl font-semibold tracking-tight text-fg">Troubleshooting</h2>
                <div className="border-t border-border">
                  <div className="border-b border-border py-4">
                    <p className="text-sm font-semibold text-fg">Connection errors</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">Check the key is active and has remaining balance — the Check a key page tells you in one look.</p>
                  </div>
                  <div className="border-b border-border py-4">
                    <p className="text-sm font-semibold text-fg">Web search or image tools not responding</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">They are server-side, so there is nothing local to fix. Confirm the key is valid and retry.</p>
                  </div>
                  <div className="border-b border-border py-4">
                    <p className="text-sm font-semibold text-fg">Model not found</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">Use an exact ID from the models list above. Display names are not accepted, only IDs and family aliases.</p>
                  </div>
                  <div className="border-b border-border py-4">
                    <p className="text-sm font-semibold text-fg">Rate limited</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">Your allocated RPM rate limit has been reached. Slow down requests or upgrade your tier.</p>
                  </div>
                </div>
              </section>
            </main>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
