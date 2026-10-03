import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  DollarSign,
  FileText,
  Sliders,
} from 'lucide-react';
import { adminFetch } from '../../utils/api';

interface EditPurchaseModalProps {
  isOpen: boolean;
  purchase: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditPurchaseModal: React.FC<EditPurchaseModalProps> = ({
  isOpen,
  purchase,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'amount' | 'status'>('amount');
  const [newAmount, setNewAmount] = useState<string>(purchase?.amountPaid ? String(purchase.amountPaid) : '');
  const [newStatus, setNewStatus] = useState<string>(purchase?.status || 'COMPLETED');
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !purchase) return null;

  const currentAmount = purchase.amountPaid || 0;
  const currentCredits = purchase.creditsEarned || 0;
  const targetAmount = Math.max(0, Number(newAmount) || 0);

  // Calculate new reward estimate
  const eligibleAmount = Math.min(targetAmount, 5000);
  const estimatedNewCredits = Math.min(Math.round((eligibleAmount * 0.10) * 100) / 100, 500);
  const netDelta = estimatedNewCredits - currentCredits;

  const handleUpdateAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    if (!reason.trim()) {
      setError('A mandatory reason is required for compliance audit logs.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await adminFetch(`/api/admin/rewards/purchases/${purchase.id}/amount`, {
        method: 'PUT',
        body: JSON.stringify({
          newAmount: targetAmount,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error?.message || 'Failed to update amount.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error updating purchase.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A mandatory reason is required for compliance audit logs.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await adminFetch(`/api/admin/rewards/purchases/${purchase.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: newStatus,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error?.message || 'Failed to update status.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error updating status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="min-h-full flex items-center justify-center py-4">
        <div
          className="bg-white border border-border rounded-panel w-full max-w-lg shadow-2xl overflow-hidden font-sans space-y-0 relative flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[88vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-bg/50 shrink-0 sticky top-0 z-10">
            <div>
              <h3 className="text-base font-extrabold text-fg tracking-tight">
                Manage Purchase: {purchase.productName}
              </h3>
              <p className="text-[11px] text-muted font-mono mt-0.5">
                Customer: {purchase.user?.name} ({purchase.user?.email})
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-subtle text-muted hover:text-fg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Selection */}
          <div className="flex border-b border-border text-xs font-mono font-bold bg-subtle/30 px-6 pt-3 gap-4 shrink-0">
            <button
              type="button"
              onClick={() => { setActiveTab('amount'); setError(null); }}
              className={`pb-2.5 border-b-2 flex items-center gap-1.5 ${
                activeTab === 'amount'
                  ? 'border-violet-600 text-violet-700'
                  : 'border-transparent text-muted hover:text-fg'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Adjust Amount & Rewards</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('status'); setError(null); }}
              className={`pb-2.5 border-b-2 flex items-center gap-1.5 ${
                activeTab === 'status'
                  ? 'border-violet-600 text-violet-700'
                  : 'border-transparent text-muted hover:text-fg'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Change Status / Refund</span>
            </button>
          </div>

          {/* Form Body */}
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
          {error && (
            <div className="p-3 rounded-control bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'amount' ? (
            <form onSubmit={handleUpdateAmount} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-control text-xs font-mono text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Authoritative Ledger Recalculation:</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Editing the purchase amount will reverse the previous ₹{currentCredits.toLocaleString()} Lightning Credits and issue the new recalculated reward of ₹{estimatedNewCredits.toLocaleString()} (Net delta: {netDelta >= 0 ? `+₹${netDelta}` : `-₹${Math.abs(netDelta)}`}). Both transactions will be preserved in the audit log.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div>
                  <label className="text-[11px] text-muted block uppercase font-bold">Current Amount</label>
                  <div className="p-2 rounded bg-subtle text-fg font-extrabold mt-1">
                    ₹{currentAmount.toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-muted block uppercase font-bold">Current Reward</label>
                  <div className="p-2 rounded bg-subtle text-emerald-600 font-extrabold mt-1">
                    +₹{currentCredits.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 font-mono text-xs">
                <label className="font-bold text-fg uppercase">New Purchase Amount (INR) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-bold">₹</span>
                  <input
                    type="number"
                    min={1}
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="ui-input pl-7 py-2 text-xs font-mono font-bold w-full"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 font-mono text-xs">
                <label className="font-bold text-fg uppercase">Mandatory Reason *</label>
                <input
                  type="text"
                  placeholder="e.g. Price adjustment, customer upgraded tier, discount applied"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="ui-input py-2 text-xs font-mono w-full"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="ui-button-secondary text-xs py-2 px-4 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="ui-button-primary text-xs py-2 px-5 font-bold flex items-center gap-1.5"
                >
                  {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save New Amount</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleUpdateStatus} className="space-y-4 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-fg uppercase">Status *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="ui-input py-2 text-xs font-mono w-full bg-white font-bold"
                >
                  <option value="COMPLETED">COMPLETED (Awards credits)</option>
                  <option value="PENDING">PENDING (No credits)</option>
                  <option value="REFUNDED">REFUNDED (Reverses credits)</option>
                  <option value="CANCELLED">CANCELLED (Reverses credits)</option>
                </select>
              </div>

              {(newStatus === 'REFUNDED' || newStatus === 'CANCELLED') && purchase.status === 'COMPLETED' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-control text-xs text-rose-800 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Credit Reversal Warning</span>
                  </div>
                  <p className="text-[11px] text-rose-700">
                    Marking this purchase as {newStatus} will automatically claw back the ₹{currentCredits.toLocaleString()} Lightning Credits previously awarded to the customer.
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold text-fg uppercase">Mandatory Reason *</label>
                <input
                  type="text"
                  placeholder="e.g. Customer requested refund, cancelled subscription"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="ui-input py-2 text-xs font-mono w-full"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="ui-button-secondary text-xs py-2 px-4 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="ui-button-primary text-xs py-2 px-5 font-bold flex items-center gap-1.5"
                >
                  {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Update Status</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  </div>
);
};
