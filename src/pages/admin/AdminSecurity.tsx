import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export const AdminSecurity: React.FC = () => {
  const [trials, setTrials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSecurity() {
      try {
        const res = await fetch('/api/admin/logs');
        if (res.ok) {
          setTrials(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadSecurity();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-amber-500" />
          <span>Security Center & Trial Risk History</span>
        </h1>
        <p className="text-xs text-muted mt-1">
          Monitor risk scoring signals, trial anti-abuse decisions, IP intelligence, and failed access attempts.
        </p>
      </div>

      <div className="bg-card border border-border rounded-panel overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-muted">Loading security logs...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50">
                  <th className="py-3 px-4">Admin / Target</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Metadata</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {trials.map((t) => (
                  <tr key={t.id} className="hover:bg-bg/40">
                    <td className="py-3 px-4 font-mono font-medium text-fg">{t.adminUser?.email || 'System'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-500">{t.action}</td>
                    <td className="py-3 px-4 font-mono text-muted">{t.ipAddress || '127.0.0.1'}</td>
                    <td className="py-3 px-4 font-mono text-muted">{t.metadata || '—'}</td>
                    <td className="py-3 px-4 font-mono text-muted whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleString()}
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
