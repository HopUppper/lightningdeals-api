import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, Clock, Filter, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminFetch } from '../../utils/api';

export const AdminLeads: React.FC = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    try {
      const res = await adminFetch('/api/admin/leads');
      if (res.ok) {
        setLeads(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await adminFetch(`/api/admin/leads/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchLeads();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
            <Mail className="w-6 h-6 text-amber-500" />
            <span>Quote Requests & Sales Leads</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Review incoming customer token package quote requests, update lead statuses, and issue API keys.
          </p>
        </div>

        <Link to="/admin/keys" className="ui-button-primary text-xs py-2 px-4 gap-2 font-bold">
          + Issue Custom API Key
        </Link>
      </div>

      <div className="bg-card border border-border rounded-panel overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-muted">Loading quote leads...</div>
        ) : leads.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted">No lead requests logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50">
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Requested Tokens</th>
                  <th className="py-3 px-4">Primary Tool</th>
                  <th className="py-3 px-4">Message</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {leads.map((l) => (
                  <tr key={l.id} className="hover:bg-bg/40">
                    <td className="py-3 px-4 font-semibold text-fg">{l.name}</td>
                    <td className="py-3 px-4 font-mono text-muted">{l.email}</td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-500">{l.tokenAmount}</td>
                    <td className="py-3 px-4 font-mono text-fg">{l.useCase || 'General'}</td>
                    <td className="py-3 px-4 font-mono text-muted max-w-[200px] truncate">{l.message || '—'}</td>
                    <td className="py-3 px-4 font-mono">
                      <select
                        value={l.status}
                        onChange={(e) => handleUpdateStatus(l.id, e.target.value)}
                        className="px-2 py-1 text-[11px] font-bold rounded bg-bg border border-border text-fg focus:outline-none focus:border-accent"
                      >
                        <option value="NEW">NEW</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="QUOTED">QUOTED</option>
                        <option value="CONVERTED">CONVERTED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </td>
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
