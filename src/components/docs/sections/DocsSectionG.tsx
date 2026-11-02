import React from 'react';
import {
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
  Clock,
  WifiOff,
  Wrench,
  CheckCircle2,
} from 'lucide-react';

export const DocsSectionG: React.FC = () => {
  return (
    <section id="sec-troubleshooting" className="scroll-mt-24 space-y-8 pt-4">
      <div className="border-b border-[#ede8e1] pb-3">
        <span className="text-xs font-bold text-violet-700 uppercase tracking-widest font-mono">
          Section G
        </span>
        <h2 className="text-2xl font-bold text-[#1c1917] tracking-tight">
          Troubleshooting &amp; Error Library
        </h2>
      </div>

      {/* G1: Diagnostic Assistant */}
      <article
        id="troubleshooting-intro"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <span>1. Diagnostic Assistant &amp; Error Library Overview</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          If your coding assistant or script encounters an error, use this guide to identify the exact HTTP status code, root cause, and verified resolution immediately:
        </p>
      </article>

      {/* G2: HTTP 400 */}
      <article
        id="error-400"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 font-mono text-xs font-bold">400</span>
            <span>HTTP 400 — Invalid Request Format</span>
          </h3>
          <span className="text-xs font-mono text-[#78716c]">Client Error</span>
        </div>
        <div className="space-y-2 text-xs">
          <p className="text-[#44403c] leading-relaxed">
            <strong>Cause:</strong> Malformed JSON syntax, missing required fields (such as <code className="font-mono">messages</code> array or <code className="font-mono">model</code> parameter), or exceeding max output token boundaries.
          </p>
          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-900">
            <strong>Resolution:</strong> Validate your JSON payload with a validator. Ensure <code className="font-mono">messages</code> is a non-empty array of objects with valid <code className="font-mono">role</code> and <code className="font-mono">content</code> fields.
          </div>
        </div>
      </article>

      {/* G3: HTTP 401 */}
      <article
        id="error-401"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 font-mono text-xs font-bold">401</span>
            <span>HTTP 401 — API Key Unrecognized or Invalid</span>
          </h3>
          <span className="text-xs font-mono text-[#78716c]">Authentication</span>
        </div>
        <div className="space-y-2 text-xs">
          <p className="text-[#44403c] leading-relaxed">
            <strong>Cause:</strong> The provided key string does not exist, was truncated during copy-paste, or was deleted from the dashboard.
          </p>
          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-900">
            <strong>Resolution:</strong> Verify your key begins with <code className="font-mono font-bold">ld_live_</code>. Open <strong className="font-semibold">Dashboard → API Keys</strong> to confirm its active status, or test it on our <a href="/check-key" className="underline font-bold">Verify Key</a> diagnostic page.
          </div>
        </div>
      </article>

      {/* G4: HTTP 402 */}
      <article
        id="error-402"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 font-mono text-xs font-bold">402</span>
            <span>HTTP 402 — Credit Wallet Depleted ($0.00 Balance)</span>
          </h3>
          <span className="text-xs font-mono text-[#78716c]">Payment Required</span>
        </div>
        <div className="space-y-2 text-xs">
          <p className="text-[#44403c] leading-relaxed">
            <strong>Cause:</strong> Your prepaid Pay-As-You-Go credit wallet balance has reached $0.00.
          </p>
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900">
            <strong>Resolution:</strong> Recharge credits from the Plans page. As soon as payment completes, your active key resumes immediately without modifying your editor or terminal settings.
          </div>
        </div>
      </article>

      {/* G5: HTTP 403 Model Denied */}
      <article
        id="error-403-model"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-purple-100 text-purple-800 font-mono text-xs font-bold">403</span>
            <span>HTTP 403 — Model Not Permitted on Current Plan</span>
          </h3>
          <span className="text-xs font-mono text-[#78716c]">Authorization</span>
        </div>
        <div className="space-y-2 text-xs">
          <p className="text-[#44403c] leading-relaxed">
            <strong>Cause:</strong> You requested a model outside your active plan&apos;s permissions (e.g. requesting OpenAI models while on a Claude-only plan).
          </p>
          <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 text-purple-900">
            <strong>Resolution:</strong> Switch your model in editor settings to an authorized model (e.g. <code className="font-mono font-bold">claude-sonnet-5.5</code>), or add a Pay-As-You-Go Credit pack to unlock Universal model access.
          </div>
        </div>
      </article>

      {/* G6: HTTP 403 Key Inactive */}
      <article
        id="error-403-key"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-purple-100 text-purple-800 font-mono text-xs font-bold">403</span>
            <span>HTTP 403 — Key Inactive or Suspended</span>
          </h3>
          <span className="text-xs font-mono text-[#78716c]">Key State</span>
        </div>
        <div className="space-y-2 text-xs">
          <p className="text-[#44403c] leading-relaxed">
            <strong>Cause:</strong> The key was manually paused in the dashboard or associated with an expired subscription.
          </p>
          <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 text-purple-900">
            <strong>Resolution:</strong> Log into your Customer Dashboard and click &quot;Resume Key&quot; under API Keys, or renew your subscription under My Plan.
          </div>
        </div>
      </article>

      {/* G7: HTTP 429 Quota Reached */}
      <article
        id="error-429-quota"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 font-mono text-xs font-bold">429</span>
            <span>HTTP 429 — 5-Hour Rolling Allowance Reached</span>
          </h3>
          <span className="text-xs font-mono text-[#78716c]">Rolling Window</span>
        </div>
        <div className="space-y-2 text-xs">
          <p className="text-[#44403c] leading-relaxed">
            <strong>Cause:</strong> You have consumed all tokens permitted within your moving 5-hour rolling cycle.
          </p>
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900">
            <strong>Resolution:</strong> Tokens replenish continuously every minute as older usage expires past the 5-hour window. Alternatively, add Pay-As-You-Go credits for an instant buffer with zero wait time.
          </div>
        </div>
      </article>

      {/* G8: HTTP 429 Speed Limit */}
      <article
        id="error-429-rpm"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 font-mono text-xs font-bold">429</span>
            <span>HTTP 429 — Request Speed Limit Exceeded (RPM)</span>
          </h3>
          <span className="text-xs font-mono text-[#78716c]">Speed Limit</span>
        </div>
        <div className="space-y-2 text-xs">
          <p className="text-[#44403c] leading-relaxed">
            <strong>Cause:</strong> Automated scripts or agent swarms sending too many rapid requests per second.
          </p>
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900">
            <strong>Resolution:</strong> Respect the <code className="font-mono font-bold">retry-after</code> response header and introduce exponential backoff (e.g. 1s, 2s, 4s).
          </div>
        </div>
      </article>

      {/* G9: HTTP 500 / 503 */}
      <article
        id="error-500-503"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 font-mono text-xs font-bold">500 / 503</span>
            <span>HTTP 500 / 503 — Temporary Cluster Congestion</span>
          </h3>
          <span className="text-xs font-mono text-[#78716c]">Server Surge</span>
        </div>
        <div className="space-y-2 text-xs">
          <p className="text-[#44403c] leading-relaxed">
            <strong>Cause:</strong> Upstream intelligence cluster overload or transient cloud network drop.
          </p>
          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-900">
            <strong>Resolution:</strong> Retry in 3 to 5 seconds. The gateway automatically triggers failover to healthy secondary nodes. Zero tokens or credits are charged for failed requests.
          </div>
        </div>
      </article>

      {/* G10: Client Connection Errors */}
      <article
        id="client-connection-errors"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <WifiOff className="w-5 h-5 text-zinc-600" />
          <span>10. Client Connection Issues (ECONNREFUSED / SSL Interception)</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          If your terminal throws <code className="font-mono text-xs bg-stone-100 px-1 py-0.5 rounded">ECONNREFUSED</code> or self-signed certificate warnings:
        </p>
        <ul className="list-disc list-inside text-xs text-[#44403c] space-y-1.5 leading-relaxed">
          <li><strong>Corporate Proxies / VPNs:</strong> Ensure your network permits outbound HTTPS traffic on port 443 to <code className="font-mono">https://lightningapi.pro</code>.</li>
          <li><strong>Base URL Protocol:</strong> Always include the <code className="font-mono font-bold">https://</code> prefix. Never use plain <code className="font-mono">http://</code>.</li>
          <li><strong>Trailing Slashes:</strong> Do not add trailing slashes to Anthropic base URLs (use <code className="font-mono">https://lightningapi.pro</code>).</li>
        </ul>
      </article>
    </section>
  );
};
