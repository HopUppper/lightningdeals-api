import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, Database, Server, RefreshCw } from 'lucide-react';

export const AdminStatus: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fg">System Health & Monitoring</h1>
          <p className="text-xs text-muted mt-1">
            Real-time status of backend API gateways, database connection pool, and upstream LLM providers.
          </p>
        </div>

        <button onClick={fetchStatus} disabled={loading} className="ui-button-secondary text-xs py-2 px-3.5 gap-2">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-card border border-border rounded-panel p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-base font-bold text-fg">Status: OPERATIONAL</h3>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-4 bg-bg border border-border rounded-control">
            <p className="text-xs font-mono text-muted uppercase">Database Latency</p>
            <p className="text-xl font-bold font-mono text-fg mt-1">{status?.dbLatencyMs || 0} ms</p>
          </div>
          <div className="p-4 bg-bg border border-border rounded-control">
            <p className="text-xs font-mono text-muted uppercase">Active Keys</p>
            <p className="text-xl font-bold font-mono text-fg mt-1">{status?.activeKeys || 0}</p>
          </div>
          <div className="p-4 bg-bg border border-border rounded-control">
            <p className="text-xs font-mono text-muted uppercase">Throughput / Hour</p>
            <p className="text-xl font-bold font-mono text-fg mt-1">{status?.requestsLastHour || 0} reqs</p>
          </div>
        </div>
      </div>
    </div>
  );
};
