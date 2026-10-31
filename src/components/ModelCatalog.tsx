import React, { useState, useMemo } from 'react';
import {
  Search,
  Check,
  Copy,
  Sparkles,
  Cpu,
  Layers,
  Terminal,
  ArrowRight,
  ExternalLink,
  Zap,
  Image as ImageIcon,
  Video as VideoIcon,
  Eye,
  Code,
  Flame,
  CheckCircle2,
  Table as TableIcon,
  LayoutGrid,
  Info,
  ShieldCheck,
  Hash,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ALL_SUPPORTED_MODELS, MODEL_FAMILIES, ModelSpec } from '../data/modelsData';

export const ModelCatalog: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'python' | 'node'>('curl');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Task Filter Options
  const taskOptions = [
    { id: 'all', label: 'All Models' },
    { id: 'code', label: 'Build & Code', icon: Code },
    { id: 'vision', label: 'Reads Images', icon: Eye },
    { id: 'fast', label: 'Fast Responses', icon: Zap },
    { id: 'reasoning', label: 'Deep Reasoning', icon: Sparkles },
    { id: 'low_cost', label: 'Lower Rate (<$1/1M)', icon: Flame },
    { id: 'long_context', label: 'Long Context (≥200k)', icon: Layers },
  ];

  // Filtered Models Logic
  const filteredModels = useMemo(() => {
    return ALL_SUPPORTED_MODELS.filter((model) => {
      // 1. Family filter
      if (selectedFamily !== 'all') {
        if (selectedFamily === 'more_models') {
          if (model.categoryKey !== 'more_models') return false;
        } else if (model.categoryKey !== selectedFamily) {
          return false;
        }
      }

      // 2. Task filter
      if (selectedTask === 'code') {
        if (!model.supportsTools && !model.tags.some((t) => t.toLowerCase().includes('code'))) {
          return false;
        }
      } else if (selectedTask === 'vision') {
        if (!model.supportsVision) return false;
      } else if (selectedTask === 'fast') {
        const isFlashOrHaiku =
          model.modelId.includes('flash') ||
          model.modelId.includes('haiku') ||
          model.modelId.includes('sol') ||
          model.tags.some((t) => t.toLowerCase().includes('fast') || t.toLowerCase().includes('latency'));
        if (!isFlashOrHaiku) return false;
      } else if (selectedTask === 'reasoning') {
        if (!model.supportsReasoning && !model.tags.some((t) => t.toLowerCase().includes('reasoning'))) {
          return false;
        }
      } else if (selectedTask === 'low_cost') {
        if (model.protocol === 'images' || model.protocol === 'videos') return false;
        if (model.inputPrice >= 1.0) return false;
      } else if (selectedTask === 'long_context') {
        if (model.contextWindow < 200000) return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = model.modelId.toLowerCase().includes(q);
        const matchName = model.displayName.toLowerCase().includes(q);
        const matchFamily = model.family.toLowerCase().includes(q);
        const matchDesc = model.description.toLowerCase().includes(q);
        const matchTag = model.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchId && !matchName && !matchFamily && !matchDesc && !matchTag) return false;
      }

      return true;
    });
  }, [selectedFamily, selectedTask, searchQuery]);

  // Family styling color map
  const getFamilyColor = (family: string) => {
    switch (family) {
      case 'Anthropic':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'OpenAI':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'GLM':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Gemini':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Grok':
        return 'bg-zinc-100 text-zinc-800 border-zinc-300';
      case 'DeepSeek':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Qwen':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Kimi':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'MiniMax':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Embeddings':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'Image generation':
        return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200';
      case 'Video generation':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-stone-50 text-stone-700 border-stone-200';
    }
  };

  const formatContext = (ctx: number) => {
    if (ctx >= 1000000) return `${(ctx / 1000000).toFixed(0)}M ctx`;
    if (ctx >= 1000) return `${(ctx / 1000).toFixed(0)}k ctx`;
    return `${ctx} ctx`;
  };

  return (
    <section id="models-directory" className="border-b border-[#e7e5e4] bg-[#faf8f5] py-14 sm:py-20 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Controls Section */}
        <div className="space-y-4">
          
          {/* Search + View Mode Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#78716c] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 74+ models by ID, name, family, or task (e.g. claude-opus, gpt-6, deepseek, flash, image)..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#e7e5e4] bg-white text-xs sm:text-sm text-[#1c1917] placeholder-[#a8a29e] focus:outline-none focus:ring-2 focus:ring-[#6d28d9] focus:border-transparent transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-[#a8a29e] hover:text-[#1c1917] transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-white border border-[#e7e5e4] p-1 rounded-xl shadow-xs shrink-0 self-end md:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[#1c1917] text-white shadow-xs'
                    : 'text-[#57534e] hover:text-[#1c1917]'
                }`}
                aria-label="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Card Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  viewMode === 'table'
                    ? 'bg-[#1c1917] text-white shadow-xs'
                    : 'text-[#57534e] hover:text-[#1c1917]'
                }`}
                aria-label="Table View"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Data Table</span>
              </button>
            </div>
          </div>

          {/* Maker / Family Filter Pills */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#78716c]">
                Provider Families ({MODEL_FAMILIES.length})
              </span>
              <span className="text-[11px] font-mono text-[#78716c]">
                Showing {filteredModels.length} of {ALL_SUPPORTED_MODELS.length} models
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {MODEL_FAMILIES.map((family) => {
                const isSelected = selectedFamily === family.id;
                return (
                  <button
                    key={family.id}
                    type="button"
                    onClick={() => setSelectedFamily(family.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#6d28d9] text-white font-semibold shadow-xs'
                        : 'bg-white text-[#57534e] border border-[#e7e5e4] hover:bg-[#f5f2eb] hover:text-[#1c1917]'
                    }`}
                  >
                    <span>{family.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#f5f2eb] text-[#78716c]'
                      }`}
                    >
                      {family.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Task Quick Filters */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#78716c]">
              Task &amp; Capability Filters
            </span>
            <div className="flex flex-wrap gap-1.5">
              {taskOptions.map((task) => {
                const isSelected = selectedTask === task.id;
                const IconComponent = task.icon;
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => setSelectedTask(task.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#1c1917] text-white font-semibold shadow-xs'
                        : 'bg-white/70 text-[#57534e] border border-[#e7e5e4] hover:bg-white hover:text-[#1c1917]'
                    }`}
                  >
                    {IconComponent && <IconComponent className="w-3 h-3 text-[#6d28d9]" />}
                    <span>{task.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredModels.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-white border border-[#e7e5e4] space-y-3">
            <Info className="w-8 h-8 text-[#a8a29e] mx-auto" />
            <h3 className="text-base font-bold text-[#1c1917]">No matching models found</h3>
            <p className="text-xs text-[#57534e] max-w-sm mx-auto">
              No models match your current search and filter combination. Try clearing your search query or selecting &quot;All Families&quot;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedFamily('all');
                setSelectedTask('all');
              }}
              className="px-4 py-2 rounded-xl bg-[#6d28d9] text-white text-xs font-semibold hover:bg-[#581c87] transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && filteredModels.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredModels.map((model) => (
              <div
                key={model.modelId}
                className="group relative bg-white border border-[#e7e5e4] rounded-2xl p-5 hover:border-[#6d28d9]/40 hover:shadow-warm transition-all flex flex-col justify-between space-y-4"
              >
                {/* Header: Family, Badges & Context */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getFamilyColor(
                        model.family
                      )}`}
                    >
                      {model.family}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {model.isNew && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          NEW
                        </span>
                      )}
                      {model.isPopular && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-purple-100 text-[#6d28d9] border border-purple-200">
                          POPULAR
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#faf8f5] text-[#1c1917] border border-[#e7e5e4]">
                        {formatContext(model.contextWindow)}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-[#1c1917] group-hover:text-[#6d28d9] transition-colors leading-snug">
                      {model.displayName}
                    </h3>
                    <p className="text-xs text-[#57534e] line-clamp-2 leading-relaxed mt-1">
                      {model.description}
                    </p>
                  </div>

                  {/* Copyable Model ID */}
                  <div className="flex items-center justify-between bg-[#faf8f5] border border-[#e7e5e4] rounded-lg px-2.5 py-1.5">
                    <code className="text-[11px] font-mono text-[#1c1917] truncate font-medium">
                      {model.modelId}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(model.modelId)}
                      className="ml-2 p-1 rounded text-[#78716c] hover:text-[#6d28d9] hover:bg-white transition-colors cursor-pointer shrink-0"
                      title="Copy Model ID"
                      aria-label={`Copy model ID ${model.modelId}`}
                    >
                      {copiedId === model.modelId ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Footer: Pricing & Capabilities */}
                <div className="space-y-3 pt-2 border-t border-[#f5f2eb]">
                  {/* Pricing row */}
                  <div className="flex items-center justify-between text-xs font-mono">
                    {model.protocol === 'images' ? (
                      <div>
                        <span className="text-[#78716c] text-[10px] uppercase">Rate: </span>
                        <span className="font-bold text-[#1c1917]">
                          ${model.inputPrice.toFixed(3)}
                        </span>
                        <span className="text-[#78716c] text-[10px]"> / image</span>
                      </div>
                    ) : model.protocol === 'videos' ? (
                      <div>
                        <span className="text-[#78716c] text-[10px] uppercase">Rate: </span>
                        <span className="font-bold text-[#1c1917]">
                          ${model.inputPrice.toFixed(3)}
                        </span>
                        <span className="text-[#78716c] text-[10px]"> / clip</span>
                      </div>
                    ) : (
                      <>
                        <div>
                          <span className="text-[#78716c] text-[10px] uppercase">Input: </span>
                          <span className="font-bold text-[#1c1917]">
                            ${model.inputPrice.toFixed(2)}
                          </span>
                          <span className="text-[#78716c] text-[10px]">/1M</span>
                        </div>
                        <div>
                          <span className="text-[#78716c] text-[10px] uppercase">Output: </span>
                          <span className="font-bold text-[#1c1917]">
                            ${model.outputPrice.toFixed(2)}
                          </span>
                          <span className="text-[#78716c] text-[10px]">/1M</span>
                        </div>
                        {model.cachedInputPrice && (
                          <div className="text-right">
                            <span className="text-emerald-700 font-bold">
                              ${model.cachedInputPrice.toFixed(2)}
                            </span>
                            <span className="text-emerald-800 text-[10px]"> cached</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Capability pills */}
                  <div className="flex flex-wrap items-center gap-1 text-[10px]">
                    {model.supportsVision && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono">
                        <Eye className="w-2.5 h-2.5" /> Vision
                      </span>
                    )}
                    {model.supportsTools && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono">
                        <Code className="w-2.5 h-2.5" /> Tools
                      </span>
                    )}
                    {model.supportsReasoning && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-50 text-[#6d28d9] font-mono">
                        <Sparkles className="w-2.5 h-2.5" /> Reasoning
                      </span>
                    )}
                    {model.supportsStreaming && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-stone-100 text-[#57534e] font-mono">
                        <Zap className="w-2.5 h-2.5" /> Stream
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && filteredModels.length > 0 && (
          <div className="border border-[#e7e5e4] rounded-2xl overflow-hidden bg-white shadow-warm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#fbf9f5] border-b border-[#e7e5e4] text-[#78716c] font-mono text-[10px] uppercase">
                  <tr>
                    <th className="py-3 px-4 font-bold">Model &amp; Canonical ID</th>
                    <th className="py-3 px-4 font-bold">Family</th>
                    <th className="py-3 px-4 font-bold">Context Limit</th>
                    <th className="py-3 px-4 font-bold">Input / 1M</th>
                    <th className="py-3 px-4 font-bold">Output / 1M</th>
                    <th className="py-3 px-4 font-bold">Cached Read</th>
                    <th className="py-3 px-4 font-bold">Capabilities</th>
                    <th className="py-3 px-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5f2eb]">
                  {filteredModels.map((model) => (
                    <tr
                      key={model.modelId}
                      className="hover:bg-[#faf8f5]/80 transition-colors text-[#57534e]"
                    >
                      {/* Name & ID */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#1c1917] flex items-center gap-1.5">
                          <span>{model.displayName}</span>
                          {model.isNew && (
                            <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-amber-100 text-amber-800">
                              NEW
                            </span>
                          )}
                        </div>
                        <code className="text-[11px] font-mono text-[#6d28d9] block mt-0.5">
                          {model.modelId}
                        </code>
                      </td>

                      {/* Family */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getFamilyColor(
                            model.family
                          )}`}
                        >
                          {model.family}
                        </span>
                      </td>

                      {/* Context */}
                      <td className="py-3 px-4 font-mono font-bold text-[#1c1917]">
                        {formatContext(model.contextWindow)}
                      </td>

                      {/* Input */}
                      <td className="py-3 px-4 font-mono text-[#1c1917] font-semibold">
                        ${model.inputPrice.toFixed(2)}
                      </td>

                      {/* Output */}
                      <td className="py-3 px-4 font-mono text-[#1c1917] font-semibold">
                        ${model.outputPrice.toFixed(2)}
                      </td>

                      {/* Cached Input */}
                      <td className="py-3 px-4 font-mono">
                        {model.cachedInputPrice ? (
                          <span className="text-emerald-700 font-semibold">
                            ${model.cachedInputPrice.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-[#a8a29e]">—</span>
                        )}
                      </td>

                      {/* Capabilities */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                          {model.supportsVision && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                              Vision
                            </span>
                          )}
                          {model.supportsTools && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                              Tools
                            </span>
                          )}
                          {model.supportsReasoning && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-50 text-[#6d28d9]">
                              Reasoning
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(model.modelId)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono bg-[#faf8f5] hover:bg-[#6d28d9] hover:text-white border border-[#e7e5e4] transition-colors cursor-pointer"
                          aria-label={`Copy model ID ${model.modelId}`}
                        >
                          {copiedId === model.modelId ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy ID</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Specialized Modality Cards: Embeddings, Image & Video */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6">
          {/* Embeddings Card */}
          <div className="p-5 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-violet-100 text-violet-700">
                <Hash className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1c1917]">Vector Embeddings</h4>
                <p className="text-[11px] text-[#78716c]">High-dimensional semantic search</p>
              </div>
            </div>
            <p className="text-xs text-[#57534e] leading-relaxed">
              Standard embeddings endpoint for semantic search, retrieval augmented generation (RAG), and vector clustering across 1536 and 3072 dimensions.
            </p>
            <div className="space-y-1 text-xs font-mono bg-[#faf8f5] p-3 rounded-xl border border-[#e7e5e4]">
              <div className="flex justify-between">
                <span className="text-[#1c1917] font-semibold">text-embedding-3-small</span>
                <span className="text-[#6d28d9]">$0.02 / 1M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#1c1917] font-semibold">text-embedding-3-large</span>
                <span className="text-[#6d28d9]">$0.13 / 1M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#1c1917] font-semibold">text-embedding-ada-002</span>
                <span className="text-[#6d28d9]">$0.10 / 1M</span>
              </div>
            </div>
          </div>

          {/* Image Generation Card */}
          <div className="p-5 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-fuchsia-100 text-fuchsia-700">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1c1917]">Image Generation</h4>
                <p className="text-[11px] text-[#78716c]">High-fidelity creative synthesis</p>
              </div>
            </div>
            <p className="text-xs text-[#57534e] leading-relaxed">
              Generate photorealistic and conceptual visuals via standard OpenAI-compatible image endpoints with resolutions up to 1792x1024.
            </p>
            <div className="space-y-1 text-xs font-mono bg-[#faf8f5] p-3 rounded-xl border border-[#e7e5e4]">
              <div className="flex justify-between">
                <span className="text-[#1c1917] font-semibold">Lightning Image 1.5</span>
                <span className="text-[#6d28d9]">$0.035 / img</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#1c1917] font-semibold">gpt-image-2</span>
                <span className="text-[#6d28d9]">$0.040 / img</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#1c1917] font-semibold">grok-imagine-image</span>
                <span className="text-[#6d28d9]">$0.035 / img</span>
              </div>
            </div>
          </div>

          {/* Video Generation Card */}
          <div className="p-5 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-orange-100 text-orange-700">
                <VideoIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1c1917]">Video Generation</h4>
                <p className="text-[11px] text-[#78716c]">Temporal consistency up to 1080p</p>
              </div>
            </div>
            <p className="text-xs text-[#57534e] leading-relaxed">
              Next-generation video synthesis offering fluid motion and full 1080p resolution support across multiple aspect ratios.
            </p>
            <div className="space-y-1 text-xs font-mono bg-[#faf8f5] p-3 rounded-xl border border-[#e7e5e4]">
              <div className="flex justify-between">
                <span className="text-[#1c1917] font-semibold">grok-imagine-video (720p)</span>
                <span className="text-[#6d28d9]">$0.25 / clip</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#1c1917] font-semibold">grok-imagine-video-1.5 (1080p)</span>
                <span className="text-[#6d28d9]">$0.375 / clip</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Discovery API Widget */}
        <div className="p-6 rounded-2xl bg-white border border-[#e7e5e4] shadow-warm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#f5f3ff] text-[#6d28d9] border border-[#ddd6fe]">
                <Terminal className="w-3 h-3" />
                <span>Runtime Discovery</span>
              </div>
              <h3 className="text-base font-bold text-[#1c1917] mt-1">
                Programmatic Model Discovery Endpoint
              </h3>
              <p className="text-xs text-[#57534e]">
                Query the live model repertoire dynamically from your backend or agent loop.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-[#faf8f5] border border-[#e7e5e4] p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveCodeTab('curl')}
                className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                  activeCodeTab === 'curl'
                    ? 'bg-[#1c1917] text-white shadow-xs'
                    : 'text-[#57534e] hover:text-[#1c1917]'
                }`}
              >
                cURL
              </button>
              <button
                type="button"
                onClick={() => setActiveCodeTab('python')}
                className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                  activeCodeTab === 'python'
                    ? 'bg-[#1c1917] text-white shadow-xs'
                    : 'text-[#57534e] hover:text-[#1c1917]'
                }`}
              >
                Python
              </button>
              <button
                type="button"
                onClick={() => setActiveCodeTab('node')}
                className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                  activeCodeTab === 'node'
                    ? 'bg-[#1c1917] text-white shadow-xs'
                    : 'text-[#57534e] hover:text-[#1c1917]'
                }`}
              >
                Node.js
              </button>
            </div>
          </div>

          <div className="relative rounded-xl bg-[#0f172a] text-slate-100 p-4 font-mono text-xs overflow-x-auto">
            {activeCodeTab === 'curl' && (
              <pre className="text-slate-200">
                {`curl https://lightningapi.pro/api/v1/models \\
  -H "Authorization: Bearer ld_live_your_api_key_here"`}
              </pre>
            )}
            {activeCodeTab === 'python' && (
              <pre className="text-slate-200">
                {`from openai import OpenAI

client = OpenAI(
    api_key="ld_live_your_api_key_here",
    base_url="https://lightningapi.pro/api/v1"
)

models = client.models.list()
for m in models.data:
    print(m.id)`}
              </pre>
            )}
            {activeCodeTab === 'node' && (
              <pre className="text-slate-200">
                {`import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.LIGHTNING_API_KEY || 'ld_live_your_api_key_here',
  baseURL: 'https://lightningapi.pro/api/v1',
});

const list = await client.models.list();
console.log(list.data.map(m => m.id));`}
              </pre>
            )}
            <button
              type="button"
              onClick={() => {
                const text =
                  activeCodeTab === 'curl'
                    ? `curl https://lightningapi.pro/api/v1/models \\\n  -H "Authorization: Bearer ld_live_your_api_key_here"`
                    : activeCodeTab === 'python'
                    ? `from openai import OpenAI\n\nclient = OpenAI(\n    api_key="ld_live_your_api_key_here",\n    base_url="https://lightningapi.pro/api/v1"\n)\n\nmodels = client.models.list()\nfor m in models.data:\n    print(m.id)`
                    : `import OpenAI from 'openai';\n\nconst client = new OpenAI({\n  apiKey: process.env.LIGHTNING_API_KEY || 'ld_live_your_api_key_here',\n  baseURL: 'https://lightningapi.pro/api/v1',\n});\n\nconst list = await client.models.list();\nconsole.log(list.data.map(m => m.id));`;
                copyToClipboard(text);
              }}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Copy snippet"
              aria-label="Copy snippet"
            >
              {copiedId ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#e7e5e4] text-xs">
          <div className="flex items-center gap-2 text-[#78716c]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Zero public pricing exposure. All rate limits and keys server-managed.</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/pricing"
              className="font-bold text-[#6d28d9] hover:text-[#581c87] inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Explore Pricing Plans</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/docs"
              className="font-bold text-[#1c1917] hover:text-[#6d28d9] inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Developer Reference</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
};

export default ModelCatalog;
