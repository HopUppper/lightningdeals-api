import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { adminFetch } from '../../utils/api';

export const AdminSecurity: React.FC = () => {
  const [trials, setTrials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSecurity() {
      try {
        const res = await adminFetch('/api/admin/logs');
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
    <div className="space-y-6 font-sans">
      <div className="pb-4 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-accent font-bold bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
            AUDIT TRAIL & THREAT DETECTION
          </span>
          <span className="text-xs text-muted font-mono">NODE FIREWALL: ENFORCED</span>
        </div>
        <h1 className="text-2xl font-bold text-fg tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-accent" />
          <span>Security Center & Trial Risk History</span>
        </h1>
        <p className="text-xs text-muted mt-1">
          Monitor risk scoring signals, trial anti-abuse decisions, IP intelligence, and failed access attempts.
        </p>
      </div>

      <div className="technical-panel overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-muted">
            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading security logs...
          </div>
        ) : trials.length === 0 ? (
          <div className="py-16 text-center text-xs font-mono text-muted">No security events recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-muted uppercase bg-subtle/50 text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-bold">Admin / Identity Target</th>
                  <th className="py-3 px-4 font-bold">Operation Action</th>
                  <th className="py-3 px-4 font-bold">Network IP</th>
                  <th className="py-3 px-4 font-bold">Metadata Payload</th>
                  <th className="py-3 px-4 font-bold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {trials.map((t) => (
                  <tr key={t.id} className="hover:bg-subtle/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-fg">{t.adminUser?.email || 'System Daemon'}</td>
                    <td className="py-3 px-4 font-bold text-accent">
                      <span className="px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-[11px]">
                        {t.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted">{t.ipAddress || '127.0.0.1'}</td>
                    <td className="py-3 px-4 text-muted truncate max-w-xs">{t.metadata || '—'}</td>
                    <td className="py-3 px-4 text-right text-muted tabular-nums whitespace-nowrap">
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

export default AdminSecurity;
