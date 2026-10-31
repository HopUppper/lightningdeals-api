import React, { useState, useEffect } from 'react';
import {
  Server,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Sparkles,
  Cpu,
  Coins,
  Send,
  Code,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  DollarSign,
  Activity,
  Key,
  Eye,
  EyeOff,
  X,
  Check,
} from 'lucide-react';
import { adminFetch } from '../../utils/api';

interface ScaleMaxKeyTelemetry {
  keyIndex: number;
  role: string;
  shortRole: string;
  description: string;
  keyPrefix: string;
  status: 'HEALTHY' | 'ERROR' | 'SUPERSEDED' | 'UNCONFIGURED' | 'UNREACHABLE';
  statusCode?: number;
  latencyMs: number | null;
  vendorLabel?: string;
  mode?: string;
  providerScope?: string;
  rpmLimit?: number;
  creditsBalanceUsd?: number;
  totalPurchasedUsd?: number;
  lifetimeSpendUsd?: number;
  todaySpendUsd?: number;
  requestsTotal?: number;
  tokensInput?: number;
  tokensOutput?: number;
  targetModels: string;
  endpoint: string;
  modelsCount: number;
  models: string[];
  error?: string;
  rawSummary?: any;
}

export const AdminScaleMaxLive: React.FC = () => {
  const [keys, setKeys] = useState<ScaleMaxKeyTelemetry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [autoRefreshSecs, setAutoRefreshSecs] = useState<number>(3);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedModelsKey, setExpandedModelsKey] = useState<number | null>(null);

  // Live Test Inference State
  const [testKeyIndex, setTestKeyIndex] = useState<number>(1);
  const [testModel, setTestModel] = useState<string>('claude-sonnet-4-6[1m]');
  const [testPrompt, setTestPrompt] = useState<string>('Say hello in 3 words');
  const [testingInference, setTestingInference] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  // Key Add / Update Modal State
  const [updateModalKey, setUpdateModalKey] = useState<ScaleMaxKeyTelemetry | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [validatingKey, setValidatingKey] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    latencyMs?: number;
    modelsCount?: number;
    keyLabel?: string;
    creditsBalanceUsd?: number;
    error?: string;
  } | null>(null);
  const [savingKey, setSavingKey] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const handleOpenUpdateModal = (k: ScaleMaxKeyTelemetry) => {
    setUpdateModalKey(k);
    setKeyInput('');
    setShowKeySecret(false);
    setValidationResult(null);
    setSaveSuccessMsg(null);
  };

  const handleValidateKey = async () => {
    if (!keyInput.trim()) return;
    setValidatingKey(true);
    setValidationResult(null);
    try {
      const res = await adminFetch('/api/admin/providers/scalemax/validate-key', {
        method: 'POST',
        body: JSON.stringify({ apiKey: keyInput.trim() }),
      });
      const data = await res.json();
      setValidationResult(data);
    } catch (err: any) {
      setValidationResult({ valid: false, error: err.message || 'Validation request failed' });
    } finally {
      setValidatingKey(false);
    }
  };

  const handleSaveKey = async () => {
    if (!updateModalKey || !keyInput.trim()) return;
    setSavingKey(true);
    try {
      const res = await adminFetch('/api/admin/providers/scalemax/update-key', {
        method: 'POST',
        body: JSON.stringify({
          keyIndex: updateModalKey.keyIndex,
          apiKey: keyInput.trim(),
        }),
      });
      if (res.ok) {
        setSaveSuccessMsg('Master key successfully activated!');
        await fetchLiveStatus(false);
        setTimeout(() => {
          setUpdateModalKey(null);
          setSaveSuccessMsg(null);
        }, 1200);
      } else {
        const err = await res.json();
        alert(err.error?.message || 'Failed to update key');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setSavingKey(false);
    }
  };

  const fetchLiveStatus = async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const res = await adminFetch('/api/admin/providers/scalemax/live-status');
      if (res.ok) {
        const data = await res.json();
        if (data.keys && Array.isArray(data.keys)) {
          setKeys(data.keys);
        }
        setLastRefreshedAt(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch ScaleMax live status:', err);
    } finally {
      if (!isSilent) {
        setIsRefreshing(false);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchLiveStatus(false);
  }, []);

  // Live auto-refresh polling
  useEffect(() => {
    if (autoRefreshSecs <= 0) return;
    const timer = setInterval(() => {
      fetchLiveStatus(true);
    }, autoRefreshSecs * 1000);
    return () => clearInterval(timer);
  }, [autoRefreshSecs]);

  const handleTestInference = async () => {
    setTestingInference(true);
    setTestResult(null);
    try {
      const res = await adminFetch('/api/admin/providers/scalemax/test-inference', {
        method: 'POST',
        body: JSON.stringify({
          keyIndex: testKeyIndex,
          model: testModel,
          prompt: testPrompt,
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ error: err.message });
    } finally {
      setTestingInference(false);
    }
  };

  const activeKeysCount = keys.filter((k) => k.status === 'HEALTHY').length;
  const totalModelsCount = keys.reduce((acc, k) => acc + (k.modelsCount || 0), 0);
  const totalBalanceUsd = keys.reduce((acc, k) => acc + (k.creditsBalanceUsd || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* ============================================================ */}
      {/* HEADER WITH LIVE AUTO-REFRESH CONTROLS                      */}
      {/* ============================================================ */}
      <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-100 text-violet-700">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-[#111827] tracking-tight">
                  ScaleMax Live Key Telemetry
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  REAL-TIME UPSTREAM
                </span>
              </div>
              <p className="text-xs text-[#6b7280]">
                Direct live ping telemetry and mapping for all 3 ScaleMax supplier keys (Claude, OpenAI, Local).
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Auto Refresh Toggle */}
          <div className="flex items-center gap-1.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl p-1 text-xs font-mono">
            <span className="text-[11px] text-[#6b7280] px-2 font-bold">
              {autoRefreshSecs > 0 ? `LIVE: ${autoRefreshSecs}s` : 'PAUSED'}
            </span>
            {[2, 3, 5].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setAutoRefreshSecs(sec)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  autoRefreshSecs === sec
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-[#6b7280] hover:text-[#111827]'
                }`}
              >
                {sec}s
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAutoRefreshSecs(autoRefreshSecs === 0 ? 3 : 0)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                autoRefreshSecs === 0
                  ? 'bg-[#111827] text-white'
                  : 'text-[#6b7280] hover:text-[#111827]'
              }`}
            >
              {autoRefreshSecs === 0 ? 'Resume' : 'Pause'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchLiveStatus(false)}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-[#111827] hover:bg-black text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh All'}</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SUMMARY KPI RIBBON                                           */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#6b7280]">
            <span>Active Supplier Keys</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-[#111827]">
            {activeKeysCount} / {keys.length} Live Active
          </div>
          <p className="text-[11px] text-[#6b7280]">
            Dual replacement keys online (Claude + Local)
          </p>
        </div>

        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#6b7280]">
            <span>Live Models Ingress</span>
            <Sparkles className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-2xl font-extrabold text-[#111827]">
            {totalModelsCount} Models
          </div>
          <p className="text-[11px] text-[#6b7280]">
            32 Frontier (Claude/OpenAI) + 45 Local models
          </p>
        </div>

        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#6b7280]">
            <span>ScaleMax USD Balance</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">
            ${totalBalanceUsd.toFixed(2)} USD
          </div>
          <p className="text-[11px] text-[#6b7280]">
            Upstream credit compute available
          </p>
        </div>

        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#6b7280]">
            <span>Last Telemetry Sync</span>
            <Clock className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-sm font-bold font-mono text-[#111827]">
            {lastRefreshedAt.toLocaleTimeString()}
          </div>
          <p className="text-[11px] text-[#6b7280]">
            Auto-polling upstream every {autoRefreshSecs}s
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3 MAPPED SCALEMAX KEY DETAILS CARDS                         */}
      {/* ============================================================ */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-extrabold text-[#111827] flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-600" />
            <span>Mapped ScaleMax Supplier Keys (3 Keys Telemetry)</span>
          </h2>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Clear segregation of responsibilities between Claude/OpenAI Frontier keys, Local Models keys, and legacy keys.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {keys.map((k) => {
            const isHealthy = k.status === 'HEALTHY';
            const isSuperseded = k.status === 'SUPERSEDED';
            const isExpanded = expandedModelsKey === k.keyIndex;

            return (
              <div
                key={k.keyIndex}
                className={`rounded-2xl bg-white border p-6 flex flex-col justify-between space-y-5 transition-all shadow-xs ${
                  isHealthy
                    ? 'border-violet-200 ring-1 ring-violet-500/10'
                    : isSuperseded
                    ? 'border-[#e5e7eb] bg-[#fdfdfd] opacity-90'
                    : 'border-rose-200'
                }`}
              >
                {/* Card Top: Role & Status */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 font-bold border border-violet-100">
                      KEY #{k.keyIndex}: {k.shortRole}
                    </span>
                    {isHealthy && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ACTIVE (200 OK)
                      </span>
                    )}
                    {isSuperseded && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                        SUPERSEDED
                      </span>
                    )}
                    {!isHealthy && !isSuperseded && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        {k.status}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-[#111827]">
                      {k.role}
                    </h3>
                    <p className="text-xs text-[#6b7280] leading-relaxed mt-1">
                      {k.description}
                    </p>

                    {/* Associated Plan Categories Badge */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-2">
                      <span className="text-[10px] text-[#6b7280] font-bold uppercase tracking-wider">Serves:</span>
                      {k.keyIndex === 1 && (
                        <>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-100 text-violet-800 font-bold">Claude Tokens</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">OpenAI Tokens</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">API Credits</span>
                        </>
                      )}
                      {k.keyIndex === 2 && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">Local Models Tokens (DeepSeek, Grok, Qwen, GLM)</span>
                      )}
                      {k.keyIndex === 3 && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-bold">Wholesale Credit Master / Backup Reserve</span>
                      )}
                    </div>
                  </div>

                  {/* Key Prefix & Vendor Label Banner */}
                  <div className="p-3 rounded-xl bg-[#f9fafb] border border-[#e5e7eb] font-mono text-xs space-y-1">
                    <div className="flex items-center justify-between text-[#6b7280] text-[11px]">
                      <span>Credential Prefix:</span>
                      <strong className="text-[#111827]">{k.keyPrefix}</strong>
                    </div>
                    {k.vendorLabel && (
                      <div className="flex items-center justify-between text-[#6b7280] text-[11px]">
                        <span>Vendor Label:</span>
                        <span className="text-violet-700 font-bold">{k.vendorLabel}</span>
                      </div>
                    )}
                    {k.providerScope && (
                      <div className="flex items-center justify-between text-[#6b7280] text-[11px]">
                        <span>Provider Scope:</span>
                        <span className="font-bold uppercase text-[#111827]">{k.providerScope}</span>
                      </div>
                    )}
                    {k.latencyMs !== null && (
                      <div className="flex items-center justify-between text-[#6b7280] text-[11px]">
                        <span>Ping Latency:</span>
                        <span className="text-emerald-700 font-bold">{k.latencyMs}ms</span>
                      </div>
                    )}
                  </div>

                  {/* Metrics Grid */}
                  {isHealthy && (
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                      <div className="p-2.5 rounded-xl bg-white border border-[#e5e7eb] space-y-0.5">
                        <span className="text-[10px] text-[#6b7280] uppercase block font-bold">Live Balance</span>
                        <span className="text-base font-extrabold text-emerald-700 block">
                          ${(k.creditsBalanceUsd || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-[#e5e7eb] space-y-0.5">
                        <span className="text-[10px] text-[#6b7280] uppercase block font-bold">Rate Limit</span>
                        <span className="text-base font-extrabold text-[#111827] block">
                          {k.rpmLimit || 60} RPM
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-[#e5e7eb] space-y-0.5">
                        <span className="text-[10px] text-[#6b7280] uppercase block font-bold">Requests Done</span>
                        <span className="text-sm font-bold text-[#111827] block">
                          {k.requestsTotal || 0}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-[#e5e7eb] space-y-0.5">
                        <span className="text-[10px] text-[#6b7280] uppercase block font-bold">Models Count</span>
                        <span className="text-sm font-bold text-violet-700 block">
                          {k.modelsCount} Models
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Clarification Notice for Superseded Key */}
                  {isSuperseded && (
                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700 space-y-1">
                      <div className="font-bold text-stone-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-stone-600" />
                        <span>Superseded by Vendor</span>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-relaxed">
                        The vendor replaced this initial wholesale test key with the two active keys on the left (sm_live_9438 for Claude/OpenAI and sm_live_8bea for Local Models). Kept in records for audit tracking.
                      </p>
                    </div>
                  )}

                  {/* Models List Accordion */}
                  {k.models && k.models.length > 0 && (
                    <div className="pt-2 border-t border-[#e5e7eb]">
                      <button
                        type="button"
                        onClick={() => setExpandedModelsKey(isExpanded ? null : k.keyIndex)}
                        className="w-full flex items-center justify-between text-xs text-violet-700 font-bold hover:text-violet-900 cursor-pointer py-1"
                      >
                        <span>
                          {isExpanded ? 'Hide Models' : `View All ${k.models.length} Upstream Models`}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-2.5 rounded-xl bg-[#f9fafb] border border-[#e5e7eb] max-h-48 overflow-y-auto space-y-1 text-[11px] font-mono">
                          {k.models.map((m) => (
                            <div
                              key={m}
                              className="px-2 py-1 rounded bg-white border border-[#e5e7eb] text-[#111827] flex items-center justify-between"
                            >
                              <span>{m}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setTestKeyIndex(k.keyIndex);
                                  setTestModel(m);
                                }}
                                className="text-[10px] text-violet-600 hover:underline cursor-pointer font-sans"
                              >
                                Test Ping
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions: Direct Add/Update Key + Test Ping */}
                <div className="pt-3 border-t border-[#e5e7eb] space-y-2">
                  <button
                    type="button"
                    onClick={() => handleOpenUpdateModal(k)}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      !isHealthy && !isSuperseded
                        ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-xs'
                        : 'bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200'
                    }`}
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{k.keyPrefix === 'Not Configured' ? 'Configure Master Key' : 'Update Master Key'}</span>
                  </button>

                  {isHealthy && (
                    <button
                      type="button"
                      onClick={() => {
                        setTestKeyIndex(k.keyIndex);
                        setTestModel(k.models[0] || (k.keyIndex === 2 ? 'qwen-3.7-flash' : 'claude-sonnet-4-6[1m]'));
                        const el = document.getElementById('test-inference-console');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full py-2 rounded-xl bg-[#111827] hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Ping This Key in Live Console</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* LIVE UPSTREAM INFERENCE TEST CONSOLE                         */}
      {/* ============================================================ */}
      <div
        id="test-inference-console"
        className="bg-white border border-[#e5e7eb] rounded-2xl p-6 shadow-xs space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e5e7eb] pb-4">
          <div className="space-y-0.5">
            <h2 className="text-base font-extrabold text-[#111827] flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-600 fill-current" />
              <span>Interactive Upstream Test Console</span>
            </h2>
            <p className="text-xs text-[#6b7280]">
              Dispatch a real 1-token test prompt to ScaleMax upstream to verify latency, authentication, and error codes.
            </p>
          </div>
          <span className="text-xs font-mono text-[#6b7280]">
            Target: https://api.scalemax.pro/v1
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Key Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#111827] block">Select Supplier Key</label>
            <select
              value={testKeyIndex}
              onChange={(e) => {
                const idx = Number(e.target.value);
                setTestKeyIndex(idx);
                const selectedKeyObj = keys.find((k) => k.keyIndex === idx);
                if (selectedKeyObj && selectedKeyObj.models.length > 0) {
                  setTestModel(selectedKeyObj.models[0]);
                } else if (idx === 2) {
                  setTestModel('qwen-3.7-flash');
                } else {
                  setTestModel('claude-sonnet-4-6[1m]');
                }
              }}
              className="w-full p-2.5 text-xs bg-[#f9fafb] border border-[#d1d5db] rounded-xl text-[#111827] font-mono focus:border-violet-600 focus:outline-none"
            >
              <option value={1}>Key 1: Claude & OpenAI Frontier Key (sm_live_9438)</option>
              <option value={2}>Key 2: Local & Open-Weights Models Key (sm_live_8bea)</option>
              <option value={3}>Key 3: Initial Master Key (sm_live_5af4 - Rotated)</option>
            </select>
          </div>

          {/* Model Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#111827] block">Select Model</label>
            <input
              type="text"
              value={testModel}
              onChange={(e) => setTestModel(e.target.value)}
              placeholder="e.g. claude-sonnet-4-6[1m] or qwen-3.7-flash"
              className="w-full p-2.5 text-xs bg-[#f9fafb] border border-[#d1d5db] rounded-xl text-[#111827] font-mono focus:border-violet-600 focus:outline-none"
            />
          </div>

          {/* Test Prompt */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#111827] block">Test Prompt</label>
            <input
              type="text"
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              placeholder="e.g. Respond with PING_OK"
              className="w-full p-2.5 text-xs bg-[#f9fafb] border border-[#d1d5db] rounded-xl text-[#111827] font-mono focus:border-violet-600 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={handleTestInference}
            disabled={testingInference}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Send className={`w-3.5 h-3.5 ${testingInference ? 'animate-pulse' : ''}`} />
            <span>{testingInference ? 'Pinging Upstream ScaleMax...' : 'Send Live Test Request'}</span>
          </button>
        </div>

        {/* Live Result Viewer */}
        {testResult && (
          <div className="mt-4 p-4 rounded-xl bg-[#0f172a] text-white font-mono text-xs space-y-2 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${testResult.success ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                HTTP Status: <strong>{testResult.statusCode || (testResult.error ? 'ERROR' : 200)}</strong>
              </span>
              <span>Latency: <strong>{testResult.latencyMs}ms</strong></span>
              <span>Endpoint: {testResult.endpoint}</span>
            </div>
            <pre className="overflow-x-auto text-[11px] text-emerald-300 whitespace-pre-wrap max-h-60">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* KEY ARCHITECTURE & ROUTING RULES MAPPING GUIDE              */}
      {/* ============================================================ */}
      <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-extrabold text-[#111827] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>How ScaleMax Keys Map to LightningAPI Customers</span>
          </h2>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Architecture and token isolation rules ensuring 100% security and zero cross-tenant leakage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#f9fafb] border border-[#e5e7eb] space-y-2">
            <div className="font-bold text-[#111827] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-violet-600" />
              <span>5-Hour Rolling Plans (Claude)</span>
            </div>
            <p className="text-[#6b7280] leading-relaxed">
              Customer requests (<code className="font-mono text-violet-700">ld_live_...</code>) are routed via Key 1 (<code className="font-mono">sm_live_9438</code>) to Anthropic models. The 5-hour rolling pool is tracked mathematically on the LightningAPI gateway.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#f9fafb] border border-[#e5e7eb] space-y-2">
            <div className="font-bold text-[#111827] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Usage Credit Plans (7x Value)</span>
            </div>
            <p className="text-[#6b7280] leading-relaxed">
              Universal key works across Claude, OpenAI, and Local models. Customer credits are atomically deducted per token based on exact prompt + completion token counts returned by ScaleMax.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#f9fafb] border border-[#e5e7eb] space-y-2">
            <div className="font-bold text-[#111827] flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-emerald-600" />
              <span>Prepaid Consumable Tokens</span>
            </div>
            <p className="text-[#6b7280] leading-relaxed">
              Customers receive a fixed non-expiring quota (e.g. 5M, 20M, 50M) without 5-hour rolling resets. Routed to the corresponding supplier key based on model family requested.
            </p>
          </div>
        </div>
      </div>
      {/* ============================================================ */}
      {/* ADD / UPDATE MASTER KEY MODAL                                */}
      {/* ============================================================ */}
      {updateModalKey && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-violet-100 text-violet-700">
                    <Key className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-extrabold text-[#111827]">
                    {updateModalKey.keyPrefix === 'Not Configured' ? 'Configure Master Key' : 'Update Master Key'}
                  </h3>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 font-bold border border-violet-100">
                    KEY #{updateModalKey.keyIndex}
                  </span>
                </div>
                <p className="text-xs text-[#6b7280]">
                  {updateModalKey.role}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUpdateModalKey(null)}
                className="text-[#9ca3af] hover:text-[#111827] p-1.5 rounded-lg hover:bg-[#f3f4f6] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Plans Served Notice */}
            <div className="p-3 rounded-xl bg-violet-50/60 border border-violet-100 space-y-1">
              <span className="text-[10px] text-violet-900 font-bold uppercase tracking-wider block">
                Associated Customer Plans:
              </span>
              <p className="text-xs text-violet-800 leading-relaxed">
                {updateModalKey.keyIndex === 1 && 'Serves Claude Token Plans, OpenAI Token Plans, and Claude + OpenAI Credit Plans.'}
                {updateModalKey.keyIndex === 2 && 'Serves Local Models Token Plans (DeepSeek V3/V4, Grok, Qwen, GLM, etc.).'}
                {updateModalKey.keyIndex === 3 && 'Serves Legacy Credit Master / Wholesale Backup Reserve.'}
              </p>
            </div>

            {/* Current Status Pill */}
            <div className="p-3 rounded-xl bg-[#f9fafb] border border-[#e5e7eb] flex items-center justify-between text-xs font-mono">
              <span className="text-[#6b7280]">Current Key Prefix:</span>
              <strong className="text-[#111827]">{updateModalKey.keyPrefix}</strong>
            </div>

            {/* Input Form */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider">
                New ScaleMax API Key *
              </label>
              <div className="relative">
                <input
                  type={showKeySecret ? 'text' : 'password'}
                  value={keyInput}
                  onChange={(e) => {
                    setKeyInput(e.target.value);
                    setValidationResult(null);
                  }}
                  placeholder="sm_live_..."
                  className="w-full pl-3 pr-24 py-2.5 text-xs bg-[#f9fafb] border border-[#d1d5db] rounded-xl text-[#111827] font-mono focus:border-violet-600 focus:bg-white focus:outline-none"
                  autoFocus
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowKeySecret(!showKeySecret)}
                    className="p-1.5 text-[#6b7280] hover:text-[#111827] rounded-md transition-colors"
                    title={showKeySecret ? 'Hide Key' : 'Show Key'}
                  >
                    {showKeySecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const clip = await navigator.clipboard.readText();
                        if (clip) {
                          setKeyInput(clip.trim());
                          setValidationResult(null);
                        }
                      } catch {}
                    }}
                    className="px-2 py-1 text-[10px] font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded border border-violet-200 transition-colors"
                  >
                    Paste
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-[#6b7280]">
                Enter the live API key provided by ScaleMax for this plan group.
              </p>
            </div>

            {/* Validation Banner */}
            {validationResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-mono space-y-1 ${
                  validationResult.valid
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {validationResult.valid ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Validation Passed (200 OK)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Validation Failed</span>
                    </>
                  )}
                </div>
                {validationResult.valid ? (
                  <div className="text-[11px] space-y-0.5 text-emerald-800">
                    <p>Ping Latency: {validationResult.latencyMs}ms | Models Available: {validationResult.modelsCount}</p>
                    <p>Key Label: {validationResult.keyLabel} | Live Balance: ${(validationResult.creditsBalanceUsd || 0).toFixed(2)}</p>
                  </div>
                ) : (
                  <p className="text-[11px] text-rose-700">{validationResult.error}</p>
                )}
              </div>
            )}

            {saveSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-[#e5e7eb]">
              <button
                type="button"
                onClick={handleValidateKey}
                disabled={!keyInput.trim() || validatingKey || savingKey}
                className="px-3.5 py-2 rounded-xl bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#111827] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${validatingKey ? 'animate-spin' : ''}`} />
                <span>{validatingKey ? 'Testing Connection...' : 'Test Connection'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUpdateModalKey(null)}
                  disabled={savingKey}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveKey}
                  disabled={!keyInput.trim() || savingKey}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{savingKey ? 'Activating...' : 'Save & Activate Key'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminScaleMaxLive;
