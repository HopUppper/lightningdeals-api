import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Globe, 
  Users, 
  Eye, 
  RefreshCw, 
  Smartphone, 
  Monitor, 
  Tablet, 
  ExternalLink, 
  CheckCircle2, 
  Zap, 
  Clock, 
  ShieldCheck, 
  Layers, 
  TrendingUp, 
  Sparkles,
  ArrowUpRight,
  Radio
} from 'lucide-react';
import { adminFetch } from '../../utils/api';

interface TopPage {
  path: string;
  title: string;
  activeNow: number;
  viewsToday: number;
}

interface CountryData {
  code: string;
  name: string;
  count: number;
  percentage: number;
}

interface DeviceData {
  device: string;
  count: number;
  percentage: number;
}

interface TrafficSource {
  source: string;
  count: number;
  percentage: number;
}

interface LiveFeedHit {
  id: string;
  sessionId: string;
  path: string;
  referrer: string;
  device: string;
  country: string;
  countryCode: string;
  timestamp: string;
}

interface AnalyticsData {
  gaPropertyId: string;
  measurementId: string;
  status: string;
  liveActiveUsers: number;
  activeUsers30m: number;
  totalHitsToday: number;
  velocity: { minute: string; hits: number }[];
  topPages: TopPage[];
  countryBreakdown: CountryData[];
  deviceBreakdown: DeviceData[];
  trafficSources: TrafficSource[];
  liveFeed: LiveFeedHit[];
}

