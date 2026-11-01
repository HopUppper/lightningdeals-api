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
  Zap,
  ShieldAlert,
  Cpu,
  Power,
  BarChart3,
  AlertOctagon,
} from 'lucide-react';
import { adminFetch } from '../../utils/api';

export const AdminHealth: React.FC = () => {
  const [healthData, setHealthData] = useState<any>(null);
  const [reconData, setReconData] = useState<any>(null);
  const [infraHealth, setInfraHealth] = useState<any>(null);
  const [circuitBreakers, setCircuitBreakers] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const [healthRes, reconRes, infraRes, breakerRes, anomalyRes] = await Promise.all([
        adminFetch('/api/admin/health').catch(() => null),
        adminFetch('/api/admin/economics/reconciliation').catch(() => null),
        adminFetch('/api/admin/infrastructure/health').catch(() => null),
        adminFetch('/api/admin/infrastructure/circuit-breakers').catch(() => null),
        adminFetch('/api/admin/infrastructure/anomalies?limit=25').catch(() => null),
      ]);

      if (healthRes && healthRes.ok) {
        setHealthData(await healthRes.json());
      }
      if (reconRes && reconRes.ok) {
        const rData = await reconRes.json();
        setReconData(rData.report || rData);
      }
      if (infraRes && infraRes.ok) {
        const iData = await infraRes.json();
        setInfraHealth(iData);
      }
      if (breakerRes && breakerRes.ok) {
        const bData = await breakerRes.json();
        setCircuitBreakers(bData.breakers || []);
      }
      if (anomalyRes && anomalyRes.ok) {
        const aData = await anomalyRes.json();
        setAnomalies(aData.anomalies || []);
      }
    } catch (e) {
      console.error('Failed to load health telemetry:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleTripBreaker = async (key: string) => {
    if (!confirm(`Are you sure you want to manually trip circuit breaker for ${key}? This will pause upstream traffic to this model route.`)) return;
    setActionKey(key);
    try {
      const res = await adminFetch(`/api/admin/infrastructure/circuit-breakers/${encodeURIComponent(key)}/trip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Manually tripped by administrator' }),
      });
      if (res.ok) {
        await fetchHealth();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionKey(null);
    }
  };

  const handleResetBreaker = async (key: string) => {
    setActionKey(key);
    try {
      const res = await adminFetch(`/api/admin/infrastructure/circuit-breakers/${encodeURIComponent(key)}/reset`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchHealth();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionKey(null);
    }
  };

  const handleResolveAnomaly = async (id: string) => {
    setActionKey(id);
    try {
      const res = await adminFetch(`/api/admin/infrastructure/anomalies/${id}/resolve`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchHealth();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionKey(null);
    }
  };

  const totalAnomalies = reconData?.overallDiscrepancyCount ?? 0;
  const isReconHealthy = totalAnomalies === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-fg flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-600" />
            <span>Smart Infrastructure & Health Telemetry</span>
          </h1>
          <p className="text-xs text-muted">
            Phase 2 intelligent routing health, circuit breakers, anomaly detection, and accounting reconciliation integrity.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          className="ui-button-secondary text-xs py-2 px-3.5 gap-2 font-mono self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {loading && !healthData && !infraHealth ? (
        <div className="py-12 text-center text-xs text-muted font-mono">Running live diagnostic checks...</div>
      ) : (
        <div className="space-y-6">
          {/* Phase 2 Infrastructure Health Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3.5 bg-card border border-border rounded-panel space-y-1 shadow-sm">
              <div className="flex items-center justify-between text-muted">
                <span className="text-[10px] uppercase tracking-wider">Gateway Status</span>
                <Zap className="w-3.5 h-3.5 text-violet-500" />
              </div>
              <p className="text-sm font-bold text-fg">
                {infraHealth?.summary?.status === 'DEGRADED' ? (
                  <span className="text-amber-500">DEGRADED</span>
                ) : (
                  <span className="text-emerald-500">OPTIMAL</span>
                )}
              </p>
              <span className="text-[10px] text-muted">{infraHealth?.summary?.totalEndpointsTracked || 0} active routes</span>
            </div>

            <div className="p-3.5 bg-card border border-border rounded-panel space-y-1 shadow-sm">
              <div className="flex items-center justify-between text-muted">
                <span className="text-[10px] uppercase tracking-wider">Open Breakers</span>
                <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <p className={`text-sm font-bold ${circuitBreakers.filter(b => b.state === 'OPEN').length > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {circuitBreakers.filter(b => b.state === 'OPEN').length} OPEN
              </p>
              <span className="text-[10px] text-muted">{circuitBreakers.filter(b => b.state === 'HALF_OPEN').length} half-open probes</span>
            </div>

            <div className="p-3.5 bg-card border border-border rounded-panel space-y-1 shadow-sm">
              <div className="flex items-center justify-between text-muted">
                <span className="text-[10px] uppercase tracking-wider">Active Anomalies</span>
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className={`text-sm font-bold ${anomalies.filter(a => a.status === 'DETECTED').length > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {anomalies.filter(a => a.status === 'DETECTED').length} DETECTED
              </p>
              <span className="text-[10px] text-muted">Multi-dim abuse filters</span>
            </div>

            <div className="p-3.5 bg-card border border-border rounded-panel space-y-1 shadow-sm">
              <div className="flex items-center justify-between text-muted">
                <span className="text-[10px] uppercase tracking-wider">Accounting Integrity</span>
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <p className={`text-sm font-bold ${isReconHealthy ? 'text-emerald-500' : 'text-amber-500'}`}>
                {isReconHealthy ? '100% RECONCILED' : `${totalAnomalies} ISSUES`}
              </p>
              <span className="text-[10px] text-muted">5 Plan architectures</span>
            </div>
          </div>

          {/* Section 1: Granular Circuit Breakers Controls */}
          <div className="bg-card border border-border rounded-panel p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-violet-500" />
                <h3 className="text-xs font-bold text-fg">Circuit Breakers & Provider Isolation</h3>
              </div>
              <span className="text-[11px] font-mono text-muted">
                Threshold: 5 consecutive failures • Cooldown: 30s probe
              </span>
            </div>

            {circuitBreakers.length === 0 ? (
              <p className="text-xs text-muted font-mono py-3">
                No circuit breakers currently tripped. All upstream provider endpoints are healthy and in CLOSED operational state.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-border/60 text-muted text-[10px] uppercase">
                      <th className="pb-2">Endpoint Route</th>
                      <th className="pb-2">Circuit State</th>
                      <th className="pb-2">Failures</th>
                      <th className="pb-2">Last Error</th>
                      <th className="pb-2">Probe / Opened</th>
                      <th className="pb-2 text-right">Admin Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {circuitBreakers.map((b) => (
                      <tr key={b.key} className="hover:bg-muted/5 transition-colors">
                        <td className="py-2.5 font-bold text-fg">{b.key}</td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.state === 'OPEN'
                                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                : b.state === 'HALF_OPEN'
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            }`}
                          >
                            {b.state}
                          </span>
                        </td>
                        <td className="py-2.5 text-muted">
                          {b.consecutiveFailures} consec / {b.failureCount} total
                        </td>
                        <td className="py-2.5 text-muted max-w-[200px] truncate" title={b.lastErrorMessage || ''}>
                          {b.lastErrorMessage || '—'}
                        </td>
                        <td className="py-2.5 text-muted text-[10px]">
                          {b.nextProbeAt ? new Date(b.nextProbeAt).toLocaleTimeString() : 'Ready'}
                        </td>
                        <td className="py-2.5 text-right space-x-1.5">
                          {b.state === 'OPEN' || b.state === 'HALF_OPEN' ? (
                            <button
                              onClick={() => handleResetBreaker(b.key)}
                              disabled={actionKey === b.key}
                              className="px-2 py-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              {actionKey === b.key ? 'Resetting...' : 'Reset to Closed'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleTripBreaker(b.key)}
                              disabled={actionKey === b.key}
                              className="px-2 py-1 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              {actionKey === b.key ? 'Tripping...' : 'Trip Breaker'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: Real-time Provider Health (5-minute rolling window) */}
          {infraHealth?.healthOverview && infraHealth.healthOverview.length > 0 && (
            <div className="bg-card border border-border rounded-panel p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-violet-500" />
                  <h3 className="text-xs font-bold text-fg">Provider & Route Health Metrics (Rolling 5-Min Window)</h3>
                </div>
                <span className="text-[11px] font-mono text-muted">Keep-Alive agent pooling active</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {infraHealth.healthOverview.map((item: any) => (
                  <div key={`${item.providerSlug}-${item.modelId}`} className="p-3.5 bg-bg rounded border border-border/70 space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-fg truncate">{item.modelId}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/10 text-muted uppercase">
                        {item.providerSlug}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border/50 text-muted">
                      <div>
                        Success Rate: <span className="font-bold text-fg">{item.successRate}%</span>
                      </div>
                      <div>
                        Reqs: <span className="font-bold text-fg">{item.totalRequests}</span>
                      </div>
                      <div>
                        Avg Latency: <span className="font-bold text-fg">{item.avgLatencyMs}ms</span>
                      </div>
                      <div>
                        p95 Latency: <span className="font-bold text-fg">{item.p95LatencyMs}ms</span>
                      </div>
                    </div>

                    {(item.rateLimitedRequests > 0 || item.timeoutRequests > 0) && (
                      <div className="flex gap-2 text-[10px] text-amber-500 pt-1">
                        {item.rateLimitedRequests > 0 && <span>{item.rateLimitedRequests}x 429 RateLimit</span>}
                        {item.timeoutRequests > 0 && <span>{item.timeoutRequests}x Timeouts</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Anomaly & Abuse Prevention Incidents */}
          <div className="bg-card border border-border rounded-panel p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-fg">Multi-Dimensional Anomaly Detection Feed</h3>
              </div>
              <span className="text-[11px] font-mono text-muted">
                Velocity spikes (&gt;120 rpm), token surges (&gt;500k/5m), auth sprays (&gt;10/2m)
              </span>
            </div>

            {anomalies.length === 0 ? (
              <p className="text-xs text-muted font-mono py-3">
                No anomalous security or traffic spikes detected. All request velocity and authentication patterns within normal operational thresholds.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-border/60 text-muted text-[10px] uppercase">
                      <th className="pb-2">Detected At</th>
                      <th className="pb-2">Anomaly Type</th>
                      <th className="pb-2">Severity</th>
                      <th className="pb-2">Metric / Limit</th>
                      <th className="pb-2">Action</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2 text-right">Resolution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {anomalies.map((a) => (
                      <tr key={a.id} className="hover:bg-muted/5 transition-colors">
                        <td className="py-2 text-[10px] text-muted">
                          {new Date(a.detectedAt).toLocaleTimeString()}
                        </td>
                        <td className="py-2 font-bold text-fg">{a.anomalyType}</td>
                        <td className="py-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              a.severity === 'CRITICAL'
                                ? 'bg-rose-500/20 text-rose-600'
                                : a.severity === 'HIGH'
                                ? 'bg-rose-500/10 text-rose-500'
                                : 'bg-amber-500/10 text-amber-500'
                            }`}
                          >
                            {a.severity}
                          </span>
                        </td>
                        <td className="py-2 text-muted">
                          {a.metricValue} / {a.thresholdValue}
                        </td>
                        <td className="py-2 text-muted">{a.actionTaken}</td>
                        <td className="py-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              a.status === 'RESOLVED'
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : 'bg-amber-500/10 text-amber-500'
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          {a.status !== 'RESOLVED' && (
                            <button
                              onClick={() => handleResolveAnomaly(a.id)}
                              disabled={actionKey === a.id}
                              className="px-2 py-0.5 bg-violet-500/10 text-violet-500 hover:bg-violet-500/20 rounded text-[10px] font-bold cursor-pointer"
                            >
                              Resolve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 4: Traditional Subsystem Probes & Accounting Integrity */}
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
              </div>
            ))}

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
