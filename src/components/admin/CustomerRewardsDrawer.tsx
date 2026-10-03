import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  PlusCircle,
  MinusCircle,
  RefreshCw,
  Clock,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { adminFetch } from '../../utils/api';

interface CustomerRewardsDrawerProps {
  isOpen: boolean;
  userId: string | null;
  onClose: () => void;
  onRecordPurchase: (customer: any) => void;
  onAdjustCredits: (customer: any, type: 'CREDIT' | 'DEBIT') => void;
}

export const CustomerRewardsDrawer: React.FC<CustomerRewardsDrawerProps> = ({
  isOpen,
  userId,
  onClose,
  onRecordPurchase,
  onAdjustCredits,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCustomerData = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch(`/api/admin/rewards/customer-profile/${userId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setError('Failed to load customer profile.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      loadCustomerData();
    }
  }, [isOpen, userId]);

  if (!isOpen || !userId) return null;

  const stats = data?.stats || {};
  const customer = data?.customer || {};
  const purchases = data?.purchases || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col font-sans border-l border-border animate-slideLeft">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-bg/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-violet-500/20">
              {customer?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-fg">{customer?.name || 'Customer Profile'}</h3>
              <p className="text-xs text-muted font-mono">{customer?.email} {customer?.phone ? `• ${customer?.phone}` : ''}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-subtle text-muted hover:text-fg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-20 text-center text-xs font-mono text-muted">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-600" />
              Loading customer loyalty profile...
            </div>
          ) : error ? (
            <div className="p-4 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono">
              {error}
            </div>
          ) : (
            <>
              {/* Quick Action Buttons (Prompt Section 14 & 24) */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => onRecordPurchase(customer)}
                  className="p-2.5 rounded-control bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-sm transition-transform active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Record Purchase</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAdjustCredits(customer, 'CREDIT')}
                  className="p-2.5 rounded-control bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  <span>+ Add Credits</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAdjustCredits(customer, 'DEBIT')}
                  className="p-2.5 rounded-control bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  <MinusCircle className="w-4 h-4" />
                  <span>- Deduct Credits</span>
                </button>
              </div>

              {/* Credit Balances Card */}
              <div className="rounded-panel border border-violet-200 bg-gradient-to-br from-violet-50/70 to-indigo-50/40 p-4 space-y-3 font-mono">
                <span className="text-[10px] text-violet-700 font-bold uppercase tracking-wider block">
                  Authoritative Credit Balances
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] text-muted uppercase block">Available</span>
                    <span className="text-xl font-black text-violet-900">
                      ₹{(stats.availableCredits || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted uppercase block">Lifetime Earned</span>
                    <span className="text-sm font-extrabold text-emerald-600 block mt-1">
                      ₹{(stats.lifetimeCreditsEarned || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted uppercase block">Lifetime Redeemed</span>
                    <span className="text-sm font-extrabold text-cyan-700 block mt-1">
                      ₹{(stats.lifetimeCreditsRedeemed || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Purchase Channel Breakdown (Prompt Section 14) */}
              <div className="rounded-panel border border-border p-4 bg-white space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="font-bold text-fg uppercase text-[11px]">Universal Purchase Stats</span>
                  <span className="text-muted">
                    Total: <strong className="text-fg">₹{(stats.totalPurchaseValue || 0).toLocaleString()}</strong> ({stats.totalPurchases || 0} orders)
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-2.5 rounded bg-emerald-50/60 border border-emerald-200/60">
                    <span className="text-[10px] text-emerald-800 font-bold uppercase block">💬 WhatsApp</span>
                    <div className="text-sm font-extrabold text-emerald-700 mt-1">
                      ₹{(stats.whatsappPurchaseValue || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-muted mt-0.5">{stats.whatsappPurchases || 0} purchases</div>
                  </div>

                  <div className="p-2.5 rounded bg-violet-50/60 border border-violet-200/60">
                    <span className="text-[10px] text-violet-800 font-bold uppercase block">🌐 Website</span>
                    <div className="text-sm font-extrabold text-violet-700 mt-1">
                      ₹{(stats.websitePurchaseValue || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-muted mt-0.5">{stats.websitePurchases || 0} purchases</div>
                  </div>

                  <div className="p-2.5 rounded bg-slate-100 border border-slate-200">
                    <span className="text-[10px] text-slate-800 font-bold uppercase block">✍️ Manual</span>
                    <div className="text-sm font-extrabold text-slate-700 mt-1">
                      ₹{(stats.manualPurchaseValue || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-muted mt-0.5">{stats.manualPurchases || 0} purchases</div>
                  </div>
                </div>
              </div>

              {/* Recent Universal Purchases List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold font-mono text-fg uppercase flex items-center justify-between">
                  <span>Recent Purchases ({purchases.length})</span>
                </h4>

                {purchases.length === 0 ? (
                  <p className="text-xs font-mono text-muted text-center py-6">No purchases recorded yet.</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {purchases.map((p: any) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-control border border-border/80 bg-subtle/20 hover:bg-subtle/50 transition-colors flex items-center justify-between font-mono text-xs"
                      >
                        <div>
                          <div className="font-bold text-fg flex items-center gap-1.5">
                            <span>{p.productName}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                              p.channel === 'WHATSAPP' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-violet-50 text-violet-700 border border-violet-200'
                            }`}>
                              {p.channel}
                            </span>
                          </div>
                          <div className="text-[10px] text-muted mt-0.5">
                            {new Date(p.purchaseDate).toLocaleDateString()} {p.referenceId ? `• Ref: ${p.referenceId}` : ''}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold text-fg">₹{p.amountPaid?.toLocaleString()}</div>
                          <div className="text-[10px] text-emerald-600 font-bold">+₹{p.creditsEarned?.toLocaleString()} credits</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
