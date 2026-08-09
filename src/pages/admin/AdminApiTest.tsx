import React, { useState } from 'react';
import { Terminal, Play, Server, Zap, Check } from 'lucide-react';

export const AdminApiTest: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('claude-3-5-sonnet-20241022');
  const [prompt, setPrompt] = useState('Verify LightningDeals vendor master key routing and token deduction.');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTestApi = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          max_tokens: 100,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || 'API diagnostic test failed.');
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || 'Network error.');
    } finally {

      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
          <Terminal className="w-6 h-6 text-amber-500" />
          <span>Admin API Diagnostics Console</span>
        </h1>
        <p className="text-xs text-muted mt-1">
          Diagnose vendor upstream gateway routing, master key connectivity, and token ledger updates.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <form onSubmit={handleTestApi} className="bg-card border border-border rounded-panel p-6 space-y-4">
          <h3 className="text-sm font-bold text-fg border-b border-border pb-3">Diagnostic Test Parameters</h3>

          <div>
            <label className="block text-xs font-semibold text-fg mb-1">API Key to Test</label>
            <input
              type="text"
              required
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="ld_live_••••••••••••••••"

              className="w-full px-3.5 py-2 text-xs font-mono bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg mb-1">Target Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-mono bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
            >
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
              <option value="claude-sonnet-5">Claude Sonnet 5</option>
              <option value="claude-fable-5">Claude Fable 5</option>
              <option value="claude-opus-5">Claude Opus 5</option>
            </select>
          </div>


          <div>
            <label className="block text-xs font-semibold text-fg mb-1">Test Prompt</label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-3 text-xs font-mono bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !apiKey}
            className="ui-button-primary w-full justify-center text-xs py-2.5 font-bold gap-2 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{loading ? 'Testing Connectivity...' : 'Run Diagnostic API Call'}</span>
          </button>
        </form>

        <div className="bg-card border border-border rounded-panel p-6 space-y-4">
          <h3 className="text-sm font-bold text-fg border-b border-border pb-3">Diagnostic Results</h3>

          {error && (
            <div className="p-4 rounded-control bg-red-500/10 border border-red-500/30 text-red-600 text-xs font-mono">
              {error}
            </div>
          )}

          {result ? (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-3 bg-bg border border-border rounded-control space-y-2">
                <div className="flex justify-between text-muted border-b border-border pb-2 text-[11px]">
                  <span>HTTP 200 OK</span>
                  <span>ID: {result.id}</span>
                </div>
                <pre className="whitespace-pre-wrap leading-relaxed text-fg font-sans text-xs">
                  {result.content?.[0]?.text}
                </pre>
              </div>

              <div className="p-3 bg-bg border border-border rounded-control flex justify-between">
                <span>Input Tokens: <strong>{result.usage?.input_tokens}</strong></span>
                <span>Output Tokens: <strong>{result.usage?.output_tokens}</strong></span>
              </div>
            </div>
          ) : (
            !error && (
              <div className="py-16 text-center text-xs text-muted font-mono">
                Run diagnostic test to verify backend routing.
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
