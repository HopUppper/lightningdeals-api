import React, { useState, useEffect } from 'react';
import { Activity, Search, Filter } from 'lucide-react';
import { adminFetch } from '../../utils/api';

export const AdminRequests: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modelFilter, setModelFilter] = useState('all');

  useEffect(() => {
    async function loadRequests() {
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
    }
    loadRequests();
  }, []);

  const filtered = modelFilter === 'all' ? requests : requests.filter((r) => r.model === modelFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg">API Request Logs</h1>
        <p className="text-xs text-muted mt-1">
          Inspect incoming customer API calls, model selections, token balances, latency, and status codes.
        </p>
      </div>

      <div className="bg-card border border-border rounded-panel overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-muted">Loading request logs...</div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted">No API request logs recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50">
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Key / Customer</th>
                  <th className="py-3 px-4">Model</th>
                  <th className="py-3 px-4">Tokens (In / Out)</th>
                  <th className="py-3 px-4">Total Tokens</th>
                  <th className="py-3 px-4">Latency</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-bg/40">
                    <td className="py-3 px-4 font-mono text-muted text-[11px] truncate max-w-[120px]">{r.requestId}</td>
                    <td className="py-3 px-4 font-mono text-fg">
                      {r.apiKey?.name || r.apiKey?.displayKey || 'Direct API'}
                      <p className="text-[10px] text-muted">{r.user?.email || 'Unassigned'}</p>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-fg">{r.model}</td>
                    <td className="py-3 px-4 font-mono text-muted">{r.inputTokens} / {r.outputTokens}</td>
                    <td className="py-3 px-4 font-mono font-bold text-accent">{r.totalTokens}</td>
                    <td className="py-3 px-4 font-mono text-muted">{r.latencyMs} ms</td>
                    <td className="py-3 px-4 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.statusCode < 400 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                      }`}>
                        {r.statusCode}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-muted whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
