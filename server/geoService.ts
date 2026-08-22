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
  flag: string;
}

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

const US_STATES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

const COUNTRY_NAMES: Record<string, { name: string; flag: string }> = {
  IN: { name: 'India', flag: '🇮🇳' },
  US: { name: 'United States', flag: '🇺🇸' },
  GB: { name: 'United Kingdom', flag: '🇬🇧' },
  SG: { name: 'Singapore', flag: '🇸🇬' },
  AE: { name: 'United Arab Emirates', flag: '🇦🇪' },
  DE: { name: 'Germany', flag: '🇩🇪' },
  CA: { name: 'Canada', flag: '🇨🇦' },
  AU: { name: 'Australia', flag: '🇦🇺' },
  FR: { name: 'France', flag: '🇫🇷' },
  JP: { name: 'Japan', flag: '🇯🇵' },
  NL: { name: 'Netherlands', flag: '🇳🇱' },
  BR: { name: 'Brazil', flag: '🇧🇷' },
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
      if (candidate && !candidate.startsWith('127.') && !candidate.startsWith('10.') && !candidate.startsWith('192.168.')) {
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

export function resolveIpLocation(ip: string, req?: Request): GeoLocationResult {
  const cleanIp = (ip || '127.0.0.1').replace(/^::ffff:/, '').trim();

  // 1. Check Cloudflare Edge Headers if request is present
  if (req) {
    const cfCountry = req.headers['cf-ipcountry']?.toString();
    const cfCity = req.headers['cf-ipcity']?.toString();
    const cfRegionCode = req.headers['cf-region-code']?.toString() || req.headers['cf-region']?.toString();
    const cfTimezone = req.headers['cf-timezone']?.toString();
    const ua = req.headers['user-agent']?.toString();

    if (cfCountry && cfCountry !== 'XX' && cfCountry !== 'T1') {
      const countryMeta = COUNTRY_NAMES[cfCountry.toUpperCase()] || { name: cfCountry, flag: '🌐' };
      let stateName = cfRegionCode || '';
      if (cfCountry.toUpperCase() === 'IN' && INDIAN_STATES[cfRegionCode?.toUpperCase() || '']) {
        stateName = INDIAN_STATES[cfRegionCode.toUpperCase()];
      } else if (cfCountry.toUpperCase() === 'US' && US_STATES[cfRegionCode?.toUpperCase() || '']) {
        stateName = US_STATES[cfRegionCode.toUpperCase()];
      }

      return {
        ip: cleanIp,
        city: cfCity || 'Local City',
        region: stateName || 'Direct Region',
        country: countryMeta.name,
        countryCode: cfCountry.toUpperCase(),
        timezone: cfTimezone || 'Asia/Kolkata',
        userAgent: parseDeviceSummary(ua),
        flag: countryMeta.flag,
      };
    }
  }

  // 2. Local / Private IP Handling
  if (
    cleanIp === '127.0.0.1' ||
    cleanIp === 'localhost' ||
    cleanIp === '::1' ||
    cleanIp.startsWith('10.') ||
    cleanIp.startsWith('192.168.') ||
    cleanIp.startsWith('172.16.')
  ) {
    return {
      ip: cleanIp,
      city: 'Mumbai',
      region: 'Maharashtra',
      country: 'India',
      countryCode: 'IN',
      timezone: 'Asia/Kolkata',
      userAgent: req ? parseDeviceSummary(req.headers['user-agent']?.toString()) : 'Localhost Dev Client',
      flag: '🇮🇳',
    };
  }

  // 3. Fast 0ms Local MaxMind GeoIP Lookup
  try {
    const geo = geoip.lookup(cleanIp);
    if (geo) {
      const countryCode = geo.country?.toUpperCase() || 'IN';
      const countryMeta = COUNTRY_NAMES[countryCode] || { name: geo.country || 'Global', flag: '🌐' };

      let regionName = geo.region || '';
      if (countryCode === 'IN' && INDIAN_STATES[geo.region?.toUpperCase()]) {
        regionName = INDIAN_STATES[geo.region.toUpperCase()];
      } else if (countryCode === 'US' && US_STATES[geo.region?.toUpperCase()]) {
        regionName = US_STATES[geo.region.toUpperCase()];
      }

      return {
        ip: cleanIp,
        city: geo.city || (countryCode === 'IN' ? 'Bengaluru' : 'City Area'),
        region: regionName || 'State Area',
        country: countryMeta.name,
        countryCode,
        timezone: geo.timezone || (countryCode === 'IN' ? 'Asia/Kolkata' : 'UTC'),
        userAgent: req ? parseDeviceSummary(req.headers['user-agent']?.toString()) : undefined,
        flag: countryMeta.flag,
      };
    }
  } catch (err) {
    console.warn('[GeoIP Lookup Error]', err);
  }

  // Fallback for unidentified public IP
  return {
    ip: cleanIp,
    city: 'India Region',
    region: 'Maharashtra',
    country: 'India',
    countryCode: 'IN',
    timezone: 'Asia/Kolkata',
    userAgent: req ? parseDeviceSummary(req.headers['user-agent']?.toString()) : undefined,
    flag: '🇮🇳',
  };
}
