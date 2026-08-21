import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  ShieldCheck,
  Search,
  RefreshCw,
  Key,
  UserCheck,
  Server,
  DollarSign,
  Activity,
  Globe,
  Clock,
  User,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  Filter,
  Eye,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  X,
  Lock,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { adminFetch } from '../../utils/api';

interface AuditEventItem {
  id: string;
  timestamp: string;
  eventType: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  actorType: 'CUSTOMER' | 'ADMIN' | 'API_KEY' | 'SYSTEM' | 'ANONYMOUS' | 'PAYMENT_PROVIDER' | 'SUPPLIER';
  actorId?: string;
  actorEmail?: string;
  customerId?: string;
  customer?: { id: string; name: string; email: string };
  adminId?: string;
  apiKeyId?: string;
  sessionId?: string;
  requestId?: string;
  endpoint?: string;
  httpMethod?: string;
  resourceType?: string;
  resourceId?: string;
  action?: string;
  result: 'SUCCESS' | 'BLOCKED' | 'FAILED' | 'DENIED' | 'WARNING';
  statusCode?: number;
  ipAddress?: string;
  userAgent?: string;
  country?: string;
  metadata?: string;
  failureReason?: string;
  beforeState?: string;
  afterState?: string;
  tamperHash?: string;
  previousHash?: string;
  isResolved?: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
}

interface AuditSummary {
  todayTotal: number;
  criticalTotal: number;
  highTotal: number;
  mediumTotal: number;
  blockedTotal: number;
  rateLimitTotal: number;
  failedLoginsTotal: number;
}