export const AdminAnalytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(5000); // 5s default
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAnalytics = async (showPulse = true) => {
    if (showPulse) setIsRefreshing(true);
    try {
      const res = await adminFetch('/api/admin/analytics/realtime');
      if (!res.ok) throw new Error('Failed to load realtime analytics data');
      const json = await res.json();
      setData(json);
      setError(null);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error connecting to analytics engine');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(false);

    if (autoRefreshInterval > 0) {
      const timer = setInterval(() => {
        fetchAnalytics(true);
      }, autoRefreshInterval);
      return () => clearInterval(timer);
    }
  }, [autoRefreshInterval]);

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile': return <Smartphone className="w-4 h-4 text-emerald-500" />;
      case 'tablet': return <Tablet className="w-4 h-4 text-amber-500" />;
      default: return <Monitor className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Live Stream Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-violet-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-mono font-bold text-emerald-600 tracking-wider uppercase bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Live Google Analytics & Web Telemetry
            </span>
          </div>
          <h1 className="text-2xl font-black text-fg tracking-tight flex items-center gap-2">
            Realtime Traffic & User Analytics
          </h1>
          <p className="text-xs text-muted mt-1 font-mono">
            Synced with GA4 Tag <span className="font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">{data?.measurementId || 'G-GBRR7YHWVM'}</span> • Property ID: <span className="font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">{data?.gaPropertyId || '15440382173'}</span>
          </p>
        </div>

        {/* Auto Refresh & Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl p-1 text-xs">
            <span className="text-[11px] font-medium text-slate-500 px-2 font-mono">Auto-Refresh:</span>
            {[
              { label: '5s', val: 5000 },
              { label: '10s', val: 10000 },
              { label: '30s', val: 30000 },
              { label: 'Pause', val: 0 },
            ].map(opt => (
              <button
                key={opt.val}
                onClick={() => setAutoRefreshInterval(opt.val)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  autoRefreshInterval === opt.val
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchAnalytics(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold border border-violet-200 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono">
          ⚠️ {error}
        </div>
      )}

      {/* Primary Real-Time Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Active Users Right Now */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-indigo-900/40 shadow-xl group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Radio className="w-24 h-24 text-emerald-400" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-300 font-mono tracking-wider uppercase flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              Active Users Right Now
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              REALTIME (5M)
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-5xl font-black tracking-tight text-white font-mono">
              {loading ? '...' : data?.liveActiveUsers || 1}
            </div>
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Online
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-mono">
            Active visitors browsing LightningDeals pages
          </p>
        </div>

        {/* Card 2: Active Users (30 Mins) */}
        <div className="bg-white p-6 rounded-3xl border border-violet-100 shadow-sm hover:border-violet-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-muted font-mono tracking-wider uppercase">
              30-Min Active Sessions
            </span>
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-4xl font-black text-fg font-mono">
            {loading ? '...' : data?.activeUsers30m || 1}
          </div>
          <p className="text-[11px] text-muted mt-2 font-mono">
            Unique sessions in past 30 minutes
          </p>
        </div>

        {/* Card 3: Total Page Views */}
        <div className="bg-white p-6 rounded-3xl border border-violet-100 shadow-sm hover:border-violet-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-muted font-mono tracking-wider uppercase">
              Total Pageviews Captured
            </span>
            <div className="p-2 bg-violet-50 rounded-xl text-violet-600">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-4xl font-black text-fg font-mono">
            {loading ? '...' : data?.totalHitsToday || 0}
          </div>
          <p className="text-[11px] text-muted mt-2 font-mono">
            Buffered client & server navigation hits
          </p>
        </div>

        {/* Card 4: Stream Status */}
        <div className="bg-white p-6 rounded-3xl border border-violet-100 shadow-sm hover:border-violet-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-muted font-mono tracking-wider uppercase">
              GA4 Stream Status
            </span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold text-emerald-600 font-mono">HEALTHY</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-[11px] text-muted mt-2 font-mono">
            Updated at {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Main Content Grid: Top Pages & Geo Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Active Top Pages Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-violet-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-fg flex items-center gap-2">
                <Layers className="w-5 h-5 text-violet-600" /> Top Pages Viewed Live
              </h2>
              <p className="text-xs text-muted font-mono mt-0.5">
                Real-time active viewers by URL path
              </p>
            </div>
            <a
              href="https://analytics.google.com/"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 bg-violet-50 px-3 py-1.5 rounded-xl border border-violet-100 transition-all"
            >
              Open GA4 Dashboard <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 pl-2">Page Path</th>
                  <th className="pb-3">Title / Description</th>
                  <th className="pb-3 text-center">Active Now</th>
                  <th className="pb-3 text-right pr-2">Views (30m)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.topPages.map((page) => (
                  <tr key={page.path} className="hover:bg-violet-50/40 transition-colors">
                    <td className="py-3.5 pl-2 font-bold text-violet-700">
                      {page.path}
                    </td>
                    <td className="py-3.5 text-slate-600 font-sans">
                      {page.title}
                    </td>
                    <td className="py-3.5 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {page.activeNow}
                      </span>
                    </td>
                    <td className="py-3.5 text-right pr-2 font-bold text-slate-800">
                      {page.viewsToday}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (1 Col): Geographic & Country Breakdown */}
        <div className="bg-white rounded-3xl border border-violet-100 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-fg flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600" /> Geographic Visitors
            </h2>
            <p className="text-xs text-muted font-mono mt-0.5">
              Live traffic by country origin
            </p>
          </div>

          <div className="space-y-4">
            {data?.countryBreakdown.map((country) => (
              <div key={country.code} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-slate-700 flex items-center gap-2">
                    <span className="text-sm">{getCountryEmoji(country.code)}</span> {country.name}
                  </span>
                  <span className="text-muted font-semibold">
                    {country.count} ({country.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-violet-600 to-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(country.percentage, 5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Row: Devices, Traffic Sources & Real-Time Feed Log */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Device Breakdown */}
        <div className="bg-white rounded-3xl border border-violet-100 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-fg flex items-center gap-2">
            <Monitor className="w-4 h-4 text-violet-600" /> Device Distribution
          </h3>
          <div className="space-y-3">
            {data?.deviceBreakdown.map(dev => (
              <div key={dev.device} className="flex items-center justify-between text-xs font-mono p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  {getDeviceIcon(dev.device)}
                  <span className="font-bold text-slate-700">{dev.device}</span>
                </div>
                <span className="font-bold text-violet-600">{dev.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white rounded-3xl border border-violet-100 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-fg flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-indigo-600" /> Referral & Traffic Sources
          </h3>
          <div className="space-y-3">
            {data?.trafficSources.map(src => (
              <div key={src.source} className="flex items-center justify-between text-xs font-mono p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-700">{src.source}</span>
                <span className="font-bold text-indigo-600">{src.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Activity Stream Feed */}
        <div className="bg-white rounded-3xl border border-violet-100 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-fg flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" /> Stream Activity Feed
          </h3>
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {data?.liveFeed && data.liveFeed.length > 0 ? (
              data.liveFeed.map(hit => (
                <div key={hit.id} className="text-[11px] font-mono p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-violet-700">{hit.path}</span>
                    <span className="text-slate-400 ml-1.5">({hit.country})</span>
                  </div>
                  <span className="text-slate-400 text-[10px]">
                    {new Date(hit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted text-center py-6 font-mono">
                Listening for real-time traffic...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function getCountryEmoji(code: string): string {
  if (!code || code.length !== 2) return '🌐';
  const charCodeA = code.toUpperCase().charCodeAt(0) + 127397;
  const charCodeB = code.toUpperCase().charCodeAt(1) + 127397;
  return String.fromCodePoint(charCodeA, charCodeB);
}

export default AdminAnalytics;
