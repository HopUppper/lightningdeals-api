import React, { useState, useEffect } from 'react';
import {
  Bot,
  Brain,
  Sparkles,
  BookOpen,
  MessageSquare,
  Sliders,
  Play,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Shield,
  Layers,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Edit2,
  Check,
  Star,
  Zap,
} from 'lucide-react';
import { adminFetch } from '../../utils/api';

export const AdminAIControl: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'teach' | 'knowledge' | 'feedback' | 'settings' | 'simulate'>('overview');
  const [loading, setLoading] = useState(true);

  // Analytics & Stats
  const [analytics, setAnalytics] = useState<any>(null);

  // Knowledge Base State
  const [knowledgeList, setKnowledgeList] = useState<any[]>([]);
  const [kbCategoryFilter, setKbCategoryFilter] = useState('ALL');
  const [kbSearch, setKbSearch] = useState('');
  const [showAddKbModal, setShowAddKbModal] = useState(false);
  const [kbForm, setKbForm] = useState({
    category: 'PRODUCT_INFO',
    title: '',
    content: '',
    keywords: '',
    priority: 5,
  });

  // Teach Bot / Training Examples State
  const [trainingList, setTrainingList] = useState<any[]>([]);
  const [trainSearch, setTrainSearch] = useState('');
  const [showAddTrainModal, setShowAddTrainModal] = useState(false);
  const [trainForm, setTrainForm] = useState({
    inputText: '',
    expectedIntent: 'PRODUCT_INQUIRY',
    preferredResponse: '',
    language: 'hinglish',
    tags: '',
  });

  // Feedback State
  const [feedbackList, setFeedbackList] = useState<any[]>([]);

  // Settings State
  const [config, setConfig] = useState<any>({
    modelProvider: 'auto',
    modelName: 'claude-sonnet-5.5',
    temperature: 0.3,
    handoffThreshold: 0.6,
    enabled: true,
  });
  const [availableKeys, setAvailableKeys] = useState<any>({});
  const [telemetry, setTelemetry] = useState<any>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  // Test Simulator State
  const [simQuery, setSimQuery] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  // Notice Alert
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [resAnalytics, resConfig, resKb, resTrain, resFeedback] = await Promise.all([
        adminFetch('/api/admin/ai/analytics'),
        adminFetch('/api/admin/ai/config'),
        adminFetch('/api/admin/ai/knowledge'),
        adminFetch('/api/admin/ai/training'),
        adminFetch('/api/admin/ai/feedback'),
      ]);

      if (resAnalytics.ok) setAnalytics(await resAnalytics.json());
      if (resConfig.ok) {
        const cData = await resConfig.json();
        setConfig(cData.config || {});
        setAvailableKeys(cData.availableKeys || {});
        if (cData.telemetry) setTelemetry(cData.telemetry);
      }
      if (resKb.ok) {
        const kbData = await resKb.json();
        setKnowledgeList(kbData.items || []);
      }
      if (resTrain.ok) {
        const tData = await resTrain.json();
        setTrainingList(tData.examples || []);
      }
      if (resFeedback.ok) {
        const fData = await resFeedback.json();
        setFeedbackList(fData.feedbacks || []);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  // Add Knowledge Article
  const handleSaveKb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kbForm.title || !kbForm.content) return;
    try {
      const res = await adminFetch('/api/admin/ai/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kbForm),
      });
      if (res.ok) {
        setShowAddKbModal(false);
        setKbForm({ category: 'PRODUCT_INFO', title: '', content: '', keywords: '', priority: 5 });
        showNotification('Knowledge article successfully published to RAG base!');
        const kbRes = await adminFetch('/api/admin/ai/knowledge');
        if (kbRes.ok) setKnowledgeList((await kbRes.json()).items || []);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteKb = async (id: string) => {
    if (!confirm('Delete this knowledge article?')) return;
    try {
      const res = await adminFetch(`/api/admin/ai/knowledge/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setKnowledgeList(knowledgeList.filter((k) => k.id !== id));
        showNotification('Article removed from knowledge base.');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Teach Bot / Add Training Example
  const handleSaveTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainForm.inputText || !trainForm.preferredResponse) return;
    try {
      const res = await adminFetch('/api/admin/ai/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trainForm),
      });
      if (res.ok) {
        setShowAddTrainModal(false);
        setTrainForm({ inputText: '', expectedIntent: 'PRODUCT_INQUIRY', preferredResponse: '', language: 'hinglish', tags: '' });
        showNotification('⚡ AI Agent successfully taught new scenario!');
        const tRes = await adminFetch('/api/admin/ai/training');
        if (tRes.ok) setTrainingList((await tRes.json()).examples || []);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteTrain = async (id: string) => {
    if (!confirm('Remove this training example?')) return;
    try {
      const res = await adminFetch(`/api/admin/ai/training/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTrainingList(trainingList.filter((t) => t.id !== id));
        showNotification('Training example removed.');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Save Settings
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await adminFetch('/api/admin/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        showNotification('⚡ AI Configuration saved and activated across all live channels!');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingConfig(false);
    }
  };

  // Run Test Simulation
  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simQuery.trim()) return;
    setSimulating(true);
    try {
      const res = await adminFetch('/api/admin/ai/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: simQuery.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setSimResult(data.response);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-fg flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-600/10 text-violet-600 border border-violet-500/20">
              <Bot className="w-5 h-5" />
            </div>
            AI Agent 2.0 Control Center
          </h1>
          <p className="text-xs text-muted mt-1">
            Intelligent WhatsApp sales representative, trainable RAG knowledge base, and model orchestrator
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAllData}
            className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold text-fg hover:bg-slate-100 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {notice}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto text-xs font-bold">
        {[
          { id: 'overview', label: 'Overview & Metrics', icon: TrendingUp },
          { id: 'teach', label: 'Teach Bot (Scenarios)', icon: Brain },
          { id: 'knowledge', label: 'Knowledge Base (RAG)', icon: BookOpen },
          { id: 'feedback', label: 'Feedback & Ratings', icon: Star },
          { id: 'simulate', label: 'Interactive Sandbox', icon: Play },
          { id: 'settings', label: 'Model Settings', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-muted hover:text-fg hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
              <div className="text-xs text-muted font-medium">AI Automation Rate</div>
              <div className="text-2xl font-black text-violet-600 mt-1">
                {analytics?.aiAutomationRate ?? 100}%
              </div>
              <div className="text-[11px] text-muted mt-0.5">Chats resolved autonomously</div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
              <div className="text-xs text-muted font-medium">Human Takeovers</div>
              <div className="text-2xl font-black text-rose-600 mt-1">
                {analytics?.humanTakeoverCount ?? 0}
              </div>
              <div className="text-[11px] text-muted mt-0.5">Admin paused chats</div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
              <div className="text-xs text-muted font-medium">Tool Executions</div>
              <div className="text-2xl font-black text-indigo-600 mt-1">
                {analytics?.totalToolExecutions ?? 0}
              </div>
              <div className="text-[11px] text-muted mt-0.5">Verified backend actions</div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
              <div className="text-xs text-muted font-medium">Customer CSAT</div>
              <div className="text-2xl font-black text-emerald-600 mt-1 flex items-center gap-1">
                <Star className="w-5 h-5 fill-current" />
                {analytics?.averageCustomerSatisfaction ?? 5.0} / 5
              </div>
              <div className="text-[11px] text-muted mt-0.5">Based on conversation ratings</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-fg flex items-center gap-2">
                <Sliders className="w-4 h-4 text-violet-600" />
                Active Model Configuration
              </h3>
              <div className="text-xs space-y-2.5">
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-muted">Active Provider:</span>
                  <span className="font-bold font-mono text-violet-700 uppercase">{config?.modelProvider || 'Auto'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-muted">Target Model:</span>
                  <span className="font-mono text-fg">{config?.modelName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-muted">Temperature:</span>
                  <span className="font-mono text-fg">{config?.temperature}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted">External API Fallback:</span>
                  <span className="text-emerald-700 font-semibold">Local Semantic NLU Active (Zero Downtime)</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-fg flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Frequently Executed Backend Tools
              </h3>
              {analytics?.toolBreakdown?.length > 0 ? (
                <div className="space-y-2">
                  {analytics.toolBreakdown.map((t: any) => (
                    <div key={t.tool} className="flex justify-between text-xs py-1 border-b border-border/50">
                      <span className="font-mono text-fg">{t.tool}</span>
                      <span className="font-bold text-indigo-600">{t.count} calls</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted">No tool calls recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEACH BOT (SCENARIOS) */}
      {activeTab === 'teach' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input
                type="text"
                placeholder="Search training examples..."
                value={trainSearch}
                onChange={(e) => setTrainSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-border bg-card text-fg focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            <button
              onClick={() => setShowAddTrainModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Teach Bot New Scenario
            </button>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-border text-muted font-bold">
                <tr>
                  <th className="p-3">Customer Input (Hinglish/Slang)</th>
                  <th className="p-3">Intent</th>
                  <th className="p-3">Preferred AI Response</th>
                  <th className="p-3">Language</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {trainingList
                  .filter((t) => !trainSearch || t.inputText.toLowerCase().includes(trainSearch.toLowerCase()))
                  .map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-fg max-w-[200px] truncate">"{t.inputText}"</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-violet-50 text-violet-700 border border-violet-200">
                          {t.expectedIntent}
                        </span>
                      </td>
                      <td className="p-3 text-muted max-w-[320px] truncate">{t.preferredResponse}</td>
                      <td className="p-3 font-mono text-[11px] uppercase text-muted">{t.language}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteTrain(t.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {showAddTrainModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                <h3 className="text-base font-bold text-fg flex items-center gap-2">
                  <Brain className="w-5 h-5 text-violet-600" />
                  Teach AI Agent a New Scenario
                </h3>
                <form onSubmit={handleSaveTrain} className="space-y-3.5 text-xs">
                  <div>
                    <label className="font-semibold text-fg">Sample Customer Message / Slang:</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. bhai canva chahiye discount me"
                      value={trainForm.inputText}
                      onChange={(e) => setTrainForm({ ...trainForm, inputText: e.target.value })}
                      className="w-full mt-1 p-2.5 rounded-xl border border-border bg-card text-fg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-fg">Expected Intent:</label>
                    <select
                      value={trainForm.expectedIntent}
                      onChange={(e) => setTrainForm({ ...trainForm, expectedIntent: e.target.value })}
                      className="w-full mt-1 p-2.5 rounded-xl border border-border bg-card text-fg"
                    >
                      <option value="PRODUCT_INQUIRY">PRODUCT_INQUIRY</option>
                      <option value="PRICE_INQUIRY">PRICE_INQUIRY</option>
                      <option value="PAYMENT_CLAIM">PAYMENT_CLAIM</option>
                      <option value="CONSULTATIVE_RECOMMENDATION">CONSULTATIVE_RECOMMENDATION</option>
                      <option value="HUMAN_HANDOFF">HUMAN_HANDOFF</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-fg">Preferred Ideal AI Response:</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Enter the exact human-grade consultative response..."
                      value={trainForm.preferredResponse}
                      onChange={(e) => setTrainForm({ ...trainForm, preferredResponse: e.target.value })}
                      className="w-full mt-1 p-2.5 rounded-xl border border-border bg-card text-fg"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddTrainModal(false)}
                      className="px-4 py-2 rounded-xl border border-border text-muted hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 cursor-pointer"
                    >
                      Save Training Example
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: KNOWLEDGE BASE (RAG) */}
      {activeTab === 'knowledge' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <select
                value={kbCategoryFilter}
                onChange={(e) => setKbCategoryFilter(e.target.value)}
                className="text-xs p-1.5 rounded-xl border border-border bg-card text-fg"
              >
                <option value="ALL">All Categories</option>
                <option value="POLICY">Policy</option>
                <option value="PRODUCT_INFO">Product Info</option>
                <option value="OBJECTION">Objection Handling</option>
                <option value="SETUP_GUIDE">Setup Guide</option>
                <option value="FAQ">FAQ</option>
                <option value="SUPPORT">Support</option>
              </select>
              <input
                type="text"
                placeholder="Search articles..."
                value={kbSearch}
                onChange={(e) => setKbSearch(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-xl border border-border bg-card text-fg w-48"
              />
            </div>

            <button
              onClick={() => setShowAddKbModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Knowledge Article
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {knowledgeList
              .filter((k) => kbCategoryFilter === 'ALL' || k.category.toUpperCase() === kbCategoryFilter)
              .filter((k) => !kbSearch || k.title.toLowerCase().includes(kbSearch.toLowerCase()) || k.content.toLowerCase().includes(kbSearch.toLowerCase()))
              .map((k) => (
                <div key={k.id} className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-2 relative">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-violet-50 text-violet-700 border border-violet-200 uppercase">
                      {k.category}
                    </span>
                    <button
                      onClick={() => handleDeleteKb(k.id)}
                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-fg">{k.title}</h4>
                  <p className="text-xs text-muted leading-relaxed line-clamp-3">{k.content}</p>
                  {k.keywords && (
                    <div className="text-[10px] font-mono text-muted truncate">
                      Keywords: {k.keywords}
                    </div>
                  )}
                </div>
              ))}
          </div>

          {showAddKbModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                <h3 className="text-base font-bold text-fg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-violet-600" />
                  Add Enterprise Knowledge Article
                </h3>
                <form onSubmit={handleSaveKb} className="space-y-3.5 text-xs">
                  <div>
                    <label className="font-semibold text-fg">Category:</label>
                    <select
                      value={kbForm.category}
                      onChange={(e) => setKbForm({ ...kbForm, category: e.target.value })}
                      className="w-full mt-1 p-2.5 rounded-xl border border-border bg-card text-fg"
                    >
                      <option value="POLICY">POLICY</option>
                      <option value="PRODUCT_INFO">PRODUCT_INFO</option>
                      <option value="OBJECTION">OBJECTION</option>
                      <option value="SETUP_GUIDE">SETUP_GUIDE</option>
                      <option value="FAQ">FAQ</option>
                      <option value="SUPPORT">SUPPORT</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-fg">Article Title:</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 100% Replacement Guarantee"
                      value={kbForm.title}
                      onChange={(e) => setKbForm({ ...kbForm, title: e.target.value })}
                      className="w-full mt-1 p-2.5 rounded-xl border border-border bg-card text-fg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-fg">Authoritative Content (Used for RAG):</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Enter verified policy details, guarantees, or onboarding steps..."
                      value={kbForm.content}
                      onChange={(e) => setKbForm({ ...kbForm, content: e.target.value })}
                      className="w-full mt-1 p-2.5 rounded-xl border border-border bg-card text-fg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-fg">Trigger Keywords (comma-separated):</label>
                    <input
                      type="text"
                      placeholder="e.g. warranty, refund, replacement, broken"
                      value={kbForm.keywords}
                      onChange={(e) => setKbForm({ ...kbForm, keywords: e.target.value })}
                      className="w-full mt-1 p-2.5 rounded-xl border border-border bg-card text-fg"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddKbModal(false)}
                      className="px-4 py-2 rounded-xl border border-border text-muted hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 cursor-pointer"
                    >
                      Publish Article
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: FEEDBACK & RATINGS */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-border text-muted font-bold">
                <tr>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Rating</th>
                  <th className="p-3">Customer Comment</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {feedbackList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted">
                      No customer feedback received yet.
                    </td>
                  </tr>
                ) : (
                  feedbackList.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-fg">
                        {f.conversation?.customerName || f.conversation?.whatsappNumber || 'Customer'}
                      </td>
                      <td className="p-3">
                        <span className="flex items-center gap-1 font-bold text-amber-600">
                          <Star className="w-3.5 h-3.5 fill-current" /> {f.rating}/5
                        </span>
                      </td>
                      <td className="p-3 text-muted">{f.feedbackText || 'No comment provided'}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            f.reviewed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {f.reviewed ? 'Reviewed' : 'Pending Review'}
                        </span>
                      </td>
                      <td className="p-3 text-muted">{new Date(f.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: TEST SIMULATOR */}
      {activeTab === 'simulate' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-fg flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-600" />
                Live Agent Sandbox
              </h3>
              <p className="text-xs text-muted mt-1">
                Simulate any customer message in Hinglish or English to test reasoning, tool selection, and responses without sending WhatsApp messages.
              </p>
            </div>

            <form onSubmit={handleRunSimulation} className="space-y-3">
              <textarea
                rows={3}
                required
                placeholder="Type test query, e.g. 'bhai canva chahiye discount milega kya' or 'developer ke liye konsa sahi h'"
                value={simQuery}
                onChange={(e) => setSimQuery(e.target.value)}
                className="w-full p-3 rounded-xl border border-border bg-card text-xs text-fg"
              />
              <button
                type="submit"
                disabled={simulating}
                className="w-full py-2.5 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                {simulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Run Live AI Simulation
              </button>
            </form>

            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Quick Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'bhai canva chahiye',
                  'kya rate h bhai canva ka',
                  'developer ke liye konsa tool best h',
                  'is this safe and genuine?',
                  'i have paid verify now',
                  'admin se baat krwa do',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSimQuery(preset)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] text-fg cursor-pointer"
                  >
                    "{preset}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-fg flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-600" />
              Real-time Reasoning & Response
            </h3>

            {simResult ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-violet-50/50 border border-violet-100 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-violet-900">Intent: {simResult.intentDetected}</span>
                    <span className="font-mono text-violet-700">Confidence: {Math.round(simResult.confidence * 100)}%</span>
                  </div>
                  <div className="text-[11px] text-violet-800">
                    Language: <span className="uppercase font-mono">{simResult.language}</span> • Tools: {simResult.toolsUsed?.join(', ') || 'None'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200 text-fg whitespace-pre-wrap leading-relaxed">
                  {simResult.messageText}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-muted border border-dashed border-border rounded-xl">
                Run a simulation to observe AI intent detection, tool execution, and consultative reply generation.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: MODEL SETTINGS */}
      {activeTab === 'settings' && (
        <div className="max-w-xl bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
          <h3 className="text-base font-bold text-fg flex items-center gap-2">
            <Sliders className="w-5 h-5 text-violet-600" />
            Model & Provider Orchestration
          </h3>

          {/* Real-Time Model Observability */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Live Model Observability</span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {telemetry?.status || 'OPERATIONAL'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted block text-[10px]">Active Provider</span>
                <span className="font-bold text-fg uppercase font-mono">{telemetry?.activeProvider || config.modelProvider || 'rule_based'}</span>
              </div>
              <div>
                <span className="text-muted block text-[10px]">Model In Use</span>
                <span className="font-mono text-fg text-[11px]">{telemetry?.activeModel || config.modelName || 'local-semantic-nlu-2.0'}</span>
              </div>
              <div>
                <span className="text-muted block text-[10px]">Last Execution Latency</span>
                <span className="font-mono font-semibold text-violet-600">{telemetry?.lastExecutionTimeMs ? `${telemetry.lastExecutionTimeMs}ms` : '< 15ms'}</span>
              </div>
              <div>
                <span className="text-muted block text-[10px]">Total AI Invocations</span>
                <span className="font-mono font-semibold text-fg">{telemetry?.totalCalls ?? 0}</span>
              </div>
            </div>
            {telemetry?.lastCallTimestamp && (
              <div className="text-[10px] text-muted border-t border-border/50 pt-2 font-mono">
                Last Call: {new Date(telemetry.lastCallTimestamp).toLocaleTimeString()} ({telemetry.totalTokens?.totalTokens || 0} tokens accounted)
              </div>
            )}
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-fg">Model Provider:</label>
              <select
                value={config.modelProvider}
                onChange={(e) => setConfig({ ...config, modelProvider: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-border bg-card text-fg"
              >
                <option value="auto">Auto-Detect (Best Available Key / Seamless Local Fallback)</option>
                <option value="anthropic">Anthropic (Claude Sonnet 5.5 / Opus 5.5)</option>
                <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                <option value="gemini">Google Gemini (Gemini 1.5 Flash)</option>
                <option value="rule_based">Local High-Precision Semantic NLU (Zero API Key)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-fg">Model Identifier:</label>
              <input
                type="text"
                value={config.modelName}
                onChange={(e) => setConfig({ ...config, modelName: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-border bg-card text-fg font-mono"
              />
            </div>

            <div>
              <div className="flex justify-between">
                <label className="font-semibold text-fg">Creativity / Temperature:</label>
                <span className="font-mono text-muted">{config.temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.temperature}
                onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                className="w-full mt-2"
              />
            </div>

            <div>
              <div className="flex justify-between">
                <label className="font-semibold text-fg">Handoff Threshold:</label>
                <span className="font-mono text-muted">{config.handoffThreshold}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={config.handoffThreshold}
                onChange={(e) => setConfig({ ...config, handoffThreshold: parseFloat(e.target.value) })}
                className="w-full mt-2"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingConfig}
                className="w-full py-2.5 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                {savingConfig ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save AI Configuration
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
