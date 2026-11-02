import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, BookOpen, Terminal, Globe, Cpu, AlertTriangle, Layers, KeyRound, Wrench } from 'lucide-react';

export interface SearchDocItem {
  id: string;
  title: string;
  category: string;
  snippet: string;
  keywords: string[];
}

export const DOC_SEARCH_INDEX: SearchDocItem[] = [
  // A. Getting Started
  { id: 'overview', title: 'Introduction & System Architecture', category: 'Getting Started', snippet: 'Unified AI Gateway connecting multiple intelligence clusters through one high-speed endpoint.', keywords: ['overview', 'intro', 'architecture', 'gateway', 'speed', 'latency'] },
  { id: 'what-is-api-key', title: 'What is an API Key?', category: 'Getting Started', snippet: 'A beginner-friendly guide to understanding and using your secret LightningAPI key securely.', keywords: ['api key', 'secret', 'beginner', 'token', 'ld_live'] },
  { id: 'how-it-works', title: 'How LightningAPI Works', category: 'Getting Started', snippet: 'Understand request routing, sub-50ms gateway latency, and multi-model failover.', keywords: ['routing', 'failover', 'cluster', 'reverse proxy', 'sub-50ms'] },
  { id: 'getting-your-key', title: 'How to Get Your API Key', category: 'Getting Started', snippet: 'Instant key provisioning from your Customer Dashboard upon subscription or trial signup.', keywords: ['get key', 'generate key', 'dashboard', 'trial', 'signup'] },
  { id: 'plan-types-overview', title: 'Understanding Your Plan Architecture', category: 'Getting Started', snippet: 'Clear breakdown of 5-hour rolling windows, credit wallets, and consumable token packs.', keywords: ['plans', 'rolling window', 'credit wallet', 'token pack', 'allowance'] },
  { id: 'first-request', title: 'Your First Successful API Request', category: 'Getting Started', snippet: 'Run your first cURL or Python request in under 60 seconds with copy-paste code.', keywords: ['first request', 'quick start', 'curl', 'test', 'hello world'] },
  { id: 'check-key-status', title: 'Checking Key Status & Consumption', category: 'Getting Started', snippet: 'Use the interactive Verify Key tool to monitor available tokens, quota, and reset timers.', keywords: ['verify key', 'check key', 'status', 'countdown', 'balance'] },

  // B. Quick Setup
  { id: 'windows-setup', title: 'Windows Setup (PowerShell & CMD)', category: 'Quick Setup', snippet: 'Set environment variables and configure AI editors natively in Windows PowerShell.', keywords: ['windows', 'powershell', 'cmd', 'env', 'appdata'] },
  { id: 'macos-setup', title: 'macOS Setup (Terminal / Zsh)', category: 'Quick Setup', snippet: 'Export environment variables and configure settings in macOS Terminal or Zsh.', keywords: ['macos', 'mac', 'zsh', 'terminal', 'bash', 'export'] },
  { id: 'linux-setup', title: 'Linux Setup (Ubuntu / Debian / Arch)', category: 'Quick Setup', snippet: 'Configure persistent system environment variables on Linux distributions.', keywords: ['linux', 'ubuntu', 'debian', 'bashrc', 'profile'] },
  { id: 'automatic-setup', title: 'Automatic Setup with LightningAPI CLI', category: 'Quick Setup', snippet: 'Run npx lightningdeals to auto-detect installed tools, backup configs, and connect instantly.', keywords: ['npx', 'cli', 'automatic', 'lightningdeals', 'one-command', 'installer'] },
  { id: 'manual-setup', title: 'Manual Setup Best Practices', category: 'Quick Setup', snippet: 'Step-by-step guidance for manual configuration file management.', keywords: ['manual', 'config', 'settings.json', 'backup'] },

  // C. Connect Applications
  { id: 'guide-claude-code', title: 'Connect to Claude Code CLI', category: 'Client Setup', snippet: 'Configure ANTHROPIC_BASE_URL and ANTHROPIC_AUTH_TOKEN in ~/.claude/settings.json.', keywords: ['claude code', 'claude cli', 'anthropic_base_url', 'settings.json'] },
  { id: 'guide-cursor', title: 'Connect to Cursor IDE', category: 'Client Setup', snippet: 'Configure custom Anthropic and OpenAI base URLs inside Cursor editor settings.', keywords: ['cursor', 'cursor ide', 'override anthropic', 'settings'] },
  { id: 'guide-codex', title: 'Connect to Codex CLI', category: 'Client Setup', snippet: 'Run OpenAI-compatible Codex developer terminal with LightningAPI models.', keywords: ['codex', 'codex cli', 'openai_base_url'] },
  { id: 'guide-vscode', title: 'Connect to Visual Studio Code', category: 'Client Setup', snippet: 'Integrate LightningAPI with VS Code AI extensions and autonomous agents.', keywords: ['vs code', 'vscode', 'visual studio code', 'editor'] },
  { id: 'guide-windsurf', title: 'Connect to Windsurf IDE', category: 'Client Setup', snippet: 'Configure Custom OpenAI provider in Windsurf Codeium Flow engine.', keywords: ['windsurf', 'codeium', 'cascade', 'ide'] },
  { id: 'guide-cline', title: 'Connect to Cline (VS Code Extension)', category: 'Client Setup', snippet: 'Enable autonomous multi-turn software development with Cline and Claude Sonnet 5.5.', keywords: ['cline', 'agent', 'autonomous', 'extension'] },
  { id: 'guide-roo-code', title: 'Connect to Roo Code (VS Code Extension)', category: 'Client Setup', snippet: 'Configure Architect and Code modes in Roo Code with custom Anthropic base URLs.', keywords: ['roo code', 'roo', 'architect', 'code mode'] },
  { id: 'guide-continue', title: 'Connect to Continue.dev', category: 'Client Setup', snippet: 'Add Claude Sonnet 5.5 and GPT-4o to your Continue.dev config.json models list.', keywords: ['continue', 'continue.dev', 'autocomplete', 'tab'] },
  { id: 'guide-trae', title: 'Connect to TRAE SOLO', category: 'Client Setup', snippet: 'Configure TRAE adaptive coding editor with custom models.', keywords: ['trae', 'trae solo', 'editor'] },
  { id: 'guide-claude-desktop', title: 'Connect to Claude Desktop', category: 'Client Setup', snippet: 'Configure claude_desktop_config.json with LightningAPI custom gateway endpoint.', keywords: ['claude desktop', 'native app', 'desktop config'] },
  { id: 'guide-cherry-studio', title: 'Connect to Cherry Studio', category: 'Client Setup', snippet: 'Add custom OpenAI provider to Cherry Studio desktop multi-model client.', keywords: ['cherry studio', 'desktop', 'chat'] },
  { id: 'guide-n8n', title: 'Connect to n8n Workflow Automation', category: 'Client Setup', snippet: 'Use LightningAPI with OpenAI and Anthropic LangChain nodes in n8n.', keywords: ['n8n', 'automation', 'workflows', 'nodes'] },

  // D. Models & Providers
  { id: 'models-claude', title: 'Claude Frontier Models', category: 'Models & Providers', snippet: 'Claude Sonnet 5.5, Claude Opus 5.5, Claude Fable 5, and Claude Haiku 5.5 specifications.', keywords: ['claude sonnet 5.5', 'claude opus 5.5', 'claude fable 5', 'haiku'] },
  { id: 'models-openai', title: 'OpenAI Frontier Models', category: 'Models & Providers', snippet: 'GPT-4o, GPT-4o-mini, o1, o3-mini, and GPT-4.5 specifications.', keywords: ['gpt-4o', 'gpt-4o-mini', 'o1', 'o3-mini', 'gpt-4.5'] },
  { id: 'models-gemini', title: 'Google Gemini Models', category: 'Models & Providers', snippet: 'Gemini 4 Argon (1M tokens context) and Gemini 2.5 Pro reasoning models.', keywords: ['gemini', 'gemini 4 argon', 'gemini 2.5 pro', '1m context'] },
  { id: 'models-local', title: 'Open-Weights & Labs (DeepSeek, Grok, Qwen)', category: 'Models & Providers', snippet: 'DeepSeek V3/R1, xAI Grok, Alibaba Qwen 2.5, and Zhipu GLM models.', keywords: ['deepseek', 'grok', 'qwen', 'local models', 'open weights'] },

  // E. API Reference
  { id: 'api-authentication', title: 'Authentication & Bearer Tokens', category: 'API Reference', snippet: 'Pass keys via x-api-key or Authorization: Bearer across all endpoints.', keywords: ['auth', 'bearer', 'x-api-key', 'headers'] },
  { id: 'api-base-urls', title: 'Base URLs & Protocols', category: 'API Reference', snippet: 'https://lightningapi.pro (Anthropic) vs https://lightningapi.pro/v1 (OpenAI).', keywords: ['base url', 'endpoints', 'v1', 'messages', 'chat completions'] },
  { id: 'api-messages', title: 'POST /v1/messages (Anthropic API)', category: 'API Reference', snippet: 'Complete Anthropic Messages endpoint specification, payload schema, and examples.', keywords: ['/v1/messages', 'messages api', 'anthropic protocol'] },
  { id: 'api-chat-completions', title: 'POST /v1/chat/completions (OpenAI API)', category: 'API Reference', snippet: 'Complete OpenAI Chat Completions specification, streaming, and examples.', keywords: ['/v1/chat/completions', 'chat completions', 'openai protocol'] },
  { id: 'api-models', title: 'GET /v1/models (Key-Scoped Discovery)', category: 'API Reference', snippet: 'Retrieve dynamically filtered models authorized for your active key.', keywords: ['/v1/models', 'list models', 'model list'] },
  { id: 'api-streaming', title: 'Server-Sent Events (SSE) Streaming', category: 'API Reference', snippet: 'Consume streaming token chunks in Python, JavaScript, and shell terminals.', keywords: ['streaming', 'sse', 'server-sent events', 'chunks'] },
  { id: 'api-multimodal', title: 'Multimodal Vision & Image Input', category: 'API Reference', snippet: 'Send base64 or HTTPS image payloads (JPEG, PNG, WEBP, GIF up to 20MB).', keywords: ['vision', 'image', 'multimodal', 'base64', 'magic bytes'] },

  // F. Usage & Billing
  { id: 'billing-architectures', title: 'The Six Billing Architectures Explained', category: 'Usage & Billing', snippet: 'Comprehensive guide to rolling windows, credit balances, and token packs.', keywords: ['billing architectures', '6 plans', 'accounting', 'ledger'] },
  { id: 'billing-rolling-window', title: '5-Hour Rolling Window Allowance', category: 'Usage & Billing', snippet: 'How rolling allowances regenerate continuously every 5 hours without expiry.', keywords: ['5-hour', 'rolling allowance', 'regeneration', 'reset'] },
  { id: 'billing-credits', title: 'Prepaid API Credit Wallet', category: 'Usage & Billing', snippet: 'Pay-as-you-go credits valid for 365 days across all model families.', keywords: ['credit wallet', 'usd', '365 days', 'top up'] },
  { id: 'billing-tokens', title: 'Consumable Token Packages', category: 'Usage & Billing', snippet: 'High-capacity token packs for burst workloads and automated agents.', keywords: ['token package', '10m', '50m', '100m', 'tokens'] },

  // G. Troubleshooting
  { id: 'error-400', title: 'HTTP 400 — Invalid Request Format', category: 'Troubleshooting', snippet: 'Fix malformed message structures, invalid JSON syntax, or unsupported parameters.', keywords: ['400', 'invalid request', 'bad request', 'json syntax'] },
  { id: 'error-401', title: 'HTTP 401 — API Key Unrecognized or Expired', category: 'Troubleshooting', snippet: 'Resolve mistyped keys, expired trials, or missing authorization headers.', keywords: ['401', 'unauthorized', 'invalid key', 'expired key'] },
  { id: 'error-402', title: 'HTTP 402 — Credit Wallet Depleted ($0.00)', category: 'Troubleshooting', snippet: 'Top up your prepaid credit balance to resume processing instantly.', keywords: ['402', 'payment required', 'insufficient funds', 'depleted'] },
  { id: 'error-403-model', title: 'HTTP 403 — Model Not Permitted on Current Plan', category: 'Troubleshooting', snippet: 'Switch to a model included in your key plan or upgrade to Universal access.', keywords: ['403', 'forbidden', 'model not permitted', 'tier mismatch'] },
  { id: 'error-429-quota', title: 'HTTP 429 — 5-Hour Rolling Allowance Reached', category: 'Troubleshooting', snippet: 'Wait for window regeneration or top up Pay-As-You-Go Credits for instant buffer.', keywords: ['429', 'rate limit', 'rolling allowance', 'quota exhausted'] },
  { id: 'error-429-rpm', title: 'HTTP 429 — Request Speed Limit Reached (RPM)', category: 'Troubleshooting', snippet: 'Add brief retry delays or reduce concurrency to stay within per-minute limits.', keywords: ['429', 'rpm', 'requests per minute', 'speed limit'] },
  { id: 'error-500-503', title: 'HTTP 500/503 — Temporary Cluster Congestion', category: 'Troubleshooting', snippet: 'Temporary cluster surge; retry in 3 seconds. Zero tokens are charged.', keywords: ['500', '502', '503', '504', 'cluster busy', 'outage'] },
];

