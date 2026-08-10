import { URL } from 'url';

/**
 * Validates an admin-configured Vendor Base URL against SSRF threats.
 * Blocks private IP ranges, localhost, cloud metadata endpoints (169.254.169.254),
 * and non-HTTP/HTTPS protocols.
 */
export function validateVendorBaseUrl(rawUrl: string): { safe: boolean; error?: string; normalizedUrl?: string } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { safe: false, error: 'Base URL is required.' };
  }

  const trimmed = rawUrl.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { safe: false, error: 'Base URL must start with http:// or https://' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { safe: false, error: 'Invalid URL syntax.' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // 1. Block Localhost & Loopback
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local')
  ) {
    return { safe: false, error: 'SSRF Violation: Localhost/Loopback targets are restricted.' };
  }

  // 2. Block Cloud Metadata IPv4 Endpoints (169.254.x.x)
  if (hostname.startsWith('169.254.')) {
    return { safe: false, error: 'SSRF Violation: Cloud Metadata endpoints (169.254.x.x) are strictly forbidden.' };
  }

  // 3. Block Private IPv4 Subnets (10.x.x.x, 172.16.x.x - 172.31.x.x, 192.168.x.x)
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = hostname.match(ipv4Regex);
  if (match) {
    const [, oct1, oct2] = match.map(Number);
    if (oct1 === 10) {
      return { safe: false, error: 'SSRF Violation: Private network range 10.0.0.0/8 is restricted.' };
    }
    if (oct1 === 172 && oct2 >= 16 && oct2 <= 31) {
      return { safe: false, error: 'SSRF Violation: Private network range 172.16.0.0/12 is restricted.' };
    }
    if (oct1 === 192 && oct2 === 168) {
      return { safe: false, error: 'SSRF Violation: Private network range 192.168.0.0/16 is restricted.' };
    }
    if (oct1 === 127) {
      return { safe: false, error: 'SSRF Violation: Loopback range 127.0.0.0/8 is restricted.' };
    }
  }

  // 4. Normalize Base URL (Strip trailing slash)
  const normalizedUrl = `${parsed.protocol}//${parsed.host}${parsed.pathname}`.replace(/\/$/, '');

  return { safe: true, normalizedUrl };
}
