import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'lightningdeals_secret_jwt_key_2026';

export interface PageviewHit {
  id: string;
  sessionId: string;
  userName: string;
  userEmail: string;
  isLoggedIn: boolean;
  path: string;
  referrer: string;
  device: string;
  browser: string;
  country: string;
  countryCode: string;
  city: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
}

// In-memory sliding window for ultra-fast realtime analytics (last 60 minutes)
const MAX_REALTIME_BUFFER = 2000;
const pageviewBuffer: PageviewHit[] = [];

function parseDevice(ua: string = ''): string {
  const userAgent = ua.toLowerCase();
  if (/mobile|iphone|android.*mobile|windows phone/i.test(userAgent)) return 'Mobile';
  if (/ipad|tablet|android(?!.*mobile)/i.test(userAgent)) return 'Tablet';
  return 'Desktop';
}

function parseBrowser(ua: string = ''): string {
  const userAgent = ua.toLowerCase();
  if (userAgent.includes('edg/')) return 'Edge';
  if (userAgent.includes('chrome/')) return 'Chrome';
  if (userAgent.includes('safari/') && !userAgent.includes('chrome/')) return 'Safari';
  if (userAgent.includes('firefox/')) return 'Firefox';
  return 'Other Browser';
}

function parseCountry(req: Request): { name: string; code: string } {
  const cfCountry = req.headers['cf-ipcountry']?.toString();
  const vercelCountry = req.headers['x-vercel-ip-country']?.toString();
  const countryHeader = req.headers['x-country']?.toString();

  const code = (cfCountry || vercelCountry || countryHeader || 'US').toUpperCase();
  
  const countryMap: Record<string, string> = {
    US: 'United States',
    IN: 'India',
    GB: 'United Kingdom',
    DE: 'Germany',
    CA: 'Canada',
    FR: 'France',
    AU: 'Australia',
    JP: 'Japan',
    SG: 'Singapore',
    BR: 'Brazil',
    NL: 'Netherlands',
  };

  return {
    code,
    name: countryMap[code] || code,
  };
}

function parseReferrer(rawReferrer: string = ''): string {
  if (!rawReferrer) return 'Direct Navigation';
  const ref = rawReferrer.toLowerCase();
  if (ref.includes('google.')) return 'Google Search';
  if (ref.includes('wa.me') || ref.includes('whatsapp')) return 'WhatsApp Support';
  if (ref.includes('twitter.com') || ref.includes('x.com') || ref.includes('t.co')) return 'Twitter / X';
  if (ref.includes('github.com')) return 'GitHub';
  if (ref.includes('linkedin.com')) return 'LinkedIn';
  if (ref.includes('reddit.com')) return 'Reddit';
  try {
    const url = new URL(rawReferrer);
    return url.hostname.replace('www.', '');
  } catch {
    return 'External Referral';
  }
}

function extractUserInfoFromReq(req: Request): { userName: string; userEmail: string; isLoggedIn: boolean } {
  const authHeader = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  // @ts-ignore
  const token = authHeader || req.cookies?.ld_token;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { email?: string; name?: string };
      if (decoded && decoded.email) {
        return {
          userName: decoded.name || decoded.email.split('@')[0],
          userEmail: decoded.email,
          isLoggedIn: true,
        };
      }
    } catch {
      // Ignored if expired or anonymous
    }
  }

  return {
    userName: 'Anonymous Web Visitor',
    userEmail: 'Unauthenticated Public Browsing',
    isLoggedIn: false,
  };
}

