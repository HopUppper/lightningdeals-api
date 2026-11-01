import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Code2,
  Copy,
  Check,
  Zap,
  Terminal,
  ShieldCheck,
  BookOpen,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  Info,
} from 'lucide-react';
import { userFetch } from '../../utils/api';

interface MigrationGuideData {
  title: string;
  subtitle: string;
  steps: Array<{
    step: number;
    title: string;
    description: string;
    before?: string;
    after: string;
    note?: string;
  }>;
  codeSnippets: {
    typescript: string;
    python: string;
    curl: string;
  };
  parameterNotes: Array<{
    parameter: string;
    openAiAnthropicDiff: string;
    recommendation: string;
  }>;
}

export const UserMigration: React.FC = () => {
  const [sourceProvider, setSourceProvider] = useState<'openai' | 'anthropic' | 'gemini'>('openai');
  const [targetModel, setTargetModel] = useState('claude-3-5-sonnet-20241022');
  const [activeCodeTab, setActiveCodeTab] = useState<'typescript' | 'python' | 'curl'>('typescript');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [guideData, setGuideData] = useState<MigrationGuideData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchGuide() {
      setLoading(true);
      try {
        const res = await userFetch(`/api/user/developer/migration-guide?from=${sourceProvider}&model=${targetModel}`);
        if (res.ok) {
          const data = await res.json();
          if (data.guide) {
            setGuideData(data.guide);
          }
        }
      } catch (e) {
        console.error('Failed to load migration guide', e);
      } finally {
        setLoading(false);
      }
    }
    fetchGuide();
  }, [sourceProvider, targetModel]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(id);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              Developer Ecosystem
            </span>
            <span className="text-xs text-slate-400">Zero Code-Rewrite</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Migration Assistant & Code Generator
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Switch from OpenAI, Anthropic, or Gemini in 2 lines of code. Drop-in OpenAI-compatible and Anthropic-native endpoints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span>API Docs</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Selector Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source Provider */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Migrating From
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'openai', name: 'OpenAI SDK', desc: 'Base URL change' },
              { id: 'anthropic', name: 'Anthropic SDK', desc: 'Drop-in proxy' },
              { id: 'gemini', name: 'Google Gemini', desc: 'REST/OpenAI format' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSourceProvider(p.id as any)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  sourceProvider === p.id
                    ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/30 text-violet-900 dark:text-violet-200 ring-1 ring-violet-500'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-semibold text-xs">{p.name}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Target Model */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Target Model
          </label>
          <select
            value={targetModel}
            onChange={(e) => setTargetModel(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
          >
            <optgroup label="Anthropic Claude Series">
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (claude-3-5-sonnet-20241022)</option>
              <option value="claude-3-opus-20240229">Claude 3 Opus (claude-3-opus-20240229)</option>
              <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (claude-3-5-haiku-20241022)</option>
            </optgroup>
            <optgroup label="DeepSeek & Frontier Models">
              <option value="deepseek-chat">DeepSeek V3 (deepseek-chat)</option>
              <option value="deepseek-reasoner">DeepSeek R1 (deepseek-reasoner)</option>
            </optgroup>
            <optgroup label="OpenAI Compatible">
              <option value="gpt-4o">OpenAI GPT-4o (gpt-4o)</option>
              <option value="gpt-4o-mini">OpenAI GPT-4o Mini (gpt-4o-mini)</option>
            </optgroup>
          </select>
          <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-violet-500 shrink-0" />
            <span>Target model automatically maps to the correct upstream supplier adapter.</span>
          </p>
        </div>
      </div>

      {/* Migration Steps Grid */}
      {guideData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {guideData.steps.map((st) => (
            <div
              key={st.step}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 font-bold text-xs flex items-center justify-center mb-2">
                  {st.step}
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{st.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {st.description}
                </p>

                {st.before && (
                  <div className="mt-3 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px] font-mono text-rose-600 dark:text-rose-400 truncate">
                    <span className="font-bold">- Before:</span> {st.before}
                  </div>
                )}
                <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 truncate">
                  <span className="font-bold">+ After:</span> {st.after}
                </div>
              </div>

              {st.note && (
                <div className="mt-3 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                  {st.note}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Code Snippets Panel */}
      {guideData && (
        <div className="rounded-2xl bg-[#0B0F19] border border-slate-800 overflow-hidden shadow-xl">
          <div className="px-4 py-3 bg-[#111625] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Production Code Example
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Tabs */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                {(['typescript', 'python', 'curl'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveCodeTab(tab)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-all cursor-pointer ${
                      activeCodeTab === tab
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab === 'curl' ? 'cURL' : tab}
                  </button>
                ))}
              </div>

              {/* Copy Code */}
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(guideData.codeSnippets[activeCodeTab], 'snippet')
                }
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              >
                {copiedTab === 'snippet' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-4 overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed bg-[#0B0F19]">
            <pre>{guideData.codeSnippets[activeCodeTab]}</pre>
          </div>
        </div>
      )}

      {/* Parameter Compatibility Matrix */}
      {guideData && guideData.parameterNotes && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-violet-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Parameter Compatibility Matrix
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Parameter</th>
                  <th className="py-2.5 px-3 font-semibold">Standard vs Anthropic</th>
                  <th className="py-2.5 px-3 font-semibold">LightningAPI Behaviour</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {guideData.parameterNotes.map((pn, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-bold text-violet-600 dark:text-violet-400">
                      {pn.parameter}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-sans">
                      {pn.openAiAnthropicDiff}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-sans">
                      {pn.recommendation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