interface DocSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSection: (id: string) => void;
}

export const DocSearchModal: React.FC<DocSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectSection,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();
  const results = cleanQuery
    ? DOC_SEARCH_INDEX.filter((item) => {
        return (
          item.title.toLowerCase().includes(cleanQuery) ||
          item.snippet.toLowerCase().includes(cleanQuery) ||
          item.category.toLowerCase().includes(cleanQuery) ||
          item.keywords.some((k) => k.includes(cleanQuery))
        );
      })
    : DOC_SEARCH_INDEX.slice(0, 8); // show popular initial items

  const handleSelect = (id: string) => {
    onClose();
    onSelectSection(id);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Getting Started':
        return <BookOpen className="w-3.5 h-3.5 text-violet-600" />;
      case 'Quick Setup':
        return <Terminal className="w-3.5 h-3.5 text-blue-600" />;
      case 'Client Setup':
        return <Wrench className="w-3.5 h-3.5 text-amber-600" />;
      case 'Models & Providers':
        return <Cpu className="w-3.5 h-3.5 text-emerald-600" />;
      case 'API Reference':
        return <Globe className="w-3.5 h-3.5 text-purple-600" />;
      case 'Usage & Billing':
        return <Layers className="w-3.5 h-3.5 text-indigo-600" />;
      case 'Troubleshooting':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <KeyRound className="w-3.5 h-3.5 text-stone-600" />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150 font-sans"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-[#ede8e1] max-w-xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#ede8e1] flex items-center gap-3 bg-[#faf8f5]">
          <Search className="w-5 h-5 text-violet-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search documentation (e.g. Cursor, Claude Code, 429, Python, rolling window)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-[#1e1b2e] placeholder:text-[#a8a29e] focus:outline-hidden font-medium"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#64607d] hover:text-[#1e1b2e] hover:bg-stone-200/50 transition-colors cursor-pointer"
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-3 overflow-y-auto space-y-1.5 divide-y divide-[#ede8e1]/50">
          {results.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#64607d] space-y-1.5">
              <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto" />
              <p className="font-bold text-[#1e1b2e]">No documentation articles matched "{query}".</p>
              <p>Try searching for a tool name like "Cursor", an error code like "429", or "Python".</p>
            </div>
          ) : (
            results.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className="w-full p-3 rounded-xl text-left hover:bg-[#faf8f5] transition-colors cursor-pointer group flex items-start justify-between gap-3 pt-2.5 first:pt-0"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-stone-100 border border-stone-200 shrink-0">
                      {getCategoryIcon(item.category)}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-[#64607d] tracking-wider font-mono">
                      {item.category}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#1e1b2e] group-hover:text-violet-700 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-[#64607d] line-clamp-2 leading-relaxed">
                    {item.snippet}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#a8a29e] group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
              </button>
            ))
          )}
        </div>

        {/* Search Footer */}
        <div className="p-3 bg-[#faf8f5] border-t border-[#ede8e1] flex items-center justify-between text-[11px] text-[#64607d] font-mono">
          <span>{results.length} articles found</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};
