import React, { useState, useEffect } from 'react';
import {
  Zap,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ArrowLeft,
  User,
  ShoppingBag,
  CreditCard,
  MessageSquare,
  HelpCircle,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { adminFetch } from '../../utils/api';

interface RecordPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: any) => void;
  preselectedCustomer?: any;
}

export const RecordPurchaseModal: React.FC<RecordPurchaseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedCustomer,
}) => {
  // Step: 1 = Form Entry, 2 = Confirmation Screen
  const [step, setStep] = useState<1 | 2>(1);

  // Customer Search
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(preselectedCustomer || null);
  const [searchAttempted, setSearchAttempted] = useState(false);

  // Form Fields
  const [productMode, setProductMode] = useState<'catalog' | 'custom'>('custom');
  const [productName, setProductName] = useState('LinkedIn Premium');
  const [amountPaid, setAmountPaid] = useState<string>('3500');
  const [channel, setChannel] = useState<'WHATSAPP' | 'WEBSITE' | 'MANUAL' | 'OTHER'>('WHATSAPP');
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'COMPLETED' | 'PENDING' | 'CANCELLED' | 'REFUNDED'>('COMPLETED');
  const [description, setDescription] = useState('LinkedIn Premium purchased through WhatsApp');
  const [referenceId, setReferenceId] = useState('');
  const [notes, setNotes] = useState('');

  // Catalog
  const [catalog, setCatalog] = useState<{ websiteProducts: any[]; externalSubscriptions: any[] }>({
    websiteProducts: [],
    externalSubscriptions: [],
  });

  // Submission & Validation States
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load catalog on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setErrorMessage(null);
      if (preselectedCustomer) {
        setSelectedCustomer(preselectedCustomer);
      }
      adminFetch('/api/admin/rewards/products-catalog')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setCatalog({
              websiteProducts: data.websiteProducts || [],
              externalSubscriptions: data.externalSubscriptions || [],
            });
          }
        })
        .catch(console.error);
    }
  }, [isOpen, preselectedCustomer]);

  // Update description automatically when product or channel changes if user hasn't heavily customized it
  useEffect(() => {
    if (productName) {
      const channelLabel = channel === 'WHATSAPP' ? 'WhatsApp' : channel === 'WEBSITE' ? 'LightningAPI.pro' : channel;
      setDescription(`${productName} purchased through ${channelLabel}`);
    }
  }, [productName, channel]);

  // Debounced Customer Search
  useEffect(() => {
    if (!customerSearch.trim() || customerSearch.trim().length < 2) {
      setSearchResults([]);
      setSearchAttempted(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingCustomer(true);
      try {
        const res = await adminFetch(`/api/admin/rewards/customers-search?q=${encodeURIComponent(customerSearch.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users || []);
          setSearchAttempted(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingCustomer(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [customerSearch]);

  if (!isOpen) return null;

  // Live Reward Preview Calculation
  const cleanAmount = Math.max(0, Number(amountPaid) || 0);
  const maxEligible = 5000;
  const rewardRate = 10;
  const maxReward = 500;

  const eligibleAmount = Math.min(cleanAmount, maxEligible);
  const creditsEarned = status === 'COMPLETED'
    ? Math.min(Math.round((eligibleAmount * (rewardRate / 100)) * 100) / 100, maxReward)
    : 0;

  const currentBalance = selectedCustomer?.availableCredits || 0;
  const newBalance = Math.round((currentBalance + creditsEarned) * 100) / 100;

  const handleSelectCustomer = (cust: any) => {
    setSelectedCustomer(cust);
    setSearchResults([]);
    setCustomerSearch('');
    setSearchAttempted(false);
  };

  const handleNextToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedCustomer) {
      setErrorMessage('Please search and select a customer account first.');
      return;
    }

    if (!productName.trim()) {
      setErrorMessage('Product name is required.');
      return;
    }

    if (cleanAmount <= 0) {
      setErrorMessage('Please enter a valid purchase amount greater than ₹0.');
      return;
    }

    setStep(2);
  };

  const handleConfirmPurchase = async () => {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await adminFetch('/api/admin/rewards/purchases', {
        method: 'POST',
        body: JSON.stringify({
          userId: selectedCustomer.id,
          productName: productName.trim(),
          description: description.trim(),
          amountPaid: cleanAmount,
          channel,
          purchaseDate: purchaseDate ? new Date(purchaseDate).toISOString() : new Date().toISOString(),
          status,
          referenceId: referenceId.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess(data);
        onClose();
      } else {
        setErrorMessage(data.error?.message || 'Failed to record purchase.');
        setStep(1);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error while recording purchase.');
      setStep(1);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-border rounded-panel w-full max-w-xl shadow-2xl overflow-hidden font-sans space-y-0 relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-bg/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-fg tracking-tight">
                  + Record Universal Purchase
                </h3>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Step {step} of 2
                </span>
              </div>
              <p className="text-[11px] text-muted font-mono mt-0.5">
                {step === 1
                  ? 'Connect any WhatsApp or manual sale to a customer and award Lightning Credits'
                  : 'Review purchase details and confirm automatic credit allocation'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-subtle text-muted hover:text-fg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3.5 rounded-control bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 1 ? (
            /* STEP 1: FORM ENTRY */
            <form id="record-purchase-form" onSubmit={handleNextToConfirm} className="space-y-4">
              {/* 1. Customer Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-mono text-fg uppercase flex items-center justify-between">
                  <span>Customer Account *</span>
                  {selectedCustomer && (
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(null)}
                      className="text-violet-600 hover:text-violet-700 text-[11px] font-normal lowercase"
                    >
                      (change customer)
                    </button>
                  )}
                </label>

                {selectedCustomer ? (
                  <div className="p-3 rounded-control bg-violet-50/70 border border-violet-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-xs">
                        {selectedCustomer.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-fg">{selectedCustomer.name}</div>
                        <div className="text-[11px] text-muted font-mono">{selectedCustomer.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted uppercase font-mono">Current Balance</div>
                      <div className="text-xs font-extrabold text-violet-700 font-mono">
                        ₹{(selectedCustomer.availableCredits || 0).toLocaleString()} Credits
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search customer by email, name, phone, or ID..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="ui-input text-xs font-mono pl-8 py-2 w-full"
                        autoFocus
                      />
                      {searchingCustomer && (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-muted absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                    </div>

                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                      <div className="border border-border rounded-control bg-white shadow-lg overflow-hidden divide-y divide-border/60 max-h-48 overflow-y-auto">
                        {searchResults.map((cust) => (
                          <button
                            key={cust.id}
                            type="button"
                            onClick={() => handleSelectCustomer(cust)}
                            className="w-full p-2.5 text-left hover:bg-violet-50/50 flex items-center justify-between text-xs transition-colors"
                          >
                            <div>
                              <span className="font-bold text-fg block">{cust.name}</span>
                              <span className="text-[11px] text-muted font-mono">{cust.email} {cust.phone ? `• ${cust.phone}` : ''}</span>
                            </div>
                            <span className="text-[11px] font-mono text-violet-700 font-bold">
                              ₹{(cust.availableCredits || 0).toLocaleString()}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchAttempted && searchResults.length === 0 && (
                      <div className="p-3 rounded-control bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Customer account not found</span>
                        </div>
                        <p className="text-[11px] text-amber-700">
                          The customer must have a registered account on LightningAPI.pro to earn and store Lightning Credits.
                        </p>
                        <div className="pt-1 flex gap-2">
                          <a
                            href="/register"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-violet-700 underline font-bold flex items-center gap-1"
                          >
                            <span>Send Registration Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Product / Subscription Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold font-mono text-fg uppercase">
                    Product / Subscription *
                  </label>
                  <div className="flex items-center gap-1 text-[11px] font-mono">
                    <button
                      type="button"
                      onClick={() => setProductMode('custom')}
                      className={`px-2 py-0.5 rounded ${productMode === 'custom' ? 'bg-violet-600 text-white font-bold' : 'text-muted hover:text-fg'}`}
                    >
                      Custom Product
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductMode('catalog')}
                      className={`px-2 py-0.5 rounded ${productMode === 'catalog' ? 'bg-violet-600 text-white font-bold' : 'text-muted hover:text-fg'}`}
                    >
                      Catalogue
                    </button>
                  </div>
                </div>

                {productMode === 'custom' ? (
                  <input
                    type="text"
                    placeholder="e.g. LinkedIn Premium, Canva Pro, Adobe Creative Cloud..."
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="ui-input text-xs font-mono py-2 w-full"
                    required
                  />
                ) : (
                  <select
                    value={productName}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setProductName(selected);
                      // Suggest price if known
                      const all = [...catalog.externalSubscriptions, ...catalog.websiteProducts];
                      const match = all.find((item) => item.name === selected);
                      if (match && match.suggestedPrice) {
                        setAmountPaid(String(match.suggestedPrice));
                      }
                    }}
                    className="ui-input text-xs font-mono py-2 w-full bg-white"
                  >
                    <optgroup label="Popular Subscriptions (WhatsApp / Direct)">
                      {catalog.externalSubscriptions.map((sub, i) => (
                        <option key={i} value={sub.name}>
                          {sub.name} (₹{sub.suggestedPrice.toLocaleString()})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Website API Plans">
                      {catalog.websiteProducts.map((p, i) => (
                        <option key={i} value={p.name}>
                          {p.name} (₹{p.suggestedPrice.toLocaleString()})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                )}
              </div>

              {/* 3. Amount Paid & Purchase Channel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold font-mono text-fg uppercase">
                    Amount Paid (INR) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-mono font-bold text-xs">₹</span>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      placeholder="3500"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="ui-input text-xs font-mono pl-7 py-2 w-full font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold font-mono text-fg uppercase">
                    Purchase Channel *
                  </label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="ui-input text-xs font-mono py-2 w-full bg-white font-bold"
                  >
                    <option value="WHATSAPP">💬 WhatsApp</option>
                    <option value="MANUAL">✍️ Direct / Manual</option>
                    <option value="WEBSITE">🌐 Website</option>
                    <option value="OTHER">📦 Other Channel</option>
                  </select>
                </div>
              </div>

              {/* 4. Purchase Date & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold font-mono text-fg uppercase">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="ui-input text-xs font-mono py-2 w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold font-mono text-fg uppercase">
                    Status *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="ui-input text-xs font-mono py-2 w-full bg-white"
                  >
                    <option value="COMPLETED">Completed (Awards credits)</option>
                    <option value="PENDING">Pending (No credits yet)</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </div>
              </div>

              {/* 5. Reference ID & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold font-mono text-fg uppercase">
                    Reference ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. WH-10293, UTR-49382"
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    className="ui-input text-xs font-mono py-2 w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold font-mono text-fg uppercase">
                    Internal Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Paid via PhonePe, verified by admin"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="ui-input text-xs font-mono py-2 w-full"
                  />
                </div>
              </div>

              {/* LIVE REWARD PREVIEW (Section 9) */}
              <div className="rounded-control bg-gradient-to-r from-violet-50 via-indigo-50/50 to-emerald-50 border border-violet-200 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-fg flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                    <span>Live Reward Calculation</span>
                  </span>
                  <span className="text-[10px] font-mono text-muted">
                    Server Rule: 10% back (max ₹500/tx)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-xs">
                  <div className="bg-white/80 p-2 rounded border border-border/60">
                    <span className="text-[10px] text-muted block uppercase">Amount Paid</span>
                    <span className="font-bold text-fg">₹{cleanAmount.toLocaleString()}</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded border border-border/60">
                    <span className="text-[10px] text-muted block uppercase">Reward Eligible</span>
                    <span className="font-bold text-violet-700">₹{eligibleAmount.toLocaleString()}</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded border border-border/60">
                    <span className="text-[10px] text-muted block uppercase">Credits Earned</span>
                    <span className="font-extrabold text-emerald-600">+₹{creditsEarned.toLocaleString()}</span>
                  </div>
                </div>

                {selectedCustomer && (
                  <div className="pt-2 border-t border-violet-200/60 flex items-center justify-between font-mono text-xs">
                    <span className="text-muted">
                      Customer Balance: <span className="text-fg font-bold">₹{currentBalance.toLocaleString()}</span>
                    </span>
                    <span className="text-violet-700 font-extrabold flex items-center gap-1">
                      <span>New Balance:</span>
                      <span className="text-sm bg-violet-600 text-white px-2 py-0.5 rounded font-bold">
                        ₹{newBalance.toLocaleString()}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </form>
          ) : (
            /* STEP 2: CONFIRMATION SCREEN (Section 10) */
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 rounded-panel bg-subtle/50 border border-border space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center border-b border-border/60 pb-2">
                  <span className="text-muted uppercase">Customer:</span>
                  <span className="text-fg font-bold">{selectedCustomer?.name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/60 pb-2">
                  <span className="text-muted uppercase">Email:</span>
                  <span className="text-fg font-bold">{selectedCustomer?.email}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/60 pb-2">
                  <span className="text-muted uppercase">Product:</span>
                  <span className="text-violet-700 font-extrabold">{productName}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/60 pb-2">
                  <span className="text-muted uppercase">Amount Paid:</span>
                  <span className="text-fg font-extrabold text-sm">₹{cleanAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/60 pb-2">
                  <span className="text-muted uppercase">Channel:</span>
                  <span className="font-bold text-fg">{channel}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/60 pb-2">
                  <span className="text-muted uppercase">Status:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {status}
                  </span>
                </div>
                {referenceId && (
                  <div className="flex justify-between items-center border-b border-border/60 pb-2">
                    <span className="text-muted uppercase">Reference ID:</span>
                    <span className="font-bold text-fg">{referenceId}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-b border-border/60 pb-2">
                  <span className="text-muted uppercase">Credits Earned:</span>
                  <span className="text-emerald-600 font-extrabold text-sm">+₹{creditsEarned.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/60 pb-2">
                  <span className="text-muted uppercase">Current Balance:</span>
                  <span className="text-muted font-bold">₹{currentBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-1 text-sm bg-violet-50/80 p-2 rounded border border-violet-200">
                  <span className="text-violet-900 font-bold uppercase text-xs">New Balance After Purchase:</span>
                  <span className="text-violet-700 font-extrabold text-base">₹{newBalance.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-control text-emerald-800 text-xs font-mono space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Automatic Operations on Confirmation:</span>
                </div>
                <ul className="list-disc list-inside text-[11px] text-emerald-700 space-y-0.5 pl-1">
                  <li>Creates Universal Purchase record in authoritative database</li>
                  <li>Issues +₹{creditsEarned.toLocaleString()} Lightning Credits to customer's wallet balance</li>
                  <li>Records chronological entry in credit ledger & audit log</li>
                  <li>Sends in-app notification to {selectedCustomer?.email}</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-subtle/30 flex items-center justify-between shrink-0">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="ui-button-secondary text-xs py-2 px-4 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="record-purchase-form"
                disabled={!selectedCustomer}
                className="ui-button-primary text-xs py-2 px-5 font-bold flex items-center gap-1.5 disabled:opacity-50"
              >
                <span>Review & Confirm</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={submitting}
                className="ui-button-secondary text-xs py-2 px-4 font-bold flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmPurchase}
                disabled={submitting}
                className="ui-button-primary bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 px-6 font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Recording Purchase...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Purchase & Award Credits</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
