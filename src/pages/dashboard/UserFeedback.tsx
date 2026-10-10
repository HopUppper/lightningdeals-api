import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, ShieldCheck, CheckCircle2, AlertCircle, History, Sparkles, Send, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userFetch } from '../../utils/api';

const CATEGORIES = [
  { id: 'api_reliability', name: 'API Reliability & Uptime' },
  { id: 'model_quality', name: 'Model Quality & Output Coherence' },
  { id: 'response_speed', name: 'Response Speed & First-Token TTFT' },
  { id: 'pricing_value', name: 'Pricing & Token Capacity Value' },
  { id: 'documentation', name: 'Documentation & Setup Workflows' },
  { id: 'customer_support', name: 'Customer Support Experience' },
  { id: 'other', name: 'Other Observations' },
];

interface FeedbackHistoryItem {
  id: string;
  rating: number;
  category: string | null;
  message: string;
  status: string;
  createdAt: string;
}

export const UserFeedback: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'private' | 'public'>('private');

  // Private Feedback Form State
  const [privateRating, setPrivateRating] = useState<number>(5);
  const [privateHoverRating, setPrivateHoverRating] = useState<number>(0);
  const [privateCategory, setPrivateCategory] = useState<string>('api_reliability');
  const [privateMessage, setPrivateMessage] = useState<string>('');
  const [submittingPrivate, setSubmittingPrivate] = useState<boolean>(false);
  const [privateSuccess, setPrivateSuccess] = useState<string | null>(null);
  const [privateError, setPrivateError] = useState<string | null>(null);

  // History State
  const [history, setHistory] = useState<FeedbackHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);

  // Public Testimonial Form State
  const [publicRating, setPublicRating] = useState<number>(5);
  const [publicHoverRating, setPublicHoverRating] = useState<number>(0);
  const [publicDisplayName, setPublicDisplayName] = useState<string>(user?.name || '');
  const [publicRole, setPublicRole] = useState<string>('');
  const [publicContent, setPublicContent] = useState<string>('');
  const [publicConsent, setPublicConsent] = useState<boolean>(false);
  const [submittingPublic, setSubmittingPublic] = useState<boolean>(false);
  const [publicSuccess, setPublicSuccess] = useState<string | null>(null);
  const [publicError, setPublicError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      const res = await userFetch('/api/user/feedback/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to load feedback history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handlePrivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrivateError(null);
    setPrivateSuccess(null);

    if (!privateMessage.trim() || privateMessage.trim().length < 5) {
      setPrivateError('Please provide at least 5 characters of feedback.');
      return;
    }

    setSubmittingPrivate(true);
    try {
      const res = await userFetch('/api/user/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: privateRating,
          category: privateCategory,
          message: privateMessage.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPrivateSuccess('Thank you! Your feedback has been safely submitted directly to our engineering leadership.');
        setPrivateMessage('');
        fetchHistory();
      } else {
        setPrivateError(data.error?.message || 'Failed to submit feedback.');
      }
    } catch (err: any) {
      setPrivateError('Network error while submitting feedback.');
    } finally {
      setSubmittingPrivate(false);
    }
  };

  const handlePublicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublicError(null);
    setPublicSuccess(null);

    if (!publicConsent) {
      setPublicError('Explicit consent is required to submit a review for public publication.');
      return;
    }

    if (!publicContent.trim() || publicContent.trim().length < 10) {
      setPublicError('Please provide at least 10 characters for your public review.');
      return;
    }

    setSubmittingPublic(true);
    try {
      const res = await userFetch('/api/user/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: publicRating,
          displayName: publicDisplayName.trim() || user?.name || 'Verified Developer',
          roleOrCompany: publicRole.trim() || null,
          content: publicContent.trim(),
          consentGiven: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPublicSuccess('Thank you! Your testimonial has been submitted for editorial verification before publication.');
        setPublicContent('');
      } else {
        setPublicError(data.error?.message || 'Failed to submit review.');
      }
    } catch (err: any) {
      setPublicError('Network error while submitting review.');
    } finally {
      setSubmittingPublic(false);
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-4xl">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">
          Feedback & Reviews
        </h1>
        <p className="text-xs sm:text-sm text-[#6b7280] mt-1">
          Share your direct observations with our engineering team or submit an authentic developer testimonial.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#e5e7eb] pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('private')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'private'
              ? 'border-[#6d28d9] text-[#6d28d9]'
              : 'border-transparent text-[#6b7280] hover:text-[#111827]'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Private Engineering Feedback</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('public')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'public'
              ? 'border-[#6d28d9] text-[#6d28d9]'
              : 'border-transparent text-[#6b7280] hover:text-[#111827]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Submit Public Testimonial</span>
        </button>
      </div>

      {/* TAB 1: PRIVATE FEEDBACK */}
      {activeTab === 'private' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 flex items-start gap-3 text-xs text-purple-900 leading-relaxed">
            <Lock className="w-4 h-4 text-[#6d28d9] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#6d28d9]">Confidential & Private to Administrators</p>
              <p className="text-[#57534e] mt-0.5">
                Submissions made here are strictly confidential and will <strong>never</strong> appear on the public website or public review endpoints. They are reviewed exclusively by authorized platform administrators.
              </p>
            </div>
          </div>

          <form onSubmit={handlePrivateSubmit} className="bg-white rounded-2xl border border-[#e5e7eb] p-5 sm:p-7 shadow-xs space-y-6">
            
            {/* 1-5 Star Interactive Rating */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#374151]">
                Overall Service Rating <span className="text-red-500">*</span>
              </label>

              <div className="flex items-center gap-1.5" role="group" aria-label="Rating selector">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (privateHoverRating || privateRating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setPrivateRating(star)}
                      onMouseEnter={() => setPrivateHoverRating(star)}
                      onMouseLeave={() => setPrivateHoverRating(0)}
                      className="p-1 rounded hover:scale-110 transition-transform cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/20"
                      aria-label={`${star} out of 5 stars`}
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          isFilled ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                        }`}
                      />
                    </button>
                  );
                })}
                <span className="text-xs font-mono font-semibold text-[#4b5563] ml-3">
                  {privateRating} / 5 Stars
                </span>
              </div>
            </div>

            {/* Category Selector */}
            <div className="space-y-2">
              <label htmlFor="feedback-category" className="block text-xs font-semibold text-[#374151]">
                Feedback Category
              </label>
              <select
                id="feedback-category"
                value={privateCategory}
                onChange={(e) => setPrivateCategory(e.target.value)}
                className="w-full sm:max-w-md px-3 py-2 text-xs rounded-xl border border-[#e5e7eb] bg-[#fbfbfa] text-[#111827] focus:outline-none focus:border-[#6d28d9] focus:ring-1 focus:ring-[#6d28d9]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Feedback Message */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="feedback-message" className="font-semibold text-[#374151]">
                  Written Feedback <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] font-mono text-[#9ca3af]">
                  {privateMessage.length} / 3000 chars
                </span>
              </div>

              <textarea
                id="feedback-message"
                rows={4}
                value={privateMessage}
                onChange={(e) => setPrivateMessage(e.target.value)}
                placeholder="What went well? Where did you encounter latency, error states, or confusing behavior? Be as detailed as you like..."
                className="w-full p-3.5 text-xs rounded-xl border border-[#e5e7eb] bg-[#fbfbfa] text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#6d28d9] focus:ring-1 focus:ring-[#6d28d9] leading-relaxed"
                maxLength={3000}
              />
            </div>

            {/* Error & Success Messages */}
            {privateError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{privateError}</span>
              </div>
            )}

            {privateSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{privateSuccess}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={submittingPrivate}
                className="px-5 py-2.5 rounded-xl bg-[#6d28d9] hover:bg-[#581c87] text-white font-semibold text-xs inline-flex items-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {submittingPrivate ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Private Feedback</span>
                  </>
                )}
              </button>
            </div>

          </form>

          {/* Past Submissions History */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#111827]">
              <History className="w-4 h-4 text-[#6b7280]" />
              <h3>Your Past Feedback Submissions</h3>
            </div>

            {loadingHistory ? (
              <div className="text-center py-6 text-xs text-gray-500 font-mono">
                Loading history...
              </div>
            ) : history.length === 0 ? (
              <div className="p-5 text-center text-xs text-gray-500 bg-white rounded-xl border border-[#e5e7eb]">
                You have not submitted any private feedback yet.
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-white border border-[#e5e7eb] shadow-xs space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < item.rating ? 'fill-current' : 'text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        {item.category && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-gray-100 text-gray-700">
                            {CATEGORIES.find((c) => c.id === item.category)?.name || item.category}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            item.status === 'RESOLVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.status === 'REVIEWED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {item.status}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {item.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: PUBLIC TESTIMONIAL SUBMISSION */}
      {activeTab === 'public' && (
        <form onSubmit={handlePublicSubmit} className="bg-white rounded-2xl border border-[#e5e7eb] p-5 sm:p-7 shadow-xs space-y-6">
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">Public Review Publication Workflow</p>
              <p className="text-stone-600 mt-0.5">
                Reviews submitted here may appear in the public <strong>"Built for people who build"</strong> community section after independent editorial review. Explicit consent is required.
              </p>
            </div>
          </div>

          {/* Star Rating */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#374151]">
              Star Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (publicHoverRating || publicRating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setPublicRating(star)}
                    onMouseEnter={() => setPublicHoverRating(star)}
                    onMouseLeave={() => setPublicHoverRating(0)}
                    className="p-1 rounded hover:scale-110 transition-transform cursor-pointer"
                    aria-label={`${star} out of 5 stars`}
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        isFilled ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="text-xs font-mono font-semibold text-[#4b5563] ml-3">
                {publicRating} / 5 Stars
              </span>
            </div>
          </div>

          {/* Display Name & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="public-display-name" className="block text-xs font-semibold text-[#374151]">
                Public Display Name <span className="text-red-500">*</span>
              </label>
              <input
                id="public-display-name"
                type="text"
                value={publicDisplayName}
                onChange={(e) => setPublicDisplayName(e.target.value)}
                placeholder="e.g. Alex M. or Anonymous"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#e5e7eb] bg-[#fbfbfa] text-[#111827] focus:outline-none focus:border-[#6d28d9]"
                required
              />
              <p className="text-[10px] text-gray-500 font-mono">
                Your email address will NEVER be displayed publicly.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="public-role" className="block text-xs font-semibold text-[#374151]">
                Role / Title <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                id="public-role"
                type="text"
                value={publicRole}
                onChange={(e) => setPublicRole(e.target.value)}
                placeholder="e.g. Staff Backend Engineer"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#e5e7eb] bg-[#fbfbfa] text-[#111827] focus:outline-none focus:border-[#6d28d9]"
              />
            </div>
          </div>

          {/* Review Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="public-content" className="font-semibold text-[#374151]">
                Public Review Text <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] font-mono text-[#9ca3af]">
                {publicContent.length} / 2000 chars
              </span>
            </div>
            <textarea
              id="public-content"
              rows={4}
              value={publicContent}
              onChange={(e) => setPublicContent(e.target.value)}
              placeholder="Describe your workflow with LightningAPI, reliability with Claude 3.5 Sonnet / Opus, and rolling quota experience..."
              className="w-full p-3.5 text-xs rounded-xl border border-[#e5e7eb] bg-[#fbfbfa] text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#6d28d9] focus:ring-1 focus:ring-[#6d28d9] leading-relaxed"
              maxLength={2000}
              required
            />
          </div>

          {/* Explicit Consent Checkbox */}
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-start gap-3">
            <input
              id="consent-checkbox"
              type="checkbox"
              checked={publicConsent}
              onChange={(e) => setPublicConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#6d28d9] focus:ring-[#6d28d9] cursor-pointer"
            />
            <label htmlFor="consent-checkbox" className="text-xs text-gray-700 leading-relaxed cursor-pointer">
              <strong>Explicit Publication Consent:</strong> I grant LightningAPI permission to display my original review, rating, and display name publicly on lightningapi.pro. I understand my email and account ID will remain strictly confidential.
            </label>
          </div>

          {/* Feedback Messages */}
          {publicError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{publicError}</span>
            </div>
          )}

          {publicSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{publicSuccess}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={submittingPublic || !publicConsent}
              className="px-5 py-2.5 rounded-xl bg-[#6d28d9] hover:bg-[#581c87] text-white font-semibold text-xs inline-flex items-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {submittingPublic ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Submit for Verification</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

    </div>
  );
};