// Middleware to record real-time page views
export function recordPageview(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/assets') && !req.path.includes('.')) {
    const ua = req.headers['user-agent'] || '';
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const countryInfo = parseCountry(req);
    // Deduplicate by IP and primary OS/device type to match GA4 user counting
    const deviceType = parseDevice(ua);
    const sessionHash = `sess_${crypto.createHash('md5').update(`${ip}-${deviceType}`).digest('hex').substring(0, 8)}`;
    const userInfo = extractUserInfoFromReq(req);

    const hit: PageviewHit = {
      id: `hit_${crypto.randomUUID().substring(0, 8)}`,
      sessionId: sessionHash,
      userName: userInfo.userName,
      userEmail: userInfo.userEmail,
      isLoggedIn: userInfo.isLoggedIn,
      path: req.path || '/',
      referrer: parseReferrer(req.headers['referer']?.toString() || req.headers['referrer']?.toString() || ''),
      device: parseDevice(ua),
      browser: parseBrowser(ua),
      country: countryInfo.name,
      countryCode: countryInfo.code,
      city: req.headers['x-city']?.toString() || 'Metropolitan Area',
      ip,
      userAgent: ua,
      timestamp: new Date(),
    };

    pageviewBuffer.unshift(hit);
    if (pageviewBuffer.length > MAX_REALTIME_BUFFER) {
      pageviewBuffer.pop();
    }
  }
  next();
}

// Handle Client Beacon Ping POST /api/analytics/beacon
export function handleAnalyticsBeacon(req: Request, res: Response) {
  try {
    const { path, referrer, userAgent } = req.body || {};
    const ua = userAgent || req.headers['user-agent'] || '';
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const countryInfo = parseCountry(req);
    // Deduplicate by IP and primary OS/device type to match GA4 user counting
    const deviceType = parseDevice(ua);
    const sessionHash = `sess_${crypto.createHash('md5').update(`${ip}-${deviceType}`).digest('hex').substring(0, 8)}`;
    const userInfo = extractUserInfoFromReq(req);

    const hit: PageviewHit = {
      id: `hit_${crypto.randomUUID().substring(0, 8)}`,
      sessionId: sessionHash,
      userName: userInfo.userName,
      userEmail: userInfo.userEmail,
      isLoggedIn: userInfo.isLoggedIn,
      path: path || '/',
      referrer: parseReferrer(referrer || req.headers['referer']?.toString() || ''),
      device: parseDevice(ua),
      browser: parseBrowser(ua),
      country: countryInfo.name,
      countryCode: countryInfo.code,
      city: req.headers['x-city']?.toString() || 'Metropolitan Area',
      ip,
      userAgent: ua,
      timestamp: new Date(),
    };

    pageviewBuffer.unshift(hit);
    if (pageviewBuffer.length > MAX_REALTIME_BUFFER) {
      pageviewBuffer.pop();
    }

    res.status(204).end();
  } catch (e) {
    res.status(200).json({ ok: true });
  }
}

