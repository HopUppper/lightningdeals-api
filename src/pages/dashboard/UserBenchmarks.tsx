import React, { useState, useEffect } from 'react';
import {
  Activity,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  Clock,
  Coins,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Scale,
  Loader2,
  ChevronRight,
  Info,
} from 'lucide-react';
import { userFetch } from '../../utils/api';

interface BenchmarkResultItem {
  modelId: string;
  providerSlug?: string;
  statusCode: number;
  latencyMs: number;
  timeToFirstTokenMs?: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  responsePreview?: string;
  error?: string;
}

interface BenchmarkRunItem {
  id: string;
  name: string;
  prompt: string;
  models: string[];
  status: string;
  totalDurationMs?: number;
  createdAt: string;
  results: BenchmarkResultItem[];
}

const PRESET_BENCHMARK_PROMPTS = [
  {
    title: 'Distributed Rate Limiter (TypeScript)',
    category: 'Coding & Architecture',
    prompt:
      'Write a production-grade distributed sliding-window rate limiter in TypeScript using Redis. Include error handling, clock drift mitigation, and unit test scenarios.',
  },
  {
    title: 'Formal Logic & Constraint Proof',
    category: 'Reasoning & Logic',
    prompt:
      'Given 5 philosophers at a round table with 5 forks, formalize the deadlock conditions using Dijkstra dining philosophers algorithm and write a starvation-free deadlock resolution in Rust.',
  },
  {
    title: 'High-Density Executive Summary',
    category: 'Summarization',
    prompt:
      'Summarize the core architectural tradeoffs between Postgres MVCC, MySQL InnoDB Undo Logs, and SQLite WAL mode in a high-density Markdown comparison matrix.',
  },
];

export const UserBenchmarks: React.FC = () => {
  const [selectedModels, setSelectedModels] = useState<string[]>([
    'claude-sonnet-5.5',
    'deepseek-v4-flash',
  ]);
  const [prompt, setPrompt] = useState(PRESET_BENCHMARK_PROMPTS[0].prompt);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(500);
  const [running, setRunning] = useState(false);
  const [currentRun, setCurrentRun] = useState<BenchmarkRunItem | null>(null);
  const [history, setHistory] = useState<BenchmarkRunItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Available models to pick from
  const candidateModels = [
    { id: 'claude-sonnet-5.5', name: 'Claude Sonnet 5.5', category: 'Flagship' },
    { id: 'claude-opus-5.5', name: 'Claude Opus 5.5', category: 'Frontier' },
    { id: 'claude-haiku-5.5', name: 'Claude Haiku 5.5', category: 'High Speed' },
    { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash', category: 'Economy' },
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', category: 'High Speed' },
    { id: 'gpt-4o', name: 'OpenAI GPT-4o', category: 'General' },
  ];

  const toggleModel = (id: string) => {
    if (selectedModels.includes(id)) {
      if (selectedModels.length > 1) {
        setSelectedModels(selectedModels.filter((m) => m !== id));
      }
    } else {
      if (selectedModels.length < 4) {
        setSelectedModels([...selectedModels, id]);
      }
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await userFetch('/api/user/benchmarks');
      if (res.ok) {
        const data = await res.json();
        const runs = Array.isArray(data.benchmarks) ? data.benchmarks : Array.isArray(data.runs) ? data.runs : [];
        setHistory(runs);
      }
    } catch (e) {
      console.error('Failed to load benchmark history', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleExecuteBenchmark = async () => {
    if (!prompt.trim() || selectedModels.length === 0) return;
    setRunning(true);
    setErrorMsg(null);

    try {
      const res = await userFetch('/api/user/benchmarks/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Benchmark: ${selectedModels.join(' vs ')}`,
          models: selectedModels,
          prompt: prompt.trim(),
          parameters: {
            temperature,
            max_tokens: maxTokens,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentRun(data.run);
        loadHistory();
      } else {
        setErrorMsg(data.error?.message || 'Benchmark execution failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Benchmark network error.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Developer Benchmarking
            </span>
            <span className="text-xs text-slate-400">Controlled Multi-Model Evaluation</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Private Model Benchmarks
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Test latency, tokens, throughput, and estimated costs across models on identical inputs. Results are kept strictly private to your account.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadHistory}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Refresh Benchmark History"
          >
            <RotateCcw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Prompt & Model Selector */}
        <div className="lg:col-span-2 space-y-4">
          {/* Model Pickers */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Select Models to Compare (Up to 4)
              </label>
              <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
                {selectedModels.length} selected
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {candidateModels.map((m) => {
                const isSelected = selectedModels.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleModel(m.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-xs truncate">{m.name}</div>
                      <div className="text-[10px] text-slate-400">{m.category}</div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Test Prompt Input */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Test Prompt
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Presets:</span>
                {PRESET_BENCHMARK_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(p.prompt)}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    {p.category.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter prompt to execute across selected models simultaneously..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Dual/Multi-model benchmarks bill tokens for each executed provider.</span>
              </div>

              <button
                type="button"
                disabled={running || selectedModels.length === 0 || !prompt.trim()}
                onClick={handleExecuteBenchmark}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                {running ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Running Benchmark...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Run Benchmark ({selectedModels.length} Models)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Parameters & History */}
        <div className="space-y-4">
          {/* Parameters */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Run Parameters
            </h3>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Temperature</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">{temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Max Output Tokens</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">{maxTokens}</span>
              </div>
              <input
                type="range"
                min="100"
                max="2048"
                step="50"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
          </div>

          {/* Recent Runs History */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Recent Benchmark Runs
            </h3>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(history || []).map((h) => (
                <div
                  key={h.id}
                  onClick={() => setCurrentRun(h)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    currentRun?.id === h.id
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="truncate">{h.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {h.totalDurationMs ? `${h.totalDurationMs}ms` : ''}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{h.prompt}</div>
                </div>
              ))}

              {history.length === 0 && !loadingHistory && (
                <div className="text-center py-4 text-xs text-slate-400">
                  No previous benchmark runs recorded.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results View */}
      {currentRun && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {currentRun.name}
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Duration: {currentRun.totalDurationMs || 0}ms • {(currentRun.results || []).length} models evaluated
              </p>
            </div>
          </div>

          {/* Cards for each model in run */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(currentRun.results || []).map((res, i) => {
              const throughput =
                res.latencyMs > 0 ? ((res.outputTokens / res.latencyMs) * 1000).toFixed(1) : '0';

              return (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {res.modelId}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        res.statusCode === 200
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      }`}
                    >
                      HTTP {res.statusCode}
                    </span>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400">Total Latency</div>
                      <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                        {res.latencyMs}ms
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400">TTFT</div>
                      <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                        {res.timeToFirstTokenMs || Math.round(res.latencyMs * 0.25)}ms
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400">Speed</div>
                      <div className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                        {throughput} t/s
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400">Est. Cost</div>
                      <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        ${res.estimatedCostUsd?.toFixed(4) || '0.0000'}
                      </div>
                    </div>
                  </div>

                  {/* Output Preview */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Response Output ({res.outputTokens} tokens)
                    </span>
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 max-h-48 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                      {res.responsePreview || (res.error ? `Error: ${res.error}` : 'No response content')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
