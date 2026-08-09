import React, { useState, useEffect } from 'react';
import { ShoppingBag, CheckCircle2 } from 'lucide-react';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch('/api/admin/orders');
        if (res.ok) {
          setOrders(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const formatTokens = (val: string | number) => {
    const num = Number(val || 0);
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-amber-500" />
          <span>Prepaid Token Purchase Orders</span>
        </h1>
        <p className="text-xs text-muted mt-1">
          Track customer token package purchases, payment verification status, and token credit records.
        </p>
      </div>

      <div className="bg-card border border-border rounded-panel overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-muted">Loading purchase orders...</div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted">No purchase orders logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Token Package</th>
                  <th className="py-3 px-4">Amount (INR)</th>
                  <th className="py-3 px-4">Payment Gateway</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-bg/40">
                    <td className="py-3 px-4 font-mono text-muted text-[11px] truncate max-w-[120px]">{o.id}</td>
                    <td className="py-3 px-4 font-mono text-fg">{o.user?.email || 'Customer'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-fg">{formatTokens(o.tokenQuantity)} Tokens</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-500">₹{o.amountInr.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono text-muted">{o.paymentGateway}</td>
                    <td className="py-3 px-4 font-mono">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-muted whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleString()}
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
