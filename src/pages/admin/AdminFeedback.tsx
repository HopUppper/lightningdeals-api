import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, ShieldCheck, CheckCircle2, AlertCircle, Search, Filter, Trash2, Edit3, Save, ExternalLink, Lock, Sparkles, Check, X, Copy } from 'lucide-react';
import { adminFetch } from '../../utils/api';

interface FeedbackItem {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    status: string;
    createdAt: string;
  };
  rating: number;
  category: string | null;
  message: string;
  status: string;
  adminNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

interface ReviewItem {
  id: string;
  userId: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  displayName: string;
  roleOrCompany: string | null;
  rating: number;
  content: string;
  isApproved: boolean;
  isFeatured: boolean;
  verifiedCustomer: boolean;
  consentGiven: boolean;
  approvedAt: string | null;
  createdAt: string;
}

interface StatsData {
  totalSubmissions: number;
  uniqueCustomers: number;
  pendingCount: number;
  reviewedCount: number;
  resolvedCount: number;
  archivedCount: number;
  ratingCounts: Record<number, number>;
  averageRating: number;
  categoryCounts: Record<string, number>;
}

export const AdminFeedback: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'feedback' | 'reviews'>('feedback');
  
  // Feedback List State
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState<boolean>(true);
  const [stats, setStats] = useState<StatsData | null>(null);

  // Filters State
  const [search, setSearch] = useState<string>('');
  const [ratingFilter, setRatingFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Editing Note State
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>('');
  const [savingNote, setSavingNote] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Public Reviews Moderation State
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);
  const [reviewFilter, setReviewFilter] = useState<string>('all'); // 'all' | 'approved' | 'pending'

  // Fetch Stats & Feedback List
  const fetchStats = async () => {
    try {
      const res = await adminFetch('/api/admin/feedback/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (e) {
      console.error('Failed to load feedback stats:', e);
    }
  };

  const fetchFeedback = async () => {
    setLoadingFeedback(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (ratingFilter) params.append('rating', ratingFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (statusFilter) params.append('status', statusFilter);
      params.append('sortBy', sortBy);

      const res = await adminFetch(`/api/admin/feedback?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFeedbackList(data.items || []);
      }
    } catch (e) {
      console.error('Failed to load feedback:', e);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const params = new URLSearchParams();
      if (reviewFilter === 'approved') params.append('isApproved', 'true');
      if (reviewFilter === 'pending') params.append('isApproved', 'false');

      const res = await adminFetch(`/api/admin/reviews?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReviewsList(data.reviews || []);
      }
    } catch (e) {
      console.error('Failed to load reviews:', e);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchFeedback();
  }, [search, ratingFilter, categoryFilter, statusFilter, sortBy]);

  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchReviews();
    }
  }, [activeTab, reviewFilter]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await adminFetch(`/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setFeedbackList((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
        fetchStats();
      }
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  const handleSaveNote = async (id: string) => {
    setSavingNote(true);
    try {
      const res = await adminFetch(`/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: noteText }),
      });
      if (res.ok) {
        setFeedbackList((prev) =>
          prev.map((item) => (item.id === id ? { ...item, adminNotes: noteText } : item))
        );
        setEditingNoteId(null);
        setNoteText('');
      }
    } catch (e) {
      console.error('Failed to save note:', e);
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this feedback submission?')) return;
    try {
      const res = await adminFetch(`/api/admin/feedback/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFeedbackList((prev) => prev.filter((item) => item.id !== id));
        fetchStats();
      }
    } catch (e) {
      console.error('Failed to delete feedback:', e);
    }
  };

  const handleToggleReviewApproval = async (id: string, currentApproved: boolean) => {
    try {
      const res = await adminFetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: !currentApproved }),
      });
      if (res.ok) {
        fetchReviews();
      }
    } catch (e) {
      console.error('Failed to toggle review approval:', e);
    }
  };

  const handleToggleReviewFeatured = async (id: string, currentFeatured: boolean) => {
    try {
      const res = await adminFetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !currentFeatured }),
      });
      if (res.ok) {
        fetchReviews();
      }
    } catch (e) {
      console.error('Failed to toggle featured status:', e);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this public review?')) return;
    try {
      const res = await adminFetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReviewsList((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (e) {
      console.error('Failed to delete review:', e);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Masthead */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">
            Customer Feedback & Reviews
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7280] mt-0.5">
            Manage private engineering feedback and moderate public customer testimonials.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('feedback')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'feedback' ? 'bg-white text-[#111827] shadow-xs font-semibold' : 'text-gray-500 hover:text-black'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-[#6d28d9]" />
            <span>Private Feedback ({stats?.totalSubmissions || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reviews' ? 'bg-white text-[#111827] shadow-xs font-semibold' : 'text-gray-500 hover:text-black'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Public Reviews Moderation</span>
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS (Calculated from Real Database Records) */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-xl bg-white border border-[#e5e7eb] shadow-xs">
            <span className="text-[11px] font-mono text-gray-500 uppercase">Total Submissions</span>
            <p className="text-2xl font-bold text-[#111827] mt-1">{stats.totalSubmissions}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{stats.uniqueCustomers} unique customers</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#e5e7eb] shadow-xs">
            <span className="text-[11px] font-mono text-amber-600 uppercase">Pending Review</span>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pendingCount}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{stats.reviewedCount} already reviewed</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#e5e7eb] shadow-xs">
            <span className="text-[11px] font-mono text-emerald-600 uppercase">Resolved</span>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.resolvedCount}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{stats.archivedCount} archived</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#e5e7eb] shadow-xs">
            <span className="text-[11px] font-mono text-gray-500 uppercase">Average Rating</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-[#111827]">{stats.averageRating.toFixed(1)}</span>
              <span className="text-xs text-amber-500 font-bold">★ / 5.0</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">Across private feedback</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#e5e7eb] shadow-xs col-span-2 sm:col-span-1">
            <span className="text-[11px] font-mono text-gray-500 uppercase">Rating Breakdown</span>
            <div className="space-y-0.5 mt-1 text-[10px] font-mono">
              <div className="flex justify-between text-gray-600">
                <span>5★: {stats.ratingCounts[5] || 0}</span>
                <span>4★: {stats.ratingCounts[4] || 0}</span>
                <span>3★: {stats.ratingCounts[3] || 0}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>2★: {stats.ratingCounts[2] || 0}</span>
                <span>1★: {stats.ratingCounts[1] || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: PRIVATE FEEDBACK TABLE & CONTROLS */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="p-4 bg-white rounded-xl border border-[#e5e7eb] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by customer name, email, feedback text, or ID..."
                className="w-full bg-transparent focus:outline-none text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Rating Filter */}
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-[#fbfbfa] text-gray-700"
              >
                <option value="">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-[#fbfbfa] text-gray-700"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="RESOLVED">Resolved</option>
                <option value="ARCHIVED">Archived</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-[#fbfbfa] text-gray-700"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Feedback List */}
          {loadingFeedback ? (
            <div className="py-12 text-center text-xs font-mono text-gray-500">
              Loading feedback submissions...
            </div>
          ) : feedbackList.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500 bg-white rounded-xl border border-[#e5e7eb]">
              No feedback submissions match the current filter criteria.
            </div>
          ) : (
            <div className="space-y-3">
              {feedbackList.map((item) => (
                <div
                  key={item.id}
                  className="p-5 bg-white rounded-xl border border-[#e5e7eb] shadow-xs space-y-3 text-xs"
                >
                  {/* Top Bar: Customer & Rating & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{item.user?.name || 'Customer'}</span>
                          <span className="text-gray-400 font-mono text-[11px]">&lt;{item.user?.email}&gt;</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(item.user?.email, item.id)}
                            className="p-0.5 text-gray-400 hover:text-gray-900 rounded"
                            title="Copy email"
                          >
                            {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">
                          ID: {item.userId} · Submitted: {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <div className="flex items-center text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < item.rating ? 'fill-current' : 'text-gray-200'
                            }`}
                          />
                        ))}
                      </div>

                      {item.category && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-200">
                          {item.category}
                        </span>
                      )}

                      {/* Status Dropdown */}
                      <select
                        value={item.status}
                        onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                        className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border cursor-pointer ${
                          item.status === 'RESOLVED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : item.status === 'REVIEWED'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : item.status === 'ARCHIVED'
                            ? 'bg-gray-100 text-gray-600 border-gray-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="REVIEWED">REVIEWED</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleDeleteFeedback(item.id)}
                        className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Feedback"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Written Feedback Message */}
                  <div className="py-1">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-xs sm:text-[13px]">
                      {item.message}
                    </p>
                  </div>

                  {/* Admin Notes Section */}
                  <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                    {editingNoteId === item.id ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="text"
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Internal admin note..."
                          className="flex-1 px-2.5 py-1 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:border-[#6d28d9]"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveNote(item.id)}
                          disabled={savingNote}
                          className="px-2.5 py-1 rounded-lg bg-[#6d28d9] text-white font-semibold cursor-pointer flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          <span>Save</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingNoteId(null)}
                          className="px-2 py-1 text-gray-500 hover:text-black"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-500">ADMIN NOTE:</span>
                          <span className="text-gray-700 italic">
                            {item.adminNotes || 'No internal note yet.'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNoteId(item.id);
                            setNoteText(item.adminNotes || '');
                          }}
                          className="text-[#6d28d9] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{item.adminNotes ? 'Edit Note' : 'Add Note'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* TAB 2: PUBLIC REVIEWS MODERATION */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          
          {/* Moderation Controls */}
          <div className="p-4 bg-white rounded-xl border border-[#e5e7eb] shadow-xs flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Filter Moderation Queue:</span>
              <button
                type="button"
                onClick={() => setReviewFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  reviewFilter === 'all' ? 'bg-[#6d28d9] text-white font-semibold' : 'bg-gray-100 text-gray-700'
                }`}
              >
                All Reviews
              </button>
              <button
                type="button"
                onClick={() => setReviewFilter('approved')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  reviewFilter === 'approved' ? 'bg-[#6d28d9] text-white font-semibold' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Published
              </button>
              <button
                type="button"
                onClick={() => setReviewFilter('pending')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  reviewFilter === 'pending' ? 'bg-[#6d28d9] text-white font-semibold' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Awaiting Approval
              </button>
            </div>

            <p className="text-[11px] text-gray-500 font-mono hidden sm:block">
              Only explicitly approved reviews appear on the public homepage.
            </p>
          </div>

          {/* Reviews List */}
          {loadingReviews ? (
            <div className="py-12 text-center text-xs font-mono text-gray-500">
              Loading public reviews...
            </div>
          ) : reviewsList.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500 bg-white rounded-xl border border-[#e5e7eb]">
              No reviews in this moderation queue.
            </div>
          ) : (
            <div className="space-y-3">
              {reviewsList.map((review) => (
                <div
                  key={review.id}
                  className={`p-5 rounded-xl border shadow-xs space-y-3 text-xs ${
                    review.isApproved ? 'bg-white border-[#e5e7eb]' : 'bg-amber-50/30 border-amber-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{review.displayName}</span>
                        {review.roleOrCompany && (
                          <span className="text-gray-500 font-mono text-[11px]">
                            ({review.roleOrCompany})
                          </span>
                        )}
                        {review.verifiedCustomer && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Verified Customer
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">
                        Submitted: {new Date(review.createdAt).toLocaleString()} · User: {review.user?.email || 'Anonymous'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < review.rating ? 'fill-current' : 'text-gray-200'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Approval Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleReviewApproval(review.id, review.isApproved)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          review.isApproved
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                      >
                        {review.isApproved ? 'Published (Click to Unpublish)' : 'Approve for Public'}
                      </button>

                      {/* Featured Toggle */}
                      {review.isApproved && (
                        <button
                          type="button"
                          onClick={() => handleToggleReviewFeatured(review.id, review.isFeatured)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                            review.isFeatured
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : 'bg-gray-100 text-gray-600 hover:text-black'
                          }`}
                        >
                          {review.isFeatured ? '★ Featured' : 'Feature'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteReview(review.id)}
                        className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete Review"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-800 leading-relaxed italic text-xs sm:text-[13px]">
                    "{review.content}"
                  </p>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
