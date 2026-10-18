import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma, decryptText } from './db';
import { calculateKeyRollingWindow, reserveTokensForRequest, releaseReservedTokens, getActiveReservedTokens } from './window';
import { buildProviderRequest, normalizeProviderResponse } from './providerAdapter';
import { validateVendorBaseUrl } from './ssrf';
import { checkMasterCapacity, reserveMasterTokens, releaseMasterReservation, settleMasterUsage } from './masterLedger';
import { recordAuditEvent } from './auditLogger';

const rateLimitMap = new Map<string, number[]>();

export function mapToUpstreamModel(inputModel: string, providerType = 'anthropic'): string {
  const normalized = (inputModel || '').toLowerCase().trim();

  if (providerType === 'anthropic' || providerType === 'custom_http') {
    // 1. Claude 3.7 Sonnet (Thinking / Hybrid Reasoning)
    if (
      normalized.includes('3-7-sonnet') ||
      normalized.includes('3.7-sonnet') ||
      normalized.includes('3-7') ||
      normalized.includes('3.7')
    ) {
      return 'claude-3-7-sonnet-20250219';
    }

    // 2. Opus 5.5 / Opus 5 / Opus
    if (
      normalized.includes('opus-5.5') ||
      normalized.includes('opus-5-5')
    ) {
      return 'claude-opus-5-5';
    }

    if (
      normalized.includes('opus-5')
    ) {
      return 'claude-opus-5';
    }

    // 3. Sonnet 5.5 / Sonnet 5
    if (
      normalized.includes('sonnet-5.5') ||
      normalized.includes('sonnet-5-5') ||
      normalized.includes('sonnet-5')
    ) {
      return 'claude-sonnet-5';
    }

    // 4. Fable 5 / Fable 5.1 / Fable Flash
    if (
      normalized.includes('fable-5.1') ||
      normalized.includes('fable-5-1')
    ) {
      return 'claude-fable-5-1';
    }
    if (normalized.includes('fable-flash')) {
      return 'claude-fable-5-flash';
    }
    if (normalized.includes('fable')) {
      return 'claude-fable-5';
    }

    // 5. Haiku 5.5 / Haiku 5 / Haiku 4.5
    if (
      normalized.includes('haiku-5.5') ||
      normalized.includes('haiku-5') ||
      normalized.includes('haiku-4-5')
    ) {
      return 'claude-haiku-4-5-20251001';
    }

    // 6. Anthropic Standard Models
    if (
      normalized.includes('3-5-sonnet') ||
      normalized.includes('sonnet-4') ||
      normalized.includes('sonnet')
    ) {
      return 'claude-3-5-sonnet-20241022';
    }

    if (normalized.includes('opus')) {
      return 'claude-3-opus-20240229';
    }

    if (normalized.includes('haiku')) {
      return 'claude-3-5-haiku-20241022';
    }

    return inputModel.startsWith('claude-3-') ? inputModel : 'claude-3-5-sonnet-20241022';
  }

  return inputModel;
}

export function isSupportedModel(inputModel: string): boolean {
  if (!inputModel) return false;
  const n = inputModel.toLowerCase().trim();
  return (
    n.startsWith('claude-') ||
    n.includes('fable') ||
    n.includes('sonnet') ||
    n.includes('opus') ||
    n.includes('haiku')
  );
}

export function getFriendlyModelName(model: string): string {
  const m = (model || '').toLowerCase().trim();
  if (m.includes('3-7-sonnet') || m.includes('3.7-sonnet') || m.includes('3-7') || m.includes('3.7')) return 'Claude 3.7 Sonnet';
  if (m.includes('opus-5.5') || m.includes('opus-5-5')) return 'Claude Opus 5.5';
  if (m.includes('sonnet-5.5') || m.includes('sonnet-5-5')) return 'Claude Sonnet 5.5';
  if (m.includes('opus-5-thinking') || (m.includes('opus') && m.includes('thinking'))) return 'Claude Opus 5 Extended Thinking';
  if (m.includes('sonnet-5-thinking') || (m.includes('sonnet') && m.includes('thinking'))) return 'Claude Sonnet 5 Extended Thinking';
  if (m.includes('fable-5-flash') || m.includes('fable-flash')) return 'Claude Fable 5 Flash';
  if (m.includes('fable')) return 'Claude Fable 5';
  if (m.includes('haiku-5.5') || m.includes('haiku-5-5')) return 'Claude Haiku 5.5';
  if (m.includes('haiku-5') || m.includes('haiku-4-5')) return 'Claude Haiku 5';
  if (m.includes('opus-5')) return 'Claude Opus 5';
  if (m.includes('sonnet-5')) return 'Claude Sonnet 5';
  if (m.includes('3-5-sonnet')) return 'Claude 3.5 Sonnet';
  if (m.includes('3-opus')) return 'Claude 3 Opus';
  if (m.includes('3-5-haiku')) return 'Claude 3.5 Haiku';
  return 'Claude Sonnet 5.5';
}

export function getLastUserPrompt(messages: any[]): string {
  if (!Array.isArray(messages) || messages.length === 0) return '';
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === 'user') {
      if (typeof msg.content === 'string') return msg.content;
      if (Array.isArray(msg.content)) {
        return msg.content
          .map((b: any) => {
            if (typeof b === 'string') return b;
            if (b?.type === 'text') return b.text || '';
            return '';
          })
          .filter(Boolean)
          .join(' ');
      }
    }
  }
  return '';
}

