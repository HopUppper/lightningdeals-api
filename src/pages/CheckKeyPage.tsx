import React, { useState, useEffect } from 'react';
import { Key, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const CheckKeyPage: React.FC = () => {
  const [keyInput, setKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!result || !result.windowActive || result.windowResetSeconds == null) {
      setSecondsLeft(null);
      return;
    }

    setSecondsLeft(result.windowResetSeconds);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev == null || prev <= 1) {
          return 5 * 3600; // Reset cycle
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


  const handleCheckKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const keyToUse = keyInput.trim() || (document.querySelector('input')?.value || '').trim();
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
      setError('Network error checking key. Make sure server is online.');
    } finally {
      setLoading(false);
    }
  };


  const formatTokens = (val: string | number) => {
    const num = Number(val || 0);
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-5 py-12">
        <div className="text-center max-w-2xl mx-auto">
          <div className="ui-kicker justify-center mb-3">
            <Key className="w-3.5 h-3.5" />
            <span>Key Status & Rolling Window Checker</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-fg mb-3">
            Check your API Key rolling balance & rate limit
          </h1>
          <p className="text-muted text-sm sm:text-base leading-relaxed">
            Enter your LightningDeals API key to inspect your 5-hour rolling token window, rate limits, and usage metrics.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleCheckKey} className="mt-8 max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="ld_live_... or ld_trial_..."
              className="w-full pl-10 pr-4 py-3 text-sm font-mono bg-card border border-border rounded-control focus:outline-none focus:border-accent text-fg"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="ui-button-primary justify-center py-3 px-6 text-sm font-semibold disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check API Key'}
          </button>
        </form>

        {/* Error Alert */}
        {error && (
          <div className="mt-6 max-w-2xl mx-auto p-4 rounded-control border border-red-500/30 bg-red-500/5 text-red-600 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Results Card */}
        {result && (
          <div className="mt-8 bg-card border border-border rounded-panel p-6 sm:p-8 animate-in fade-in duration-200">
            {!result.valid ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-fg">Invalid API Key</h3>
                <p className="text-muted text-sm mt-1">This API key does not exist or was deleted.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Status Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-bold text-fg">{result.name}</h2>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        result.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" />
                        {result.status.toUpperCase()}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 font-mono font-bold">
                        {result.plan || 'Claude Max 20x'}
                      </span>

                    </div>
                    <p className="text-xs font-mono text-muted mt-1.5">
                      Key: <span className="text-fg font-bold">{result.displayKey}</span> ({result.type} key)
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-muted font-mono uppercase tracking-wider">Rate Limit</p>
                    <p className="text-lg font-bold text-fg font-mono">{result.rateLimitRpm} RPM</p>
                  </div>
                </div>

                {/* 5-Hour Rolling Token Allowance Card */}
                <div className="p-6 rounded-control bg-bg border border-border/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium text-muted uppercase tracking-wider">
                      5-Hour Rolling Window Allowance (Auto-resets on cycle)
                    </span>
                    <span className="text-xs font-mono text-accent font-semibold">
                      {((Number(result.tokensUsed) / Number(result.purchasedTokens)) * 100).toFixed(1)}% Consumed in Window
                    </span>
                  </div>

                  <div className="text-3xl font-extrabold font-mono text-fg">
                    {formatTokens(result.tokensRemaining)} <span className="text-xs text-muted font-normal font-sans">remaining out of {formatTokens(result.purchasedTokens)} (5h window)</span>
                  </div>

                  <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (Number(result.tokensUsed) / Number(result.purchasedTokens)) * 100)}%` }}
                    />
                  </div>

                  {/* 5-Hour Rolling Window Reset Countdown Timer Bar */}
                  <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <Clock className={`w-4 h-4 ${result.windowActive ? 'text-amber-500 animate-pulse' : 'text-muted'}`} />
                      <span className="text-muted font-medium">5h Window Reset Timer:</span>
                      {result.windowActive && secondsLeft !== null ? (
                        <span className="font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20 text-xs">
                          Resets in {formatCountdown(secondsLeft)}
                        </span>
                      ) : (
                        <span className="font-bold text-muted bg-card px-2.5 py-0.5 rounded border border-border text-[11px]">
                          Window Inactive — Starts on 1st API request
                        </span>
                      )}
                    </div>

                    {result.windowActive && result.nextResetAt ? (
                      <span className="text-muted text-[11px]">
                        Next reset: {new Date(result.nextResetAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    ) : (
                      <span className="text-amber-500/80 text-[11px] font-semibold">
                        ⚡ 5-hour rolling timer will activate upon initial request
                      </span>
                    )}
                  </div>
                </div>


                {/* Request Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-control bg-bg border border-border/60">
                    <p className="text-xs text-muted font-mono uppercase">Total Requests</p>
                    <p className="text-xl font-bold font-mono text-fg mt-1">{result.totalRequests.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-control bg-bg border border-border/60">
                    <p className="text-xs text-muted font-mono uppercase">24h Requests</p>
                    <p className="text-xl font-bold font-mono text-fg mt-1">{result.requests24h.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-control bg-bg border border-border/60">
                    <p className="text-xs text-muted font-mono uppercase">Input Tokens</p>
                    <p className="text-xl font-bold font-mono text-fg mt-1">{formatTokens(result.totalInputTokens)}</p>
                  </div>
                  <div className="p-4 rounded-control bg-bg border border-border/60">
                    <p className="text-xs text-muted font-mono uppercase">Output Tokens</p>
                    <p className="text-xl font-bold font-mono text-fg mt-1">{formatTokens(result.totalOutputTokens)}</p>
                  </div>
                </div>

                {/* Latest 20 Request Activity Breakdown */}
                <div className="pt-4 border-t border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-fg">Latest 20 API Requests Activity</h3>
                      <p className="text-xs text-muted font-mono mt-0.5">Transparent token breakdown & latency audit log for this key</p>
                    </div>
                  </div>

                  <div className="border border-border rounded-panel overflow-hidden bg-bg">
                    {!result.recentRequests || result.recentRequests.length === 0 ? (
                      <div className="py-8 text-center text-xs font-mono text-muted">
                        No recent API requests logged for this key yet. Send a request with Claude Code CLI or Cursor to see live activity.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-mono">
                          <thead>
                            <tr className="border-b border-border text-muted uppercase bg-card/60">
                              <th className="py-2.5 px-3">Date & Time</th>
                              <th className="py-2.5 px-3">Model Used</th>
                              <th className="py-2.5 px-3">Endpoint</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3">Input</th>
                              <th className="py-2.5 px-3">Output</th>
                              <th className="py-2.5 px-3">Total Tokens</th>
                              <th className="py-2.5 px-3">Latency</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {result.recentRequests.map((req: any) => (
                              <tr key={req.id} className="hover:bg-card/50">
                                <td className="py-2.5 px-3 text-muted text-[11px] whitespace-nowrap">
                                  {new Date(req.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-amber-500">{req.model}</td>
                                <td className="py-2.5 px-3 text-fg text-[11px]">{req.endpoint}</td>
                                <td className="py-2.5 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    req.statusCode === 200 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                                  }`}>
                                    {req.statusCode} OK
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-muted">{req.inputTokens?.toLocaleString()}</td>
                                <td className="py-2.5 px-3 text-muted">{req.outputTokens?.toLocaleString()}</td>
                                <td className="py-2.5 px-3 font-bold text-fg">
                                  <span>{req.totalTokens?.toLocaleString()}</span>
                                  {req.isEstimated && (
                                    <span className="ml-1.5 text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-sans" title="Estimated via length heuristics">
                                      ESTIMATED
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-muted">{req.latencyMs} ms</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
};
