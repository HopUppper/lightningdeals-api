import { URL } from 'url';
import dns from 'dns';
import net from 'net';

/**
 * Checks whether an IPv4 or IPv6 address is private, loopback, link-local,
 * cloud metadata, or reserved.
 */
export function isIpPrivateOrRestricted(ip: string): boolean {
  if (!ip) return true;

  // IPv6 checks
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::' || lower === '0:0:0:0:0:0:0:1') return true;
    if (lower.startsWith('fe80:') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) return true; // fe80::/10
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // fc00::/7 (unique local)
    // IPv4-mapped IPv6 (::ffff:192.168.1.1)
    if (lower.startsWith('::ffff:')) {
      const ipv4Part = lower.replace('::ffff:', '');
      return isIpPrivateOrRestricted(ipv4Part);
    }
    return false;
  }

  // IPv4 checks
  const match = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) return true;

  const [, o1, o2, o3] = match.map(Number);
  if (o1 > 255 || o2 > 255 || o3 > 255) return true;

  // 1. Loopback (127.0.0.0/8)
  if (o1 === 127) return true;

  // 2. Current network / 0.0.0.0/8
  if (o1 === 0) return true;

  // 3. Private 10.0.0.0/8
  if (o1 === 10) return true;

  // 4. Private 172.16.0.0/12
  if (o1 === 172 && o2 >= 16 && o2 <= 31) return true;

  // 5. Private 192.168.0.0/16
  if (o1 === 192 && o2 === 168) return true;

  // 6. Cloud metadata / Link-local (169.254.0.0/16)
  if (o1 === 169 && o2 === 254) return true;

  // 7. CGNAT (100.64.0.0/10)
  if (o1 === 100 && o2 >= 64 && o2 <= 127) return true;

  // 8. Documentation / Test networks
  if (o1 === 192 && o2 === 0 && o3 === 2) return true; // TEST-NET-1
  if (o1 === 198 && o2 === 51 && o3 === 100) return true; // TEST-NET-2
  if (o1 === 203 && o2 === 0 && o3 === 113) return true; // TEST-NET-3

  // 9. Multicast & Reserved (224.0.0.0/4 and 240.0.0.0/4)
  if (o1 >= 224) return true;

  return false;
}

/**
 * Validates a public web URL requested for web research, link understanding,
 * or browser automation.
 * Enforces:
 * - http / https schemes only
 * - Ports restricted to 80, 443, or default
 * - Blocks localhost, loopback, private IP ranges, cloud metadata (169.254.169.254)
 * - Performs DNS resolution check to prevent DNS rebinding attacks
 */
export async function validatePublicWebUrl(
  rawUrl: string
): Promise<{ safe: boolean; error?: string; url?: URL; resolvedIp?: string }> {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { safe: false, error: 'URL is required.' };
  }

  const trimmed = rawUrl.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { safe: false, error: 'URL must use http:// or https:// protocol.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { safe: false, error: 'Invalid URL syntax.' };
  }

  // Enforce protocol
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { safe: false, error: `Protocol "${parsed.protocol}" is not allowed.` };
  }

  // Restrict ports to standard web ports (or default)
  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
    return { safe: false, error: `Port "${parsed.port}" is not allowed for web research.` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost & loopback strings
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.lan') ||
    hostname.endsWith('.home') ||
    hostname.endsWith('.corp')
  ) {
    return { safe: false, error: 'SSRF Violation: Localhost/internal domain targets are forbidden.' };
  }

  // Block cloud metadata hostnames directly
  if (
    hostname === 'metadata.google.internal' ||
    hostname === 'instance-data' ||
    hostname.startsWith('169.254.')
  ) {
    return { safe: false, error: 'SSRF Violation: Cloud Metadata endpoints are strictly forbidden.' };
  }

  // Check if hostname is an immediate IP literal
  if (net.isIP(hostname)) {
    if (isIpPrivateOrRestricted(hostname)) {
      return { safe: false, error: `SSRF Violation: Target IP ${hostname} is in a restricted or private range.` };
    }
    return { safe: true, url: parsed, resolvedIp: hostname };
  }

  // Perform asynchronous DNS resolution to defend against DNS rebinding (e.g. nip.io / sslip.io)
  try {
    const lookup = await dns.promises.lookup(hostname, { all: true });
    if (!lookup || lookup.length === 0) {
      return { safe: false, error: `Failed to resolve hostname: ${hostname}` };
    }

    for (const record of lookup) {
      if (isIpPrivateOrRestricted(record.address)) {
        return {
          safe: false,
          error: `SSRF Violation: Domain ${hostname} resolves to restricted IP ${record.address}.`,
        };
      }
    }

    return { safe: true, url: parsed, resolvedIp: lookup[0].address };
  } catch (dnsErr: any) {
    return { safe: false, error: `DNS resolution failed for ${hostname}: ${dnsErr.message}` };
  }
}

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
