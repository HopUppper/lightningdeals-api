import React, { useState, useEffect } from 'react';
import { FileText, ShieldCheck, Search, Filter, RefreshCw, Key, UserCheck, Server, DollarSign, Activity, Globe, Clock, User } from 'lucide-react';
import { adminFetch } from '../../utils/api';

export const AdminLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'LOGINS' | 'KEYS' | 'VENDOR' | 'USERS' | 'SYSTEM'>('ALL');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const getActionBadge = (action: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('LOGIN')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/30 flex items-center gap-1 w-fit">
          <User className="w-3 h-3" />
          <span>{act}</span>
        </span>
      );
    }
    if (act.includes('KEY')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 flex items-center gap-1 w-fit">
          <Key className="w-3 h-3" />
          <span>{act}</span>
        </span>
      );
    }
    if (act.includes('VENDOR') || act.includes('TOPUP') || act.includes('LEDGER')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/10 text-violet-600 border border-violet-500/30 flex items-center gap-1 w-fit">
          <DollarSign className="w-3 h-3" />
          <span>{act}</span>
        </span>
      );
    }
    if (act.includes('USER') || act.includes('CUSTOMER')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-600 border border-teal-500/30 flex items-center gap-1 w-fit">
          <UserCheck className="w-3 h-3" />
          <span>{act}</span>
        </span>
      );
    }
    if (act.includes('EMERGENCY') || act.includes('KILL')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 border border-red-500/30 flex items-center gap-1 w-fit">
          <Activity className="w-3 h-3" />
          <span>{act}</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted/40 text-fg border border-border flex items-center gap-1 w-fit">
        <Server className="w-3 h-3" />
        <span>{act}</span>
      </span>
    );
  };

  const filteredLogs = logs.filter((log) => {
    // Category filter
    const act = (log.action || '').toUpperCase();
    if (filterCategory === 'LOGINS' && !act.includes('LOGIN')) return false;
    if (filterCategory === 'KEYS' && !act.includes('KEY')) return false;
    if (filterCategory === 'VENDOR' && !act.includes('VENDOR') && !act.includes('TOPUP') && !act.includes('LEDGER')) return false;
    if (filterCategory === 'USERS' && !act.includes('USER') && !act.includes('CUSTOMER')) return false;
    if (filterCategory === 'SYSTEM' && (act.includes('LOGIN') || act.includes('KEY') || act.includes('VENDOR') || act.includes('USER'))) return false;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const adminStr = `${log.adminUser?.name || ''} ${log.adminUser?.email || ''}`.toLowerCase();
      const metaStr = (log.metadata || '').toLowerCase();
      const ipStr = (log.ipAddress || '').toLowerCase();
      const actStr = (log.action || '').toLowerCase();
      return adminStr.includes(q) || metaStr.includes(q) || ipStr.includes(q) || actStr.includes(q);
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
            <FileText className="w-6 h-6 text-violet-600" />
            <span>Administrative Audit & Security Logs</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Real-time immutable audit trail: logins, IP addresses, master vendor top-ups, key generation, and post-login activity.
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="ui-button-secondary text-xs py-2 px-3.5 gap-2 font-mono"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Control Bar: Search & Category Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border p-4 rounded-panel shadow-xs font-mono">
        <div className="flex items-center gap-2 relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by IP, Admin, Action, or Metadata details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-bg border border-border rounded-control py-1.5 pl-9 pr-3 text-xs text-fg focus:outline-none focus:border-violet-500 font-sans"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-muted hover:text-fg text-xs pr-2">✕</button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-sans">
          {(['ALL', 'LOGINS', 'KEYS', 'VENDOR', 'USERS', 'SYSTEM'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-control font-bold transition-all text-xs ${
                filterCategory === cat
                  ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-xs'
                  : 'bg-bg text-muted hover:text-fg border border-border'
              }`}
            >
              {cat === 'ALL' ? 'All Activity' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-card border border-border rounded-panel overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-xs text-muted font-mono flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-violet-600" />
            <span>Loading security audit trail...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-xs text-muted font-mono space-y-2">
            <ShieldCheck className="w-8 h-8 text-muted mx-auto" />
            <p>No audit activity matching filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg/60">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor / Admin</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Activity & Work Performed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono">
                {filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-bg/40 transition-colors">
                    <td className="py-3.5 px-4 text-muted whitespace-nowrap text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-muted shrink-0" />
                        <span>{new Date(l.createdAt).toLocaleString()}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-fg">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-violet-600/10 text-violet-600 border border-violet-600/20 flex items-center justify-center font-bold text-[10px]">
                          {(l.adminUser?.name || 'A')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-fg">{l.adminUser?.name || 'System Admin'}</div>
                          <div className="text-[10px] text-muted font-normal">{l.adminUser?.email || 'system@lightningapi.pro'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {getActionBadge(l.action)}
                    </td>

                    <td className="py-3.5 px-4 text-fg font-mono whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3 h-3 text-muted shrink-0" />
                        <span className="bg-bg px-1.5 py-0.5 rounded border border-border text-[11px]">
                          {l.ipAddress || '127.0.0.1'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-fg font-sans text-xs">
                      <div className="font-mono text-[11px] text-fg">{l.metadata || '—'}</div>
                      {l.targetType && (
                        <div className="text-[10px] text-muted mt-0.5 font-mono">
                          Target: <span className="text-violet-600 font-semibold">{l.targetType}</span> {l.targetId ? `(${l.targetId.substring(0, 8)}...)` : ''}
                        </div>
                      )}
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
