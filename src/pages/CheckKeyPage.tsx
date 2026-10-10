import React, { useState, useEffect } from 'react';
import { Key, AlertCircle, Check, Clock, Activity, ArrowRight, Shield, Sparkles } from 'lucide-react';
import { ElectricNavbar } from '../components/ElectricNavbar';
import { ElectricFooter } from '../components/ElectricFooter';

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
      setError('Network error checking key. Make sure server is reachable.');
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
    <div className="min-h-screen bg-[#fbf9f5] text-[#1c1917] flex flex-col font-sans antialiased selection:bg-[#6d28d9]/10 selection:text-[#6d28d9]">
      <ElectricNavbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium uppercase tracking-wider bg-[#f5f3ff] text-[#6d28d9] border border-[#ddd6fe]">
            <Sparkles className="w-3 h-3 text-[#6d28d9]" />
            <span>Key Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1c1917]">
            Verify API Key Balance
          </h1>
          <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed">
            Enter your key to inspect real-time 5-hour rolling tokens, reset countdown, and rate limits.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleCheckKey} className="mt-8 max-w-xl mx-auto flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a8a29e]" />
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="ld_live_... or ld_trial_..."
              className="w-full pl-10 pr-3.5 py-2.5 text-xs font-mono bg-white border border-[#e7e5e4] rounded-xl focus:outline-none focus:border-[#6d28d9] focus:ring-1 focus:ring-[#6d28d9] text-[#1c1917] shadow-xs"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-[#6d28d9] hover:bg-[#581c87] text-white text-xs font-semibold shadow-plum flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shrink-0"
          >
            {loading ? 'Checking...' : 'Inspect Key →'}
          </button>
        </form>

        {/* Error Alert */}
        {error && (
          <div className="mt-6 max-w-xl mx-auto p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Results Card */}
        {result && (
          <div className="mt-8 bg-white border border-[#e7e5e4] rounded-2xl p-6 sm:p-8 shadow-warm">
            {!result.valid ? (
              <div className="text-center py-8 space-y-2">
                <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                <h3 className="text-base font-bold text-[#1c1917]">Invalid Key</h3>
                <p className="text-xs text-[#78716c]">This key does not exist or has been revoked.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {result.exactFailureReason && (
                  <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Notice</p>
                      <p className="text-rose-600 text-xs mt-0.5">{result.exactFailureReason}</p>
                    </div>
                  </div>
                )}

                {/* Status Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#e7e5e4] gap-2">
                  <div>
                    <h3 className="text-base font-bold text-[#1c1917]">{result.planName || 'Active Key'}</h3>
                    <code className="text-[11px] font-mono text-[#78716c]">{result.maskedKey || 'ld_live_••••'}</code>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#ecfdf5] text-[#047857] text-xs font-medium border border-[#a7f3d0] w-fit">
                    <Check className="w-3.5 h-3.5 text-[#059669]" />
                    <span>Operational</span>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#fdfbf7] border border-[#e7e5e4]">
                    <div className="text-[10px] text-[#78716c] uppercase font-semibold">5h Window Quota</div>
                    <div className="text-base font-bold text-[#1c1917] mt-1 font-mono">
                      {formatTokens(result.windowTokensLimit || result.quotaLimit || 0)}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#fdfbf7] border border-[#e7e5e4]">
                    <div className="text-[10px] text-[#78716c] uppercase font-semibold">Used in Window</div>
                    <div className="text-base font-bold text-[#6d28d9] mt-1 font-mono">
                      {formatTokens(result.windowTokensUsed || 0)}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#fdfbf7] border border-[#e7e5e4]">
                    <div className="text-[10px] text-[#78716c] uppercase font-semibold">Remaining</div>
                    <div className="text-base font-bold text-[#059669] mt-1 font-mono">
                      {formatTokens(result.windowTokensRemaining || (result.quotaLimit - (result.windowTokensUsed || 0)))}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#fdfbf7] border border-[#e7e5e4]">
                    <div className="text-[10px] text-[#78716c] uppercase font-semibold">Next Refresh</div>
                    <div className="text-sm font-mono font-bold text-[#1c1917] mt-1">
                      {secondsLeft != null ? formatCountdown(secondsLeft) : 'Rolling'}
                    </div>
                  </div>
                </div>

                {/* Rate Limits Footer */}
                <div className="pt-2 border-t border-[#e7e5e4] flex flex-wrap items-center justify-between text-xs text-[#78716c]">
                  <span>Rate Limit: {result.rpmLimit || 60} RPM • {result.tpmLimit ? `${formatTokens(result.tpmLimit)} TPM` : 'Standard'}</span>
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