// Aggregate Realtime Analytics Report with Detailed Active Visitor Roster
export function getRealtimeAnalyticsReport() {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

  // Active in last 5 minutes (Live Users Right Now)
  const activeHits5m = pageviewBuffer.filter(h => h.timestamp >= fiveMinutesAgo);

  // Group active hits into distinct visitor sessions
  const activeSessionMap: Record<string, {
    sessionId: string;
    userName: string;
    userEmail: string;
    isLoggedIn: boolean;
    ip: string;
    currentPath: string;
    referrer: string;
    device: string;
    browser: string;
    country: string;
    countryCode: string;
    city: string;
    firstSeenAt: Date;
    lastSeenAt: Date;
    pageviewsCount: number;
  }> = {};

  activeHits5m.forEach(hit => {
    if (!activeSessionMap[hit.sessionId]) {
      activeSessionMap[hit.sessionId] = {
        sessionId: hit.sessionId,
        userName: hit.userName,
        userEmail: hit.userEmail,
        isLoggedIn: hit.isLoggedIn,
        ip: hit.ip,
        currentPath: hit.path,
        referrer: hit.referrer,
        device: `${hit.browser} on ${hit.device}`,
        browser: hit.browser,
        country: hit.country,
        countryCode: hit.countryCode,
        city: hit.city,
        firstSeenAt: hit.timestamp,
        lastSeenAt: hit.timestamp,
        pageviewsCount: 1,
      };
    } else {
      activeSessionMap[hit.sessionId].pageviewsCount += 1;
      if (hit.timestamp > activeSessionMap[hit.sessionId].lastSeenAt) {
        activeSessionMap[hit.sessionId].lastSeenAt = hit.timestamp;
        activeSessionMap[hit.sessionId].currentPath = hit.path;
      }
    }
  });

  const activeVisitorsList = Object.values(activeSessionMap)
    .sort((a, b) => b.lastSeenAt.getTime() - a.lastSeenAt.getTime())
    .map(v => ({
      ...v,
      firstSeenAt: v.firstSeenAt.toISOString(),
      lastSeenAt: v.lastSeenAt.toISOString(),
    }));

  // Active in last 30 minutes
  const activeHits30m = pageviewBuffer.filter(h => h.timestamp >= thirtyMinutesAgo);
  const activeUsers30m = new Set(activeHits30m.map(h => h.sessionId)).size;

  // Top Pages in last 30 minutes
  const pageMap: Record<string, { activeNow: number; totalViews: number }> = {};
  const coreRoutes = ['/', '/pricing', '/docs', '/models', '/check-key', '/status', '/trial'];
  coreRoutes.forEach(route => {
    pageMap[route] = { activeNow: 0, totalViews: 0 };
  });

  activeHits30m.forEach(h => {
    if (!pageMap[h.path]) pageMap[h.path] = { activeNow: 0, totalViews: 0 };
    pageMap[h.path].totalViews += 1;
  });

  activeHits5m.forEach(h => {
    if (pageMap[h.path]) {
      pageMap[h.path].activeNow += 1;
    }
  });

  const topPages = Object.entries(pageMap)
    .map(([path, data]) => ({
      path,
      title: getPathTitle(path),
      activeNow: data.activeNow,
      viewsToday: data.totalViews,
    }))
    .sort((a, b) => b.activeNow - a.activeNow || b.viewsToday - a.viewsToday);

  // Country Breakdown
  const countryCounts: Record<string, { name: string; count: number }> = {};
  activeHits30m.forEach(h => {
    if (!countryCounts[h.countryCode]) {
      countryCounts[h.countryCode] = { name: h.country, count: 0 };
    }
    countryCounts[h.countryCode].count += 1;
  });

  const totalCountryHits = activeHits30m.length || 1;
  const countryBreakdown = Object.entries(countryCounts)
    .map(([code, d]) => ({
      code,
      name: d.name,
      count: d.count,
      percentage: Number(((d.count / totalCountryHits) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count);

  // Device Breakdown
  const deviceCounts: Record<string, number> = { Desktop: 0, Mobile: 0, Tablet: 0 };
  activeHits30m.forEach(h => {
    deviceCounts[h.device] = (deviceCounts[h.device] || 0) + 1;
  });
  const totalDeviceHits = activeHits30m.length || 1;
  const deviceBreakdown = Object.entries(deviceCounts).map(([device, count]) => ({
    device,
    count,
    percentage: Number(((count / totalDeviceHits) * 100).toFixed(1)),
  }));

  // Traffic Sources
  const sourceCounts: Record<string, number> = {};
  activeHits30m.forEach(h => {
    sourceCounts[h.referrer] = (sourceCounts[h.referrer] || 0) + 1;
  });
  const totalSourceHits = activeHits30m.length || 1;
  const trafficSources = Object.entries(sourceCounts)
    .map(([source, count]) => ({
      source,
      count,
      percentage: Number(((count / totalSourceHits) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    gaPropertyId: '15440382173',
    measurementId: 'G-GBRR7YHWVM',
    status: 'ACTIVE_REALTIME_STREAM',
    liveActiveUsers: activeVisitorsList.length,
    activeUsers30m,
    totalHitsToday: pageviewBuffer.length,
    activeVisitorsList,
    topPages,
    countryBreakdown,
    deviceBreakdown,
    trafficSources,
    liveFeed: pageviewBuffer.slice(0, 15),
  };
}

function getPathTitle(p: string): string {
  switch (p) {
    case '/': return 'Homepage — Claude AI Gateway';
    case '/pricing': return 'Prepaid Token Packages & Pricing';
    case '/docs': return 'Developer Setup & Integration Guide';
    case '/models': return 'Supported Models Catalog';
    case '/status': return 'Live System Status & Health';
    case '/check-key': return 'Check API Key Status & Logs';
    case '/trial': return 'Claim 1M Token Free Trial';
    case '/request-quote': return 'Enterprise Quote Request';
    default: return p;
  }
}
