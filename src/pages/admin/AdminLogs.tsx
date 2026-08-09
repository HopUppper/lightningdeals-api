import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';

export const AdminLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await fetch('/api/admin/logs');
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg">Administrative Audit Logs</h1>
        <p className="text-xs text-muted mt-1">
          Chronological record of key creations, trial key issuances, user suspensions, and model updates.
        </p>
      </div>

      <div className="bg-card border border-border rounded-panel overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-muted">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted">No administrative logs recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50">
                  <th className="py-3 px-4">Admin User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Type</th>
                  <th className="py-3 px-4">Metadata</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-bg/40">
                    <td className="py-3 px-4 font-mono font-medium text-fg">
                      {l.adminUser?.email || 'System Admin'}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-600/10 text-violet-600 uppercase">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-muted">{l.targetType}</td>
                    <td className="py-3 px-4 font-mono text-fg">{l.metadata || '—'}</td>
                    <td className="py-3 px-4 font-mono text-muted whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString()}
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
