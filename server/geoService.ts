import { Request } from 'express';
import geoip from 'geoip-lite';

export interface GeoLocationResult {
  ip: string;
  city: string;
  region: string; // State / Province
  country: string;
  countryCode: string;
  timezone: string;
  userAgent?: string;
  org?: string;
  flag: string;
  isPrivate?: boolean;
}

const geoCache = new Map<string, GeoLocationResult>();

const INDIAN_STATES: Record<string, string> = {
  AN: 'Andaman and Nicobar Islands',
  AP: 'Andhra Pradesh',
  AR: 'Arunachal Pradesh',
  AS: 'Assam',
  BR: 'Bihar',
  CH: 'Chandigarh',
  CT: 'Chhattisgarh',
  CG: 'Chhattisgarh',
  DL: 'Delhi',
  DN: 'Dadra and Nagar Haveli',
  GA: 'Goa',
  GJ: 'Gujarat',
  HP: 'Himachal Pradesh',
  HR: 'Haryana',
  JH: 'Jharkhand',
  JK: 'Jammu and Kashmir',
  KA: 'Karnataka',
  KL: 'Kerala',
  LA: 'Ladakh',
  LD: 'Lakshadweep',
  MH: 'Maharashtra',
  ML: 'Meghalaya',
  MN: 'Manipur',
  MP: 'Madhya Pradesh',
  MZ: 'Mizoram',
  NL: 'Nagaland',
  OD: 'Odisha',
  OR: 'Odisha',
  PB: 'Punjab',
  PY: 'Puducherry',
  RJ: 'Rajasthan',
  SK: 'Sikkim',
  TG: 'Telangana',
  TS: 'Telangana',
  TN: 'Tamil Nadu',
  TR: 'Tripura',
  UP: 'Uttar Pradesh',
  UK: 'Uttarakhand',
  UT: 'Uttarakhand',
  WB: 'West Bengal',
};

const COUNTRY_FLAGS: Record<string, string> = {
  IN: '🇮🇳',
  US: '🇺🇸',
  GB: '🇬🇧',
  SG: '🇸🇬',
  AE: '🇦🇪',
  DE: '🇩🇪',
  CA: '🇨🇦',
  AU: '🇦🇺',
  FR: '🇫🇷',
  JP: '🇯🇵',
  NL: '🇳🇱',
  BR: '🇧🇷',
  CH: '🇨🇭',
  RU: '🇷🇺',
  CN: '🇨🇳',
};

export function extractClientIp(req: Request): string {
  const cfConnectingIp = req.headers['cf-connecting-ip']?.toString();
  if (cfConnectingIp) return cfConnectingIp.trim();

  const xRealIp = req.headers['x-real-ip']?.toString();
  if (xRealIp) return xRealIp.trim();

  const xForwardedFor = req.headers['x-forwarded-for']?.toString();
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',').map((s) => s.trim());
    for (const candidate of ips) {
      if (candidate && !candidate.startsWith('127.') && !candidate.startsWith('10.') && !candidate.startsWith('192.168.') && !candidate.startsWith('172.16.')) {
        return candidate;
      }
    }
    return ips[0];
  }

  return (req.socket.remoteAddress || req.ip || '127.0.0.1').replace(/^::ffff:/, '').trim();
}

export function parseDeviceSummary(userAgent?: string): string {
  if (!userAgent) return 'Web Client';
  const ua = userAgent.toLowerCase();

  let browser = 'Browser';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome/')) browser = 'Chrome';
  else if (ua.includes('safari/') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('firefox/')) browser = 'Firefox';
  else if (ua.includes('postman')) browser = 'Postman API';
  else if (ua.includes('curl/')) browser = 'cURL CLI';

  let os = 'OS';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('linux')) os = 'Linux';

  return `${browser} on ${os}`;
}

export function isPrivateIp(ip: string): boolean {
  const cleanIp = (ip || '').replace(/^::ffff:/, '').trim();
  return (
    !cleanIp ||
    cleanIp === '127.0.0.1' ||
    cleanIp === 'localhost' ||
    cleanIp === '::1' ||
    cleanIp.startsWith('10.') ||
    cleanIp.startsWith('192.168.') ||
    cleanIp.startsWith('172.16.') ||
    cleanIp.startsWith('172.17.') ||
    cleanIp.startsWith('172.18.') ||
    cleanIp.startsWith('172.19.') ||
    cleanIp.startsWith('172.2') ||
    cleanIp.startsWith('172.3') ||
    cleanIp.startsWith('169.254.')
  );
}

/**
 * Real, accurate IP Geolocation lookup
 */