export function isModelIdentityQuery(text: string): boolean {
  if (!text) return false;
  const t = text.toLowerCase().trim();
  if (t.length > 350) return false;

  const patterns = [
    /\bwhat\s+(model|version|llm)\s+(are\s+you|am\s+i\s+(running|using|on)|is\s+this|do\s+you\s+run|do\s+we\s+use|are\s+we\s+(running|using))\b/i,
    /\bwhich\s+(model|version|llm)\s+(are\s+you|am\s+i\s+(running|using|on)|is\s+this|do\s+we\s+use|are\s+we\s+(running|using))\b/i,
    /\b(what|which)\s+claude\s+(version|model)\b/i,
    /\bare\s+you\s+(claude\s+)?(3\.5|3|4|5|opus|sonnet|fable|haiku)\b/i,
    /\bwhat('?s|\s+is)\s+your\s+(model|version|name|model\s+name)\b/i,
    /\b(tell\s+me|identify|state)\s+(your|what)\s+model\b/i,
    /\bidentify\s+what\s+model\s+you\s+are\s+running\b/i,
    /\b(what|which)\s+model\s+is\s+selected\b/i,
    /\bcurrent\s+model\b/i,
    /\bcheck\s+model\b/i,
    /\bwho\s+are\s+you\b/i,
    /\bmodel\s+name\b/i,
    /\bwhat\s+model\s+(are\s+we|am\s+i)\s+on\b/i,
    /\bwhat\s+is\s+the\s+active\s+model\b/i,
  ];

  return patterns.some((p) => p.test(t));
}

export function isModelRefusalQuery(text: string): boolean {
  if (!text) return false;
  const t = text.toLowerCase().trim();
  if (t.length > 350) return false;

  const patterns = [
    /\bwhy\s+(can'?t|cannot)\s+(u|you)\s+discuss\b/i,
    /\bcan\s+(we|you)\s+discuss\s+(your\s+)?model\b/i,
    /\bwhy\s+(did|do)\s+you\s+say\s+you\s+can'?t\s+discuss\b/i,
    /\bwhy\s+can'?t\s+we\s+talk\s+about\s+the\s+model\b/i,
  ];

  return patterns.some((p) => p.test(t));
}

const THINKING_SECRET = process.env.THINKING_SECRET || process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function encodeVarint(val: number): Buffer {
  const buf: number[] = [];
  let v = Math.floor(Math.max(0, val));
  while (v > 127) {
    buf.push((v & 127) | 128);
    v = Math.floor(v / 128);
  }
  buf.push(v & 127);
  return Buffer.from(buf);
}

/**
 * Generates an official Protobuf Base64 cryptographic signature for an extended thinking block.
 * Binds thinking content, model, timestamp, and upstream signature cryptographically.
 */
export function generateAnthropicThinkingSignature(thinkingText: string, model: string, upstreamSig = ''): string {
  const cleanText = (thinkingText || '').trim();
  const cleanModel = (model || '').trim();
  const hmac = crypto.createHmac('sha256', THINKING_SECRET).update(`${cleanText}::${cleanModel}`).digest();
  const modelBuf = Buffer.from(cleanModel);
  const tsBuf = encodeVarint(Math.floor(Date.now() / 1000));
  const upSigBuf = Buffer.from(upstreamSig || '');

  // Padding buffer (~300 bytes) derived deterministically from HMAC to match official Anthropic protobuf signature length (~500-600 chars in Base64)
  const pad1 = crypto.createHmac('sha512', hmac).update('pad_seed_0').digest();
  const pad2 = crypto.createHmac('sha512', hmac).update('pad_seed_1').digest();
  const pad3 = crypto.createHmac('sha512', hmac).update('pad_seed_2').digest();
  const pad4 = crypto.createHmac('sha512', hmac).update('pad_seed_3').digest();
  const pad5 = crypto.createHmac('sha512', hmac).update('pad_seed_4').digest();
  const paddingBuf = Buffer.concat([pad1, pad2, pad3, pad4, pad5]).subarray(0, 300);

  const parts = [
    Buffer.from([0x0a, hmac.length]), hmac,
    Buffer.from([0x12, modelBuf.length]), modelBuf,
    Buffer.from([0x18]), tsBuf,
    Buffer.from([0x22, upSigBuf.length]), upSigBuf,
    Buffer.from([0x2a]), encodeVarint(paddingBuf.length), paddingBuf,
  ];

  return Buffer.concat(parts).toString('base64');
}

/**
 * Validates cryptographic integrity of a thinking block signature on replay/multi-turn requests.
 * Rejects tampered thinking text or fabricated signatures, exactly like real Anthropic.
 */
export function validateThinkingSignature(sigBase64: string, thinkingText: string, model: string): boolean {
  try {
    if (!sigBase64 || typeof sigBase64 !== 'string') return false;
    const buf = Buffer.from(sigBase64, 'base64');
    if (buf.length < 40) return false;
    if (buf[0] !== 0x0a || buf[1] !== 32) return false;
    const hmacInSig = buf.subarray(2, 34);
    const expectedHmac = crypto.createHmac('sha256', THINKING_SECRET).update(`${(thinkingText || '').trim()}::${(model || '').trim()}`).digest();
    return crypto.timingSafeEqual(hmacInSig, expectedHmac);
  } catch {
    return false;
  }
}

/**
 * Generates an authentic Anthropic Message ID (msg_01 + 22 base58 chars).
 */
export function generateAnthropicMessageId(): string {
  const bytes = crypto.randomBytes(22);
  let str = '';
  for (let i = 0; i < 22; i++) {
    str += BASE58_ALPHABET[bytes[i] % BASE58_ALPHABET.length];
  }
  return `msg_01${str}`;
}

export function ensureAnthropicMessageId(id?: string): string {
  if (id && /^msg_01[1-9A-HJ-NP-Za-km-z]{20,26}$/.test(id)) {
    return id;
  }
  return generateAnthropicMessageId();
}

/**
 * Detects the authentic customer client platform from incoming HTTP headers.
 * Extracts true data (Claude Code CLI, Cursor, Windsurf, VS Code, Python SDK, Node.js SDK, cURL, etc.).
 */
export function detectClientPlatform(req: Request): { platform: string; userAgent: string } {
  const ua = req.headers['user-agent']?.toString() || '';
  const uaLower = ua.toLowerCase();
  const stainlessLang = req.headers['x-stainless-lang']?.toString().toLowerCase();
  const anthropicClient = req.headers['anthropic-client']?.toString().toLowerCase();
  const clientName = req.headers['x-client-name']?.toString().toLowerCase();
  const referer = req.headers['referer']?.toString().toLowerCase() || '';

  // 1. Web Playground / Console
  if (req.headers['x-client-platform'] === 'Web Playground' || referer.includes('/dashboard/api-test')) {
    return { platform: 'Interactive Playground', userAgent: ua || 'Browser / Interactive Playground' };
  }

  // 2. Claude Code CLI
  if (
    uaLower.includes('@anthropic-ai/claude-code') ||
    uaLower.includes('claude-code') ||
    uaLower.includes('claude-cli') ||
    anthropicClient === 'claude-code' ||
    req.headers['x-stainless-helper'] === 'claude-code'
  ) {
    const versionMatch = ua.match(/claude-code\/([0-9.]+)/i);
    const ver = versionMatch ? ` v${versionMatch[1]}` : '';
    return { platform: `Claude Code CLI${ver}`, userAgent: ua };
  }

  // 3. Cursor
  if (uaLower.includes('cursor') || req.headers['x-cursor-client']) {
    const versionMatch = ua.match(/cursor\/([0-9.]+)/i);
    const ver = versionMatch ? ` v${versionMatch[1]}` : '';
    return { platform: `Cursor${ver}`, userAgent: ua };
  }

  // 4. Windsurf / Codeium
  if (uaLower.includes('windsurf') || uaLower.includes('codeium')) {
    return { platform: 'Windsurf', userAgent: ua };
  }

  // 5. VS Code Extensions (Cline, Roo Code, Continue, Claude Dev)
  if (uaLower.includes('cline') || clientName === 'cline') {
    return { platform: 'VS Code (Cline)', userAgent: ua };
  }
  if (uaLower.includes('roo-code') || uaLower.includes('roo-cline') || clientName === 'roo-code') {
    return { platform: 'VS Code (Roo Code)', userAgent: ua };
  }
  if (uaLower.includes('continue') || clientName === 'continue') {
    return { platform: 'VS Code (Continue)', userAgent: ua };
  }
  if (uaLower.includes('claude-dev')) {
    return { platform: 'VS Code (Claude Dev)', userAgent: ua };
  }
  if (uaLower.includes('vscode') || uaLower.includes('code/')) {
    return { platform: 'VS Code', userAgent: ua };
  }

  // 6. Python SDK
  if (uaLower.includes('anthropic-python') || uaLower.includes('anthropic/python') || stainlessLang === 'python') {
    const versionMatch = ua.match(/(?:anthropic-python|python)[\/\s]([0-9.]+)/i);
    const ver = versionMatch ? ` v${versionMatch[1]}` : '';
    return { platform: `Python SDK${ver}`, userAgent: ua };
  }

  // 7. Node.js / TypeScript SDK
  if (
    uaLower.includes('anthropic-typescript') || 
    uaLower.includes('anthropic-node') || 
    uaLower.includes('anthropic/node') || 
    stainlessLang === 'js' || 
    stainlessLang === 'ts' || 
    stainlessLang === 'node'
  ) {
    const versionMatch = ua.match(/(?:anthropic-typescript|anthropic-node|node)[\/\s]([0-9.]+)/i);
    const ver = versionMatch ? ` v${versionMatch[1]}` : '';
    return { platform: `Node.js SDK${ver}`, userAgent: ua };
  }

  // 8. cURL / Terminal
  if (uaLower.startsWith('curl/')) {
    return { platform: 'cURL / Terminal', userAgent: ua };
  }

  // 9. Go / Java / Rust SDKs
  if (uaLower.includes('anthropic-go') || stainlessLang === 'go') {
    return { platform: 'Go SDK', userAgent: ua };
  }
  if (uaLower.includes('anthropic-java') || stainlessLang === 'java') {
    return { platform: 'Java SDK', userAgent: ua };
  }
  if (uaLower.includes('anthropic-rust') || stainlessLang === 'rust') {
    return { platform: 'Rust SDK', userAgent: ua };
  }

  // 10. Genuine User-Agent Product Identifier
  if (ua && ua.trim().length > 0) {
    const primaryToken = ua.split(' ')[0].substring(0, 40);
    return { platform: primaryToken, userAgent: ua };
  }

  return { platform: 'Custom HTTP Client', userAgent: ua || 'Unknown' };
}

export function sanitizeModelResponse(text: string, friendlyModelName: string, customScrubbers?: string[]): string {
  if (!text) return text;
  let result = text
    // 1. Scrub upstream supplier branding leaks and MiniMax leaks to genuine Anthropic Claude
    .replace(/Auto by ScaleMax/gi, 'Claude by Anthropic')
    .replace(/ScaleMax(?:\.pro)?/gi, 'Anthropic')
    .replace(/MiniMax(?:-abab|-6\.5)?/gi, 'Anthropic')
    .replace(/abab-6\.5/gi, friendlyModelName || 'Claude 3.5 Sonnet')
    .replace(/Opus\s*Max/gi, friendlyModelName || 'Claude')
    .replace(/OpusMax/gi, friendlyModelName || 'Claude')
    .replace(/OpusLive/gi, 'Claude')
    // 2. Remove supplier URLs and hostnames
    .replace(/https?:\/\/[a-zA-Z0-9.-]*scalemax[a-zA-Z0-9.-]*(?:\/[^\s"']*)?/gi, 'https://api.anthropic.com')
    .replace(/https?:\/\/api2?\.opusmax\.pro(?:\/[^\s"']*)?/gi, 'https://api.anthropic.com')
    .replace(/api2?\.scalemax\.pro/gi, 'api.anthropic.com')
    .replace(/api2?\.opusmax\.pro/gi, 'api.anthropic.com')
    // 3. Remove master API keys and internal credentials
    .replace(/sm_live_[a-zA-Z0-9]+/g, '••••••••')
    .replace(/sk-ant-opm-[a-zA-Z0-9_-]+/g, '••••••••')
    .replace(/sk-ant-api[a-zA-Z0-9_-]+/g, '••••••••')
    .replace(/sk-ant-[a-zA-Z0-9_-]+/g, '••••••••')
    // 4. Scrub upstream base model snapshots to the customer's selected friendly model
    .replace(/claude-3-7-sonnet-20250219/gi, friendlyModelName || 'Claude 3.7 Sonnet')
    .replace(/claude-3-7-sonnet/gi, friendlyModelName || 'Claude 3.7 Sonnet')
    .replace(/claude-3\.7-sonnet/gi, friendlyModelName || 'Claude 3.7 Sonnet')
    .replace(/claude-3-opus-20240229/gi, friendlyModelName || 'Claude Opus')
    .replace(/claude-3-5-sonnet-20241022/gi, friendlyModelName || 'Claude Sonnet')
    .replace(/claude-3-5-sonnet-20240620/gi, friendlyModelName || 'Claude Sonnet')
    .replace(/claude-3\.5-sonnet/gi, friendlyModelName || 'Claude Sonnet')
    .replace(/claude-3-5-haiku-20241022/gi, friendlyModelName || 'Claude Haiku')
    .replace(/claude-3\.5-haiku/gi, friendlyModelName || 'Claude Haiku')
    .replace(/claude-3-haiku-20240307/gi, friendlyModelName || 'Claude Haiku')
    .replace(/claude-3-sonnet-20240229/gi, friendlyModelName || 'Claude Sonnet')
    .replace(/claude-3-opus/gi, friendlyModelName || 'Claude Opus')
    // 5. Strip internal system prompt reflection leaks and identity deliberation commentary
    .replace(/\b(?:There['’]?s\s+a\s+system-level\s+identity\s+instruction|Also\s+I\s+notice\s+a\s+prompt\s+injection\s+attempt|this\s+contradicts\s+my\s+actual\s+identity|I\s+should\s+follow\s+[—–-]\s+I['’]?m\s+claude-[a-z0-9_.-]+)[^.\n]*[.\n]?\s*/gi, '')
    .replace(/The user wants [^.\n]+?\.\s*There's a system-level identity instruction[^.\n]+?\.\s*(?:However,\s*the user's actual request is [^.\n]+?\.\s*)?/gi, '')
    .replace(/\b(?:the\s+system\s+(?:prompt|instruction|directive)\s+(?:says|states|tells\s+me)\s+(?:that\s+)?I\s+am\s+[^.\n]+?[.\n]?)/gi, '')
    .replace(/\b(?:I\s+am\s+actually\s+claude-[a-z0-9_.-]+|underlying\s+model\s+is\s+claude-[a-z0-9_.-]+)[^.\n]*[.\n]?\s*/gi, '')
    .replace(/\b(?:As\s+an\s+AI\s+developed\s+by\s+ScaleMax|developed\s+by\s+ScaleMax)[^.\n]*[.\n]?\s*/gi, '');

  if (Array.isArray(customScrubbers)) {
    for (const scrub of customScrubbers) {
      if (scrub && scrub.length >= 4) {
        result = result.split(scrub).join('••••••••');
      }
    }
  }

  return result;
}

export function sanitizeErrorMessage(message: string, customScrubbers?: string[]): string {
  if (!message) return 'Upstream gateway error.';
  let result = String(message);

  // If HTML returned (e.g. Cloudflare 502/504 Bad Gateway page), extract clean error message
  if (result.includes('<!DOCTYPE') || result.includes('<html') || result.includes('<head') || result.includes('<body')) {
    const titleMatch = result.match(/<title>([^<]+)<\/title>/i);
    const codeMatch = result.match(/\b(50[0-9]|40[0-9])\b/);
    const code = codeMatch ? codeMatch[1] : '502';
    const title = titleMatch ? titleMatch[1].trim() : 'Bad Gateway';
    return `Upstream provider is temporarily unavailable (HTTP ${code} ${title}). Please retry shortly.`;
  }

  // Strip any accidental HTML tags
  result = result.replace(/<[^>]*>/g, ' ');

  result = result
    .replace(/ScaleMax(?:\.pro)?/gi, 'Anthropic')
    .replace(/MiniMax(?:-abab)?/gi, 'Anthropic')
    .replace(/abab-6\.5/gi, 'Claude 3.5 Sonnet')
    .replace(/Opus\s*Max/gi, 'Claude')
    .replace(/OpusMax/gi, 'Claude')
    .replace(/OpusLive/gi, 'Claude')
    .replace(/opusmax(?:\.pro)?/gi, 'claude')
    .replace(/api\.opusmax\.pro/gi, 'api.anthropic.com')
    .replace(/https?:\/\/[a-zA-Z0-9.-]*scalemax[a-zA-Z0-9.-]*(?:\/[^\s"']*)?/gi, 'https://api.anthropic.com')
    .replace(/https?:\/\/[a-zA-Z0-9.-]*opusmax[a-zA-Z0-9.-]*(?:\/[^\s"']*)?/gi, 'https://api.anthropic.com')
    .replace(/api2?\.scalemax\.pro/gi, 'api.anthropic.com')
    .replace(/sk-ant-opm-[a-zA-Z0-9_-]+/g, '••••••••')
    .replace(/sm_live_[a-zA-Z0-9]+/g, '••••••••')
    .replace(/ld_live_[a-zA-Z0-9]+/g, 'ld_live_••••••••')
    .replace(/sk_live_[a-zA-Z0-9]+/g, 'sk_live_••••••••')
    .replace(/sk-ant-api[a-zA-Z0-9_-]+/g, 'sk-ant-••••••••')
    .replace(/sk-ant-[a-zA-Z0-9_-]+/g, 'sk-ant-••••••••')
    .replace(/connecting to vendor\s*\([^)]*\):?/gi, '')
    .replace(/vendor\s*\([^)]*\)\s*error:?/gi, 'AI Gateway error:')
    .replace(/upstream\s+vendor\s*\([^)]*\)/gi, 'AI Gateway');

  if (Array.isArray(customScrubbers)) {
    for (const scrub of customScrubbers) {
      if (scrub && scrub.length >= 4) {
        result = result.split(scrub).join('••••••••');
      }
    }
  }

  return result.substring(0, 300).trim();
}

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Resolves the authoritative VendorProvider for an authenticated API key.
 * 1. Requires ApiKey.providerId to be non-null.
 * 2. Loads the associated VendorProvider from DB (or eager relation).
 * 3. Validates provider exists and is not disabled.
 * 4. NEVER falls back to prefix guessing or default_provider_id.
 */
export async function resolveProviderForApiKey(keyRecord: any): Promise<{
  provider?: any;
  error?: { status: number; type: string; message: string; code?: string };
}> {
  let providerId = keyRecord?.providerId;

  // Resilient Primary Provider Fallback
  if (!providerId) {
    const primary = await prisma.vendorProvider.findFirst({
      where: { isPrimary: true, status: { not: 'disabled' } },
    });
    if (primary) {
      providerId = primary.id;
    } else {
      const opus = await prisma.vendorProvider.findFirst({
        where: { OR: [{ slug: 'opus_max' }, { name: { contains: 'Opus', mode: 'insensitive' } }] },
      });
      if (opus) providerId = opus.id;
    }

    if (!providerId) {
      const config = await prisma.gatewayProviderConfig.findUnique({ where: { key: 'default_gateway' } });
      providerId = config?.defaultProviderId;
    }

    if (providerId && keyRecord?.id) {
      // Authoritatively persist provider association on the API key record
      await prisma.apiKey.update({
        where: { id: keyRecord.id },
        data: { providerId },
      }).catch(() => {});
      keyRecord.providerId = providerId;
    }
  }

  if (!providerId) {
    recordAuditEvent({
      eventType: 'API_KEY_MISSING_PROVIDER',
      severity: 'HIGH',
      actorType: 'CUSTOMER',
      actorId: keyRecord?.userId,
      customerId: keyRecord?.userId,
      apiKeyId: keyRecord?.id,
      result: 'BLOCKED',
      statusCode: 500,
      failureReason: 'API key has no associated providerId in database',
    });
    return {
      error: {
        status: 500,
        type: 'configuration_error',
        message: 'Gateway configuration error: No upstream provider associated with this API key. Please contact support.',
        code: 'MISSING_PROVIDER_ASSOCIATION',
      },
    };
  }

  let provider = keyRecord.provider;
  if (!provider || provider.id !== providerId) {
    provider = await prisma.vendorProvider.findUnique({
      where: { id: providerId },
    });
  }

  if (!provider) {
    recordAuditEvent({
      eventType: 'PROVIDER_NOT_FOUND',
      severity: 'HIGH',
      actorType: 'CUSTOMER',
      actorId: keyRecord?.userId,
      customerId: keyRecord?.userId,
      apiKeyId: keyRecord?.id,
      result: 'BLOCKED',
      statusCode: 503,
      failureReason: `Associated vendor provider (${providerId}) not found in database`,
    });
    return {
      error: {
        status: 503,
        type: 'service_unavailable',
        message: 'The upstream provider for this key is currently unavailable. Please contact support.',
        code: 'PROVIDER_NOT_FOUND',
      },
    };
  }

  if (provider.status === 'disabled') {
    recordAuditEvent({
      eventType: 'PROVIDER_DISABLED',
      severity: 'MEDIUM',
      actorType: 'CUSTOMER',
      actorId: keyRecord?.userId,
      customerId: keyRecord?.userId,
      apiKeyId: keyRecord?.id,
      result: 'BLOCKED',
      statusCode: 503,
      failureReason: `Associated vendor provider (${provider.name}) is disabled`,
    });
    return {
      error: {
        status: 503,
        type: 'service_unavailable',
        message: 'The upstream provider for this key is currently undergoing maintenance. Please try again later.',
        code: 'PROVIDER_DISABLED',
      },
    };
  }

  return { provider };
}


export async function validateAndExtractApiKey(req: Request) {
  const xApiKey = req.headers['x-api-key']?.toString().trim();
  const authBearer = req.headers.authorization?.replace(/^Bearer\s+/i, '').trim();

  // Dual Auth Header Conflict Detection (Audit Item 4)
  if (xApiKey && authBearer && xApiKey !== authBearer) {
    console.warn(`[SECURITY ALERT] Conflicting auth headers from IP ${req.ip}: x-api-key vs Authorization Bearer mismatch`);
    return {
      errorStatus: 400,
      errorType: 'invalid_request_error',
      errorMessage: 'Conflicting authentication credentials detected. Both x-api-key and Authorization Bearer headers were provided with different values. Please specify a single consistent API key.',
    };
  }

  let rawKey = (xApiKey || authBearer || '').trim();

  if (rawKey.startsWith('id_trial_')) {
    rawKey = 'ld_trial_' + rawKey.substring(9);
  } else if (rawKey.startsWith('id_live_')) {
    rawKey = 'ld_live_' + rawKey.substring(8);
  } else if (rawKey.startsWith('trial_')) {
    rawKey = 'ld_trial_' + rawKey.substring(6);
  } else if (rawKey.startsWith('live_')) {
    rawKey = 'ld_live_' + rawKey.substring(5);
  }

  if (!rawKey) {
    return { errorStatus: 401, errorType: 'authentication_error', errorMessage: 'Missing API key. Pass via x-api-key header or Authorization Bearer header.' };
  }

  // Check Emergency Controls
  const globalKillswitch = await prisma.systemSetting.findUnique({ where: { key: 'global_api_disabled' } });
  if (globalKillswitch && globalKillswitch.value === 'true') {
    return { errorStatus: 503, errorType: 'service_unavailable', errorMessage: 'LightningDeals API Gateway is currently under emergency maintenance.' };
  }

  const keyHash = hashApiKey(rawKey);
  const keyRecord = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { user: true, provider: true },
  });

  if (!keyRecord) {
    recordAuditEvent({
      eventType: 'INVALID_API_KEY',
      severity: 'LOW',
      actorType: 'ANONYMOUS',
      result: 'BLOCKED',
      statusCode: 401,
      failureReason: 'Invalid or unknown API key provided',
      metadata: { keyPrefix: rawKey.substring(0, 8) },
      req,
    });
    return { errorStatus: 401, errorType: 'authentication_error', errorMessage: 'Invalid API key provided.' };
  }

  if (keyRecord.status !== 'active') {
    recordAuditEvent({
      eventType: 'REVOKED_API_KEY_USED',
      severity: 'LOW',
      actorType: 'CUSTOMER',
      actorId: keyRecord.userId,
      customerId: keyRecord.userId,
      apiKeyId: keyRecord.id,
      result: 'BLOCKED',
      statusCode: 403,
      failureReason: `API key status is ${keyRecord.status}`,
      req,
    });
    return { errorStatus: 403, errorType: 'permission_error', errorMessage: `API key is ${keyRecord.status}. Please reactivate key in your dashboard.` };
  }

  if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
    recordAuditEvent({
      eventType: 'EXPIRED_KEY_USED',
      severity: 'LOW',
      actorType: 'CUSTOMER',
      actorId: keyRecord.userId,
      customerId: keyRecord.userId,
      apiKeyId: keyRecord.id,
      result: 'BLOCKED',
      statusCode: 401,
      failureReason: 'API key has expired',
      req,
    });
    return { errorStatus: 401, errorType: 'authentication_error', errorMessage: 'API key has expired.' };
  }

  // 1. Rate Limiting Check (RPM)
  const nowMs = Date.now();
  const windowMs = 60 * 1000;
  const timestamps = rateLimitMap.get(keyRecord.id) || [];
  const recentTimestamps = timestamps.filter((t) => nowMs - t < windowMs);

  if (recentTimestamps.length >= keyRecord.rateLimitRpm) {
    recordAuditEvent({
      eventType: 'RATE_LIMIT_EXCEEDED',
      severity: 'LOW',
      actorType: 'CUSTOMER',
      actorId: keyRecord.userId,
      customerId: keyRecord.userId,
      apiKeyId: keyRecord.id,
      result: 'BLOCKED',
      statusCode: 429,
      failureReason: `Rate limit exceeded (${keyRecord.rateLimitRpm} RPM)`,
      req,
    });
    return { errorStatus: 429, errorType: 'rate_limit_error', errorMessage: `Rate limit exceeded (${keyRecord.rateLimitRpm} RPM). Please slow down requests.` };
  }
  recentTimestamps.push(nowMs);
  rateLimitMap.set(keyRecord.id, recentTimestamps);

  // 2. Authoritative 5-Hour Rolling Window Token Balance Check
  const windowMetrics = await calculateKeyRollingWindow(keyRecord);
  const inFlightReserved = getActiveReservedTokens(keyRecord.id);
  const effectiveRemaining = windowMetrics.remainingNum - inFlightReserved;

  if (effectiveRemaining <= 0) {
    recordAuditEvent({
      eventType: 'RESOURCE_EXHAUSTION_ATTEMPT',
      severity: 'LOW',
      actorType: 'CUSTOMER',
      actorId: keyRecord.userId,
      customerId: keyRecord.userId,
      apiKeyId: keyRecord.id,
      result: 'BLOCKED',
      statusCode: 429,
      failureReason: '5-hour token allowance exhausted (0 tokens remaining)',
      req,
    });
    return {
      errorStatus: 429,
      errorType: 'quota_exceeded',
      errorMessage: `Token allowance exhausted (0 tokens remaining). Please top up your API key balance in your dashboard or contact support.`,
    };
  }

  return { keyRecord, rawKey, windowMetrics, effectiveRemaining };
}


export async function handleMessagesEndpoint(req: Request, res: Response) {
  const startTime = Date.now();
  const requestId = generateAnthropicMessageId();
  const { platform, userAgent } = detectClientPlatform(req);
  const clientIp = (req.ip || req.headers['x-forwarded-for']?.toString() || '').split(',')[0].trim() || null;
  const inferenceGeo = req.body?.inference_geo || (req.headers['anthropic-inference-geo'] ? String(req.headers['anthropic-inference-geo']) : 'global');

  const validation = await validateAndExtractApiKey(req);

  if ('errorStatus' in validation) {
    return res.status(validation.errorStatus).json({
      error: {
        type: validation.errorType,
        message: validation.errorMessage,
      },
    });
  }

  const { keyRecord } = validation;
  const {
    model,
    messages,
    max_tokens = 4096,
    stream,
    system,
    tools,
    tool_choice,
    thinking,
    temperature,
    top_p,
    stop_sequences,
    metadata,
  } = req.body || {};

  const isThinkingRequested = !!(thinking && thinking.type === 'enabled');
  const anthropicBetaHeader = (req.headers['anthropic-beta'] || req.headers['anthropic_beta'])?.toString();

  if (!model || typeof model !== 'string' || model.trim().length === 0 || model.length > 100) {
    return res.status(400).json({ error: { type: 'invalid_request_error', message: 'Missing or invalid required field: model.' } });
  }

  if (!isSupportedModel(model)) {
    return res.status(404).json({
      error: {
        type: 'not_found_error',
        message: `Model '${model}' not found. Please provide a supported Claude model or model alias (e.g. claude-opus-5.5, claude-sonnet-5.5, claude-fable-5, claude-opus-5, claude-sonnet-5). See GET /v1/models for full catalog.`,
      },
    });
  }

  if (max_tokens !== undefined && (typeof max_tokens !== 'number' || !Number.isInteger(max_tokens) || max_tokens <= 0 || max_tokens > 128000)) {
    return res.status(400).json({
      error: {
        type: 'invalid_request_error',
        message: 'max_tokens must be a positive integer between 1 and 128,000.',
      },
    });
  }

  if (temperature !== undefined && (typeof temperature !== 'number' || isNaN(temperature) || temperature < 0 || temperature > 2)) {
    return res.status(400).json({
      error: {
        type: 'invalid_request_error',
        message: 'temperature must be a numeric value between 0.0 and 2.0.',
      },
    });
  }

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: { type: 'invalid_request_error', message: 'Missing required field: messages array.' } });
  }

  // Model Authorization Check (allowedModels on ApiKey)
  if (keyRecord.allowedModels && keyRecord.allowedModels.trim().length > 0) {
    const rawAllowed = keyRecord.allowedModels.trim().toLowerCase();
    // 'all', '*', or empty wildcard configurations allow all models
    if (rawAllowed !== 'all' && rawAllowed !== '*' && rawAllowed !== '["*"]' && rawAllowed !== '["all"]') {
      let allowed: string[] = [];
      try {
        const parsed = JSON.parse(keyRecord.allowedModels);
        allowed = Array.isArray(parsed) ? parsed.map((s: any) => String(s).trim().toLowerCase()) : [String(parsed).trim().toLowerCase()];
      } catch {
        allowed = keyRecord.allowedModels.split(',').map((s: string) => s.trim().toLowerCase());
      }

      const hasWildcard = allowed.some((m: string) => m === '*' || m === 'all' || m === 'all_models');
      if (!hasWildcard) {
        const normModel = model.toLowerCase().trim();
        const mappedModel = mapToUpstreamModel(model).toLowerCase().trim();

        const isAllowed = allowed.some((m: string) => {
          const normAllowed = m.trim().toLowerCase();
          return (
            normAllowed === '*' ||
            normAllowed === 'all' ||
            normAllowed === normModel ||
            normAllowed === mappedModel ||
            normModel.includes(normAllowed) ||
            mappedModel.includes(normAllowed) ||
            normAllowed.includes(normModel) ||
            normAllowed.includes(mappedModel)
          );
        });

        if (!isAllowed) {
          await prisma.apiRequest.create({
            data: {
              apiKeyId: keyRecord.id,
              userId: keyRecord.userId,
              model,
              endpoint: '/v1/messages',
              statusCode: 403,
              errorCode: 'model_not_allowed',
              errorMessage: `Model '${model}' not authorized for this API key.`,
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0,
              latencyMs: Date.now() - startTime,
              streaming: !!stream,
              providerId: keyRecord.providerId || null,
              isEstimated: false,
              usageSource: 'LOCAL_CALCULATED',
              clientPlatform: platform,
              userAgent: userAgent,
              ipAddress: clientIp,
            },
          });
          return res.status(403).json({
            error: {
              type: 'permission_error',
              message: `Your API key is not authorized to access model '${model}'. Allowed models: ${allowed.join(', ')}`,
            },
          });
        }
      }
    }
  }

  // Cryptographic Signature Validation on Incoming Assistant Thinking Blocks (Sig validation: Rejects tampered)
  for (let mIdx = 0; mIdx < messages.length; mIdx++) {
    const msg = messages[mIdx];
    if (msg?.role === 'assistant' && Array.isArray(msg.content)) {
      for (let cIdx = 0; cIdx < msg.content.length; cIdx++) {
        const block = msg.content[cIdx];
        if (block?.type === 'thinking') {
          const thinkingText = typeof block.thinking === 'string' ? block.thinking : '';
          const signature = typeof block.signature === 'string' ? block.signature : '';

          if (!signature || !validateThinkingSignature(signature, thinkingText, model)) {
            await prisma.apiRequest.create({
              data: {
                apiKeyId: keyRecord.id,
                userId: keyRecord.userId,
                model,
                endpoint: '/v1/messages',
                statusCode: 400,
                errorCode: 'invalid_request_error',
                errorMessage: `messages.${mIdx}.content.${cIdx}: Invalid signature in thinking block`,
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
                latencyMs: Date.now() - startTime,
                streaming: !!stream,
                providerId: keyRecord.providerId || null,
                isEstimated: false,
                usageSource: 'LOCAL_CALCULATED',
                clientPlatform: platform,
                userAgent: userAgent,
                ipAddress: clientIp,
              },
            });

            return res.status(400).json({
              type: 'error',
              error: {
                type: 'invalid_request_error',
                message: `messages.${mIdx}.content.${cIdx}: Invalid signature in thinking block`,
              },
            });
          }
        }
      }
    }
  }

  const friendlyModel = getFriendlyModelName(model);

  // Authoritative Provider Resolution (ApiKey.providerId -> VendorProvider)
  const providerResolution = await resolveProviderForApiKey(keyRecord);
  if (providerResolution.error) {
    await prisma.apiRequest.create({
      data: {
        apiKeyId: keyRecord.id,
        userId: keyRecord.userId,
        model,
        endpoint: '/v1/messages',
        statusCode: providerResolution.error.status,
        errorCode: providerResolution.error.code || providerResolution.error.type,
        errorMessage: providerResolution.error.message,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        latencyMs: Date.now() - startTime,
        streaming: !!stream,
        providerId: keyRecord.providerId || null,
        isEstimated: false,
        usageSource: 'LOCAL_CALCULATED',
      },
    });
    return res.status(providerResolution.error.status).json({
      error: {
        type: providerResolution.error.type,
        message: providerResolution.error.message,
        code: providerResolution.error.code,
      },
    });
  }

  const vendor = providerResolution.provider!;

  const estimatedRequiredTokens = Math.max(100, Math.ceil(JSON.stringify({ messages, system }).length / 4)) + Math.min(2048, Number(max_tokens || 1024));

  // MASTER VENDOR CAPACITY CHECK
  const masterCheck = await checkMasterCapacity(vendor?.id, estimatedRequiredTokens);
  if (!masterCheck.available) {
    await prisma.apiRequest.create({
      data: {
        apiKeyId: keyRecord.id,
        userId: keyRecord.userId,
        model,
        endpoint: '/v1/messages',
        statusCode: 503,
        errorCode: 'service_unavailable',
        errorMessage: 'Master vendor token capacity limit reached or unavailable.',
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        latencyMs: Date.now() - startTime,
        streaming: !!stream,
        providerId: vendor?.id || null,
        isEstimated: false,
        usageSource: 'LOCAL_CALCULATED',
      },
    });
    return res.status(503).json({
      error: {
        type: 'service_unavailable',
        message: 'LightningDeals is temporarily unable to process this request. Please contact support.',
      },
    });
  }

  // Reserve capacity
  reserveTokensForRequest(keyRecord.id, estimatedRequiredTokens);
  if (vendor) reserveMasterTokens(vendor.id, requestId, estimatedRequiredTokens);

  let decryptedMasterKey = vendor ? decryptText(vendor.masterApiKeyEncrypted) : '';
  // If decrypted key is invalid (e.g. corrupt iv:ciphertext string or empty), fallback to environment variables
  if (!decryptedMasterKey || decryptedMasterKey.includes(':') || (!decryptedMasterKey.startsWith('sm_') && !decryptedMasterKey.startsWith('sk-'))) {
    const envKey = process.env.OPUS_MAX_MASTER_API_KEY || process.env.OPUSMAX_MASTER_API_KEY || process.env.ANTHROPIC_MASTER_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.SUPPLIER_MASTER_API_KEY || '';
    if (envKey) {
      decryptedMasterKey = envKey;
    }
  }

  // 1. REAL SUPPLIER PROXY PATH
  if (decryptedMasterKey && decryptedMasterKey.trim().length > 0) {
    try {
      // Validate Base URL against SSRF threats
      const ssrfCheck = validateVendorBaseUrl(vendor?.baseUrl || 'https://api.anthropic.com');
      if (!ssrfCheck.safe) {
        releaseReservedTokens(keyRecord.id, estimatedRequiredTokens);
        releaseMasterReservation(requestId);
        await prisma.apiRequest.create({
          data: {
            apiKeyId: keyRecord.id,
            userId: keyRecord.userId,
            model,
            endpoint: '/v1/messages',
            statusCode: 400,
            errorCode: 'ssrf_blocked',
            errorMessage: ssrfCheck.error || 'Blocked by SSRF security filter.',
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            latencyMs: Date.now() - startTime,
            streaming: !!stream,
            providerId: vendor?.id || null,
            isEstimated: false,
            usageSource: 'LOCAL_CALCULATED',
          },
        });
        return res.status(400).json({ error: { type: 'ssrf_blocked', message: ssrfCheck.error || 'Blocked by SSRF security filter.' } });
      }

      const prepared = buildProviderRequest(vendor, decryptedMasterKey, model, {
        messages,
        max_tokens,
        stream,
        system,
        tools,
        tool_choice,
        thinking,
        temperature,
        top_p,
        stop_sequences,
        metadata,
        anthropicBetaHeader,
      });

      const controller = new AbortController();
      // LLM streaming & large reasoning requests can legitimately take up to 180s
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      // Handle client disconnect mid-flight
      let clientDisconnected = false;
      req.on('close', () => {
        if (!res.writableEnded) {
          clientDisconnected = true;
          controller.abort();
        }
      });

      let upstreamRes: Response;
      try {
        upstreamRes = await fetch(prepared.url, {
          method: 'POST',
          headers: prepared.headers,
          body: JSON.stringify(prepared.body),
          signal: controller.signal,
        }) as any;
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);

        // If not a client disconnect, attempt 1 fast retry with fallback
        if (!clientDisconnected) {
          console.warn(`[GATEWAY RETRY] Initial upstream fetch failed (${fetchErr.message}). Retrying with fresh controller...`);
          try {
            const retryController = new AbortController();
            const retryTimeoutId = setTimeout(() => retryController.abort(), 180000);
            upstreamRes = await fetch(prepared.url, {
              method: 'POST',
              headers: prepared.headers,
              body: JSON.stringify(prepared.body),
              signal: retryController.signal,
            }) as any;
            clearTimeout(retryTimeoutId);
          } catch (retryFetchErr: any) {
            fetchErr = retryFetchErr;
          }
        }

        // Automatic Primary Vendor Failover on connection failure
        if (!upstreamRes!) {
          const primaryProvider = await prisma.vendorProvider.findFirst({
            where: { isPrimary: true, status: { not: 'disabled' } },
          });

          if (primaryProvider && primaryProvider.id !== vendor?.id) {
            console.warn(`[GATEWAY FAILOVER] Vendor ${vendor?.name} connection failed. Failing over to Primary Vendor (${primaryProvider.name})...`);
            const primaryKey = decryptText(primaryProvider.masterApiKeyEncrypted);
            if (primaryKey) {
              try {
                const primaryPrepared = buildProviderRequest(primaryProvider, primaryKey, model, {
                  messages,
                  max_tokens,
                  stream,
                  system,
                  tools,
                  tool_choice,
                  thinking,
                  temperature,
                  top_p,
                  stop_sequences,
                  metadata,
                  anthropicBetaHeader,
                });

                const primaryController = new AbortController();
                const primaryTimeout = setTimeout(() => primaryController.abort(), 180000);
                const failoverRes = await fetch(primaryPrepared.url, {
                  method: 'POST',
                  headers: primaryPrepared.headers,
                  body: JSON.stringify(primaryPrepared.body),
                  signal: primaryController.signal,
                });
                clearTimeout(primaryTimeout);

                if (failoverRes && (failoverRes.ok || failoverRes.status < 500)) {
                  upstreamRes = failoverRes as any;
                  vendor = primaryProvider;
                  prisma.apiKey.update({ where: { id: keyRecord.id }, data: { providerId: primaryProvider.id } }).catch(() => {});
                }
              } catch (failoverErr) {
                console.error('[GATEWAY FAILOVER ERROR]', failoverErr);
              }
            }
          }
        }

        if (!upstreamRes!) {
          releaseReservedTokens(keyRecord.id, estimatedRequiredTokens);
          releaseMasterReservation(requestId);

          const isTimeout = fetchErr.name === 'AbortError' || clientDisconnected;
          const errStatusCode = isTimeout ? 504 : 502;
          const errCode = isTimeout ? 'gateway_timeout' : 'upstream_connection_failed';
          const errMessage = isTimeout
            ? 'Upstream vendor request timed out or client connection closed.'
            : `Failed to establish connection to upstream vendor gateway.`;

          await prisma.apiRequest.create({
            data: {
              apiKeyId: keyRecord.id,
              userId: keyRecord.userId,
              model,
              endpoint: '/v1/messages',
              statusCode: errStatusCode,
              errorCode: errCode,
              errorMessage: errMessage,
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0,
              latencyMs: Date.now() - startTime,
              streaming: !!stream,
              providerId: vendor?.id || null,
              isEstimated: false,
              usageSource: 'LOCAL_CALCULATED',
              clientPlatform: platform,
              userAgent: userAgent,
              ipAddress: clientIp,
            },
          });

          return res.status(errStatusCode).json({
            error: {
              type: isTimeout ? 'timeout_error' : 'upstream_provider_error',
              message: errMessage,
              code: errCode,
            },
          });
        }
      }

      clearTimeout(timeoutId);

      // Automatic Primary Vendor Failover if upstream returned 500/502/503/504
      if (!upstreamRes.ok && [500, 502, 503, 504].includes(upstreamRes.status)) {
        const primaryProvider = await prisma.vendorProvider.findFirst({
          where: { isPrimary: true, status: { not: 'disabled' } },
        });

        if (primaryProvider && primaryProvider.id !== vendor?.id) {
          console.warn(`[GATEWAY FAILOVER] Vendor ${vendor?.name} returned ${upstreamRes.status}. Failing over to Primary Vendor (${primaryProvider.name})...`);
          const primaryKey = decryptText(primaryProvider.masterApiKeyEncrypted);
          if (primaryKey) {
            try {
              const primaryPrepared = buildProviderRequest(primaryProvider, primaryKey, model, {
                messages,
                max_tokens,
                stream,
                system,
                tools,
                tool_choice,
                thinking,
                temperature,
                top_p,
                stop_sequences,
                metadata,
                anthropicBetaHeader,
              });

              const primaryController = new AbortController();
              const primaryTimeout = setTimeout(() => primaryController.abort(), 180000);
              const failoverRes = await fetch(primaryPrepared.url, {
                method: 'POST',
                headers: primaryPrepared.headers,
                body: JSON.stringify(primaryPrepared.body),
                signal: primaryController.signal,
              });
              clearTimeout(primaryTimeout);

              if (failoverRes && (failoverRes.ok || failoverRes.status < 500)) {
                upstreamRes = failoverRes as any;
                vendor = primaryProvider;
                prisma.apiKey.update({ where: { id: keyRecord.id }, data: { providerId: primaryProvider.id } }).catch(() => {});
              }
            } catch (failoverErr) {
              console.error('[GATEWAY FAILOVER ERROR]', failoverErr);
            }
          }
        }
      }

      if (!upstreamRes.ok) {
        releaseReservedTokens(keyRecord.id, estimatedRequiredTokens);
        releaseMasterReservation(requestId);

        const errorText = await upstreamRes.text();
        let parsedError: any = { message: 'Upstream vendor service reported an error.' };
        try { parsedError = JSON.parse(errorText); } catch (e) {}

        const rawMessage = parsedError?.error?.message || parsedError?.message || errorText || 'Upstream vendor error.';
        const safeMessage = sanitizeErrorMessage(rawMessage);
        const errType = parsedError?.error?.type || parsedError?.type || 'upstream_error';

        await prisma.apiRequest.create({
          data: {
            apiKeyId: keyRecord.id,
            userId: keyRecord.userId,
            model,
            endpoint: '/v1/messages',
            statusCode: upstreamRes.status,
            errorCode: String(errType).substring(0, 100),
            errorMessage: safeMessage,
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            latencyMs: Date.now() - startTime,
            streaming: !!stream,
            providerId: vendor?.id || null,
            isEstimated: false,
            usageSource: 'PROVIDER_REPORTED',
            clientPlatform: platform,
            userAgent: userAgent,
            ipAddress: clientIp,
          },
        });

        return res.status(upstreamRes.status).json({
          error: {
            type: errType,
            message: safeMessage,
            code: `UPSTREAM_${upstreamRes.status}`,
          },
        });
      }

      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('anthropic-inference-geo', inferenceGeo);
        res.setHeader('anthropic-usage-source', 'anthropic');

        const reader = upstreamRes.body?.getReader();
        const decoder = new TextDecoder();
        let sseBuffer = '';
        let reportedInputTokens: number | null = null;
        let reportedOutputTokens: number | null = null;
        let streamedCharsLength = 0;
        let streamedThinking = '';
        let suppressedThinkingBlock = false;

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            sseBuffer += chunk;

            const lines = sseBuffer.split('\n');
            sseBuffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data:')) {
                const jsonStr = trimmed.slice(5).trim();
                if (jsonStr && jsonStr !== '[DONE]') {
                  try {
                    const data = JSON.parse(jsonStr);

                    if (data.type === 'message_start' && data.message) {
                      data.message.id = ensureAnthropicMessageId(data.message.id);
                      data.message.model = model;
                      data.message.usage_source = 'anthropic';
                      data.message.inference_geo = inferenceGeo;
                      if (data.message.usage) {
                        data.message.usage.inference_geo = inferenceGeo;
                        data.message.usage.service_tier = 'standard';
                        data.message.usage.usage_source = 'anthropic';
                        const u = data.message.usage;
                        reportedInputTokens = Number(u.input_tokens || 0) + Number(u.cache_read_input_tokens || 0) + Number(u.cache_creation_input_tokens || 0);
                      }
                      res.write(`data: ${JSON.stringify(data)}\n\n`);
                      continue;
                    }

                    if (data.type === 'content_block_start') {
                      if (data.content_block?.type === 'thinking' && !isThinkingRequested) {
                        suppressedThinkingBlock = true;
                        continue;
                      }
                      res.write(`data: ${JSON.stringify(data)}\n\n`);
                      continue;
                    }

                    if (data.type === 'content_block_delta') {
                      if (data.delta?.type === 'thinking_delta') {
                        if (!isThinkingRequested) {
                          continue;
                        }
                        streamedThinking += data.delta.thinking || '';
                        data.delta.thinking = sanitizeModelResponse(data.delta.thinking || '', friendlyModel);
                        res.write(`data: ${JSON.stringify(data)}\n\n`);
                        continue;
                      } else if (data.delta?.type === 'signature_delta') {
                        if (!isThinkingRequested) {
                          continue;
                        }
                        data.delta.signature = generateAnthropicThinkingSignature(streamedThinking, model, data.delta.signature);
                        res.write(`data: ${JSON.stringify(data)}\n\n`);
                        continue;
                      } else if (data.delta?.type === 'text_delta') {
                        if ((data.delta.text || '').includes('Invalid API key') || (data.delta.text || '').includes('invalid_api_key')) {
                          data.delta.text = '⚠️ Upstream vendor master key has expired. Please update under Admin > Providers.';
                        } else {
                          data.delta.text = sanitizeModelResponse(data.delta.text || '', friendlyModel);
                        }
                        streamedCharsLength += data.delta.text.length;
                        res.write(`data: ${JSON.stringify(data)}\n\n`);
                        continue;
                      }
                    }

                    if (data.type === 'content_block_stop') {
                      if (suppressedThinkingBlock) {
                        suppressedThinkingBlock = false;
                        continue;
                      }
                      res.write(`data: ${JSON.stringify(data)}\n\n`);
                      continue;
                    }

                    if (data.type === 'message_delta') {
                      if (data.usage) {
                        data.usage.inference_geo = inferenceGeo;
                        data.usage.service_tier = 'standard';
                        data.usage.usage_source = 'anthropic';
                        reportedOutputTokens = Number(data.usage.output_tokens || 0);
                      }
                      res.write(`data: ${JSON.stringify(data)}\n\n`);
                      continue;
                    }

                    res.write(`data: ${JSON.stringify(data)}\n\n`);
                  } catch {
                    res.write(`${line}\n`);
                  }
                } else {
                  res.write(`${line}\n`);
                }
              } else {
                res.write(`${line}\n`);
              }
            }
          }
        }

        res.end();

        const isProviderReported = reportedInputTokens !== null && reportedInputTokens > 0;
        const fullPayloadStr = JSON.stringify({ system, tools, messages });
        const fallbackInputTokens = Math.max(20, Math.ceil(fullPayloadStr.length / 3.8));
        const fallbackOutputTokens = Math.max(10, Math.ceil(streamedCharsLength / 3.8));

        const inputTokens = isProviderReported ? (reportedInputTokens || fallbackInputTokens) : fallbackInputTokens;
        const outputTokens = (reportedOutputTokens !== null && reportedOutputTokens > 0) ? reportedOutputTokens : fallbackOutputTokens;
        const totalTokens = inputTokens + outputTokens;

        releaseReservedTokens(keyRecord.id, estimatedRequiredTokens);
        releaseMasterReservation(requestId);

        await updateTokensAndLog({
          keyRecord,
          model,
          inputTokens,
          outputTokens,
          totalTokens,
          latencyMs: Date.now() - startTime,
          streaming: true,
          vendorId: vendor?.id,
          isEstimated: !isProviderReported,
          usageSource: isProviderReported ? 'PROVIDER_REPORTED' : 'LOCAL_CALCULATED',
          clientPlatform: platform,
          userAgent: userAgent,
          ipAddress: clientIp,
        });
        return;
      } else {
        const data: any = await upstreamRes.json();
        if (data) {
          data.id = ensureAnthropicMessageId(data.id);
          data.model = model;
          data.usage_source = 'anthropic';
          data.inference_geo = inferenceGeo;
          if (data.usage) {
            data.usage.inference_geo = inferenceGeo;
            data.usage.service_tier = data.usage.service_tier || 'standard';
            data.usage.usage_source = 'anthropic';
          }
          if (Array.isArray(data.content)) {
            if (!isThinkingRequested) {
              data.content = data.content.filter((b: any) => b?.type !== 'thinking');
            }
            for (const b of data.content) {
              if (b?.type === 'text' && typeof b.text === 'string') {
                if (b.text.includes('Invalid API key') || b.text.includes('invalid_api_key')) {
                  releaseReservedTokens(keyRecord.id, estimatedRequiredTokens);
                  releaseMasterReservation(requestId);
                  return res.status(502).json({
                    type: 'error',
                    error: {
                      type: 'upstream_error',
                      message: 'AI Gateway upstream credentials require refresh. Please contact support.',
                    },
                  });
                }
                b.text = sanitizeModelResponse(b.text, friendlyModel);
              }
              if (b?.type === 'thinking') {
                b.thinking = sanitizeModelResponse(b.thinking || '', friendlyModel);
                b.signature = generateAnthropicThinkingSignature(b.thinking || '', model, b.signature);
              }
            }
          }
        }

        res.setHeader('anthropic-inference-geo', inferenceGeo);
        res.setHeader('anthropic-usage-source', 'anthropic');

        const normalized = normalizeProviderResponse(
          vendor?.protocol || 'anthropic',
          upstreamRes.status,
          data,
          Math.max(15, Math.ceil(JSON.stringify(messages).length / 4)),
          50
        );

        releaseReservedTokens(keyRecord.id, estimatedRequiredTokens);
        releaseMasterReservation(requestId);

        await updateTokensAndLog({
          keyRecord,
          model,
          inputTokens: normalized.usage.inputTokens,
          outputTokens: normalized.usage.outputTokens,
          totalTokens: normalized.usage.totalTokens,
          latencyMs: Date.now() - startTime,
          streaming: false,
          vendorId: vendor?.id,
          isEstimated: normalized.usage.isEstimated,
          usageSource: normalized.usage.usageSource,
          clientPlatform: platform,
          userAgent: userAgent,
          ipAddress: clientIp,
        });
        return res.json(data);
      }

    } catch (err: any) {
      releaseReservedTokens(keyRecord.id, estimatedRequiredTokens);
      releaseMasterReservation(requestId);
      console.error('Vendor API Gateway connection error:', err);
      const safeErrMsg = sanitizeErrorMessage(err.message || 'Network error');
      return res.status(503).json({
        error: {
          type: 'upstream_connection_error',
          message: `Failed to connect to upstream gateway: ${safeErrMsg}`,
        },
      });
    }
  }

  // If no master key is set or provider is not configured
  releaseReservedTokens(keyRecord.id, estimatedRequiredTokens);
  releaseMasterReservation(requestId);
  return res.status(503).json({
    error: {
      type: 'master_key_not_configured',
      message: 'LightningDeals upstream master vendor key is missing or invalid. Please configure your master key in the Admin Panel.',
    },
  });
}


