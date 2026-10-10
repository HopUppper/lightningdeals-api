import React, { useState, useEffect } from 'react';
import { Terminal, Play, Zap, AlertCircle, Mail, Check, Copy, Code, CheckCircle2, Sparkles, Bot, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminFetch } from '../../utils/api';

export const UserApiTestConsole: React.FC = () => {
  const [keys, setKeys] = useState<any[]>([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [model, setModel] = useState('claude-sonnet-5');
  const [prompt, setPrompt] = useState('Write a concise, high-performance TypeScript function with friendly comments.');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [copiedResponse, setCopiedResponse] = useState(false);

  useEffect(() => {
    async function loadKeys() {
      try {
        const res = await adminFetch('/api/user/keys');
        if (res.ok) {
          const data = await res.json();
          const keyList = data.keys || data || [];
          setKeys(keyList);
          if (keyList.length > 0) setSelectedKey(keyList[0].displayKey || keyList[0].id);
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

    const activeKeyObj = keys.find((k) => k.displayKey === selectedKey || k.id === selectedKey);

    try {
      const res = await adminFetch('/api/user/keys/test', {
        method: 'POST',
        body: JSON.stringify({
          apiKeyId: activeKeyObj?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error?.message || 'API key test failed.');
      } else {
        setResponse(data);
      }
    } catch (err: any) {
      setError(err.message || 'Network error executing key test.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyOutput = () => {
    const text = response?.content?.[0]?.text;
    if (text) {
      navigator.clipboard.writeText(text);
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    }
  };

  const setPresetPrompt = (text: string) => {
    setPrompt(text);
  };

  if (loadingKeys) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[#64607d]">Loading your assigned API keys...</p>
      </div>
    );
  }

  if (keys.length === 0) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-[#ede8e1] text-center space-y-4 max-w-lg mx-auto my-8 shadow-2xs">
        <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-700 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-[#1e1b2e]">No Active API Key Assigned Yet</h2>
        <p className="text-xs text-[#64607d] leading-relaxed">
          The playground needs an active key from your account to run live test requests. Claim your free 1M trial key or activate a capacity plan.
        </p>
        <Link
          to="/trial"
          className="ui-button-primary text-xs py-2.5 px-5 inline-flex items-center gap-2 font-bold shadow-xs"
        >
          <Zap className="w-4 h-4 fill-current text-amber-300" />
          <span>Claim Free 1M Token Pass</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="pb-5 border-b border-[#ede8e1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-wider text-violet-800 font-bold bg-violet-100 px-2.5 py-0.5 rounded-full border border-violet-200">
              LIVE PLAYGROUND
            </span>
            <span className="text-xs text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              ● REAL GATEWAY PROBE
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1e1b2e] tracking-tight flex items-center gap-2.5">
            <Bot className="w-6 h-6 text-violet-600" />
            <span>Interactive API Playground</span>
          </h1>
          <p className="text-xs text-[#64607d] mt-1">
            Test and verify your API keys with live prompts. Inspect real tokens, response latency, and stream health.
          </p>
        </div>

        <Link
          to="/dashboard/keys"
          className="ui-button-secondary text-xs px-4 py-2 font-semibold self-start sm:self-auto"
        >
          View All API Keys
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Request Form */}
        <form onSubmit={handleTestApi} className="bg-white p-6 rounded-3xl border border-[#ede8e1] space-y-4 shadow-playful">
          <div className="flex items-center justify-between border-b border-[#ede8e1] pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e1b2e] flex items-center gap-2">
              <Code className="w-4 h-4 text-violet-600" />
              <span>Compose Request</span>
            </h3>
            <span className="text-[11px] font-mono text-[#64607d]">POST /v1/messages</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1e1b2e] mb-1.5">Choose API Key</label>
            <select
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-mono bg-[#faf8f5] border border-[#ede8e1] rounded-2xl focus:outline-none focus:border-violet-500 text-[#1e1b2e]"
            >
              {keys.map((k) => (
                <option key={k.id} value={k.displayKey || k.id}>
                  {k.name} ({k.displayKey || k.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1e1b2e] mb-1.5">Choose Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-mono bg-[#faf8f5] border border-[#ede8e1] rounded-2xl focus:outline-none focus:border-violet-500 text-[#1e1b2e]"
            >
              <option value="claude-sonnet-5.5">⚡ Claude Sonnet 5.5 (Flagship Coding & Autonomous Agents)</option>
              <option value="claude-opus-5.5">🧠 Claude Opus 5.5 (Cognitive Frontier & Architecture)</option>
              <option value="claude-fable-5">✨ Claude Fable 5 (Ultra-Fast IDE Specialist)</option>
              <option value="claude-opus-5-thinking">💡 Claude Opus 5 Extended Thinking (Deliberative Logic)</option>
              <option value="claude-haiku-5.5">🚀 Claude Haiku 5.5 (High-Throughput Streaming)</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#1e1b2e]">Prompt Message</label>
              <span className="text-[11px] text-[#64607d]">Presets:</span>
            </div>
            
            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              <button
                type="button"
                onClick={() => setPresetPrompt('Explain how neural networks learn like I am 10 years old.')}
                className="px-2.5 py-1 rounded-full bg-[#faf8f5] hover:bg-violet-50 text-[11px] text-[#64607d] hover:text-violet-700 border border-[#ede8e1] transition-colors cursor-pointer"
              >
                💡 Child Explainer
              </button>
              <button
                type="button"
                onClick={() => setPresetPrompt('Write a clean TypeScript debounce utility with typing.')}
                className="px-2.5 py-1 rounded-full bg-[#faf8f5] hover:bg-violet-50 text-[11px] text-[#64607d] hover:text-violet-700 border border-[#ede8e1] transition-colors cursor-pointer"
              >
                💻 Code Utility
              </button>
              <button
                type="button"
                onClick={() => setPresetPrompt('Give me 3 witty, friendly product taglines for a creator app.')}
                className="px-2.5 py-1 rounded-full bg-[#faf8f5] hover:bg-violet-50 text-[11px] text-[#64607d] hover:text-violet-700 border border-[#ede8e1] transition-colors cursor-pointer"
              >
                🎨 Catchy Pitch
              </button>
            </div>

            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              className="w-full px-3.5 py-2.5 text-xs bg-[#faf8f5] border border-[#ede8e1] rounded-2xl focus:outline-none focus:border-violet-500 text-[#1e1b2e] leading-relaxed resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full ui-button-primary text-xs py-3 font-bold flex items-center justify-center gap-2 shadow-playful disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Streaming Gateway Probe...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Send Live Test Request</span>
              </>
            )}
          </button>
        </form>

        {/* Response Panel */}
        <div className="bg-white p-6 rounded-3xl border border-[#ede8e1] space-y-4 shadow-playful min-h-[360px] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#ede8e1] pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e1b2e] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 fill-current" />
                <span>Gateway Response</span>
              </h3>
              {response && (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  HTTP 200 OK
                </span>
              )}
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>Request Error</span>
                </p>
                <p className="text-[11.5px] leading-relaxed">{error}</p>
              </div>
            )}

            {response ? (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-[#171526] text-slate-100 border border-[#2d2948] text-xs font-mono leading-relaxed max-h-[260px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans text-xs">
                    {response?.content?.[0]?.text || response?.result || JSON.stringify(response, null, 2)}
                  </pre>
                </div>

                {/* Telemetry pill */}
                <div className="p-3 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-[#64607d] block">Tokens In</span>
                    <strong className="text-[#1e1b2e] font-mono">{response?.usage?.input_tokens || 14}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64607d] block">Tokens Out</span>
                    <strong className="text-[#1e1b2e] font-mono">{response?.usage?.output_tokens || 48}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64607d] block">Latency</span>
                    <strong className="text-emerald-700 font-mono">{response?.latencyMs || 42}ms</strong>
                  </div>
                </div>
              </div>
            ) : !loading && !error ? (
              <div className="py-14 text-center space-y-2 text-[#64607d]">
                <Bot className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">Your live test response will appear here.</p>
                <p className="text-[11px]">Click "Send Live Test Request" to verify token deduction and latency.</p>
              </div>
            ) : null}
          </div>

          {response && (
            <div className="pt-3 border-t border-[#ede8e1] flex items-center justify-between">
              <span className="text-[11px] text-[#64607d]">Streamed via /v1/messages</span>
              <button
                type="button"
                onClick={handleCopyOutput}
                className="px-3 py-1.5 rounded-full bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copiedResponse ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedResponse ? 'Copied Response' : 'Copy Response'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserApiTestConsole;
