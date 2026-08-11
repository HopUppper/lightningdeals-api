import React, { useState, useEffect } from 'react';
import { Activity, Search, Filter, AlertCircle, CheckCircle2, Clock, Zap, RefreshCw, X, ChevronRight, Info, Database, ShieldAlert, Cpu } from 'lucide-react';
import { adminFetch } from '../../utils/api';

export const AdminRequests: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = requests.filter((r) => {
    const isSuccess = (r.statusCode || 200) < 400;
    if (statusFilter === 'SUCCESS' && !isSuccess) return false;
    if (statusFilter === 'FAILED' && isSuccess) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const reqIdStr = (r.requestId || '').toLowerCase();
      const modelStr = (r.model || '').toLowerCase();
      const keyStr = (r.apiKey?.name || r.apiKey?.displayKey || '').toLowerCase();
      const userStr = (r.user?.email || r.user?.name || '').toLowerCase();
      const errStr = (r.errorMessage || r.errorCode || '').toLowerCase();
      return reqIdStr.includes(q) || modelStr.includes(q) || keyStr.includes(q) || userStr.includes(q) || errStr.includes(q);
    }

    return true;
  });

  const getStatusBadge = (statusCode: number, errorCode?: string) => {
    if (statusCode < 400) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 flex items-center gap-1 w-fit">
          <CheckCircle2 className="w-3 h-3" />
          <span>{statusCode} OK</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 border border-red-500/30 flex items-center gap-1 w-fit">
        <AlertCircle className="w-3 h-3" />
        <span>{statusCode} {errorCode ? `(${errorCode})` : 'FAILED'}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
            <Activity className="w-6 h-6 text-violet-600" />
            <span>API Prompt & Telemetry Inspector</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Real-time prompt execution logs: success/failure reasons, token accounting breakdown, latency, and upstream vendor diagnostics.
          </p>
        </div>

        <button
          onClick={loadRequests}
          disabled={loading}
          className="ui-button-secondary text-xs py-2 px-3.5 gap-2 font-mono"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border p-4 rounded-panel shadow-xs font-mono">
        <div className="flex items-center gap-2 relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Request ID, Model, API Key, Customer, or Error..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-bg border border-border rounded-control py-1.5 pl-9 pr-3 text-xs text-fg focus:outline-none focus:border-violet-500 font-sans"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-muted hover:text-fg text-xs pr-2">✕</button>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs font-sans">
          {(['ALL', 'SUCCESS', 'FAILED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-control font-bold transition-all text-xs ${
                statusFilter === st
                  ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-xs'
                  : 'bg-bg text-muted hover:text-fg border border-border'
              }`}
            >
              {st === 'ALL' ? 'All Requests' : st === 'SUCCESS' ? 'Successful (200)' : 'Failed (4xx/5xx)'}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-card border border-border rounded-panel overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-xs text-muted font-mono flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-violet-600" />
            <span>Loading API request telemetry...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 text-center text-xs text-muted font-mono space-y-2">
            <Activity className="w-8 h-8 text-muted mx-auto" />
            <p>No prompt execution telemetry matching filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg/60">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Model & Endpoint</th>
                  <th className="py-3 px-4">Key / Customer</th>
                  <th className="py-3 px-4">Tokens (In / Out)</th>
                  <th className="py-3 px-4">Latency</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono">
                {filteredRequests.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedRequest(r)}
                    className="hover:bg-bg/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 text-muted whitespace-nowrap text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-muted shrink-0" />
                        <span>{new Date(r.createdAt).toLocaleString()}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(r.statusCode, r.errorCode)}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-fg flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                        <span>{r.model}</span>
                      </div>
                      <div className="text-[10px] text-muted font-mono mt-0.5">
                        {r.endpoint} {r.streaming ? '(Stream SSE)' : '(Sync)'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-fg font-sans">
                      <div className="font-mono text-xs font-semibold">{r.apiKey?.name || r.apiKey?.displayKey || 'Direct Key'}</div>
                      <div className="text-[10px] text-muted font-mono">{r.user?.email || 'System User'}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-violet-600">{Number(r.totalTokens || 0).toLocaleString()} tokens</div>
                      <div className="text-[10px] text-muted font-mono">
                        {Number(r.inputTokens || 0).toLocaleString()} in / {Number(r.outputTokens || 0).toLocaleString()} out
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-muted whitespace-nowrap">
                      {r.latencyMs} ms
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button className="text-violet-600 hover:text-violet-700 font-bold text-xs flex items-center gap-1 ml-auto">
                        <span>Inspect</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Details Drawer / Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-panel max-w-2xl w-full p-6 space-y-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col font-sans">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-bold text-fg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-violet-600" />
                  <span>Prompt Execution Telemetry Inspector</span>
                </h2>
                <p className="text-xs text-muted font-mono mt-0.5">Request ID: {selectedRequest.requestId}</p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1.5 rounded-control text-muted hover:text-fg hover:bg-bg border border-border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-1 font-mono text-xs">
              {/* Outcome Status Banner */}
              <div className={`p-4 rounded-panel border ${
                selectedRequest.statusCode < 400
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                  : 'bg-red-500/10 border-red-500/30 text-red-600'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm">
                  {selectedRequest.statusCode < 400 ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  <span>HTTP {selectedRequest.statusCode} {selectedRequest.statusCode < 400 ? 'SUCCESS' : 'EXECUTION FAILED'}</span>
                </div>

                {selectedRequest.statusCode >= 400 && (
                  <div className="mt-2.5 pt-2.5 border-t border-red-500/20 space-y-1.5 text-xs">
                    <div><span className="font-bold uppercase text-[10px]">Error Code:</span> {selectedRequest.errorCode || 'upstream_error'}</div>
                    <div><span className="font-bold uppercase text-[10px]">Failure Rationale:</span> {selectedRequest.errorMessage || 'No detailed error string supplied.'}</div>

                    <div className="mt-2 p-2.5 bg-red-950/40 rounded border border-red-500/30 text-[11px] font-sans text-fg">
                      <span className="font-bold text-red-400">💡 Diagnostic Guidance:</span>{' '}
                      {selectedRequest.statusCode === 503
                        ? 'The upstream vendor cluster (ScaleMax/Anthropic) experienced a temporary 503 capacity outage. Requests automatically retry or route to backup vendor.'
                        : selectedRequest.statusCode === 429
                        ? 'Customer API Key reached its 5-hour rolling token allowance or RPM limit.'
                        : selectedRequest.statusCode === 400
                        ? 'Request parameters or vendor Base URL rejected by safety validation filters.'
                        : 'Inspect vendor credentials and model mappings in Admin -> Providers.'}
                    </div>
                  </div>
                )}
              </div>

              {/* Grid Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-bg border border-border p-3 rounded-control space-y-1">
                  <div className="text-[10px] text-muted uppercase">Model Name</div>
                  <div className="font-bold text-fg font-sans">{selectedRequest.model}</div>
                </div>

                <div className="bg-bg border border-border p-3 rounded-control space-y-1">
                  <div className="text-[10px] text-muted uppercase">Total Tokens</div>
                  <div className="font-bold text-violet-600">{Number(selectedRequest.totalTokens || 0).toLocaleString()}</div>
                </div>

                <div className="bg-bg border border-border p-3 rounded-control space-y-1">
                  <div className="text-[10px] text-muted uppercase">Latency</div>
                  <div className="font-bold text-fg">{selectedRequest.latencyMs} ms</div>
                </div>

                <div className="bg-bg border border-border p-3 rounded-control space-y-1">
                  <div className="text-[10px] text-muted uppercase">Input Tokens</div>
                  <div className="font-bold text-fg">{Number(selectedRequest.inputTokens || 0).toLocaleString()}</div>
                </div>

                <div className="bg-bg border border-border p-3 rounded-control space-y-1">
                  <div className="text-[10px] text-muted uppercase">Output Tokens</div>
                  <div className="font-bold text-fg">{Number(selectedRequest.outputTokens || 0).toLocaleString()}</div>
                </div>

                <div className="bg-bg border border-border p-3 rounded-control space-y-1">
                  <div className="text-[10px] text-muted uppercase">Accounting Source</div>
                  <div className="font-bold text-emerald-600">{selectedRequest.usageSource || 'PROVIDER_REPORTED'}</div>
                </div>
              </div>

              {/* Meta details */}
              <div className="bg-bg border border-border p-3.5 rounded-control space-y-2 text-xs">
                <div className="font-bold text-fg border-b border-border pb-1 text-[11px] uppercase tracking-wider">Context & Key Ownership</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-muted">Customer Email:</span> <span className="text-fg font-semibold">{selectedRequest.user?.email || 'N/A'}</span></div>
                  <div><span className="text-muted">API Key Label:</span> <span className="text-fg font-semibold">{selectedRequest.apiKey?.name || selectedRequest.apiKey?.displayKey || 'N/A'}</span></div>
                  <div><span className="text-muted">Streaming Mode:</span> <span className="text-fg font-semibold">{selectedRequest.streaming ? 'Yes (Server-Sent Events)' : 'No (Synchronous)'}</span></div>
                  <div><span className="text-muted">Timestamp:</span> <span className="text-fg font-semibold">{new Date(selectedRequest.createdAt).toLocaleString()}</span></div>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4 text-right">
              <button
                onClick={() => setSelectedRequest(null)}
                className="ui-button-secondary py-2 px-4 text-xs font-mono"
              >
                Close Telemetry Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