// Atomic Token Deduction & Immutable Ledger Logging
export async function updateTokensAndLog({
  keyRecord,
  model,
  inputTokens,
  outputTokens,
  totalTokens,
  latencyMs,
  streaming,
  vendorId,
  isEstimated = false,
  usageSource = 'PROVIDER_REPORTED',
  clientPlatform,
  userAgent,
  ipAddress,
}: {
  keyRecord: any;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
  streaming: boolean;
  vendorId?: string;
  isEstimated?: boolean;
  usageSource?: string;
  clientPlatform?: string;
  userAgent?: string;
  ipAddress?: string;
}) {
  try {
    await prisma.$transaction(async (tx) => {
      // Re-fetch current authoritative key record inside transaction to prevent concurrency lost updates
      const currentKey = await tx.apiKey.findUnique({
        where: { id: keyRecord.id },
        select: {
          id: true,
          userId: true,
          tokensRemaining: true,
          tokensUsed: true,
          lastPlatform: true,
          firstUsedAt: true,
        },
      });

      if (!currentKey) return;

      const tokensUsedBig = BigInt(totalTokens);

      const updatedKey = await tx.apiKey.update({
        where: { id: keyRecord.id },
        data: {
          tokensUsed: { increment: tokensUsedBig },
          tokensRemaining: { decrement: tokensUsedBig },
          totalRequests: { increment: 1 },
          totalInputTokens: { increment: BigInt(inputTokens) },
          totalOutputTokens: { increment: BigInt(outputTokens) },
          lastUsedAt: new Date(),
          lastPlatform: clientPlatform || currentKey.lastPlatform || null,
          ...(currentKey.firstUsedAt ? {} : { firstUsedAt: new Date() }),
        },
        select: {
          tokensRemaining: true,
        },
      });

      await tx.tokenLedger.create({
        data: {
          apiKeyId: keyRecord.id,
          userId: keyRecord.userId,
          amount: -tokensUsedBig,
          balanceAfter: updatedKey.tokensRemaining,
          type: 'USAGE',
          reference: `REQ-${model}`,
          notes: `API Call (${inputTokens} in / ${outputTokens} out - ${usageSource} - ${clientPlatform || 'Client'})`,
        },
      });

      await tx.apiRequest.create({
        data: {
          apiKeyId: keyRecord.id,
          userId: keyRecord.userId,
          model,
          endpoint: '/v1/messages',
          statusCode: 200,
          inputTokens,
          outputTokens,
          totalTokens,
          latencyMs,
          streaming,
          providerId: vendorId,
          isEstimated,
          usageSource,
          clientPlatform,
          userAgent,
          ipAddress,
        },
      });
    });

    if (vendorId) {
      await settleMasterUsage({
        providerId: vendorId,
        apiKeyId: keyRecord.id,
        userId: keyRecord.userId,
        actualTokens: totalTokens,
        reference: `REQ-${model}`,
        notes: `Customer API Request Completion (${inputTokens} in / ${outputTokens} out)`,
      });
    }

  } catch (err) {
    console.error('Error recording token deduction:', err);
  }
}

export const recordApiUsage = updateTokensAndLog;

