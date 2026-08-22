import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Mail,
  Phone,
  Key,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Globe,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CreditCard,
  Activity,
  Layers,
  ChevronRight,
  Copy,
  Check,
  X,
  Lock,
  ExternalLink,
  Sparkles,
  Sliders,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { adminFetch } from '../../utils/api';

interface CustomerApiKey {
  id: string;
  keyPrefix: string;
  displayKey: string;
  name: string;
  type: string;
  status: string;
  purchasedTokens: string;
  tokensUsed: string;
  tokensRemaining: string;
  rateLimitRpm: number;
  expiresAt: string | null;
  createdAt: string;
}

interface CustomerOrder {
  id: string;
  internalOrderId: string;
  planName: string;
  amountInr: number;
  status: string;
  paymentStatus: string;
  fulfillmentStatus?: string;
  createdAt: string;
}

interface CustomerItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: 'active' | 'unverified' | 'suspended';
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
  registrationIp?: string;
  lastLoginIp?: string;
  city?: string;
  region?: string; // State / Province
  country?: string;
  countryCode?: string;
  flag?: string;
  timezone?: string;
  userAgent?: string;
  keyCount: number;
  paidKeyCount: number;
  trialKeyCount: number;
  activeKeyCount: number;
  purchasedTokens: string;
  tokensUsed: string;
  tokensRemaining: string;
  orderCount: number;
  paidOrderCount: number;
  totalSpendInr: number;
  latestPlanName?: string;
  ticketCount: number;
  openTicketCount: number;
  keys: CustomerApiKey[];
  orders: CustomerOrder[];
}

