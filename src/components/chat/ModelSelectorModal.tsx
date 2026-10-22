import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Sparkles,
  Check,
  CheckCircle2,
  Zap,
  Brain,
  Eye,
  Globe,
  Layers,
  Cpu,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

export interface StudioModelMeta {
  id: string;
  name: string;
  category: string;
  badge?: string;
  description: string;
  tokenMultiplier: number;
  contextWindow: number;
  maxOutputTokens?: number;
  supportsThinking?: boolean;
  supportsVision?: boolean;
  supportsTools?: boolean;
  supportsWebSearch?: boolean;
  supportsMCP?: boolean;
  isAvailable?: boolean;
  speed?: number; // 1-5
  intelligence?: number; // 1-5
  costTier?: 'Economy' | 'Standard' | 'Premium';
  provider?: string;
  contextWords?: string;
}

interface ModelSelectorModalProps {
  open: boolean;
  onClose: () => void;
  models: StudioModelMeta[];
  activeModelId: string;
  onSelectModel: (modelId: string) => void;
  currentEstimatedTokens?: number;
}

export const ModelSelectorModal: React.FC<ModelSelectorModalProps> = ({
  open,
  onClose,
  models,
  activeModelId,
  onSelectModel,
  currentEstimatedTokens = 0,
}) => {
  const [search, setSearch] = useState('');
  const [hoveredModelId, setHoveredModelId] = useState<string>(activeModelId);

  // Filter models
  const filteredModels = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return models;
    return models.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        (m.category && m.category.toLowerCase().includes(q)) ||
        (m.provider && m.provider.toLowerCase().includes(q))
    );
  }, [models, search]);

  // Selected or hovered model for the right inspection pane
  const activeDetail = useMemo(() => {
    return (
      models.find((m) => m.id === hoveredModelId) ||
      models.find((m) => m.id === activeModelId) ||
      models[0]
    );
  }, [models, hoveredModelId, activeModelId]);

  if (!open) return null;

  const renderSegmentedBar = (rating: number = 3, max: number = 5) => {
    return (
      <div className="flex items-center gap-1.5 flex-1">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-sm transition-all ${
              i < rating ? 'bg-slate-200 dark:bg-white' : 'bg-slate-300 dark:bg-slate-800'
            }`}
          />
        ))}
      </div>
    );
  };

  const getModelIcon = (name: string) => {
    if (name.toLowerCase().includes('opus')) {
      return (
        <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
          ✽
        </div>
      );
    }
    if (name.toLowerCase().includes('sonnet')) {
      return (
        <div className="w-5 h-5 rounded-md bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-xs shrink-0">
          ✳
        </div>
      );
    }
    if (name.toLowerCase().includes('haiku') || name.toLowerCase().includes('fable')) {
      return (
        <div className="w-5 h-5 rounded-md bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs shrink-0">
          ⚡
        </div>
      );
    }
    return (
      <div className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
        ✦
      </div>
    );
  };

  const isContextOverflow =
    activeDetail &&
    currentEstimatedTokens > 0 &&
    currentEstimatedTokens > activeDetail.contextWindow;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="w-full max-w-4xl bg-[#0e1320] text-slate-100 rounded-2xl border border-slate-800 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="h-14 px-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#0c101b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Model Capability Registry</h2>
              <p className="text-[11px] text-slate-400">Verified models with native context limits & capabilities</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Left List + Right Detail Card */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          {/* Left Pane: Search + Model List */}
          <div className="w-full md:w-1/2 border-r border-slate-800 flex flex-col min-h-0 bg-[#0a0d16]">
            {/* Search Input */}
            <div className="p-3 border-b border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search models, reasoning, vision..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-900 border border-slate-700/70 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>

            {/* Models Scrollable List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredModels.map((m) => {
                const isSelected = activeModelId === m.id;
                const isHovered = activeDetail?.id === m.id;

                return (
                  <div
                    key={m.id}
                    onMouseEnter={() => setHoveredModelId(m.id)}
                    onClick={() => {
                      onSelectModel(m.id);
                      onClose();
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-violet-600/15 border-violet-500/50 text-white shadow-xs'
                        : isHovered
                        ? 'bg-slate-800/60 border-slate-700 text-slate-200'
                        : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800/30 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {getModelIcon(m.name)}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-white truncate">{m.name}</span>
                          {m.badge && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase shrink-0">
                              {m.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{m.tokenMultiplier}x rate</span>
                          <span>•</span>
                          <span>
                            {m.contextWindow >= 1000000
                              ? `${(m.contextWindow / 1000000).toFixed(0)}M ctx`
                              : `${(m.contextWindow / 1000).toFixed(0)}k ctx`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-violet-400" />}
                    </div>
                  </div>
                );
              })}

              {filteredModels.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  No matching models found.
                </div>
              )}
            </div>
          </div>

          {/* Right Pane: Detail Inspection Card (Matching Reference Image 2) */}
          <div className="w-full md:w-1/2 p-5 flex flex-col justify-between overflow-y-auto bg-[#0e1320]">
            {activeDetail ? (
              <div className="space-y-5">
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                      {getModelIcon(activeDetail.name)}
                      <span>{activeDetail.name}</span>
                    </h3>
                    {activeDetail.badge && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        {activeDetail.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {activeDetail.description}
                  </p>
                </div>

                {/* Rating Meters: Speed & Intelligence (Image 2 style) */}
                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between gap-4 text-xs">
                    <span className="text-slate-400 font-medium w-24">Speed</span>
                    {renderSegmentedBar(activeDetail.speed || (activeDetail.tokenMultiplier < 1 ? 5 : 4))}
                  </div>

                  <div className="flex items-center justify-between gap-4 text-xs">
                    <span className="text-slate-400 font-medium w-24">Intelligence</span>
                    {renderSegmentedBar(activeDetail.intelligence || (activeDetail.tokenMultiplier >= 2 ? 5 : 4))}
                  </div>
                </div>

                {/* Meta details list */}
                <div className="space-y-2.5 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-400">Cost Tier</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      {activeDetail.costTier || (activeDetail.tokenMultiplier >= 2 ? 'Premium' : activeDetail.tokenMultiplier < 1 ? 'Economy' : 'Standard')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-400">Provider</span>
                    <span className="font-medium text-slate-200">
                      {activeDetail.provider || 'Anthropic'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-400">Context Limit</span>
                    <span className="font-mono font-medium text-slate-200">
                      {activeDetail.contextWindow >= 1000000
                        ? `${(activeDetail.contextWindow / 1000000).toFixed(0)}M tokens`
                        : `${(activeDetail.contextWindow / 1000).toFixed(0)}k tokens`}{' '}
                      <span className="text-slate-400 font-sans">
                        | {activeDetail.contextWords || `${Math.round(activeDetail.contextWindow * 0.75 / 1000)}k words`}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Capability Checkmarks (Image 2 style) */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2 text-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Supports
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Web Search</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>MCP & Tools</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <span className={activeDetail.supportsVision ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                        {activeDetail.supportsVision ? '✓' : '✕'}
                      </span>
                      <span className={activeDetail.supportsVision ? '' : 'text-slate-500'}>
                        Vision & PDFs
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <span className={activeDetail.supportsThinking ? 'text-amber-400 font-bold' : 'text-slate-600'}>
                        {activeDetail.supportsThinking ? '✓' : '✕'}
                      </span>
                      <span className={activeDetail.supportsThinking ? 'text-amber-300/90' : 'text-slate-500'}>
                        Extended Thinking
                      </span>
                    </div>
                  </div>
                </div>

                {/* Context overflow warning if switching to smaller context */}
                {isContextOverflow && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <p className="font-semibold">Context Window Warning</p>
                      <p className="text-[11px] text-amber-300/80 mt-0.5">
                        Your current conversation (~{currentEstimatedTokens.toLocaleString()} tokens) exceeds this model's {activeDetail.contextWindow.toLocaleString()} token capacity. Some older messages will be compacted.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Bottom Select Action */}
            <div className="pt-4 mt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (activeDetail) {
                    onSelectModel(activeDetail.id);
                    onClose();
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <span>{activeModelId === activeDetail?.id ? 'Current Model' : 'Select Model'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
