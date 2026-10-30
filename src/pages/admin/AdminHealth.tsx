import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldCheck,
  Database,
  Server,
  Mail,
  CreditCard,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Lock,
} from 'lucide-react';
import { adminFetch } from '../../utils/api';

export const AdminHealth: React.FC = () => {
  const [healthData, setHealthData] = useState<any>(null);
  const [reconData, setReconData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const [healthRes, reconRes] = await Promise.all([
        adminFetch('/api/admin/health'),
        adminFetch('/api/admin/economics/reconciliation').catch(() => null),
      ]);

      if (healthRes.ok) {
        setHealthData(await healthRes.json());
      }
      if (reconRes && reconRes.ok) {
        const rData = await reconRes.json();
        setReconData(rData.report || rData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const totalAnomalies = reconData?.overallDiscrepancyCount ?? 0;
  const isReconHealthy = totalAnomalies === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-fg flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-600" />
            <span>System Infrastructure Health</span>
          </h1>
          <p className="text-xs text-muted">
            Live diagnostic status, subsystem latency probes, and accounting reconciliation integrity.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          className="ui-button-secondary text-xs py-2 px-3.5 gap-2 font-mono self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Run Health Probes</span>
        </button>
      </div>

      {loading && !healthData ? (
        <div className="py-12 text-center text-xs text-muted font-mono">Running live diagnostic checks...</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {healthData?.subsystems?.map((sub: any) => (
              <div key={sub.key} className="bg-card border border-border rounded-panel p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border ${
                      sub.status === 'operational' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                      sub.status === 'degraded' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                      'bg-red-50 text-red-600 border-red-200'
                    }`}>
                      {sub.key === 'database' ? <Database className="w-4 h-4" /> :
                       sub.key === 'supplier' ? <Server className="w-4 h-4" /> :
                       sub.key === 'email' ? <Mail className="w-4 h-4" /> :
                       sub.key === 'payments' ? <CreditCard className="w-4 h-4" /> :
                       <Activity className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-fg">{sub.name}</h3>
                      <p className="text-[10px] font-mono text-muted">Checked: {new Date(sub.lastChecked).toLocaleTimeString()}</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold inline-flex items-center gap-1.5 uppercase ${
                    sub.status === 'operational' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                    sub.status === 'degraded' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                    'bg-red-500/10 text-red-600 border border-red-500/20'
                  }`}>
                    {sub.status === 'operational' ? <CheckCircle2 className="w-3 h-3" /> :
                     sub.status === 'degraded' ? <AlertTriangle className="w-3 h-3" /> :
                     <XCircle className="w-3 h-3" />}
                    {sub.status}
                  </span>
                </div>

                {sub.latencyMs !== undefined && (
                  <div className="flex justify-between items-center text-xs font-mono pt-2 border-t border-border/60">
                    <span className="text-muted">Probe Latency:</span>
                    <span className="font-bold text-fg">{sub.latencyMs} ms</span>
                  </div>
                )}

                {sub.details && (
                  <div className="p-3 bg-bg rounded border border-border/60 font-mono text-[11px] space-y-1">
                    {Object.entries(sub.details).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-muted">
                        <span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                        <span className="text-fg font-semibold">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {sub.message && (
                  <p className="text-[11px] font-mono text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                    {sub.message}
                  </p>
                )}
              </div>
            ))}

            {/* Subsystem: Ledger & Accounting Reconciliation Audit */}
            {reconData && (
              <div className="bg-card border border-border rounded-panel p-5 space-y-4 shadow-sm md:col-span-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border ${
                      isReconHealthy ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                    }`}>
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-fg">Accounting & Ledger Reconciliation Engine</h3>
                      <p className="text-[10px] font-mono text-muted">
                        Audited: {new Date(reconData.timestamp || Date.now()).toLocaleTimeString()} • Read-Only Discrepancy Probe
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold inline-flex items-center gap-1.5 uppercase ${
                    isReconHealthy ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  }`}>
                    {isReconHealthy ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    {isReconHealthy ? 'OPERATIONAL (0 DISCREPANCIES)' : `DEGRADED (${totalAnomalies} DISCREPANCIES)`}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs pt-2 border-t border-border/60">
                  <div className="p-2.5 bg-bg rounded border border-border/60 space-y-0.5">
                    <span className="text-[10px] text-muted uppercase">Credit Mismatches</span>
                    <p className={`font-bold ${reconData.creditKeyMismatches?.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {reconData.creditKeyMismatches?.length ?? 0}
                    </p>
                  </div>
                  <div className="p-2.5 bg-bg rounded border border-border/60 space-y-0.5">
                    <span className="text-[10px] text-muted uppercase">Token Mismatches</span>
                    <p className={`font-bold ${reconData.tokenKeyMismatches?.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {reconData.tokenKeyMismatches?.length ?? 0}
                    </p>
                  </div>
                  <div className="p-2.5 bg-bg rounded border border-border/60 space-y-0.5">
                    <span className="text-[10px] text-muted uppercase">Unprovisioned Purchases</span>
                    <p className={`font-bold ${reconData.unprovisionedPurchases?.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {reconData.unprovisionedPurchases?.length ?? 0}
                    </p>
                  </div>
                  <div className="p-2.5 bg-bg rounded border border-border/60 space-y-0.5">
                    <span className="text-[10px] text-muted uppercase">Stale In-Flight Holds</span>
                    <p className={`font-bold ${reconData.staleReservations?.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {reconData.staleReservations?.length ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHealth;