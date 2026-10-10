import React, { useState, useEffect } from 'react';
import { Key, AlertCircle, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { ElectricNavbar } from '../components/ElectricNavbar';
import { ElectricFooter } from '../components/ElectricFooter';

export const CheckKeyPage: React.FC = () => {
  const [keyInput, setKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

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
    if (!result || !result.windowActive || result.windowResetSeconds == null) {
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

  const purchasedNum = Number(result?.purchasedTokens || 0);
  const usedNum = Number(result?.tokensUsed || 0);
  const consumedPercent = result?.consumptionPercent != null
    ? result.consumptionPercent
    : purchasedNum > 0
    ? (usedNum / purchasedNum) * 100
    : 0;

  return (
    <div className="min-h-screen bg-[#fbf9f5] text-[#1c1917] flex flex-col font-sans antialiased selection:bg-[#6d28d9]/10 selection:text-[#6d28d9]">
      <ElectricNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center max-w-2xl mx-auto space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium uppercase tracking-wider bg-[#f5f3ff] text-[#6d28d9] border border-[#ddd6fe]">
            <Sparkles className="w-3 h-3 text-[#6d28d9]" />
            <span>Key Telemetry & Rolling Window Inspector</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#1c1917]">
            Check your API Key rolling balance & rate limit
          </h1>
          <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed max-w-xl mx-auto">
            Enter your LightningAPI key to inspect your 5-hour rolling token window, live reset countdown, rate limits, and audit logs.
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
              placeholder="ld_live_... or ld_trial_..."
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
                  <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-mono flex items-start gap-3 shadow-xs">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-rose-900 text-sm font-sans">API Key Attention Required</p>
                      <p className="text-rose-700 font-mono text-xs">{result.exactFailureReason}</p>
                    </div>
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
                        {result.plan || 'Claude Max 20x'}
                      </span>
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

                {/* 5-Hour Rolling Token Allowance Card */}
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

                {/* Request Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="p-4 rounded-xl bg-[#fbf9f5] border border-[#e7e5e4]">
                    <p className="text-xs text-[#78716c] font-mono uppercase">Total Requests</p>
                    <p className="text-lg sm:text-xl font-bold font-mono text-[#1c1917] mt-1">
                      {Number(result.totalRequests || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#fbf9f5] border border-[#e7e5e4]">
                    <p className="text-xs text-[#78716c] font-mono uppercase">24h Requests</p>
                    <p className="text-lg sm:text-xl font-bold font-mono text-[#1c1917] mt-1">
                      {Number(result.requests24h || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#fbf9f5] border border-[#e7e5e4]">
                    <p className="text-xs text-[#78716c] font-mono uppercase">Input Tokens</p>
                    <p className="text-lg sm:text-xl font-bold font-mono text-[#1c1917] mt-1">
                      {formatTokens(result.totalInputTokens)}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#fbf9f5] border border-[#e7e5e4]">
                    <p className="text-xs text-[#78716c] font-mono uppercase">Output Tokens</p>
                    <p className="text-lg sm:text-xl font-bold font-mono text-[#1c1917] mt-1">
                      {formatTokens(result.totalOutputTokens)}
                    </p>
                  </div>
                </div>

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
                              <th className="py-2.5 px-3 whitespace-nowrap">Input</th>
                              <th className="py-2.5 px-3 whitespace-nowrap">Output</th>
                              <th className="py-2.5 px-3 whitespace-nowrap">Total Tokens</th>
                              <th className="py-2.5 px-3 whitespace-nowrap">Latency</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#e7e5e4]">
                            {result.recentRequests.map((req: any) => (
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
                                    <div className="flex flex-col" title={req.errorMessage || req.errorCode || 'Failed'}>
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1 w-fit">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                        <span>
                                          {req.statusCode === 503
                                            ? '503 (Upstream Outage)'
                                            : req.statusCode === 429
                                            ? '429 (Rate Limit)'
                                            : `${req.statusCode} (${req.errorCode || 'Failed'})`}
                                        </span>
                                      </span>
                                      {req.errorMessage && (
                                        <span className="text-[9px] text-rose-500 truncate max-w-[200px] mt-0.5 font-normal">
                                          {req.errorMessage}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-[#78716c]">{req.inputTokens?.toLocaleString()}</td>
                                <td className="py-2.5 px-3 text-[#78716c]">{req.outputTokens?.toLocaleString()}</td>
                                <td className="py-2.5 px-3 font-bold text-[#1c1917]">
                                  <span>{req.totalTokens?.toLocaleString()}</span>
                                  {req.isEstimated && (
                                    <span
                                      className="ml-1.5 text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-sans"
                                      title="Estimated via length heuristics"
                                    >
                                      ESTIMATED
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-[#78716c]">{req.latencyMs} ms</td>
                              </tr>
                            ))}
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
      </main>

      <ElectricFooter />
    </div>
  );
};

export default CheckKeyPage;