export async function resolveRealIpLocation(ip: string, req?: Request): Promise<GeoLocationResult> {
  const cleanIp = (ip || '127.0.0.1').replace(/^::ffff:/, '').trim();

  // 1. Private / Local IP
  if (isPrivateIp(cleanIp)) {
    return {
      ip: cleanIp,
      city: 'Localhost',
      region: 'Development',
      country: 'Private Network',
      countryCode: 'DEV',
      timezone: 'Asia/Kolkata',
      userAgent: req ? parseDeviceSummary(req.headers['user-agent']?.toString()) : 'Local Machine',
      flag: '💻',
      isPrivate: true,
    };
  }

  // 2. Check Cache
  if (geoCache.has(cleanIp)) {
    const cached = geoCache.get(cleanIp)!;
    if (req) cached.userAgent = parseDeviceSummary(req.headers['user-agent']?.toString());
    return cached;
  }

  // 3. Live High-Accuracy IP-API Lookup
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(
      `http://ip-api.com/json/${cleanIp}?fields=status,message,country,countryCode,region,regionName,city,zip,timezone,isp,org`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        const countryCode = data.countryCode || 'IN';
        let regionName = data.regionName || '';
        if (countryCode === 'IN' && INDIAN_STATES[data.region?.toUpperCase()]) {
          regionName = INDIAN_STATES[data.region.toUpperCase()];
        }

        const result: GeoLocationResult = {
          ip: cleanIp,
          city: data.city || 'Unknown City',
          region: regionName || data.region || 'Unknown Region',
          country: data.country || 'India',
          countryCode,
          timezone: data.timezone || 'Asia/Kolkata',
          userAgent: req ? parseDeviceSummary(req.headers['user-agent']?.toString()) : undefined,
          org: data.isp || data.org || undefined,
          flag: COUNTRY_FLAGS[countryCode.toUpperCase()] || '🌐',
          isPrivate: false,
        };

        geoCache.set(cleanIp, result);
        return result;
      }
    }
  } catch (err) {
    // Network timeout, proceed to offline geoip-lite fallback
  }

  // 4. Offline geoip-lite fallback
  try {
    const geo = geoip.lookup(cleanIp);
    if (geo) {
      const countryCode = geo.country?.toUpperCase() || 'IN';
      let regionName = geo.region || '';
      if (countryCode === 'IN' && INDIAN_STATES[geo.region?.toUpperCase()]) {
        regionName = INDIAN_STATES[geo.region.toUpperCase()];
      }

      const result: GeoLocationResult = {
        ip: cleanIp,
        city: geo.city || '',
        region: regionName || geo.region || '',
        country: countryCode === 'IN' ? 'India' : countryCode === 'US' ? 'United States' : geo.country || 'Unknown',
        countryCode,
        timezone: geo.timezone || 'Asia/Kolkata',
        userAgent: req ? parseDeviceSummary(req.headers['user-agent']?.toString()) : undefined,
        flag: COUNTRY_FLAGS[countryCode] || '🌐',
        isPrivate: false,
      };

      geoCache.set(cleanIp, result);
      return result;
    }
  } catch (err) {
    // fallback below
  }

  const fallback: GeoLocationResult = {
    ip: cleanIp,
    city: 'Location Pending',
    region: 'Region Pending',
    country: 'India',
    countryCode: 'IN',
    timezone: 'Asia/Kolkata',
    userAgent: req ? parseDeviceSummary(req.headers['user-agent']?.toString()) : undefined,
    flag: '🇮🇳',
    isPrivate: false,
  };
  return fallback;
}

// Synchronous fast fallback wrapper
export function resolveIpLocation(ip: string, req?: Request): GeoLocationResult {
  const cleanIp = (ip || '127.0.0.1').replace(/^::ffff:/, '').trim();

  if (isPrivateIp(cleanIp)) {
    return {
      ip: cleanIp,
      city: 'Localhost',
      region: 'Development',
      country: 'Private Network',
      countryCode: 'DEV',
      timezone: 'Asia/Kolkata',
      userAgent: req ? parseDeviceSummary(req.headers['user-agent']?.toString()) : 'Local Machine',
      flag: '💻',
      isPrivate: true,
    };
  }

  if (geoCache.has(cleanIp)) {
    return geoCache.get(cleanIp)!;
  }

  // Trigger background real lookup to populate cache
  resolveRealIpLocation(cleanIp, req).catch(() => {});

  try {
    const geo = geoip.lookup(cleanIp);
    if (geo) {
      const countryCode = geo.country?.toUpperCase() || 'IN';
      let regionName = geo.region || '';
      if (countryCode === 'IN' && INDIAN_STATES[geo.region?.toUpperCase()]) {
        regionName = INDIAN_STATES[geo.region.toUpperCase()];
      }

      return {
        ip: cleanIp,
        city: geo.city || '',
        region: regionName || geo.region || '',
        country: countryCode === 'IN' ? 'India' : countryCode === 'US' ? 'United States' : geo.country || '',
        countryCode,
        timezone: geo.timezone || 'Asia/Kolkata',
        userAgent: req ? parseDeviceSummary(req.headers['user-agent']?.toString()) : undefined,
        flag: COUNTRY_FLAGS[countryCode] || '🌐',
        isPrivate: false,
      };
    }
  } catch {}

  return {
    ip: cleanIp,
    city: 'Location Pending',
    region: 'Region Pending',
    country: 'India',
    countryCode: 'IN',
    timezone: 'Asia/Kolkata',
    userAgent: req ? parseDeviceSummary(req.headers['user-agent']?.toString()) : undefined,
    flag: '🇮🇳',
    isPrivate: false,
  };
}