export const AdminLogs: React.FC = () => {
  // Data state
  const [events, setEvents] = useState<AuditEventItem[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const limit = 25;

  // Filter state
  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [actorFilter, setActorFilter] = useState<string>('ALL');
  const [resultFilter, setResultFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Tamper verification state
  const [integrityStatus, setIntegrityStatus] = useState<{
    checked: boolean;
    isTamperFree: boolean;
    checkedCount: number;
  } | null>(null);
  const [verifyingIntegrity, setVerifyingIntegrity] = useState(false);

  // Investigation Drawer state
  const [selectedEvent, setSelectedEvent] = useState<AuditEventItem | null>(null);
  const [relatedActivity, setRelatedActivity] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  // Export Modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [exporting, setExporting] = useState(false);

  // Clipboard copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        quickFilter,
        severity: severityFilter,
        actorType: actorFilter,
        result: resultFilter,
      });

      if (search.trim()) params.append('q', search.trim());
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const res = await adminFetch(`/api/admin/audit/events?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        if (data.summary) setSummary(data.summary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, quickFilter, severityFilter, actorFilter, resultFilter, search, dateFrom, dateTo]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Initial Integrity Check
  const runIntegrityCheck = async () => {
    setVerifyingIntegrity(true);
    try {
      const res = await adminFetch('/api/admin/audit/verify-integrity');
      if (res.ok) {
        const data = await res.json();
        setIntegrityStatus({
          checked: true,
          isTamperFree: data.isTamperFree,
          checkedCount: data.checkedCount,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setVerifyingIntegrity(false);
    }
  };

  useEffect(() => {
    runIntegrityCheck();
  }, []);

  const openInvestigation = async (event: AuditEventItem) => {
    setSelectedEvent(event);
    setLoadingDetail(true);
    setResolutionNotes('');
    try {
      const res = await adminFetch(`/api/admin/audit/events/${event.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedEvent(data.event);
        setRelatedActivity(data.relatedActivity || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleResolveAlert = async () => {
    if (!selectedEvent) return;
    setResolving(true);
    try {
      const res = await adminFetch(`/api/admin/audit/events/${selectedEvent.id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ notes: resolutionNotes }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedEvent(data.event);
        fetchEvents();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setResolving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        format: exportFormat,
        severity: severityFilter,
        actorType: actorFilter,
      });
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const res = await adminFetch(`/api/admin/audit/export?${params.toString()}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lightningdeals-audit-export-${Date.now()}.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setShowExportModal(false);
        fetchEvents();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-rose-600 text-white flex items-center gap-1 shadow-xs animate-pulse">
            <ShieldAlert className="w-3 h-3" />
            <span>CRITICAL</span>
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-amber-500 text-white flex items-center gap-1 shadow-xs">
            <AlertTriangle className="w-3 h-3" />
            <span>HIGH</span>
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-amber-500/10 text-amber-700 border border-amber-500/30 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>MEDIUM</span>
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1">
            <span>LOW</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-blue-500/10 text-blue-700 border border-blue-500/30 flex items-center gap-1">
            <span>INFO</span>
          </span>
        );
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'SUCCESS':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>SUCCESS</span>
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-rose-500/10 text-rose-600 border border-rose-500/30 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            <span>BLOCKED</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-red-500/10 text-red-600 border border-red-500/30 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            <span>FAILED</span>
          </span>
        );
      case 'DENIED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-amber-500/10 text-amber-700 border border-amber-500/30 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>DENIED</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-subtle text-muted border border-border">
            {result}
          </span>
        );
    }
  };

  const getActorBadge = (actorType: string, email?: string) => {
    const isSpecial = actorType === 'ADMIN';
    return (
      <div className="flex flex-col text-xs">
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase w-fit ${
            isSpecial
              ? 'bg-violet-600 text-white shadow-xs'
              : actorType === 'CUSTOMER'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              : actorType === 'API_KEY'
              ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
              : 'bg-subtle text-muted border border-border'
          }`}
        >
          {actorType}
        </span>
        {email && (
          <span className="text-[11px] font-sans text-muted truncate max-w-[140px] mt-0.5" title={email}>
            {email}
          </span>
        )}
      </div>
    );
  };

  const resetFilters = () => {
    setSearch('');
    setQuickFilter('ALL');
    setSeverityFilter('ALL');
    setActorFilter('ALL');
    setResultFilter('ALL');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header & Tamper Verification */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-fg flex items-center gap-2">
              <FileText className="w-6 h-6 text-violet-600" />
              <span>Audit & Security Event Center</span>
            </h1>
            {integrityStatus && (
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5 border shadow-xs ${
                  integrityStatus.isTamperFree
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                }`}
                title="Cryptographic SHA-256 tamper-evident hash chain verification"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {integrityStatus.isTamperFree
                    ? `Hash Chain Verified (${integrityStatus.checkedCount} records)`
                    : 'TAMPER DETECTED'}
                </span>
              </span>
            )}
          </div>
          <p className="text-xs text-muted mt-1">
            Tamper-evident, zero-secrets immutable ledger tracking all customer, administrative, and security threat events.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={runIntegrityCheck}
            disabled={verifyingIntegrity}
            className="ui-button-secondary text-xs py-2 px-3 gap-1.5 font-mono shadow-xs"
            title="Verify SHA-256 hash chaining integrity"
          >
            <Lock className="w-3.5 h-3.5 text-violet-600" />
            <span>{verifyingIntegrity ? 'Verifying...' : 'Verify Tamper Chain'}</span>
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="ui-button-secondary text-xs py-2 px-3 gap-1.5 font-mono shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Log</span>
          </button>

          <button
            onClick={fetchEvents}
            disabled={loading}
            className="ui-button-primary text-xs py-2 px-3.5 gap-1.5 font-mono shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Top Real-Time Security Metrics Cards (Section 76) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 font-mono text-xs">
        <div className="p-3.5 bg-card border border-border rounded-panel space-y-1 shadow-xs">
          <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Events Today</span>
          <div className="text-lg font-extrabold text-fg">{summary?.todayTotal?.toLocaleString() ?? '—'}</div>
        </div>

        <div className="p-3.5 bg-card border border-rose-200 rounded-panel space-y-1 shadow-xs">
          <span className="text-[10px] text-rose-700 uppercase font-bold tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping inline-block" /> Critical
          </span>
          <div className="text-lg font-extrabold text-rose-600">{summary?.criticalTotal?.toLocaleString() ?? 0}</div>
        </div>

        <div className="p-3.5 bg-card border border-amber-200 rounded-panel space-y-1 shadow-xs">
          <span className="text-[10px] text-amber-700 uppercase font-bold tracking-wider">High</span>
          <div className="text-lg font-extrabold text-amber-600">{summary?.highTotal?.toLocaleString() ?? 0}</div>
        </div>

        <div className="p-3.5 bg-card border border-border rounded-panel space-y-1 shadow-xs">
          <span className="text-[10px] text-yellow-700 uppercase font-bold tracking-wider">Medium</span>
          <div className="text-lg font-extrabold text-yellow-600">{summary?.mediumTotal?.toLocaleString() ?? 0}</div>
        </div>

        <div className="p-3.5 bg-card border border-border rounded-panel space-y-1 shadow-xs">
          <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Blocked</span>
          <div className="text-lg font-extrabold text-rose-600">{summary?.blockedTotal?.toLocaleString() ?? 0}</div>
        </div>

        <div className="p-3.5 bg-card border border-border rounded-panel space-y-1 shadow-xs">
          <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Rate Limits</span>
          <div className="text-lg font-extrabold text-amber-600">{summary?.rateLimitTotal?.toLocaleString() ?? 0}</div>
        </div>

        <div className="p-3.5 bg-card border border-border rounded-panel space-y-1 shadow-xs">
          <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Failed Logins</span>
          <div className="text-lg font-extrabold text-slate-700">{summary?.failedLoginsTotal?.toLocaleString() ?? 0}</div>
        </div>
      </div>

      {/* Quick Filter Tabs (Section 69) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
        {[
          { id: 'ALL', label: 'ALL EVENTS' },
          { id: 'SECURITY', label: '🛡️ SECURITY EVENTS' },
          { id: 'ALERTS', label: '🚨 UNRESOLVED ALERTS' },
          { id: 'CRITICAL', label: '🔴 CRITICAL' },
          { id: 'HIGH', label: '🟠 HIGH' },
          { id: 'FAILED', label: '🛑 BLOCKED / FAILED' },
          { id: 'ADMIN_ACTIONS', label: '👑 ADMIN ACTIONS' },
          { id: 'CUSTOMER_ACTIONS', label: '👤 CUSTOMER ACTIONS' },
          { id: 'API_ACTIVITY', label: '⚡ API ACTIVITY' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setQuickFilter(tab.id);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-control font-bold whitespace-nowrap transition-all ${
              quickFilter === tab.id
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs'
                : 'bg-card border border-border text-muted hover:text-fg hover:bg-subtle'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Multi-Filter & Search Bar (Section 82) */}
      <div className="p-4 bg-card border border-border rounded-panel space-y-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Event ID, Email, IP, Endpoint, Request ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-bg border border-border rounded-control py-2 pl-9 pr-8 text-xs text-fg focus:outline-none focus:border-violet-500 font-sans"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-fg text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Severity Dropdown */}
          <div>
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-bg border border-border rounded-control py-2 px-3 text-xs text-fg focus:outline-none focus:border-violet-500 font-mono"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">🔴 CRITICAL</option>
              <option value="HIGH">🟠 HIGH</option>
              <option value="MEDIUM">🟡 MEDIUM</option>
              <option value="LOW">⚪ LOW</option>
              <option value="INFO">🔵 INFO</option>
            </select>
          </div>

          {/* Actor Dropdown */}
          <div>
            <select
              value={actorFilter}
              onChange={(e) => {
                setActorFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-bg border border-border rounded-control py-2 px-3 text-xs text-fg focus:outline-none focus:border-violet-500 font-mono"
            >
              <option value="ALL">All Actors</option>
              <option value="ADMIN">ADMIN</option>
              <option value="CUSTOMER">CUSTOMER</option>
              <option value="API_KEY">API KEY</option>
              <option value="SYSTEM">SYSTEM</option>
              <option value="ANONYMOUS">ANONYMOUS</option>
            </select>
          </div>

          {/* Result Dropdown */}
          <div>
            <select
              value={resultFilter}
              onChange={(e) => {
                setResultFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-bg border border-border rounded-control py-2 px-3 text-xs text-fg focus:outline-none focus:border-violet-500 font-mono"
            >
              <option value="ALL">All Results</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="BLOCKED">BLOCKED</option>
              <option value="FAILED">FAILED</option>
              <option value="DENIED">DENIED</option>
            </select>
          </div>
        </div>

        {/* Date Range & Clear Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60 text-xs font-mono">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-muted">Date Range:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="bg-bg border border-border rounded-control py-1 px-2 text-xs text-fg focus:outline-none"
            />
            <span className="text-muted">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="bg-bg border border-border rounded-control py-1 px-2 text-xs text-fg focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-muted">
              Showing <strong>{events.length}</strong> of <strong>{total.toLocaleString()}</strong> events
            </span>
            <button
              onClick={resetFilters}
              className="text-violet-600 hover:text-violet-700 underline font-semibold"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Audit Event Table (Sections 70 & 71) */}
      <div className="bg-card border border-border rounded-panel overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-subtle/60 text-muted font-mono uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Resource & Endpoint</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-xs text-muted font-mono">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-violet-600 mb-2" />
                    <span>Loading audit records...</span>
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-xs text-muted font-mono space-y-2">
                    <p className="font-bold text-fg">No audit events match your filter criteria.</p>
                    <p className="text-[11px]">Try adjusting your search query, severity, or date range filters.</p>
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr
                    key={event.id}
                    onClick={() => openInvestigation(event)}
                    className="hover:bg-subtle/50 transition-colors cursor-pointer group"
                  >
                    {/* Time */}
                    <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap">
                      <div className="font-bold text-fg">{new Date(event.timestamp).toLocaleTimeString()}</div>
                      <div className="text-[10px] text-muted">{formatRelativeTime(event.timestamp)}</div>
                    </td>

                    {/* Severity */}
                    <td className="py-3 px-4 whitespace-nowrap">{getSeverityBadge(event.severity)}</td>

                    {/* Event Type */}
                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-fg flex items-center gap-1.5">
                        <span>{event.eventType}</span>
                        {event.isResolved && (
                          <span className="text-[10px] text-emerald-600 font-sans font-semibold">✓ Resolved</span>
                        )}
                      </div>
                      {event.failureReason && (
                        <div className="text-[11px] text-rose-600 truncate max-w-[200px]" title={event.failureReason}>
                          {event.failureReason}
                        </div>
                      )}
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActorBadge(event.actorType, event.actorEmail || event.customer?.email)}
                    </td>

                    {/* Resource & Endpoint */}
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {event.endpoint ? (
                        <span className="text-fg bg-subtle px-1.5 py-0.5 rounded border border-border truncate max-w-[180px] inline-block" title={event.endpoint}>
                          {event.httpMethod ? `${event.httpMethod} ` : ''}{event.endpoint}
                        </span>
                      ) : event.resourceType ? (
                        <span className="text-muted">
                          {event.resourceType}: <strong className="text-fg">{event.resourceId || 'N/A'}</strong>
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    {/* IP */}
                    <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-fg">{event.ipAddress || '127.0.0.1'}</span>
                        {event.country && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-subtle text-muted font-bold">
                            {event.country}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Result */}
                    <td className="py-3 px-4 whitespace-nowrap">{getResultBadge(event.result)}</td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openInvestigation(event);
                        }}
                        className="px-2.5 py-1 rounded-control bg-subtle hover:bg-violet-600 hover:text-white text-muted font-bold text-[11px] transition-all flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Investigate</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-border flex items-center justify-between font-mono text-xs">
          <span className="text-muted">
            Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total.toLocaleString()} total events)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 rounded-control bg-bg border border-border text-fg disabled:opacity-40 flex items-center gap-1 font-bold"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 rounded-control bg-bg border border-border text-fg disabled:opacity-40 flex items-center gap-1 font-bold"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Deep Event Investigation Drawer / Modal (Sections 71 & 72) */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-border rounded-panel w-full max-w-3xl max-h-[90vh] shadow-2xl overflow-y-auto font-sans relative space-y-0">
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getSeverityBadge(selectedEvent.severity)}
                  {getResultBadge(selectedEvent.result)}
                  <span className="text-xs font-mono text-muted">ID: {selectedEvent.id}</span>
                </div>
                <h2 className="text-xl font-extrabold text-fg">{selectedEvent.eventType}</h2>
              </div>

              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 rounded-full hover:bg-subtle text-muted hover:text-fg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Investigation Body */}
            <div className="p-6 space-y-6">
              {/* Alert Resolution Box if Unresolved Security Event */}
              {(selectedEvent.severity === 'HIGH' || selectedEvent.severity === 'CRITICAL' || selectedEvent.severity === 'MEDIUM') && (
                <div
                  className={`p-4 rounded-panel border ${
                    selectedEvent.isResolved
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-900'
                  } space-y-2`}
                >
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span className="flex items-center gap-1.5">
                      {selectedEvent.isResolved ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                      <span>{selectedEvent.isResolved ? 'SECURITY ALERT RESOLVED' : 'ACTIVE SECURITY INCIDENT'}</span>
                    </span>
                    {selectedEvent.isResolved && selectedEvent.resolvedAt && (
                      <span className="text-[11px] font-mono">
                        Resolved by {selectedEvent.resolvedBy} on {new Date(selectedEvent.resolvedAt).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {selectedEvent.isResolved ? (
                    <p className="text-xs text-emerald-800">
                      <strong>Resolution Notes:</strong> {selectedEvent.resolutionNotes || 'Reviewed and confirmed resolved.'}
                    </p>
                  ) : (
                    <div className="space-y-3 pt-2">
                      <p className="text-xs text-amber-900">
                        This suspicious event was flagged for administrator inspection. Review the correlated activity timeline below and mark resolved once verified.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add investigation resolution notes..."
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          className="flex-1 bg-white border border-amber-300 rounded-control px-3 py-1.5 text-xs text-fg focus:outline-none"
                        />
                        <button
                          onClick={handleResolveAlert}
                          disabled={resolving}
                          className="px-4 py-1.5 rounded-control bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
                        >
                          {resolving ? 'Saving...' : 'Mark Resolved'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Core Event Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3.5 bg-card border border-border rounded-panel space-y-1">
                  <span className="text-[10px] text-muted uppercase font-bold">Exact Timestamp</span>
                  <div className="font-bold text-fg">{new Date(selectedEvent.timestamp).toISOString()}</div>
                </div>

                <div className="p-3.5 bg-card border border-border rounded-panel space-y-1">
                  <span className="text-[10px] text-muted uppercase font-bold">Actor Type & Email</span>
                  <div className="font-bold text-fg">
                    {selectedEvent.actorType} — {selectedEvent.actorEmail || selectedEvent.customer?.email || 'N/A'}
                  </div>
                </div>

                <div className="p-3.5 bg-card border border-border rounded-panel space-y-1">
                  <span className="text-[10px] text-muted uppercase font-bold">Origin IP & Country</span>
                  <div className="font-bold text-fg flex items-center justify-between">
                    <span>{selectedEvent.ipAddress || '127.0.0.1'} ({selectedEvent.country || 'GLOBAL'})</span>
                    <button
                      onClick={() => copyToClipboard(selectedEvent.ipAddress || '', 'ip')}
                      className="text-violet-600 hover:underline text-[10px]"
                    >
                      {copiedId === 'ip' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-card border border-border rounded-panel space-y-1">
                  <span className="text-[10px] text-muted uppercase font-bold">Request ID</span>
                  <div className="font-bold text-fg truncate" title={selectedEvent.requestId || ''}>
                    {selectedEvent.requestId || 'N/A'}
                  </div>
                </div>

                {selectedEvent.endpoint && (
                  <div className="p-3.5 bg-card border border-border rounded-panel space-y-1 sm:col-span-2">
                    <span className="text-[10px] text-muted uppercase font-bold">Endpoint & Method</span>
                    <div className="font-bold text-fg">
                      {selectedEvent.httpMethod} {selectedEvent.endpoint} {selectedEvent.statusCode ? `(Status: ${selectedEvent.statusCode})` : ''}
                    </div>
                  </div>
                )}

                {selectedEvent.userAgent && (
                  <div className="p-3.5 bg-card border border-border rounded-panel space-y-1 sm:col-span-2">
                    <span className="text-[10px] text-muted uppercase font-bold">Client User Agent</span>
                    <div className="text-muted text-[11px] break-all">{selectedEvent.userAgent}</div>
                  </div>
                )}
              </div>

              {/* Before / After Change Visualizer (Section 62) */}
              {(selectedEvent.beforeState || selectedEvent.afterState) && (
                <div className="space-y-2 font-mono">
                  <span className="text-xs font-bold text-fg uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-violet-600" />
                    <span>State Mutation Diff (Before vs After)</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-red-50/50 border border-red-200 rounded-panel space-y-1">
                      <span className="text-[10px] font-bold text-red-700 uppercase">BEFORE STATE:</span>
                      <pre className="text-[11px] text-slate-800 overflow-x-auto whitespace-pre-wrap">
                        {selectedEvent.beforeState ? JSON.stringify(JSON.parse(selectedEvent.beforeState), null, 2) : 'None'}
                      </pre>
                    </div>

                    <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-panel space-y-1">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase">AFTER STATE:</span>
                      <pre className="text-[11px] text-slate-800 overflow-x-auto whitespace-pre-wrap">
                        {selectedEvent.afterState ? JSON.stringify(JSON.parse(selectedEvent.afterState), null, 2) : 'None'}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Safe Metadata JSON */}
              {selectedEvent.metadata && (
                <div className="space-y-2 font-mono">
                  <span className="text-xs font-bold text-fg uppercase tracking-wider">Sanitized Safe Metadata</span>
                  <div className="p-3.5 bg-slate-900 text-slate-100 rounded-panel overflow-x-auto text-[11px]">
                    <pre>{JSON.stringify(JSON.parse(selectedEvent.metadata), null, 2)}</pre>
                  </div>
                </div>
              )}

              {/* Related Incident Activity Correlation Stream (Sections 72 & 73) */}
              <div className="space-y-3 font-mono">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-xs font-bold text-fg uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Related Incident Activity (±60m Correlation Stream)</span>
                  </span>
                  <span className="text-[10px] text-muted">
                    {relatedActivity.length} related events found
                  </span>
                </div>

                {loadingDetail ? (
                  <div className="py-6 text-center text-xs text-muted font-mono">Correlating timeline events...</div>
                ) : relatedActivity.length === 0 ? (
                  <div className="p-4 bg-card border border-border rounded-panel text-center text-xs text-muted">
                    No other events recorded from this IP / Customer within the ±60 minute window.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {relatedActivity.map((rel) => (
                      <div
                        key={rel.id}
                        onClick={() => openInvestigation(rel)}
                        className="p-2.5 bg-card border border-border rounded-control flex items-center justify-between text-xs hover:border-violet-500 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-muted">
                            {new Date(rel.timestamp).toLocaleTimeString()}
                          </span>
                          {getSeverityBadge(rel.severity)}
                          <span className="font-bold text-fg">{rel.eventType}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {rel.endpoint && <span className="text-muted text-[11px]">{rel.endpoint}</span>}
                          {getResultBadge(rel.result)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cryptographic SHA-256 Tamper Hash */}
              <div className="p-3 bg-subtle border border-border rounded-panel text-[10px] font-mono text-muted space-y-1">
                <div className="flex items-center justify-between">
                  <span>SHA-256 Tamper Hash:</span>
                  <button
                    onClick={() => copyToClipboard(selectedEvent.tamperHash || '', 'hash')}
                    className="text-violet-600 hover:underline"
                  >
                    {copiedId === 'hash' ? 'Copied!' : 'Copy Hash'}
                  </button>
                </div>
                <div className="text-fg break-all font-bold">{selectedEvent.tamperHash || 'N/A'}</div>
                {selectedEvent.previousHash && (
                  <div className="text-muted text-[9px] truncate">
                    Linked Previous Hash: {selectedEvent.previousHash}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border flex items-center justify-between bg-subtle/40">
              <span className="text-[11px] text-muted font-mono">
                🔒 Zero secrets logging policy verified.
              </span>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2 rounded-control bg-fg text-bg hover:bg-fg/90 font-bold text-xs"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal (Section 83) */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-border rounded-panel w-full max-w-md shadow-2xl p-6 space-y-5 font-sans">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-extrabold text-fg flex items-center gap-2">
                <Download className="w-4 h-4 text-violet-600" />
                <span>Export Sanitized Audit Logs</span>
              </h3>
              <button onClick={() => setShowExportModal(false)} className="text-muted hover:text-fg">✕</button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-3 bg-violet-50 border border-violet-200 rounded-control text-violet-900 space-y-1">
                <p className="font-bold">🔒 Privacy & Compliance Assurance</p>
                <p className="text-[11px]">
                  All exported files are strictly sanitized. Passwords, API keys, tokens, prompts, and secrets are permanently excluded.
                </p>
              </div>

              <div>
                <label className="block text-muted mb-1 font-bold uppercase">Export Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportFormat('csv')}
                    className={`py-2 px-3 rounded-control font-bold text-xs border text-center transition-all ${
                      exportFormat === 'csv'
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-bg text-fg border-border'
                    }`}
                  >
                    CSV Spreadsheet
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFormat('json')}
                    className={`py-2 px-3 rounded-control font-bold text-xs border text-center transition-all ${
                      exportFormat === 'json'
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-bg text-fg border-border'
                    }`}
                  >
                    JSON Structure
                  </button>
                </div>
              </div>

              <div className="p-3 bg-card border border-border rounded-control space-y-1 text-[11px]">
                <p><strong>Current Active Filters:</strong></p>
                <p className="text-muted">Severity: {severityFilter} · Actor: {actorFilter}</p>
                {dateFrom && <p className="text-muted">From: {dateFrom} To: {dateTo || 'Present'}</p>}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 py-2.5 rounded-control bg-bg border border-border text-fg font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex-1 py-2.5 rounded-control bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>{exporting ? 'Generating...' : 'Download Export'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogs;
