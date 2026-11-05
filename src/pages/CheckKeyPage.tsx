import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Key,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  DollarSign,
  Coins,
  HelpCircle,
  Wrench,
  ChevronDown,
  ChevronUp,
  Search,
  Copy,
  Check,
  Layers,
} from 'lucide-react';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { ErrorSolutionModal } from '../components/ErrorSolutionModal';
import { getFriendlyError, FriendlyErrorInfo } from '../utils/friendlyErrors';

interface ModelCategoryMeta {
  label: string;
  key: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
}

function getModelCategory(modelId: string): ModelCategoryMeta {
  const id = (modelId || '').toLowerCase();
  if (id.includes('claude') || id.includes('fable')) {
    return {
      label: 'Anthropic Claude Frontier',
      key: 'claude',
      badgeBg: 'bg-violet-50',
      badgeText: 'text-violet-700',
      badgeBorder: 'border-violet-200',
      dotColor: 'bg-violet-600',
    };
  }
  if (id.includes('gpt') || id.startsWith('o1') || id.startsWith('o3') || id.startsWith('o4') || id.includes('codex') || id.includes('text-embedding')) {
    return {
      label: 'OpenAI Frontier',
      key: 'openai',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      badgeBorder: 'border-emerald-200',
      dotColor: 'bg-emerald-600',
    };
  }
  if (id.includes('gemini')) {
    return {
      label: 'Google Gemini',
      key: 'gemini',
      badgeBg: 'bg-sky-50',
      badgeText: 'text-sky-700',
      badgeBorder: 'border-sky-200',
      dotColor: 'bg-sky-600',
    };
  }
  if (id.includes('deepseek')) {
    return {
      label: 'DeepSeek AI',
      key: 'deepseek',
      badgeBg: 'bg-indigo-50',
      badgeText: 'text-indigo-700',
      badgeBorder: 'border-indigo-200',
      dotColor: 'bg-indigo-600',
    };
  }
  if (id.includes('grok')) {
    return {
      label: 'xAI Grok',
      key: 'grok',
      badgeBg: 'bg-zinc-100',
      badgeText: 'text-zinc-800',
      badgeBorder: 'border-zinc-300',
      dotColor: 'bg-zinc-700',
    };
  }
  return {
    label: 'Open-Weights & Labs',
    key: 'local',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    dotColor: 'bg-amber-600',
  };
}