export const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState<string>('ALL');
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [keyTypeFilter, setKeyTypeFilter] = useState<string>('ALL');

  // Customer Detail Drawer
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);

  // Modal State (Create / Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [status, setStatus] = useState<'active' | 'unverified' | 'suspended'>('active');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Issue Key Modal State
  const [showIssueKeyModal, setShowIssueKeyModal] = useState(false);
  const [selectedKeyCustomer, setSelectedKeyCustomer] = useState<CustomerItem | null>(null);
  const [issuePlanId, setIssuePlanId] = useState('20000000');
  const [issueKeyName, setIssueKeyName] = useState('Production Key');
  const [issueRpm, setIssueRpm] = useState('100');
  const [issueIsTrial, setIssueIsTrial] = useState(false);
  const [issueSubmitting, setIssueSubmitting] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [issuedSecretKey, setIssuedSecretKey] = useState<string | null>(null);

  // Token Adjustment Modal State
  const [showAdjustTokensModal, setShowAdjustTokensModal] = useState(false);
  const [adjustCustomer, setAdjustCustomer] = useState<CustomerItem | null>(null);
  const [adjustKeyId, setAdjustKeyId] = useState('');
  const [adjustAmountM, setAdjustAmountM] = useState('5'); // in Millions
  const [adjustReason, setAdjustReason] = useState('Customer loyalty credit');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // Clipboard copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Summary Metrics Computation
  const metrics = useMemo(() => {
    const total = customers.length;
    let paying = 0;
    let trialActive = 0;
    let verified = 0;
    let suspended = 0;
    let totalRevenue = 0;
    let totalTokensUsedBig = BigInt(0);

    customers.forEach((c) => {
      if (c.paidKeyCount > 0 || c.totalSpendInr > 0) paying++;
      if (c.trialKeyCount > 0) trialActive++;
      if (c.emailVerified) verified++;
      if (c.status === 'suspended') suspended++;
      totalRevenue += c.totalSpendInr || 0;
      totalTokensUsedBig += BigInt(c.tokensUsed || '0');
    });

    const tokensUsedM = (Number(totalTokensUsedBig) / 1000000).toFixed(1);

    return {
      total,
      paying,
      trialActive,
      verified,
      suspended,
      totalRevenue,
      tokensUsedM,
    };
  }, [customers]);

  // Unique States & Countries for Filter dropdowns
  const availableStates = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      if (c.region) set.add(c.region);
    });
    return Array.from(set).sort();
  }, [customers]);

  const availableCountries = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      if (c.country) set.add(c.country);
    });
    return Array.from(set).sort();
  }, [customers]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Quick filter
      if (quickFilter === 'PAYING' && c.paidKeyCount === 0 && c.totalSpendInr === 0) return false;
      if (quickFilter === 'TRIAL' && c.trialKeyCount === 0) return false;
      if (quickFilter === 'VERIFIED' && !c.emailVerified) return false;
      if (quickFilter === 'UNVERIFIED' && c.emailVerified) return false;
      if (quickFilter === 'SUSPENDED' && c.status !== 'suspended') return false;

      // State Filter
      if (stateFilter !== 'ALL' && c.region !== stateFilter) return false;

      // Country Filter
      if (countryFilter !== 'ALL' && c.country !== countryFilter) return false;

      // Key Type Filter
      if (keyTypeFilter === 'PAID_ONLY' && c.paidKeyCount === 0) return false;
      if (keyTypeFilter === 'TRIAL_ONLY' && c.trialKeyCount === 0) return false;
      if (keyTypeFilter === 'NO_KEYS' && c.keyCount > 0) return false;
      if (keyTypeFilter === 'HAS_KEYS' && c.keyCount === 0) return false;

      // Search Query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesEmail = c.email.toLowerCase().includes(q);
        const matchesPhone = c.phone?.toLowerCase().includes(q);
        const matchesCity = c.city?.toLowerCase().includes(q);
        const matchesRegion = c.region?.toLowerCase().includes(q);
        const matchesCountry = c.country?.toLowerCase().includes(q);
        const matchesIp = c.registrationIp?.includes(q) || c.lastLoginIp?.includes(q);
        const matchesKeys = c.keys.some((k) => k.displayKey.toLowerCase().includes(q) || k.name.toLowerCase().includes(q));

        if (!matchesName && !matchesEmail && !matchesPhone && !matchesCity && !matchesRegion && !matchesCountry && !matchesIp && !matchesKeys) {
          return false;
        }
      }

      return true;
    });
  }, [customers, quickFilter, stateFilter, countryFilter, keyTypeFilter, search]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  };

  const openCreateModal = () => {
    setEditingCustomer(null);
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setRole('user');
    setStatus('active');
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (cust: CustomerItem) => {
    setEditingCustomer(cust);
    setName(cust.name);
    setEmail(cust.email);
    setPhone(cust.phone || '');
    setPassword('');
    setRole(cust.role || 'user');
    setStatus(cust.status || 'active');
    setFormError(null);
    setShowModal(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const url = editingCustomer ? `/api/admin/customers/${editingCustomer.id}` : '/api/admin/customers';
      const method = editingCustomer ? 'PUT' : 'POST';

      const payload: any = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        role,
        status,
      };
      if (password) payload.password = password;

      const res = await adminFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (res.ok) {
        setShowModal(false);
        fetchCustomers();
      } else {
        setFormError(resData.error?.message || 'Failed to save customer account.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Network error saving customer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSuspend = async (cust: CustomerItem) => {
    const newStatus = cust.status === 'suspended' ? 'active' : 'suspended';
    const confirmMsg = cust.status === 'suspended'
      ? `Reactivate account for ${cust.name}?`
      : `Are you sure you want to suspend account for ${cust.name}? All active keys will be blocked.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await adminFetch(`/api/admin/customers/${cust.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchCustomers();
        if (selectedCustomer?.id === cust.id) {
          setSelectedCustomer((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openIssueKeyModal = (cust: CustomerItem) => {
    setSelectedKeyCustomer(cust);
    setIssuePlanId('20000000');
    setIssueKeyName(`${cust.name.split(' ')[0]}'s Production Key`);
    setIssueRpm('100');
    setIssueIsTrial(false);
    setIssueError(null);
    setIssuedSecretKey(null);
    setShowIssueKeyModal(true);
  };

  const handleIssueKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKeyCustomer) return;
    setIssueSubmitting(true);
    setIssueError(null);

    const tokenLimitNum = Number(issuePlanId);
    const numM = Math.round(tokenLimitNum / 1000000);
    const planName = issueIsTrial ? 'Free Trial' : `${numM}M Tokens / 5h Window`;

    try {
      const res = await adminFetch('/api/admin/keys', {
        method: 'POST',
        body: JSON.stringify({
          userId: selectedKeyCustomer.id,
          name: issueKeyName.trim(),
          tokenLimit: tokenLimitNum,
          plan: planName,
          rateLimitRpm: Number(issueRpm || 100),
          isTrial: issueIsTrial,
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.rawKey) {
        setIssuedSecretKey(resData.rawKey);
        fetchCustomers();
      } else {
        setIssueError(resData?.error?.message || 'Failed to issue API key to customer.');
      }
    } catch (err: any) {
      setIssueError(err.message || 'Network error issuing API key.');
    } finally {
      setIssueSubmitting(false);
    }
  };

  const openAdjustTokensModal = (cust: CustomerItem, defaultKeyId?: string) => {
    setAdjustCustomer(cust);
    setAdjustKeyId(defaultKeyId || cust.keys[0]?.id || '');
    setAdjustAmountM('5');
    setAdjustReason('Customer loyalty credit');
    setAdjustError(null);
    setShowAdjustTokensModal(true);
  };

  const handleAdjustTokensSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustCustomer || !adjustKeyId) return;
    setAdjustSubmitting(true);
    setAdjustError(null);

    const amountTokens = Number(adjustAmountM) * 1000000;

    try {
      const res = await adminFetch(`/api/admin/customers/${adjustCustomer.id}/adjust-tokens`, {
        method: 'POST',
        body: JSON.stringify({
          apiKeyId: adjustKeyId,
          amountTokens,
          reason: adjustReason,
        }),
      });

      const resData = await res.json();
      if (res.ok) {
        setShowAdjustTokensModal(false);
        fetchCustomers();
      } else {
        setAdjustError(resData?.error?.message || 'Failed to adjust token balance.');
      }
    } catch (err: any) {
      setAdjustError(err.message || 'Network error adjusting tokens.');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-fg flex items-center gap-2.5">
            <Users className="w-6 h-6 text-violet-600" />
            <span>Customer Intelligence & Accounts Center</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Complete customer directory tracking geographic origin (State & City by IP), API keys owned, token allowances, and lifetime spend.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={openCreateModal}
            className="ui-button-secondary text-xs py-2 px-3.5 gap-1.5 font-bold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-violet-600" />
            <span>Create Customer</span>
          </button>

          <button
            onClick={fetchCustomers}
            disabled={loading}
            className="ui-button-primary text-xs py-2 px-3.5 gap-1.5 font-bold shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Real-Time Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
        <div className="p-3.5 bg-card border border-border rounded-panel space-y-1 shadow-xs">
          <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Total Accounts</span>
          <div className="text-lg font-extrabold text-fg">{metrics.total.toLocaleString()}</div>
        </div>

        <div className="p-3.5 bg-card border border-emerald-200 rounded-panel space-y-1 shadow-xs">
          <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider flex items-center gap-1">
            <span>💎 Paying Customers</span>
          </span>
          <div className="text-lg font-extrabold text-emerald-600">{metrics.paying.toLocaleString()}</div>
        </div>

        <div className="p-3.5 bg-card border border-violet-200 rounded-panel space-y-1 shadow-xs">
          <span className="text-[10px] text-violet-700 uppercase font-bold tracking-wider">⚡ Free Trial Users</span>
          <div className="text-lg font-extrabold text-violet-600">{metrics.trialActive.toLocaleString()}</div>
        </div>

        <div className="p-3.5 bg-card border border-border rounded-panel space-y-1 shadow-xs">
          <span className="text-[10px] text-muted uppercase font-bold tracking-wider">✓ Verified Emails</span>
          <div className="text-lg font-extrabold text-fg">{metrics.verified.toLocaleString()}</div>
        </div>

        <div className="p-3.5 bg-card border border-border rounded-panel space-y-1 shadow-xs">
          <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Lifetime Spend</span>
          <div className="text-lg font-extrabold text-emerald-600">₹{metrics.totalRevenue.toLocaleString()}</div>
        </div>

        <div className="p-3.5 bg-card border border-border rounded-panel space-y-1 shadow-xs">
          <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Tokens Consumed</span>
          <div className="text-lg font-extrabold text-fg">{metrics.tokensUsedM}M</div>
        </div>
      </div>

      {/* Quick Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
        {[
          { id: 'ALL', label: 'ALL ACCOUNTS' },
          { id: 'PAYING', label: '💎 PAYING CUSTOMERS' },
          { id: 'TRIAL', label: '⚡ FREE TRIAL ACTIVE' },
          { id: 'VERIFIED', label: '✓ EMAIL VERIFIED' },
          { id: 'UNVERIFIED', label: '⚠️ UNVERIFIED' },
          { id: 'SUSPENDED', label: '🛑 SUSPENDED' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setQuickFilter(tab.id)}
            className={`px-3 py-1.5 rounded-control font-bold whitespace-nowrap transition-all ${
              quickFilter === tab.id
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs'
                : 'bg-card border border-border text-muted hover:text-fg hover:bg-subtle'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Multi-Filter & Search Bar */}
      <div className="p-4 bg-card border border-border rounded-panel space-y-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Live Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Name, Email, Phone, City, State, Country, IP, or Key ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-bg border border-border rounded-control py-2 pl-9 pr-8 text-xs text-fg focus:outline-none focus:border-violet-500 font-sans"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-fg text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* State Filter */}
          <div>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full bg-bg border border-border rounded-control py-2 px-3 text-xs text-fg focus:outline-none focus:border-violet-500 font-mono"
            >
              <option value="ALL">All States / Regions</option>
              {availableStates.map((st) => (
                <option key={st} value={st}>
                  📍 {st}
                </option>
              ))}
            </select>
          </div>

          {/* Key Type Filter */}
          <div>
            <select
              value={keyTypeFilter}
              onChange={(e) => setKeyTypeFilter(e.target.value)}
              className="w-full bg-bg border border-border rounded-control py-2 px-3 text-xs text-fg focus:outline-none focus:border-violet-500 font-mono"
            >
              <option value="ALL">All Key Statuses</option>
              <option value="HAS_KEYS">Has Active Keys</option>
              <option value="PAID_ONLY">Has Paid Key 💎</option>
              <option value="TRIAL_ONLY">Trial Key Only ⚡</option>
              <option value="NO_KEYS">No Keys Issued</option>
            </select>
          </div>
        </div>

        {/* Filter Details & Results Count */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs font-mono">
          <span className="text-muted">
            Showing <strong>{filteredCustomers.length}</strong> of <strong>{customers.length}</strong> customer accounts
          </span>
          <button
            onClick={() => {
              setSearch('');
              setQuickFilter('ALL');
              setStateFilter('ALL');
              setCountryFilter('ALL');
              setKeyTypeFilter('ALL');
            }}
            className="text-violet-600 hover:text-violet-700 underline font-semibold"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Main Customer Intelligence Table */}
      <div className="bg-card border border-border rounded-panel overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-subtle/60 text-muted font-mono uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Origin & Location</th>
                <th className="py-3 px-4">API Keys & Tokens</th>
                <th className="py-3 px-4">Lifetime Spend</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Joined / Active</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-xs text-muted font-mono">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-violet-600 mb-2" />
                    <span>Loading customer accounts & geolocation data...</span>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-xs text-muted font-mono space-y-2">
                    <p className="font-bold text-fg">No customer accounts match your search/filter criteria.</p>
                    <p className="text-[11px]">Try adjusting your search query, state, or key status filter.</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const hasKeys = cust.keyCount > 0;
                  const totalRemNum = Number(BigInt(cust.tokensRemaining || '0'));
                  const totalPurNum = Number(BigInt(cust.purchasedTokens || '0')) || 1;
                  const usagePercent = Math.min(100, Math.max(0, Math.round((totalRemNum / totalPurNum) * 100)));

                  return (
                    <tr
                      key={cust.id}
                      onClick={() => setSelectedCustomer(cust)}
                      className="hover:bg-subtle/50 transition-colors cursor-pointer group"
                    >
                      {/* Customer Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-xs">
                            {cust.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-fg flex items-center gap-1.5">
                              <span>{cust.name}</span>
                              {cust.role === 'admin' && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-violet-100 text-violet-800">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted font-mono flex items-center gap-1 mt-0.5">
                              <span>{cust.email}</span>
                              {cust.emailVerified ? (
                                <span className="text-emerald-600" title="Email Verified">✓</span>
                              ) : (
                                <span className="text-amber-500 text-[10px]" title="Unverified Email">⚠️</span>
                              )}
                            </div>
                            {cust.phone && (
                              <div className="text-[10px] text-muted font-mono mt-0.5">
                                📞 {cust.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Origin & Location (City, State, Country, IP) */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="space-y-0.5">
                          <div className="font-bold text-fg flex items-center gap-1.5">
                            <span>{cust.flag || '🇮🇳'}</span>
                            <span>
                              {cust.city && cust.region
                                ? `${cust.city}, ${cust.region}`
                                : cust.region || cust.city || (cust.country ? cust.country : 'Location Pending')}
                            </span>
                          </div>
                          <div className="text-[10px] text-muted flex items-center gap-1">
                            <span className="truncate max-w-[140px]" title={cust.registrationIp || '127.0.0.1'}>
                              IP: {cust.registrationIp || '127.0.0.1'}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(cust.registrationIp || '127.0.0.1', cust.id);
                              }}
                              className="text-violet-600 hover:underline text-[9px]"
                              title="Copy IP"
                            >
                              {copiedId === cust.id ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          {cust.userAgent && (
                            <div className="text-[9px] text-muted truncate max-w-[150px]" title={cust.userAgent}>
                              {cust.userAgent}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* API Keys & Token Balances */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {hasKeys ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-fg">
                                {cust.keyCount} Key{cust.keyCount > 1 ? 's' : ''}
                              </span>
                              {cust.paidKeyCount > 0 && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {cust.paidKeyCount} Paid
                                </span>
                              )}
                              {cust.trialKeyCount > 0 && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                                  {cust.trialKeyCount} Trial (100 RPM)
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-muted">
                              Remaining: <strong className="text-fg">{(totalRemNum / 1000000).toFixed(2)}M</strong> tokens
                            </div>
                            <div className="w-24 bg-subtle rounded-full h-1.5 overflow-hidden border border-border">
                              <div
                                className={`h-full rounded-full ${
                                  usagePercent > 20 ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted text-[11px]">No Keys Issued</span>
                        )}
                      </td>

                      {/* Lifetime Spend & Orders */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="font-extrabold text-emerald-600 text-xs">
                          ₹{cust.totalSpendInr.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-muted">
                          {cust.orderCount} Order{cust.orderCount !== 1 ? 's' : ''}
                        </div>
                        {cust.latestPlanName && (
                          <div className="text-[9px] text-muted truncate max-w-[120px]" title={cust.latestPlanName}>
                            {cust.latestPlanName}
                          </div>
                        )}
                      </td>

                      {/* Account Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase inline-flex items-center gap-1 border ${
                            cust.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : cust.status === 'suspended'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              cust.status === 'active'
                                ? 'bg-emerald-500'
                                : cust.status === 'suspended'
                                ? 'bg-rose-500'
                                : 'bg-amber-500'
                            }`}
                          />
                          <span>{cust.status}</span>
                        </span>
                      </td>

                      {/* Joined / Active */}
                      <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap">
                        <div className="font-bold text-fg">
                          {new Date(cust.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-muted">
                          Joined {formatRelativeTime(cust.createdAt)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomer(cust);
                            }}
                            className="px-2.5 py-1 rounded-control bg-subtle hover:bg-violet-600 hover:text-white text-muted font-bold text-[11px] transition-all flex items-center gap-1"
                          >
                            <span>Profile</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openIssueKeyModal(cust);
                            }}
                            className="p-1.5 rounded-control hover:bg-violet-50 text-violet-600 transition-colors"
                            title="Issue API Key"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(cust);
                            }}
                            className="p-1.5 rounded-control hover:bg-subtle text-muted hover:text-fg transition-colors"
                            title="Edit Account"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deep Customer Intelligence Profile Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-border rounded-panel w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-y-auto font-sans relative space-y-0">
            {/* Drawer Header */}
            <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-base shadow-md">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-fg">{selectedCustomer.name}</h2>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase ${
                        selectedCustomer.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : selectedCustomer.status === 'suspended'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {selectedCustomer.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted font-mono mt-0.5">
                    {selectedCustomer.email} · Customer ID: <span className="font-bold text-fg">{selectedCustomer.id}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openIssueKeyModal(selectedCustomer)}
                  className="ui-button-primary text-xs py-1.5 px-3 font-bold gap-1 shadow-sm"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Issue Key</span>
                </button>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 rounded-full hover:bg-subtle text-muted hover:text-fg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6">
              {/* Geolocation & Origin Intelligence Card */}
              <div className="p-4 bg-violet-50/50 border border-violet-200/80 rounded-panel space-y-3">
                <div className="flex items-center justify-between border-b border-violet-200/60 pb-2">
                  <span className="text-xs font-bold text-violet-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-violet-600" />
                    <span>Geographic Origin & Device Intelligence (Captured via IP)</span>
                  </span>
                  <span className="text-xs font-bold text-violet-700 font-mono">
                    {selectedCustomer.flag || '🇮🇳'} {selectedCustomer.country || 'India'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 bg-white border border-violet-100 rounded-control space-y-1">
                    <span className="text-[10px] text-muted uppercase font-bold">State / Province</span>
                    <div className="font-bold text-fg">{selectedCustomer.region || 'Maharashtra'}</div>
                  </div>

                  <div className="p-3 bg-white border border-violet-100 rounded-control space-y-1">
                    <span className="text-[10px] text-muted uppercase font-bold">City / Metro</span>
                    <div className="font-bold text-fg">{selectedCustomer.city || 'Mumbai'}</div>
                  </div>

                  <div className="p-3 bg-white border border-violet-100 rounded-control space-y-1">
                    <span className="text-[10px] text-muted uppercase font-bold">Origin Signup IP</span>
                    <div className="font-bold text-fg flex items-center justify-between">
                      <span className="truncate">{selectedCustomer.registrationIp || '127.0.0.1'}</span>
                      <button
                        onClick={() => copyToClipboard(selectedCustomer.registrationIp || '127.0.0.1', 'reg_ip')}
                        className="text-violet-600 hover:underline text-[9px]"
                      >
                        {copiedId === 'reg_ip' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-violet-100 rounded-control space-y-1">
                    <span className="text-[10px] text-muted uppercase font-bold">Device / Browser</span>
                    <div className="font-bold text-fg truncate" title={selectedCustomer.userAgent || ''}>
                      {selectedCustomer.userAgent || 'Web Browser'}
                    </div>
                  </div>
                </div>
              </div>

              {/* API Keys Portfolio */}
              <div className="space-y-3 font-mono">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-xs font-bold text-fg uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-violet-600" />
                    <span>API Key Portfolio ({selectedCustomer.keys.length} Keys Owned)</span>
                  </span>
                  {selectedCustomer.keys.length > 0 && (
                    <button
                      onClick={() => openAdjustTokensModal(selectedCustomer)}
                      className="text-xs text-violet-600 hover:underline font-bold"
                    >
                      + Adjust Token Allowance
                    </button>
                  )}
                </div>

                {selectedCustomer.keys.length === 0 ? (
                  <div className="p-6 bg-card border border-border rounded-panel text-center text-xs text-muted">
                    No API keys have been issued or claimed by this customer yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedCustomer.keys.map((k) => (
                      <div
                        key={k.id}
                        className="p-3.5 bg-card border border-border rounded-control flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-fg">{k.name}</span>
                            <span
                              className={`px-2 py-0.2 rounded text-[9px] font-bold uppercase ${
                                k.type === 'trial' ? 'bg-violet-100 text-violet-800' : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {k.type}
                            </span>
                            <span className="text-muted text-[11px]">({k.rateLimitRpm} RPM)</span>
                          </div>
                          <div className="flex items-center gap-2 font-mono text-[11px] text-muted">
                            <span>Key: <strong className="text-fg">{k.displayKey}</strong></span>
                            <button
                              onClick={() => copyToClipboard(k.displayKey, k.id)}
                              className="text-violet-600 hover:underline text-[10px]"
                            >
                              {copiedId === k.id ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right font-mono">
                            <div className="font-bold text-fg">
                              {(Number(BigInt(k.tokensRemaining)) / 1000000).toFixed(2)}M remaining
                            </div>
                            <div className="text-[10px] text-muted">
                              of {(Number(BigInt(k.purchasedTokens)) / 1000000).toFixed(2)}M allowance
                            </div>
                          </div>

                          <button
                            onClick={() => openAdjustTokensModal(selectedCustomer, k.id)}
                            className="px-2.5 py-1 rounded-control bg-subtle hover:bg-violet-600 hover:text-white text-muted font-bold text-[10px] transition-all"
                          >
                            Adjust
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order & Payment History */}
              <div className="space-y-3 font-mono">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-xs font-bold text-fg uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Purchase & Order History ({selectedCustomer.orders.length} Orders)</span>
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    Total Spend: ₹{selectedCustomer.totalSpendInr.toLocaleString()}
                  </span>
                </div>

                {selectedCustomer.orders.length === 0 ? (
                  <div className="p-6 bg-card border border-border rounded-panel text-center text-xs text-muted">
                    No purchase transactions recorded for this customer.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedCustomer.orders.map((o) => (
                      <div
                        key={o.id}
                        className="p-3 bg-card border border-border rounded-control flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-fg">{o.planName}</div>
                          <div className="text-[10px] text-muted">
                            Order ID: {o.internalOrderId} · {new Date(o.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <div className="font-extrabold text-emerald-600">₹{o.amountInr}</div>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                              o.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {o.paymentStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Administrative Actions Bar */}
              <div className="p-4 bg-subtle border border-border rounded-panel flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleSuspend(selectedCustomer)}
                    className={`px-3.5 py-2 rounded-control font-bold text-xs flex items-center gap-1.5 shadow-xs ${
                      selectedCustomer.status === 'suspended'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-rose-600 hover:bg-rose-700 text-white'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{selectedCustomer.status === 'suspended' ? 'Reactivate Account' : 'Suspend Account'}</span>
                  </button>

                  <button
                    onClick={() => openEditModal(selectedCustomer)}
                    className="ui-button-secondary text-xs py-2 px-3 font-bold"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                </div>

                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="px-5 py-2 rounded-control bg-fg text-bg hover:bg-fg/90 font-bold text-xs"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-border rounded-panel w-full max-w-md shadow-2xl p-6 space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-extrabold text-fg flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-600" />
                <span>{editingCustomer ? 'Edit Customer Profile' : 'Create Customer Account'}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-fg">✕</button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-control text-rose-700 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="space-y-3.5 text-xs font-mono">
              <div>
                <label className="block text-muted mb-1 font-bold uppercase">Customer Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-bg border border-border rounded-control p-2 text-xs text-fg focus:outline-none focus:border-violet-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-muted mb-1 font-bold uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. customer@example.com"
                  className="w-full bg-bg border border-border rounded-control p-2 text-xs text-fg focus:outline-none focus:border-violet-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-muted mb-1 font-bold uppercase">Phone Number (Optional)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full bg-bg border border-border rounded-control p-2 text-xs text-fg focus:outline-none focus:border-violet-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-muted mb-1 font-bold uppercase">
                  {editingCustomer ? 'New Password (Leave blank to keep current)' : 'Password'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingCustomer ? '••••••••' : 'Enter secure password'}
                  className="w-full bg-bg border border-border rounded-control p-2 text-xs text-fg focus:outline-none focus:border-violet-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted mb-1 font-bold uppercase">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-bg border border-border rounded-control p-2 text-xs text-fg focus:outline-none"
                  >
                    <option value="user">User / Customer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-muted mb-1 font-bold uppercase">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-bg border border-border rounded-control p-2 text-xs text-fg focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="unverified">Unverified</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-control bg-bg border border-border text-fg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-control bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold shadow-md"
                >
                  {submitting ? 'Saving...' : editingCustomer ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue API Key Modal */}
      {showIssueKeyModal && selectedKeyCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-border rounded-panel w-full max-w-md shadow-2xl p-6 space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-extrabold text-fg flex items-center gap-2">
                <Key className="w-4 h-4 text-violet-600" />
                <span>Issue API Key to {selectedKeyCustomer.name}</span>
              </h3>
              <button onClick={() => setShowIssueKeyModal(false)} className="text-muted hover:text-fg">✕</button>
            </div>

            {issueError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-control text-rose-700 text-xs">
                {issueError}
              </div>
            )}

            {issuedSecretKey ? (
              <div className="space-y-4 font-mono text-xs">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-control space-y-2">
                  <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>API Key Issued Successfully!</span>
                  </p>
                  <p className="text-[11px] text-emerald-800">
                    Copy the unmasked key below now. It will not be shown again.
                  </p>
                  <div className="p-2.5 bg-slate-900 text-emerald-400 rounded text-xs break-all select-all font-bold">
                    {issuedSecretKey}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(issuedSecretKey, 'issued_key')}
                    className="flex-1 py-2 rounded-control bg-violet-600 hover:bg-violet-700 text-white font-bold"
                  >
                    {copiedId === 'issued_key' ? 'Copied to Clipboard!' : 'Copy Key Secret'}
                  </button>
                  <button
                    onClick={() => {
                      setShowIssueKeyModal(false);
                      setIssuedSecretKey(null);
                    }}
                    className="px-4 py-2 rounded-control bg-bg border border-border text-fg font-bold"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleIssueKeySubmit} className="space-y-3.5 text-xs font-mono">
                <div>
                  <label className="block text-muted mb-1 font-bold uppercase">Key Name</label>
                  <input
                    type="text"
                    required
                    value={issueKeyName}
                    onChange={(e) => setIssueKeyName(e.target.value)}
                    className="w-full bg-bg border border-border rounded-control p-2 text-xs text-fg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-muted mb-1 font-bold uppercase">Token Allowance Plan</label>
                  <select
                    value={issuePlanId}
                    onChange={(e) => setIssuePlanId(e.target.value)}
                    className="w-full bg-bg border border-border rounded-control p-2 text-xs text-fg focus:outline-none"
                  >
                    <option value="1000000">1 Million Tokens (Trial / Starter)</option>
                    <option value="5000000">5 Million Tokens</option>
                    <option value="10000000">10 Million Tokens</option>
                    <option value="20000000">20 Million Tokens (Claude Max 20x)</option>
                    <option value="40000000">40 Million Tokens (Claude Max 40x)</option>
                    <option value="100000000">100 Million Tokens (Claude Max 100x)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-muted mb-1 font-bold uppercase">Rate Limit (RPM)</label>
                    <input
                      type="number"
                      value={issueRpm}
                      onChange={(e) => setIssueRpm(e.target.value)}
                      className="w-full bg-bg border border-border rounded-control p-2 text-xs text-fg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-muted mb-1 font-bold uppercase">Key Type</label>
                    <select
                      value={issueIsTrial ? 'trial' : 'production'}
                      onChange={(e) => setIssueIsTrial(e.target.value === 'trial')}
                      className="w-full bg-bg border border-border rounded-control p-2 text-xs text-fg focus:outline-none"
                    >
                      <option value="production">Production (ld_live_)</option>
                      <option value="trial">Free Trial (ld_trial_)</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowIssueKeyModal(false)}
                    className="flex-1 py-2.5 rounded-control bg-bg border border-border text-fg font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={issueSubmitting}
                    className="flex-1 py-2.5 rounded-control bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-md"
                  >
                    {issueSubmitting ? 'Generating...' : 'Issue Key Now'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Adjust Token Allowance Modal */}
      {showAdjustTokensModal && adjustCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-border rounded-panel w-full max-w-md shadow-2xl p-6 space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-extrabold text-fg flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-600" />
                <span>Adjust Token Balance for {adjustCustomer.name}</span>
              </h3>
              <button onClick={() => setShowAdjustTokensModal(false)} className="text-muted hover:text-fg">✕</button>
            </div>

            {adjustError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-control text-rose-700 text-xs">
                {adjustError}
              </div>
            )}

            <form onSubmit={handleAdjustTokensSubmit} className="space-y-3.5 text-xs font-mono">
              <div>
                <label className="block text-muted mb-1 font-bold uppercase">Select Customer API Key</label>
                <select
                  value={adjustKeyId}
                  onChange={(e) => setAdjustKeyId(e.target.value)}
                  className="w-full bg-bg border border-border rounded-control p-2 text-xs text-fg focus:outline-none"
                >
                  {adjustCustomer.keys.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name} ({k.displayKey}) — Remaining: {(Number(BigInt(k.tokensRemaining)) / 1000000).toFixed(2)}M
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-muted mb-1 font-bold uppercase">Tokens Delta Amount (in Millions)</label>
                <div className="flex gap-2">
                  {['+1', '+5', '+10', '+20', '-5'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAdjustAmountM(preset.replace('+', ''))}
                      className={`px-3 py-1 rounded border text-xs font-bold ${
                        adjustAmountM === preset.replace('+', '')
                          ? 'bg-violet-600 text-white border-violet-600'
                          : 'bg-subtle text-fg border-border'
                      }`}
                    >
                      {preset}M
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={adjustAmountM}
                  onChange={(e) => setAdjustAmountM(e.target.value)}
                  placeholder="e.g. 5 or -5"
                  className="w-full bg-bg border border-border rounded-control p-2 text-xs text-fg focus:outline-none mt-2"
                />
              </div>

              <div>
                <label className="block text-muted mb-1 font-bold uppercase">Reason / Admin Note</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Loyalty credit or balance adjustment"
                  className="w-full bg-bg border border-border rounded-control p-2 text-xs text-fg focus:outline-none font-sans"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustTokensModal(false)}
                  className="flex-1 py-2.5 rounded-control bg-bg border border-border text-fg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustSubmitting}
                  className="flex-1 py-2.5 rounded-control bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-md"
                >
                  {adjustSubmitting ? 'Adjusting...' : 'Confirm Balance Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
