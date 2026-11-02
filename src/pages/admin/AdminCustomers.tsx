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
  hasStudioAccess?: boolean;
  studioAccessGrantedAt?: string;
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
  const [hasStudioAccess, setHasStudioAccess] = useState(false);
  const [togglingStudio, setTogglingStudio] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Issue Key Modal State
  const [showIssueKeyModal, setShowIssueKeyModal] = useState(false);
  const [selectedKeyCustomer, setSelectedKeyCustomer] = useState<CustomerItem | null>(null);
  const [issueBillingType, setIssueBillingType] = useState<'window' | 'credit' | 'token'>('window');
  const [issueCreditBalanceUsd, setIssueCreditBalanceUsd] = useState('7.00');
  const [issuePlanId, setIssuePlanId] = useState('20000000');
  const [customTokens, setCustomTokens] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [providers, setProviders] = useState<any[]>([]);
  const [issueModelScope, setIssueModelScope] = useState<'all' | 'claude' | 'openai' | 'local'>('all');
  const [issueKeyPrefix, setIssueKeyPrefix] = useState('sk_live_');
  const [issueKeyName, setIssueKeyName] = useState('Production Key');
  const [issueRpm, setIssueRpm] = useState('100');
  const [issueExpiryDays, setIssueExpiryDays] = useState('');
  const [issueIsTrial, setIssueIsTrial] = useState(false);
  const [issueSubmitting, setIssueSubmitting] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [issuedSecretKey, setIssuedSecretKey] = useState<string | null>(null);
  const [issuedKeyDetails, setIssuedKeyDetails] = useState<any | null>(null);

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

  const fetchProviders = async () => {
    try {
      const res = await adminFetch('/api/admin/providers');
      if (res.ok) {
        const data = await res.json();
        setProviders(data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchProviders();
  }, []);

  // Summary Metrics Computation
  const metrics = useMemo(() => {
    const total = customers.length;
    let paying = 0;
    let trialActive = 0;
    let studioVip = 0;
    let verified = 0;
    let suspended = 0;
    let totalRevenue = 0;
    let totalTokensUsedBig = BigInt(0);

    customers.forEach((c) => {
      if (c.paidKeyCount > 0 || c.totalSpendInr > 0) paying++;
      if (c.trialKeyCount > 0) trialActive++;
      if (c.hasStudioAccess) studioVip++;
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
      studioVip,
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
      if (quickFilter === 'STUDIO_VIP' && !c.hasStudioAccess) return false;
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
    setHasStudioAccess(false);
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
    setHasStudioAccess(Boolean(cust.hasStudioAccess));
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
        hasStudioAccess,
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
        if (selectedCustomer?.id === editingCustomer?.id) {
          setSelectedCustomer((prev) => (prev ? { ...prev, ...payload } : null));
        }
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

  const handleToggleStudioAccess = async (cust: CustomerItem, granted?: boolean) => {
    const targetGranted = granted !== undefined ? granted : !cust.hasStudioAccess;
    const confirmMsg = targetGranted
      ? `Grant full AI Chat Studio access to ${cust.name}? They will immediately be able to use Claude Opus 5.5 & Sonnet 5.5 Studio, multimodal vision, and multi-turn chat without an active paid subscription.`
      : `Revoke AI Chat Studio VIP access from ${cust.name}?`;

    if (!window.confirm(confirmMsg)) return;

    setTogglingStudio(true);
    try {
      const res = await adminFetch(`/api/admin/customers/${cust.id}/toggle-studio`, {
        method: 'POST',
        body: JSON.stringify({ granted: targetGranted }),
      });
      const data = await res.json();
      if (res.ok) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === cust.id
              ? { ...c, hasStudioAccess: data.hasStudioAccess, studioAccessGrantedAt: data.studioAccessGrantedAt }
              : c
          )
        );
        if (selectedCustomer?.id === cust.id) {
          setSelectedCustomer((prev) =>
            prev
              ? { ...prev, hasStudioAccess: data.hasStudioAccess, studioAccessGrantedAt: data.studioAccessGrantedAt }
              : null
          );
        }
      } else {
        alert(data?.error?.message || 'Failed to update AI Chat Studio access.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error updating AI Chat Studio access.');
    } finally {
      setTogglingStudio(false);
    }
  };

  const openIssueKeyModal = (cust: CustomerItem) => {
    setSelectedKeyCustomer(cust);
    setIssueBillingType('window');
    setIssuePlanId('20000000');
    setIssueCreditBalanceUsd('7.00');
    setCustomTokens('');
    setSelectedProviderId('');
    setIssueModelScope('all');
    setIssueKeyPrefix('sk_live_');
    setIssueKeyName(`${cust.name.split(' ')[0]}'s Production Key`);
    setIssueRpm('100');
    setIssueExpiryDays('');
    setIssueIsTrial(false);
    setIssueError(null);
    setIssuedSecretKey(null);
    setIssuedKeyDetails(null);
    setShowIssueKeyModal(true);
  };

  const handleIssueKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKeyCustomer) return;
    setIssueSubmitting(true);
    setIssueError(null);

    let tokenLimitNum = 0;
    let planName = '';

    if (issueBillingType === 'credit') {
      planName = `API Credits (${Number(issueCreditBalanceUsd || 7.00).toFixed(2)} USD)`;
    } else if (issueBillingType === 'window') {
      tokenLimitNum = issuePlanId === 'custom'
        ? Number(customTokens || 20000000)
        : Number(issuePlanId);
      const numM = Math.round(tokenLimitNum / 1000000);
      planName = issueIsTrial ? 'Free Trial' : (numM > 0 ? `Claude Max ${numM}x` : `5h Pool (${tokenLimitNum} Tokens)`);
    } else {
      tokenLimitNum = issuePlanId === 'custom'
        ? Number(customTokens || 100000000)
        : Number(issuePlanId);
      const numM = Math.round(tokenLimitNum / 1000000);
      planName = `Token Pack ${numM}M`;
    }

    try {
      let finalAllowedFamilies = 'all';
      if (issueModelScope === 'claude') {
        finalAllowedFamilies = JSON.stringify(['claude']);
      } else if (issueModelScope === 'openai') {
        finalAllowedFamilies = JSON.stringify(['openai']);
      } else if (issueModelScope === 'local') {
        finalAllowedFamilies = JSON.stringify(['local', 'deepseek', 'gemini', 'grok', 'glm', 'minimax', 'kimi', 'qwen']);
      }

      const payload: any = {
        userId: selectedKeyCustomer.id,
        name: issueKeyName.trim(),
        billingType: issueBillingType,
        plan: planName,
        rateLimitRpm: Number(issueRpm || 100),
        isTrial: issueIsTrial,
        providerId: selectedProviderId || undefined,
        allowedModelFamilies: finalAllowedFamilies,
        allowedModels: 'all',
        keyPrefix: issueKeyPrefix,
        expiryDays: issueExpiryDays ? Number(issueExpiryDays) : undefined,
      };

      if (issueBillingType === 'credit') {
        payload.creditBalanceUsd = Number(issueCreditBalanceUsd || 7.00);
      } else {
        payload.tokenLimit = tokenLimitNum;
      }

      const res = await adminFetch('/api/admin/keys', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (res.ok && resData.rawKey) {
        setIssuedSecretKey(resData.rawKey);
        setIssuedKeyDetails(resData);
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 font-mono text-xs">
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

        <div className="p-3.5 bg-card border border-amber-200/90 rounded-panel space-y-1 shadow-xs bg-amber-50/20">
          <span className="text-[10px] text-amber-700 uppercase font-bold tracking-wider flex items-center gap-1">
            <span>✨ Studio VIPs</span>
          </span>
          <div className="text-lg font-extrabold text-amber-600">{metrics.studioVip.toLocaleString()}</div>
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
          { id: 'STUDIO_VIP', label: '✨ STUDIO VIP (DEMO/TESTING)' },
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
                            <div className="font-bold text-fg flex items-center gap-1.5 flex-wrap">
                              <span>{cust.name}</span>
                              {cust.role === 'admin' && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-violet-100 text-violet-800">
                                  ADMIN
                                </span>
                              )}
                              {cust.hasStudioAccess && (
                                <span
                                  className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5 shadow-xs"
                                  title="Admin-granted AI Chat Studio VIP access (Demo/Testing)"
                                >
                                  <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                                  STUDIO VIP
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
                              handleToggleStudioAccess(cust);
                            }}
                            className={`p-1.5 rounded-control transition-colors ${
                              cust.hasStudioAccess
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                                : 'hover:bg-amber-50 text-muted hover:text-amber-600'
                            }`}
                            title={cust.hasStudioAccess ? 'Revoke AI Chat Studio Access' : 'Grant AI Chat Studio VIP Access'}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-white border border-border rounded-panel w-full max-w-4xl max-h-[92vh] shadow-2xl overflow-y-auto font-sans relative space-y-0 my-auto">
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

              {/* AI Chat Studio VIP Override (Demo / Testing) */}
              <div className={`p-4 rounded-panel border space-y-3 transition-all ${
                selectedCustomer.hasStudioAccess
                  ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border-amber-300 shadow-xs'
                  : 'bg-card border-border'
              }`}>
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="text-xs font-bold uppercase font-mono tracking-wider flex items-center gap-1.5 text-fg">
                    <Sparkles className={`w-4 h-4 ${selectedCustomer.hasStudioAccess ? 'text-amber-600 animate-pulse' : 'text-muted'}`} />
                    <span>AI Chat Studio VIP Override (Demo / Testing)</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      selectedCustomer.hasStudioAccess
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-subtle text-muted border border-border'
                    }`}
                  >
                    {selectedCustomer.hasStudioAccess ? '✨ VIP ACCESS ACTIVE' : 'LOCKED (PAID ONLY)'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="font-bold text-fg">
                      {selectedCustomer.hasStudioAccess
                        ? 'Customer has full, unrestricted access to the AI Chat Studio.'
                        : 'Customer is restricted from multi-turn chat, Claude Opus 5.5 / Sonnet 5.5, and multimodal vision.'}
                    </div>
                    <div className="text-[11px] text-muted font-sans">
                      {selectedCustomer.hasStudioAccess
                        ? `Granted by administrator on ${
                            selectedCustomer.studioAccessGrantedAt
                              ? new Date(selectedCustomer.studioAccessGrantedAt).toLocaleDateString()
                              : 'Admin Override'
                          }. This customer bypasses all paid subscription checks for studio chat, code debugging, and attachments.`
                        : 'Grant instant VIP studio access to this customer for demoing, debugging, or VIP evaluations without requiring a paid subscription.'}
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleStudioAccess(selectedCustomer)}
                    disabled={togglingStudio}
                    className={`px-4 py-2 rounded-control font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-sm transition-all ${
                      selectedCustomer.hasStudioAccess
                        ? 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold shadow-amber-200'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {togglingStudio
                        ? 'Updating...'
                        : selectedCustomer.hasStudioAccess
                        ? 'Revoke Studio VIP Access'
                        : '✨ Grant Studio VIP Access'}
                    </span>
                  </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-white border border-border rounded-panel w-full max-w-md shadow-2xl p-4 sm:p-6 space-y-4 font-sans my-auto max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <h3 className="text-base font-extrabold text-fg flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-600" />
                <span>{editingCustomer ? 'Edit Customer Profile' : 'Create Customer Account'}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-fg">✕</button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-control text-rose-700 text-xs shrink-0">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="space-y-3.5 text-xs font-mono overflow-y-auto flex-1 pr-1">
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

              {/* Studio VIP Access Toggle */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/90 rounded-control flex items-center justify-between">
                <div>
                  <div className="font-bold text-fg text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Grant AI Chat Studio VIP Access (Demo / Testing)</span>
                  </div>
                  <div className="text-[11px] text-muted mt-0.5">
                    Unlocks full multi-turn chat studio & vision without requiring an active paid plan.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                  <input
                    type="checkbox"
                    checked={hasStudioAccess}
                    onChange={(e) => setHasStudioAccess(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              <div className="flex gap-2 pt-2 shrink-0">
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

      {/* Issue API Key Modal (Multi-Plan & Any Provider Configurable) */}
      {showIssueKeyModal && selectedKeyCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-white border border-border rounded-panel w-full max-w-xl shadow-2xl p-4 sm:p-6 space-y-4 font-sans my-auto max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-fg flex items-center gap-2">
                  <Key className="w-5 h-5 text-violet-600" />
                  <span>Issue API Key to {selectedKeyCustomer.name}</span>
                </h3>
                <p className="text-xs text-muted font-mono mt-0.5">{selectedKeyCustomer.email}</p>
              </div>
              <button onClick={() => setShowIssueKeyModal(false)} className="text-muted hover:text-fg text-sm font-bold">✕</button>
            </div>

            {issueError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-control text-rose-700 text-xs shrink-0">
                {issueError}
              </div>
            )}

            {issuedSecretKey ? (
              <div className="space-y-4 font-mono text-xs overflow-y-auto flex-1 pr-1">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-control space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="font-bold text-emerald-900 flex items-center gap-1.5 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>API Key Issued Successfully!</span>
                    </p>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase">
                      {issuedKeyDetails?.billingType === 'credit'
                        ? '💳 Credit Wallet'
                        : issuedKeyDetails?.billingType === 'token'
                        ? '📦 Token Pack'
                        : '🔄 5h Rolling Pool'}
                    </span>
                  </div>

                  <p className="text-[11px] text-emerald-800 font-sans">
                    Copy the unmasked key below now and share it with the customer. It will not be shown again.
                  </p>

                  <div className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-xs break-all select-all font-mono font-bold tracking-wider shadow-inner">
                    {issuedSecretKey}
                  </div>

                  {issuedKeyDetails && (
                    <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-mono border-t border-emerald-200/60 text-emerald-900">
                      <div>
                        <span className="text-emerald-700/80 uppercase text-[9px] block">Provider</span>
                        <span className="font-bold">{issuedKeyDetails.providerName || 'Primary Vendor'}</span>
                      </div>
                      <div>
                        <span className="text-emerald-700/80 uppercase text-[9px] block">Allowance / Balance</span>
                        <span className="font-bold">
                          {issuedKeyDetails.billingType === 'credit'
                            ? `${Number(issuedKeyDetails.creditBalanceUsd || 0).toFixed(2)} USD`
                            : `${Number(issuedKeyDetails.tokensRemaining || 0).toLocaleString()} Tokens`}
                        </span>
                      </div>
                      <div>
                        <span className="text-emerald-700/80 uppercase text-[9px] block">Model Permissions</span>
                        <span className="font-bold uppercase">{issuedKeyDetails.allowedModelFamilies || 'all'}</span>
                      </div>
                      <div>
                        <span className="text-emerald-700/80 uppercase text-[9px] block">Status</span>
                        <span className="font-bold text-emerald-600">ACTIVE & READY</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(issuedSecretKey, 'issued_key')}
                    className="flex-1 py-2.5 rounded-control bg-violet-600 hover:bg-violet-700 text-white font-bold"
                  >
                    {copiedId === 'issued_key' ? 'Copied to Clipboard!' : 'Copy Key Secret'}
                  </button>
                  <button
                    onClick={() => {
                      setShowIssueKeyModal(false);
                      setIssuedSecretKey(null);
                      setIssuedKeyDetails(null);
                    }}
                    className="px-4 py-2.5 rounded-control bg-bg border border-border text-fg font-bold"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleIssueKeySubmit} className="space-y-4 text-xs font-mono overflow-y-auto flex-1 pr-1">
                {/* 1. Key Name */}
                <div>
                  <label className="block text-fg mb-1 font-bold uppercase text-[11px]">Key Name</label>
                  <input
                    type="text"
                    required
                    value={issueKeyName}
                    onChange={(e) => setIssueKeyName(e.target.value)}
                    placeholder="e.g. Production Key, Staging Key"
                    className="w-full bg-bg border border-border rounded-control p-2 text-xs text-fg focus:outline-none"
                  />
                </div>

                {/* 2. Billing Architecture Type Selector */}
                <div className="p-3 bg-violet-500/5 border border-violet-500/20 rounded-control space-y-2">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-violet-900">
                    Key Billing Architecture / Plan Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIssueBillingType('window');
                        setIssueKeyName(`${selectedKeyCustomer.name.split(' ')[0]}'s Production Key`);
                      }}
                      className={`p-2.5 rounded-control border text-left transition-all ${
                        issueBillingType === 'window'
                          ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                          : 'bg-bg text-fg border-border hover:bg-subtle'
                      }`}
                    >
                      <div className="font-bold text-xs">🔄 Rolling Pool</div>
                      <div className="text-[10px] opacity-80 mt-0.5">5-Hour Sliding Window</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIssueBillingType('credit');
                        setIssueKeyName(`${selectedKeyCustomer.name.split(' ')[0]}'s Credit Key`);
                        // Auto-select ScaleMax if available
                        const sm = providers.find(p => p.slug === 'scalemax');
                        if (sm) setSelectedProviderId(sm.id);
                      }}
                      className={`p-2.5 rounded-control border text-left transition-all ${
                        issueBillingType === 'credit'
                          ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                          : 'bg-bg text-fg border-border hover:bg-subtle'
                      }`}
                    >
                      <div className="font-bold text-xs">💳 Credit Wallet</div>
                      <div className="text-[10px] opacity-80 mt-0.5">$ USD Balance Deductions</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIssueBillingType('token');
                        setIssueKeyName(`${selectedKeyCustomer.name.split(' ')[0]}'s Token Pack Key`);
                        setIssuePlanId('100000000');
                      }}
                      className={`p-2.5 rounded-control border text-left transition-all ${
                        issueBillingType === 'token'
                          ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                          : 'bg-bg text-fg border-border hover:bg-subtle'
                      }`}
                    >
                      <div className="font-bold text-xs">📦 Token Pack</div>
                      <div className="text-[10px] opacity-80 mt-0.5">Consumable Lifetime Tokens</div>
                    </button>
                  </div>
                </div>

                {/* 3. Dynamic Balance / Allowance Input based on Billing Type */}
                {issueBillingType === 'credit' ? (
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-control space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-emerald-800">
                        Initial Credit Balance ($ USD)
                      </label>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold">
                        Deducted atomized per model token
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2 font-mono font-bold text-fg text-xs">$</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={issueCreditBalanceUsd}
                        onChange={(e) => setIssueCreditBalanceUsd(e.target.value)}
                        placeholder="e.g. 7.00, 15.00, 25.00, 50.00"
                        className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold bg-bg border border-border rounded-control focus:outline-none focus:border-emerald-500 text-fg"
                      />
                    </div>
                    <div className="flex gap-1.5 flex-wrap pt-1">
                      {['7.00', '15.00', '25.00', '35.00', '50.00', '100.00', '350.00'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setIssueCreditBalanceUsd(preset)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors ${
                            issueCreditBalanceUsd === preset
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-bg text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                          }`}
                        >
                          +${preset}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : issueBillingType === 'window' ? (
                  <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-control space-y-2">
                    <label className="block text-xs font-semibold text-fg">5-Hour Rolling Token Allowance</label>
                    <select
                      value={issuePlanId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setIssuePlanId(val);
                        if (val === '200000') {
                          setIssueIsTrial(true);
                          setIssueKeyName(`${selectedKeyCustomer.name.split(' ')[0]}'s Free Trial Key`);
                        } else {
                          setIssueIsTrial(false);
                          setIssueKeyName(`${selectedKeyCustomer.name.split(' ')[0]}'s Production Key`);
                        }
                      }}
                      className="w-full bg-bg border border-border rounded-control p-2 text-xs text-fg focus:outline-none font-mono"
                    >
                      <option value="1000000">1 Million Tokens (1M / 5h Window)</option>
                      <option value="5000000">5 Million Tokens (MAX 5X — 5M / 5h Window)</option>
                      <option value="10000000">10 Million Tokens (MAX 10X — 10M / 5h Window)</option>
                      <option value="20000000">20 Million Tokens (MAX 20X — 20M / 5h Window)</option>
                      <option value="40000000">40 Million Tokens (MAX 40X — 40M / 5h Window)</option>
                      <option value="50000000">50 Million Tokens (MAX 50X — 50M / 5h Window)</option>
                      <option value="100000000">100 Million Tokens (MAX 100x — 100M / 5h Window)</option>
                      <option value="200000">200,000 Tokens (Free Trial Pass)</option>
                      <option value="custom">Custom Token Allowance...</option>
                    </select>

                    {issuePlanId === 'custom' && (
                      <div>
                        <label className="block text-muted mb-1 font-bold uppercase text-[10px]">Custom Token Count</label>
                        <input
                          type="number"
                          required
                          value={customTokens}
                          onChange={(e) => setCustomTokens(e.target.value)}
                          placeholder="e.g. 20000000 for 20 Million Tokens"
                          className="w-full bg-bg border border-border rounded-control p-2 text-xs text-fg focus:outline-none font-mono"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-control space-y-2">
                    <label className="block text-xs font-semibold text-fg">Consumable Lifetime Token Quota</label>
                    <select
                      value={issuePlanId}
                      onChange={(e) => setIssuePlanId(e.target.value)}
                      className="w-full bg-bg border border-border rounded-control p-2 text-xs text-fg focus:outline-none font-mono"
                    >
                      <option value="10000000">10 Million Tokens (10M Lifetime Pack)</option>
                      <option value="50000000">50 Million Tokens (50M Lifetime Pack)</option>
                      <option value="100000000">100 Million Tokens (100M Lifetime Pack)</option>
                      <option value="500000000">500 Million Tokens (500M Lifetime Pack)</option>
                      <option value="1000000000">1 Billion Tokens (1B Lifetime Pack)</option>
                      <option value="custom">Custom Token Allowance...</option>
                    </select>

                    {issuePlanId === 'custom' && (
                      <div>
                        <label className="block text-muted mb-1 font-bold uppercase text-[10px]">Custom Lifetime Tokens</label>
                        <input
                          type="number"
                          required
                          value={customTokens}
                          onChange={(e) => setCustomTokens(e.target.value)}
                          placeholder="e.g. 100000000 for 100 Million Tokens"
                          className="w-full bg-bg border border-border rounded-control p-2 text-xs text-fg focus:outline-none font-mono"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Upstream Vendor Provider */}
                <div>
                  <label className="block text-fg mb-1 font-bold uppercase text-[11px]">Upstream Vendor Provider</label>
                  <select
                    value={selectedProviderId}
                    onChange={(e) => setSelectedProviderId(e.target.value)}
                    className="w-full bg-bg border border-border rounded-control p-2 text-xs text-fg focus:outline-none font-mono"
                  >
                    <option value="">System Default / Primary Vendor (Opus Max)</option>
                    {providers.filter((p) => p.status !== 'disabled').map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.status === 'connected' ? 'Connected' : p.status}) {p.isPrimary ? '★ Primary' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-muted mt-0.5">
                    Directly binds this key to the selected upstream vendor (ScaleMax, Opus Max, LotusAI).
                  </p>
                </div>

                {/* 5. Ecosystem & Model Scope Permissions */}
                <div>
                  <label className="block text-fg mb-1 font-bold uppercase text-[11px]">Ecosystem & Model Permissions</label>
                  <select
                    value={issueModelScope}
                    onChange={(e) => setIssueModelScope(e.target.value as any)}
                    className="w-full bg-bg border border-border rounded-control p-2 text-xs text-fg focus:outline-none font-mono"
                  >
                    <option value="all">Universal (All Models: Claude, OpenAI, Local Models)</option>
                    <option value="claude">Claude Frontier Only (Sonnet 5.5, Opus 5.5, Sonnet 5, Fable 5.1)</option>
                    <option value="openai">OpenAI Frontier Only (GPT-4o, o1, o3-mini, GPT-4.5)</option>
                    <option value="local">Local Models Only (DeepSeek V3/R1, Grok, Qwen, GLM)</option>
                  </select>
                  <p className="text-[10px] text-muted mt-0.5">
                    Enforces gateway permission boundary. Requests to unauthorized families are blocked.
                  </p>
                </div>

                {/* 6. Key Prefix & Key Type (2 Columns) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-fg mb-1 font-bold uppercase text-[11px]">Key Prefix</label>
                    <select
                      value={issueKeyPrefix}
                      onChange={(e) => setIssueKeyPrefix(e.target.value)}
                      className="w-full bg-bg border border-border rounded-control p-2 text-xs text-fg focus:outline-none font-mono"
                    >
                      <option value="sk_live_">sk_live_ (Standard)</option>
                      <option value="ld_live_">ld_live_ (Lightning Deals)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-fg mb-1 font-bold uppercase text-[11px]">Key Mode</label>
                    <select
                      value={issueIsTrial ? 'trial' : 'production'}
                      onChange={(e) => setIssueIsTrial(e.target.value === 'trial')}
                      className="w-full bg-bg border border-border rounded-control p-2 text-xs text-fg focus:outline-none font-mono"
                    >
                      <option value="production">Production Key</option>
                      <option value="trial">Free Trial Key</option>
                    </select>
                  </div>
                </div>

                {/* 7. Rate Limits & Expiry (2 Columns) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-fg mb-1 font-bold uppercase text-[11px]">Rate Limit (RPM)</label>
                    <input
                      type="number"
                      value={issueRpm}
                      onChange={(e) => setIssueRpm(e.target.value)}
                      className="w-full bg-bg border border-border rounded-control p-2 text-xs text-fg focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-fg mb-1 font-bold uppercase text-[11px]">Validity / Expiry</label>
                    <select
                      value={issueExpiryDays}
                      onChange={(e) => setIssueExpiryDays(e.target.value)}
                      className="w-full bg-bg border border-border rounded-control p-2 text-xs text-fg focus:outline-none font-mono"
                    >
                      <option value="">Never (Lifetime)</option>
                      <option value="7">7 Days</option>
                      <option value="30">30 Days</option>
                      <option value="90">90 Days</option>
                      <option value="365">365 Days (1 Year)</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 shrink-0">
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
                    className="flex-1 py-2.5 rounded-control bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {issueSubmitting ? 'Provisioning Key...' : 'Issue Key Now'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Adjust Token Allowance Modal */}
      {showAdjustTokensModal && adjustCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-white border border-border rounded-panel w-full max-w-md shadow-2xl p-4 sm:p-6 space-y-4 font-sans my-auto max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <h3 className="text-base font-extrabold text-fg flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-600" />
                <span>Adjust Token Balance for {adjustCustomer.name}</span>
              </h3>
              <button onClick={() => setShowAdjustTokensModal(false)} className="text-muted hover:text-fg">✕</button>
            </div>

            {adjustError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-control text-rose-700 text-xs shrink-0">
                {adjustError}
              </div>
            )}

            <form onSubmit={handleAdjustTokensSubmit} className="space-y-3.5 text-xs font-mono overflow-y-auto flex-1 pr-1">
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

              <div className="flex gap-2 pt-2 shrink-0">
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
