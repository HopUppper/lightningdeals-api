import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Zap,
  CreditCard,
  Layers,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { FriendlyErrorInfo } from '../utils/friendlyErrors';

interface ErrorSolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: FriendlyErrorInfo | null;
  rawEvent?: {
    id?: string;
    model?: string;
    endpoint?: string;
    statusCode?: number;
    createdAt?: string;
  } | null;
}

export const ErrorSolutionModal: React.FC<ErrorSolutionModalProps> = ({
  isOpen,
  onClose,
  error,
  rawEvent,
}) => {
  const navigate = useNavigate();

  if (!isOpen || !error) return null;

  const getCategoryIcon = () => {
    switch (error.category) {
      case 'window_limit':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'credit_depleted':
        return <CreditCard className="w-5 h-5 text-rose-600" />;
      case 'token_pack_depleted':
        return <Layers className="w-5 h-5 text-amber-600" />;
      case 'model_not_allowed':
        return <Sparkles className="w-5 h-5 text-violet-600" />;
      case 'invalid_key':
      case 'key_suspended':
        return <ShieldCheck className="w-5 h-5 text-rose-600" />;
      case 'cluster_busy':
        return <Zap className="w-5 h-5 text-sky-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-violet-600" />;
    }
  };

  const getBadgeColor = () => {
    if (error.statusCode === 429) return 'bg-amber-50 text-amber-800 border-amber-200';
    if (error.statusCode === 402) return 'bg-rose-50 text-rose-800 border-rose-200';
    if (error.statusCode === 403) return 'bg-purple-50 text-purple-800 border-purple-200';
    if (error.statusCode >= 500) return 'bg-sky-50 text-sky-800 border-sky-200';
    return 'bg-stone-100 text-stone-800 border-stone-200';
  };

  const handleAction = () => {
    if (!error.actionUrl) {
      onClose();
      return;
    }
    if (error.actionType === 'external' || error.actionUrl.startsWith('mailto:') || error.actionUrl.startsWith('http')) {
      window.open(error.actionUrl, '_blank', 'noopener,noreferrer');
    } else {
      onClose();
      navigate(error.actionUrl);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="error-solution-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-[#e7e5e4] max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#e7e5e4] flex items-start justify-between gap-4 bg-[#faf8f5]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#e7e5e4] flex items-center justify-center shadow-2xs shrink-0 mt-0.5">
              {getCategoryIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${getBadgeColor()}`}>
                  HTTP {error.statusCode}
                </span>
                <span className="text-[11px] text-[#78716c] font-medium">Issue Diagnosis & Solution</span>
              </div>
              <h3 id="error-solution-title" className="text-base font-bold text-[#1c1917] leading-snug">
                {error.simpleTitle}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#78716c] hover:text-[#1c1917] hover:bg-stone-200/60 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Explanation Box */}
          <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#e7e5e4] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1c1917]">
              <Info className="w-3.5 h-3.5 text-violet-600" />
              <span>What Happened</span>
            </div>
            <p className="text-xs text-[#44403c] leading-relaxed">
              {error.simpleReason}
            </p>
            <p className="text-[11.5px] text-[#78716c] leading-relaxed pt-1 border-t border-[#ede8e1]">
              {error.simpleExplanation}
            </p>
          </div>

          {/* Step-by-Step Resolution */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#78716c]">
              How to Resolve This Issue
            </h4>
            <div className="space-y-2">
              {error.solutionSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-stone-50/80 border border-stone-200/70 text-xs">
                  <div className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="text-[#292524] leading-relaxed">
                    {step}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Context & Metadata (if available) */}
          {rawEvent && (
            <div className="pt-2 border-t border-[#e7e5e4] flex flex-wrap items-center justify-between text-[11px] font-mono text-[#78716c] gap-2">
              {rawEvent.model && (
                <div>
                  <span className="text-[#a8a29e]">Model: </span>
                  <span className="text-[#1c1917] font-semibold">{rawEvent.model}</span>
                </div>
              )}
              {rawEvent.createdAt && (
                <div>
                  <span className="text-[#a8a29e]">Time: </span>
                  <span>{new Date(rawEvent.createdAt).toLocaleTimeString()}</span>
                </div>
              )}
              <div className="text-[10px] text-emerald-700 font-sans flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Zero tokens charged for failed attempts</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#faf8f5] border-t border-[#e7e5e4] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-[#57534e] hover:text-[#1c1917] hover:bg-stone-200/50 transition-colors cursor-pointer"
          >
            Close
          </button>

          {error.actionLabel && (
            <button
              type="button"
              onClick={handleAction}
              className="px-4 py-2 rounded-lg bg-[#6d28d9] hover:bg-[#5b21b6] text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>{error.actionLabel}</span>
              {error.actionType === 'external' ? (
                <ExternalLink className="w-3.5 h-3.5" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
