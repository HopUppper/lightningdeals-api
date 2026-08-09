import React, { useState, useEffect } from 'react';
import { Terminal, Play, Zap, AlertCircle, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export const UserApiTestConsole: React.FC = () => {
  const [keys, setKeys] = useState<any[]>([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [model, setModel] = useState('claude-sonnet-5');
  const [prompt, setPrompt] = useState('Write a quick TypeScript function to sort an array.');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingKeys, setLoadingKeys] = useState(true);

  useEffect(() => {
    async function loadKeys() {
      try {
        const res = await fetch('/api/user/keys');
        if (res.ok) {
          const data = await res.json();
          setKeys(data);
          if (data.length > 0) setSelectedKey(data[0].displayKey);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingKeys(false);
      }
    }
    loadKeys();
  }, []);

  const handleTestApi = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);

    const activeKeyObj = keys.find((k) => k.displayKey === selectedKey);
    const keyToUse = activeKeyObj ? activeKeyObj.displayKey : selectedKey;

    try {
      const res = await fetch('/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': keyToUse,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          max_tokens: 150,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || 'API request failed.');
      } else {
        setResponse(data);
      }
    } catch (err: any) {
      setError(err.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingKeys) {
    return <div className="py-12 text-center text-xs text-muted">Loading assigned API keys...</div>;
  }

  if (keys.length === 0) {
    return (
      <div className="bg-card border border-border rounded-panel p-8 text-center space-y-4 max-w-xl mx-auto my-8">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-fg">No API key assigned. Contact LightningDeals.</h2>
        <p className="text-xs text-muted leading-relaxed">
          API keys are assigned directly by LightningDeals administrators upon token package purchase. Please request a key quote or contact support to get an API key assigned.
        </p>
        <Link to="/request-quote" className="ui-button-primary text-xs py-2.5 px-5 inline-flex items-center gap-2 font-bold">
          <Mail className="w-4 h-4" />
          <span>Request Key Assignment</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
          <Terminal className="w-6 h-6 text-amber-500" />
          <span>API Debug Test Console</span>
        </h1>
        <p className="text-xs text-muted mt-1">
          Test your assigned LightningDeals API keys and models in real-time. Verify completions, token usage, and latencies.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Request Form */}
        <form onSubmit={handleTestApi} className="bg-card border border-border rounded-panel p-6 space-y-4">
          <h3 className="text-sm font-bold text-fg border-b border-border pb-3">Configure Request</h3>

          <div>
            <label className="block text-xs font-semibold text-fg mb-1">Select Assigned API Key</label>
            <select
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
            >
              {keys.map((k) => (
                <option key={k.id} value={k.displayKey}>
                  {k.name} ({k.displayKey})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg mb-1">Target AI Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
            >
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
              <option value="claude-sonnet-5">Claude Sonnet 5</option>
              <option value="claude-fable-5">Claude Fable 5</option>
              <option value="claude-opus-5">Claude Opus 5</option>
              <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
            </select>
          </div>


          <div>
            <label className="block text-xs font-semibold text-fg mb-1">Prompt</label>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-3 text-xs font-mono bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !selectedKey}
            className="ui-button-primary w-full justify-center text-xs py-2.5 font-bold gap-2 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{loading ? 'Executing Request...' : 'Send API Test Request'}</span>
          </button>
        </form>

        {/* Response Inspector */}
        <div className="bg-card border border-border rounded-panel p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-fg border-b border-border pb-3">Response Inspector</h3>

            {error && (
              <div className="mt-4 p-4 rounded-control bg-red-500/10 border border-red-500/30 text-red-600 text-xs font-mono">
                {error}
              </div>
            )}

            {response ? (
              <div className="mt-4 space-y-4">
                <div className="p-3 bg-bg border border-border rounded-control font-mono text-xs text-fg space-y-2">
                  <div className="flex justify-between text-muted border-b border-border pb-2 text-[11px]">
                    <span>ID: {response.id}</span>
                    <span>Model: {response.model}</span>
                  </div>
                  <pre className="whitespace-pre-wrap leading-relaxed text-fg font-sans text-xs">
                    {response.content?.[0]?.text}
                  </pre>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-bg border border-border rounded-control">
                    <p className="text-muted text-[10px] uppercase">Input Tokens</p>
                    <p className="font-bold text-fg mt-0.5">{response.usage?.input_tokens}</p>
                  </div>
                  <div className="p-3 bg-bg border border-border rounded-control">
                    <p className="text-muted text-[10px] uppercase">Output Tokens</p>
                    <p className="font-bold text-fg mt-0.5">{response.usage?.output_tokens}</p>
                  </div>
                </div>
              </div>
            ) : (
              !error && (
                <div className="py-16 text-center text-xs text-muted font-mono">
                  Send a request to inspect the live response stream.
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