function formatContextWindow(tokens: number | undefined | null): string {
  if (!tokens) return '128k context';
  if (tokens >= 1_000_000) return `${Math.round(tokens / 1_000_000)}M context`;
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}k context`;
  return `${tokens} tokens`;
}

export const CheckKeyPage: React.FC = () => {
  const [keyInput, setKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [selectedSolution, setSelectedSolution] = useState<{
    error: FriendlyErrorInfo;
    rawEvent?: any;
  } | null>(null);

  // Authorized Models Dropdown State
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [modelCategoryFilter, setModelCategoryFilter] = useState('all');
  const [copiedModel, setCopiedModel] = useState<string | null>(null);
  const [isGridExpanded, setIsGridExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleCheckKey = async (e?: React.FormEvent, keyOverride?: string) => {
    if (e) e.preventDefault();
    const keyToUse = (keyOverride ?? keyInput).trim() || (document.querySelector('input')?.value || '').trim();
    if (!keyToUse) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/key-status?key=${encodeURIComponent(keyToUse)}`);
      const data = await res.json();
      if (!res.ok && data.error) {
        setError(data.error.message || 'Failed to verify key status.');
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError('Network error checking key. Make sure the server is reachable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qKey = params.get('key');
      if (qKey) {
        setKeyInput(qKey);
        handleCheckKey(undefined, qKey);
      }
    }
  }, []);

  useEffect(() => {
    if (!result || result.billingType === 'credit' || result.billingType === 'token' || !result.windowActive || result.windowResetSeconds == null) {
      setSecondsLeft(null);
      return;
    }

    setSecondsLeft(result.windowResetSeconds);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev == null || prev <= 1) {
          return 5 * 3600;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [result]);

  const formatCountdown = (secs: number | null) => {
    if (secs == null) return null;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  const formatTokens = (val: string | number | undefined | null) => {
    const num = Number(val || 0);
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2).replace(/\.00$/, '')}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2).replace(/\.00$/, '')}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
    return num.toLocaleString();
  };

  const isCredit = result?.billingType === 'credit';
  const isToken = result?.billingType === 'token';
  const isWindow = result ? (!isCredit && !isToken) : false;

  const purchasedNum = Number(result?.purchasedTokens || 0);
  const usedNum = Number(result?.tokensUsed || 0);
  const consumedPercent = result?.consumptionPercent != null
    ? result.consumptionPercent
    : purchasedNum > 0
    ? (usedNum / purchasedNum) * 100
    : 0;

  // Close model dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Strict Rule 1 Filtering: Ensure no Claude 3 models appear anywhere
  const cleanAvailableModels = useMemo(() => {
    if (!result?.availableModels || !Array.isArray(result.availableModels)) return [];
    return result.availableModels.filter((m: any) => {
      const id = (m.id || m.modelId || m.name || '').toLowerCase();
      return (
        !id.includes('claude-3') &&
        !id.includes('3-5-sonnet') &&
        !id.includes('3-5-haiku') &&
        !id.includes('3-7-sonnet') &&
        !id.includes('3-opus')
      );
    });
  }, [result]);

  // Set default model on load
  useEffect(() => {
    if (cleanAvailableModels.length > 0) {
      const preferred =
        cleanAvailableModels.find((m: any) => m.id === result?.defaultModel) ||
        cleanAvailableModels.find((m: any) => m.id === 'claude-sonnet-5.5') ||
        cleanAvailableModels.find((m: any) => m.id === 'claude-opus-5.5') ||
        cleanAvailableModels[0];
      setSelectedModelId(preferred?.id || cleanAvailableModels[0]?.id || '');
    }
  }, [cleanAvailableModels, result]);

  const copyModelId = (id: string) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedModel(id);
    setTimeout(() => setCopiedModel(null), 2000);
  };

  const selectedModel = useMemo(() => {
    if (!selectedModelId) return cleanAvailableModels[0] || null;
    return cleanAvailableModels.find((m: any) => (m.id || m.name) === selectedModelId) || cleanAvailableModels[0] || null;
  }, [cleanAvailableModels, selectedModelId]);

  const activeCategory = useMemo(() => {
    return getModelCategory(selectedModel?.id || '');
  }, [selectedModel]);

  // Categorized counts for filter tabs
  const categoryTabs = useMemo(() => {
    const counts: Record<string, number> = {
      all: cleanAvailableModels.length,
      claude: 0,
      openai: 0,
      gemini: 0,
      deepseek: 0,
      local: 0,
    };
    for (const m of cleanAvailableModels) {
      const cat = getModelCategory(m.id || m.name);
      if (counts[cat.key] !== undefined) {
        counts[cat.key]++;
      } else {
        counts.local++;
      }
    }
    return [
      { key: 'all', label: 'All', count: counts.all },
      { key: 'claude', label: 'Claude', count: counts.claude },
      { key: 'openai', label: 'OpenAI', count: counts.openai },
      { key: 'gemini', label: 'Gemini', count: counts.gemini },
      { key: 'deepseek', label: 'DeepSeek', count: counts.deepseek },
      { key: 'local', label: 'Open-Weights', count: counts.local },
    ].filter((tab) => tab.count > 0 || tab.key === 'all');
  }, [cleanAvailableModels]);

  // Filtered models for dropdown list
  const filteredDropdownModels = useMemo(() => {
    return cleanAvailableModels.filter((m: any) => {
      const id = (m.id || m.name || '').toLowerCase();
      const displayName = (m.name || '').toLowerCase();
      const searchMatch = !modelSearch || id.includes(modelSearch.toLowerCase()) || displayName.includes(modelSearch.toLowerCase());
      if (!searchMatch) return false;

      if (modelCategoryFilter === 'all') return true;
      const cat = getModelCategory(m.id || m.name);
      return cat.key === modelCategoryFilter;
    });
  }, [cleanAvailableModels, modelSearch, modelCategoryFilter]);

  // Grouped models for full visual grid expansion
  const groupedModelCategories = useMemo(() => {
    const groups: Record<string, { label: string; key: string; dotColor: string; models: any[] }> = {
      claude: { label: 'Anthropic Claude Frontier', key: 'claude', dotColor: 'bg-violet-600', models: [] },
      openai: { label: 'OpenAI Frontier', key: 'openai', dotColor: 'bg-emerald-600', models: [] },
      gemini: { label: 'Google Gemini', key: 'gemini', dotColor: 'bg-sky-600', models: [] },
      deepseek: { label: 'DeepSeek AI', key: 'deepseek', dotColor: 'bg-indigo-600', models: [] },
      grok: { label: 'xAI Grok', key: 'grok', dotColor: 'bg-zinc-700', models: [] },
      local: { label: 'Open-Weights & Labs', key: 'local', dotColor: 'bg-amber-600', models: [] },
    };

    for (const m of cleanAvailableModels) {
      const cat = getModelCategory(m.id || m.name);
      const targetGroup = groups[cat.key] || groups.local;
      targetGroup.models.push(m);
    }

    return Object.values(groups).filter((g) => g.models.length > 0);
  }, [cleanAvailableModels]);

  return (
    <div className="min-h-screen bg-[#fafaf9] text-zinc-950 flex flex-col font-sans antialiased selection:bg-violet-500/10 selection:text-violet-700">
      <SiteHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center max-w-2xl mx-auto space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium uppercase tracking-wider bg-[#f5f3ff] text-[#6d28d9] border border-[#ddd6fe]">
            <Sparkles className="w-3 h-3 text-[#6d28d9]" />
            <span>
              {isCredit
                ? '⚡ API Usage Credits & Telemetry Inspector'
                : isToken
                ? '📦 Consumable Token Quota Inspector'
                : '🔄 Key Telemetry & Usage Inspector'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#1c1917]">
            {isCredit
              ? 'Check your API Usage Credits & Rate Limit'
              : isToken
              ? 'Check your Prepaid Token Quota & Rate Limit'
              : 'Check your API Key rolling balance & rate limit'}
          </h1>
          <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed max-w-xl mx-auto">
            {isCredit
              ? 'Enter your LightningAPI key to inspect your USD credit wallet balance, token deductions, rate limits, and audit logs.'
              : isToken
              ? 'Enter your LightningAPI key to inspect your consumable lifetime token quota, usage metrics, and audit logs.'
              : 'Enter your LightningAPI key to inspect your 5-hour rolling token window, live reset countdown, rate limits, and audit logs.'}
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleCheckKey} className="mt-8 max-w-2xl mx-auto flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a8a29e]" />
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="sk_live_... or sk_trial_..."
              className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm font-mono bg-white border border-[#e7e5e4] rounded-xl focus:outline-none focus:border-[#6d28d9] focus:ring-1 focus:ring-[#6d28d9] text-[#1c1917] shadow-xs"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-[#6d28d9] hover:bg-[#581c87] text-white text-xs sm:text-sm font-semibold shadow-plum flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all shrink-0"
          >
            {loading ? 'Checking...' : 'Check API Key →'}
          </button>
        </form>

        {/* Error Alert */}
        {error && (
          <div className="mt-6 max-w-2xl mx-auto p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs sm:text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Results Card */}
        {result && (
          <div className="mt-8 bg-white border border-[#e7e5e4] rounded-2xl p-6 sm:p-8 shadow-warm animate-in fade-in duration-200 space-y-6">
            {!result.valid ? (
              <div className="text-center py-8 space-y-2">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                <h3 className="text-base font-bold text-[#1c1917]">Invalid API Key</h3>
                <p className="text-xs text-[#78716c]">This API key does not exist or has been revoked.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Attention Required Banner */}
                {result.exactFailureReason && (
                  <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="font-bold text-rose-900 text-sm font-sans">API Key Attention Required</p>
                        <p className="text-rose-700 font-sans text-xs">
                          {result.keyFailureResolution?.simpleReason || result.exactFailureReason}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedSolution({
                          error:
                            result.keyFailureResolution ||
                            getFriendlyError({
                              statusCode: result.status !== 'active' ? 403 : 429,
                              errorMessage: result.exactFailureReason,
                              billingPlanType: isCredit ? 'credit' : isToken ? 'token' : 'window',
                            }),
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer self-start sm:self-center shrink-0"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>How to Resolve</span>
                    </button>
                  </div>
                )}

                {/* Status Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e7e5e4] pb-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-lg sm:text-xl font-bold text-[#1c1917]">{result.name || result.plan || 'Active Key'}</h2>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          result.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {String(result.status || 'ACTIVE').toUpperCase()}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f5f3ff] text-[#6d28d9] border border-[#ddd6fe] font-mono">
                        {isCredit ? '⚡ Credit Wallet' : isToken ? '📦 Token Pack' : '🔄 5h Rolling Pool'}
                      </span>
                      {isToken && (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono border ${
                          result.allowedModelFamilies?.includes('claude') && !result.allowedModelFamilies?.includes('openai')
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : result.allowedModelFamilies?.includes('openai') && !result.allowedModelFamilies?.includes('claude')
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : result.allowedModelFamilies?.includes('local')
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {result.allowedModelFamilies?.includes('claude') && !result.allowedModelFamilies?.includes('openai')
                            ? '⚡ Claude Frontier Models Only'
                            : result.allowedModelFamilies?.includes('openai') && !result.allowedModelFamilies?.includes('claude')
                            ? '🤖 OpenAI Frontier Models Only'
                            : result.allowedModelFamilies?.includes('local')
                            ? '🌐 Local Models Only'
                            : '⚡ Frontier Models'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-[#78716c] mt-1.5">
                      Key: <span className="text-[#1c1917] font-bold">{result.displayKey}</span> ({result.type || 'live'} key)
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-xs text-[#78716c] font-mono uppercase tracking-wider">Rate Limit</p>
                    <p className="text-base sm:text-lg font-bold text-[#1c1917] font-mono">{result.rateLimitRpm || 60} RPM</p>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* CASE A: USAGE CREDIT WALLET (Pay-As-You-Go Deductions)      */}
                {/* ========================================================= */}
                {isCredit && (
                  <div className="p-5 sm:p-6 rounded-xl bg-[#fbf9f5] border border-[#e7e5e4] space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-mono font-medium text-[#78716c] uppercase tracking-wider flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-[#6d28d9]" />
                        <span>Prepaid Usage Credit Balance (Atomic USD Deductions)</span>
                      </span>
                      <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold">
                        365-Day Validity (No 5h Resets)
                      </span>
                    </div>

                    <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#1c1917]">
                      ${Number(result.creditBalanceUsd || 0).toFixed(2)}{' '}
                      <span className="text-xs text-[#78716c] font-normal font-sans">
                        USD remaining out of ${Number((result.creditBalanceUsd || 0) + (result.totalCreditsUsedUsd || 0)).toFixed(2)} USD granted
                      </span>
                    </div>

                    <div className="w-full bg-[#e7e5e4] rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-[#6d28d9] h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, Number(consumedPercent)))}%` }}
                      />
                    </div>

                    <div className="pt-3 border-t border-[#e7e5e4] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                      <div>
                        <span className="text-[#78716c] block">Spent So Far:</span>
                        <span className="font-bold text-[#1c1917]">${Number(result.totalCreditsUsedUsd || 0).toFixed(4)} USD</span>
                      </div>
                      <div>
                        <span className="text-[#78716c] block">Purchasing Multiplier:</span>
                        <span className="font-bold text-amber-700">7x–8.75x Power Multiplier</span>
                      </div>
                      <div>
                        <span className="text-[#78716c] block">Billing Engine:</span>
                        <span className="font-bold text-violet-700">Atomically Deducted per Request</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================= */}
                {/* CASE B: CONSUMABLE TOKEN PACK (Fixed Lifetime Quota)      */}
                {/* ========================================================= */}
                {isToken && (
                  <div className="p-5 sm:p-6 rounded-xl bg-[#fbf9f5] border border-[#e7e5e4] space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-mono font-medium text-[#78716c] uppercase tracking-wider flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-emerald-700" />
                        <span>Consumable Token Quota (Fixed Non-Expiring Allowance)</span>
                      </span>
                      <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold">
                        365-Day Validity (No 5h Resets)
                      </span>
                    </div>

                    <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#1c1917]">
                      {formatTokens(result.tokensRemaining)}{' '}
                      <span className="text-xs text-[#78716c] font-normal font-sans">
                        tokens remaining out of {formatTokens(result.purchasedTokens)} total allowance
                      </span>
                    </div>

                    <div className="w-full bg-[#e7e5e4] rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, Number(consumedPercent)))}%` }}
                      />
                    </div>

                    <div className="pt-3 border-t border-[#e7e5e4] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                      <div>
                        <span className="text-[#78716c] block">Tokens Consumed:</span>
                        <span className="font-bold text-[#1c1917]">{formatTokens(result.tokensUsed)}</span>
                      </div>
                      <div>
                        <span className="text-[#78716c] block">Reset Windows:</span>
                        <span className="font-bold text-emerald-700">None (Spend as needed)</span>
                      </div>
                      <div>
                        <span className="text-[#78716c] block">Term:</span>
                        <span className="font-bold text-slate-700">365 Days Guaranteed</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-[#e7e5e4] text-xs font-mono flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-[#6d28d9] shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold text-[#1c1917] block font-sans">
                          {result.allowedModelFamilies?.includes('claude') && !result.allowedModelFamilies?.includes('openai')
                            ? 'Claude Token Plan (Isolated Claude Scope)'
                            : result.allowedModelFamilies?.includes('openai') && !result.allowedModelFamilies?.includes('claude')
                            ? 'OpenAI Token Plan (Isolated OpenAI Scope)'
                            : result.allowedModelFamilies?.includes('local')
                            ? 'Local Models Plan (Open-Weights Scope)'
                            : 'Universal Model Scope'}
                        </span>
                        <p className="text-[11px] text-[#78716c] leading-relaxed">
                          {result.allowedModelFamilies?.includes('claude') && !result.allowedModelFamilies?.includes('openai')
                            ? 'This key is strictly provisioned for Claude Frontier models (Claude Sonnet 5.5, Opus 5.5, Haiku 5.5). Gateway blocks non-Claude models to protect your token allocation.'
                            : result.allowedModelFamilies?.includes('openai') && !result.allowedModelFamilies?.includes('claude')
                            ? 'This key is strictly provisioned for OpenAI Frontier models (GPT-4o, o1, o3-mini, Codex). Gateway blocks non-OpenAI models to protect your token allocation.'
                            : result.allowedModelFamilies?.includes('local')
                            ? 'This key is provisioned for open-weights models (DeepSeek V3/R1, Grok, Qwen, GLM).'
                            : 'Universal access across configured models.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================= */}
                {/* CASE C: 5-HOUR ROLLING WINDOW (Claude & OpenAI Rolling Plans) */}
                {/* ========================================================= */}
                {isWindow && (
                  <div className="p-5 sm:p-6 rounded-xl bg-[#fbf9f5] border border-[#e7e5e4] space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-mono font-medium text-[#78716c] uppercase tracking-wider">
                        5-Hour Rolling Window Allowance (Auto-resets on cycle)
                      </span>
                      <span className="text-xs font-mono text-[#6d28d9] font-semibold">
                        {Number(consumedPercent).toFixed(1)}% Consumed in Window
                      </span>
                    </div>

                    <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#1c1917]">
                      {formatTokens(result.tokensRemaining)}{' '}
                      <span className="text-xs text-[#78716c] font-normal font-sans">
                        remaining out of {formatTokens(result.purchasedTokens)} (5h window)
                      </span>
                    </div>

                    <div className="w-full bg-[#e7e5e4] rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-[#6d28d9] h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, Number(consumedPercent)))}%` }}
                      />
                    </div>

                    {/* 5-Hour Rolling Window Reset Countdown Timer Bar */}
                    <div className="pt-3 border-t border-[#e7e5e4] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <Clock className={`w-4 h-4 ${result.windowActive ? 'text-[#6d28d9] animate-pulse' : 'text-[#a8a29e]'}`} />
                        <span className="text-[#78716c] font-medium">5h Window Reset Timer:</span>
                        {result.windowActive && secondsLeft !== null ? (
                          <span className="font-bold text-[#6d28d9] bg-[#f5f3ff] px-2.5 py-0.5 rounded border border-[#ddd6fe] text-xs">
                            Resets in {formatCountdown(secondsLeft)}
                          </span>
                        ) : (
                          <span className="font-bold text-[#78716c] bg-white px-2.5 py-0.5 rounded border border-[#e7e5e4] text-[11px]">
                            Window Inactive — Starts on 1st API request
                          </span>
                        )}
                      </div>

                      {result.windowActive && result.nextResetAt ? (
                        <span className="text-[#78716c] text-[11px]">
                          Next reset: {new Date(result.nextResetAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      ) : (
                        <span className="text-[#6d28d9] text-[11px] font-semibold">
                          ⚡ 5-hour rolling timer will activate upon initial request
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Request Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                  <div className="p-3.5 sm:p-4 rounded-xl bg-[#fbf9f5] border border-[#e7e5e4]">
                    <p className="text-[11px] text-[#78716c] font-mono uppercase tracking-wider">Total Requests</p>
                    <p className="text-lg sm:text-xl font-bold font-mono text-[#1c1917] mt-1">
                      {Number(result.totalRequests || 0).toLocaleString()}
                    </p>
                    <p className="text-[10px] font-mono text-[#78716c] mt-0.5">
                      {Number(result.requests24h || 0).toLocaleString()} in past 24h
                    </p>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-xl bg-[#fbf9f5] border border-[#e7e5e4]">
                    <p className="text-[11px] text-[#78716c] font-mono uppercase tracking-wider">Tokens Consumed</p>
                    <p className="text-lg sm:text-xl font-bold font-mono text-amber-600 mt-1">
                      {formatTokens(result.tokensUsed || (Number(result.totalInputTokens || 0) + Number(result.totalOutputTokens || 0)))}
                    </p>
                    <p className="text-[10px] font-mono text-emerald-700 mt-0.5 font-medium">
                      100% Backend Verified
                    </p>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-xl bg-[#fbf9f5] border border-[#e7e5e4]">
                    <p className="text-[11px] text-[#78716c] font-mono uppercase tracking-wider">Input / Output</p>
                    <p className="text-sm sm:text-base font-bold font-mono text-[#1c1917] mt-1.5 truncate">
                      {formatTokens(result.totalInputTokens)} / {formatTokens(result.totalOutputTokens)}
                    </p>
                    <p className="text-[10px] font-mono text-[#78716c] mt-0.5">
                      Prompt / Completion
                    </p>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-xl bg-[#fbf9f5] border border-[#e7e5e4]">
                    <p className="text-[11px] text-[#78716c] font-mono uppercase tracking-wider">Prompt Cache</p>
                    <p className="text-lg sm:text-xl font-bold font-mono text-cyan-700 mt-1">
                      {formatTokens(result.totalCachedTokens || 0)}
                    </p>
                    <p className="text-[10px] font-mono text-cyan-800 mt-0.5">
                      Cache Read Hits
                    </p>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-xl bg-[#fbf9f5] border border-[#e7e5e4]">
                    <p className="text-[11px] text-[#78716c] font-mono uppercase tracking-wider">Avg Latency</p>
                    <p className="text-lg sm:text-xl font-bold font-mono text-emerald-700 mt-1">
                      {result.avgLatencyMs ? (result.avgLatencyMs >= 1000 ? `${(result.avgLatencyMs / 1000).toFixed(2)}s` : `${result.avgLatencyMs}ms`) : '<1.0s'}
                    </p>
                    <p className="text-[10px] font-mono text-emerald-700 mt-0.5 font-semibold">
                      ⚡ &lt;10s SLA Enforced
                    </p>
                  </div>

                  {isCredit ? (
                    <div className="p-3.5 sm:p-4 rounded-xl bg-[#fbf9f5] border border-[#e7e5e4]">
                      <p className="text-[11px] text-[#78716c] font-mono uppercase tracking-wider">Available Credits</p>
                      <p className="text-lg sm:text-xl font-bold font-mono text-[#1c1917] mt-1">
                        ${Number(result.creditBalanceUsd || 0).toFixed(2)} USD
                      </p>
                      <p className="text-[10px] font-mono text-[#78716c] mt-0.5">
                        ${Number(result.totalCreditsUsedUsd || 0).toFixed(2)} spent
                      </p>
                    </div>
                  ) : (
                    <div className="p-3.5 sm:p-4 rounded-xl bg-[#fbf9f5] border border-[#e7e5e4]">
                      <p className="text-[11px] text-[#78716c] font-mono uppercase tracking-wider">Available Tokens</p>
                      <p className="text-lg sm:text-xl font-bold font-mono text-emerald-700 mt-1">
                        {formatTokens(result.tokensRemaining)}
                      </p>
                      <p className="text-[10px] font-mono text-[#78716c] mt-0.5">
                        {isWindow ? 'Current 5h cycle' : 'Prepaid balance'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Authorized Permitted Models Dropdown Box */}
                {cleanAvailableModels.length > 0 && (
                  <div className="p-4 rounded-2xl bg-[#fbf9f5] border border-[#e7e5e4] shadow-xs space-y-3">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-[#1c1917] uppercase tracking-wider">
                              Authorized Models
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-violet-50 text-violet-700 border border-violet-200">
                              {cleanAvailableModels.length} Models Permitted
                            </span>
                          </div>
                          <p className="text-[11px] text-[#78716c] font-sans">
                            Instant access through OpenAI & Anthropic API client formats
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsGridExpanded(!isGridExpanded)}
                          className="px-2.5 py-1 text-[11px] font-mono font-medium rounded-lg bg-white border border-[#e7e5e4] hover:bg-[#f5f3ff] hover:text-violet-700 hover:border-violet-300 transition-all text-[#44403c] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Layers className="w-3 h-3 text-violet-600" />
                          <span>{isGridExpanded ? 'Collapse to Dropdown' : `View Full Grid (${cleanAvailableModels.length})`}</span>
                          {isGridExpanded ? <ChevronUp className="w-3 h-3 text-violet-600" /> : <ChevronDown className="w-3 h-3 text-zinc-400" />}
                        </button>
                        <span className="hidden sm:inline-block text-[11px] font-mono text-[#78716c]">
                          Strict Gateway Enforced
                        </span>
                      </div>
                    </div>

                    {/* Compact Dropdown Selector Box */}
                    <div className="relative" ref={dropdownRef}>
                      <div
                        onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                        className={`w-full p-2.5 sm:p-3 rounded-xl bg-white border cursor-pointer transition-all flex items-center justify-between gap-2 shadow-2xs ${
                          isModelDropdownOpen
                            ? 'border-violet-500 ring-2 ring-violet-500/10'
                            : 'border-[#e7e5e4] hover:border-violet-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${activeCategory.dotColor}`} />
                          <div className="flex flex-wrap items-center gap-2 min-w-0">
                            <span className="font-mono font-bold text-xs sm:text-sm text-[#1c1917] truncate">
                              {selectedModel?.id || 'Select a permitted model...'}
                            </span>
                            {selectedModel && (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border ${activeCategory.badgeBg} ${activeCategory.badgeText} ${activeCategory.badgeBorder}`}>
                                {activeCategory.label}
                              </span>
                            )}
                            {selectedModel?.contextWindow && (
                              <span className="hidden sm:inline-block text-[10px] font-mono text-[#78716c] bg-[#fbf9f5] px-1.5 py-0.5 rounded border border-[#e7e5e4]">
                                {formatContextWindow(selectedModel.contextWindow)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {selectedModel && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyModelId(selectedModel.id);
                              }}
                              title="Copy Model ID"
                              className="p-1.5 rounded-lg hover:bg-violet-50 text-zinc-500 hover:text-violet-700 transition-colors cursor-pointer"
                            >
                              {copiedModel === selectedModel.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                          <div className="w-px h-4 bg-zinc-200" />
                          <ChevronDown
                            className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                              isModelDropdownOpen ? 'rotate-180 text-violet-600' : ''
                            }`}
                          />
                        </div>
                      </div>

                      {/* Dropdown Menu Overlay */}
                      {isModelDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl bg-white border border-[#e7e5e4] shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                          {/* Search & Category Filter Header */}
                          <div className="p-2.5 sm:p-3 border-b border-[#e7e5e4] bg-[#faf8f5] space-y-2">
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                type="text"
                                value={modelSearch}
                                onChange={(e) => setModelSearch(e.target.value)}
                                placeholder={`Search ${cleanAvailableModels.length} authorized models by name or id...`}
                                className="w-full pl-9 pr-3 py-1.5 text-xs font-mono rounded-lg bg-white border border-[#e7e5e4] focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-[#1c1917] placeholder:text-zinc-400"
                                autoFocus
                              />
                              {modelSearch && (
                                <button
                                  type="button"
                                  onClick={() => setModelSearch('')}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600"
                                >
                                  ×
                                </button>
                              )}
                            </div>

                            {/* Category Filter Pills */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              {categoryTabs.map((tab) => (
                                <button
                                  key={tab.key}
                                  type="button"
                                  onClick={() => setModelCategoryFilter(tab.key)}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                                    modelCategoryFilter === tab.key
                                      ? 'bg-violet-600 text-white shadow-2xs'
                                      : 'bg-white text-[#78716c] hover:text-[#1c1917] hover:bg-zinc-100 border border-[#e7e5e4]'
                                  }`}
                                >
                                  {tab.label} ({tab.count})
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Filtered Models List */}
                          <div className="max-h-72 overflow-y-auto divide-y divide-[#f5f3ef] custom-scrollbar">
                            {filteredDropdownModels.length === 0 ? (
                              <div className="py-8 text-center text-xs font-mono text-[#78716c]">
                                No authorized models match "{modelSearch}"
                              </div>
                            ) : (
                              filteredDropdownModels.map((m: any) => {
                                const cat = getModelCategory(m.id || m.name);
                                const isSelected = selectedModel?.id === (m.id || m.name);
                                return (
                                  <div
                                    key={m.id || m.name}
                                    onClick={() => {
                                      setSelectedModelId(m.id || m.name);
                                      setIsModelDropdownOpen(false);
                                    }}
                                    className={`p-2.5 sm:px-3 sm:py-2 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                                      isSelected
                                        ? 'bg-violet-50/80 hover:bg-violet-50'
                                        : 'hover:bg-[#faf8f5]'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <span className={`w-2 h-2 rounded-full shrink-0 ${cat.dotColor}`} />
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className={`font-mono text-xs font-bold ${isSelected ? 'text-violet-700' : 'text-[#1c1917]'}`}>
                                            {m.id || m.name}
                                          </span>
                                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${cat.badgeBg} ${cat.badgeText} ${cat.badgeBorder}`}>
                                            {cat.label}
                                          </span>
                                        </div>
                                        {m.name && m.name !== m.id && (
                                          <p className="text-[11px] text-[#78716c] truncate">
                                            {m.name}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      {m.contextWindow && (
                                        <span className="text-[10px] font-mono text-[#78716c] bg-[#fbf9f5] px-1.5 py-0.5 rounded border border-[#e7e5e4]">
                                          {formatContextWindow(m.contextWindow)}
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          copyModelId(m.id || m.name);
                                        }}
                                        title="Copy model ID"
                                        className="p-1 rounded hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                                      >
                                        {copiedModel === (m.id || m.name) ? (
                                          <Check className="w-3 h-3 text-emerald-600" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Footer with quick action hint */}
                          <div className="px-3 py-2 bg-[#fbf9f5] border-t border-[#e7e5e4] flex items-center justify-between text-[11px] font-mono text-[#78716c]">
                            <span>Showing {filteredDropdownModels.length} of {cleanAvailableModels.length} models</span>
                            <span>Click any model to select & copy ID</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Selected Model Spec Pill Bar */}
                    {selectedModel && !isGridExpanded && (
                      <div className="p-2.5 rounded-xl bg-white border border-[#e7e5e4] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[#78716c]">Model ID:</span>
                          <span className="font-bold text-[#1c1917] bg-[#f5f3ff] text-violet-700 px-2 py-0.5 rounded border border-violet-200">
                            {selectedModel.id}
                          </span>
                          <span className="text-[#78716c] hidden sm:inline">•</span>
                          <span className="text-[#78716c] hidden sm:inline">Provider: <strong className="text-[#1c1917]">{activeCategory.label}</strong></span>
                          {selectedModel.contextWindow && (
                            <>
                              <span className="text-[#78716c] hidden sm:inline">•</span>
                              <span className="text-[#78716c] hidden sm:inline">Context: <strong className="text-[#1c1917]">{formatContextWindow(selectedModel.contextWindow)}</strong></span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => copyModelId(selectedModel.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#faf8f5] hover:bg-violet-50 text-[11px] font-mono text-zinc-700 hover:text-violet-700 border border-zinc-200 transition-colors cursor-pointer"
                          >
                            {copiedModel === selectedModel.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700 font-bold">Copied ID</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Model ID</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Expandable Grouped Grid */}
                    {isGridExpanded && (
                      <div className="pt-2 border-t border-[#e7e5e4] space-y-3">
                        {groupedModelCategories.map((group) => (
                          <div key={group.key} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-mono font-bold text-[#78716c] uppercase tracking-wider flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${group.dotColor}`} />
                                <span>{group.label}</span>
                                <span className="text-zinc-400 font-normal">({group.models.length})</span>
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {group.models.map((m: any) => {
                                const isSelected = selectedModel?.id === m.id;
                                return (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedModelId(m.id);
                                      copyModelId(m.id);
                                    }}
                                    title="Click to select & copy ID"
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                                      isSelected
                                        ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                                        : 'bg-white hover:bg-violet-50 text-[#1c1917] hover:text-violet-700 border-[#e7e5e4] hover:border-violet-300'
                                    }`}
                                  >
                                    <span>{m.id}</span>
                                    {copiedModel === m.id ? (
                                      <Check className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                                    ) : (
                                      <Copy className={`w-3 h-3 opacity-40 hover:opacity-100 ${isSelected ? 'text-white' : 'text-zinc-400'}`} />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Latest 20 Request Activity Breakdown */}
                <div className="pt-4 border-t border-[#e7e5e4] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <h3 className="text-base font-bold text-[#1c1917]">Latest 20 API Requests Activity</h3>
                      <p className="text-xs text-[#78716c] font-mono mt-0.5">
                        Transparent token breakdown & latency audit log for this key
                      </p>
                    </div>
                  </div>

                  <div className="border border-[#e7e5e4] rounded-xl overflow-hidden bg-white shadow-xs">
                    {!result.recentRequests || result.recentRequests.length === 0 ? (
                      <div className="py-10 text-center text-xs font-mono text-[#78716c] px-4">
                        No recent API requests logged for this key yet. Send a request with Claude Code CLI or Cursor to see live activity.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-mono">
                          <thead>
                            <tr className="border-b border-[#e7e5e4] text-[#78716c] uppercase bg-[#fbf9f5]">
                              <th className="py-2.5 px-3 whitespace-nowrap">Date & Time</th>
                              <th className="py-2.5 px-3 whitespace-nowrap">Model Used</th>
                              <th className="py-2.5 px-3 whitespace-nowrap">Endpoint</th>
                              <th className="py-2.5 px-3 whitespace-nowrap">Status</th>
                              <th className="py-2.5 px-3 whitespace-nowrap text-right">Time Taken</th>
                              <th className="py-2.5 px-3 whitespace-nowrap text-right">Input</th>
                              <th className="py-2.5 px-3 whitespace-nowrap text-right">Output</th>
                              <th className="py-2.5 px-3 whitespace-nowrap text-right">Cache</th>
                              <th className="py-2.5 px-3 whitespace-nowrap text-right">Total Tokens</th>
                              {isCredit && (
                                <th className="py-2.5 px-3 whitespace-nowrap text-right">Credits Consumed</th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#e7e5e4]">
                            {result.recentRequests.map((req: any) => {
                              const latMs = Number(req.latencyMs || 0);
                              const latFormatted = req.formattedLatency || (latMs >= 1000 ? `${(latMs / 1000).toFixed(2)}s` : `${latMs}ms`);
                              const inTok = Number(req.inputTokens || 0);
                              const outTok = Number(req.outputTokens || 0);
                              const cachedTok = Number(req.cachedTokens || 0);
                              const totTok = Number(req.totalTokens || (inTok + outTok));
                              return (
                                <tr key={req.id} className="hover:bg-[#fbf9f5]/70 transition-colors">
                                  <td className="py-2.5 px-3 text-[#78716c] text-[11px] whitespace-nowrap">
                                    {new Date(req.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                                  </td>
                                  <td className="py-2.5 px-3 font-bold text-[#6d28d9] whitespace-nowrap">{req.model}</td>
                                  <td className="py-2.5 px-3 text-[#1c1917] text-[11px] whitespace-nowrap">{req.endpoint}</td>
                                  <td className="py-2.5 px-3 whitespace-nowrap">
                                    {req.statusCode < 400 ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        <span>Success</span>
                                      </span>
                                    ) : (
                                      <div className="flex flex-col gap-1 items-start">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1 w-fit">
                                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                          <span>
                                            {req.friendlyError?.simpleTitle ||
                                              (req.statusCode === 503
                                                ? '503 (Cluster Busy)'
                                                : req.statusCode === 429
                                                ? '429 (Quota Limit)'
                                                : `${req.statusCode} (${req.errorCode || 'Failed'})`)}
                                          </span>
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setSelectedSolution({
                                              error:
                                                req.friendlyError ||
                                                getFriendlyError({
                                                  statusCode: req.statusCode,
                                                  errorCode: req.errorCode,
                                                  errorMessage: req.errorMessage,
                                                  model: req.model,
                                                  billingPlanType: result.billingType,
                                                }),
                                              rawEvent: req,
                                            })
                                          }
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors shadow-2xs cursor-pointer"
                                        >
                                          <Wrench className="w-3 h-3 text-rose-500" />
                                          <span>How to Resolve</span>
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                    <span className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-bold border inline-flex items-center gap-1 ${
                                      latMs < 5000
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : latMs < 10000
                                        ? 'bg-teal-50 text-teal-800 border-teal-200'
                                        : 'bg-amber-50 text-amber-800 border-amber-200'
                                    }`}>
                                      {latFormatted}
                                      {req.streaming && (
                                        <span className="text-[9px] px-1 py-0.1 rounded bg-white/70 border border-current font-sans font-semibold">
                                          SSE
                                        </span>
                                      )}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right text-[#78716c] font-mono whitespace-nowrap">
                                    {inTok.toLocaleString()}
                                  </td>
                                  <td className="py-2.5 px-3 text-right text-[#78716c] font-mono whitespace-nowrap">
                                    {outTok.toLocaleString()}
                                  </td>
                                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                    {cachedTok > 0 ? (
                                      <span className="px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200 text-[10px] font-bold font-mono">
                                        {cachedTok.toLocaleString()}
                                      </span>
                                    ) : (
                                      <span className="text-[#a8a29e] font-mono text-[11px]">0</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-bold text-[#1c1917] font-mono whitespace-nowrap">
                                    <span>{totTok.toLocaleString()}</span>
                                    {req.isEstimated && (
                                      <span
                                        className="ml-1.5 text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-sans"
                                        title="Estimated via length heuristics"
                                      >
                                        ESTIMATED
                                      </span>
                                    )}
                                  </td>
                                  {isCredit && (
                                    <td className="py-2.5 px-3 font-bold text-emerald-700 text-right font-mono whitespace-nowrap">
                                      ${Number(req.costDeductedUsd || req.costUsd || req.customerCostUsd || 0).toFixed(4)} USD
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rate Limits Footer */}
                <div className="pt-3 border-t border-[#e7e5e4] flex flex-wrap items-center justify-between text-xs text-[#78716c] font-mono">
                  <span>Rate Limit: {result.rateLimitRpm || 60} RPM • Standard</span>
                  <span>Zero retention proxy active</span>
                </div>
              </div>
            )}
          </div>
        )}

        <ErrorSolutionModal
          isOpen={Boolean(selectedSolution)}
          onClose={() => setSelectedSolution(null)}
          error={selectedSolution?.error || null}
          rawEvent={selectedSolution?.rawEvent || null}
        />
      </main>

      <SiteFooter />
    </div>
  );
};

export default CheckKeyPage;
