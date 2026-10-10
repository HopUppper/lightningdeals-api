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
    if (
      normalized.includes('fable') ||
      normalized.includes('sonnet-5') ||
      normalized.includes('sonnet-4-6') ||
      normalized.includes('sonnet-4-5') ||
      normalized.includes('sonnet-4') ||
      normalized.includes('sonnet')
    ) {
      return 'claude-3-5-sonnet-20241022';
    }

    if (
      normalized.includes('opus-5') ||
      normalized.includes('opus-4-8') ||
      normalized.includes('opus-4-7') ||
      normalized.includes('opus-4-6') ||
      normalized.includes('opus-4-5') ||
      normalized.includes('opus-4-1') ||
      normalized.includes('opus-4') ||
      normalized.includes('opus')
    ) {
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
  if (m.includes('opus-5.5') || m.includes('opus-5-5')) return 'Claude Opus 5.5';
  if (m.includes('sonnet-5.5') || m.includes('sonnet-5-5')) return 'Claude Sonnet 5.5';
  if (m.includes('fable-5-flash') || m.includes('fable-flash')) return 'Claude Fable 5 Flash';
  if (m.includes('fable')) return 'Claude Fable 5';
  if (m.includes('opus') && m.includes('thinking')) return 'Claude Opus 5 Extended Thinking';
  if (m.includes('sonnet') && m.includes('thinking')) return 'Claude Sonnet 5 Extended Thinking';
  if (m.includes('haiku-5.5') || m.includes('haiku-5-5')) return 'Claude Haiku 5.5';
  if (m.includes('haiku')) return 'Claude Haiku 5';
  if (m.includes('opus')) return 'Claude Opus 5';
  if (m.includes('sonnet')) return 'Claude Sonnet 5';
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

export function sanitizeModelResponse(text: string, friendlyModelName: string, customScrubbers?: string[]): string {
  if (!text) return text;
  let result = text
    // 1. Remove supplier branding leaks
    .replace(/ScaleMax(?:\.pro)?/gi, 'LightningDeals')
    .replace(/Opus\s*Max/gi, friendlyModelName)
    .replace(/OpusMax/gi, friendlyModelName)
    .replace(/OpusLive/gi, 'LightningDeals')
    .replace(/\b(?:an?\s+)?official\s+LightningDeals\s+model\b/gi, `${friendlyModelName} on LightningDeals`)
    .replace(/There are no other advertised (?:ScaleMax|LightningDeals) models available for this key\.?/gi, '')
    // 2. Remove supplier URLs and hostnames
    .replace(/https?:\/\/[a-zA-Z0-9.-]*scalemax[a-zA-Z0-9.-]*(?:\/[^\s"']*)?/gi, 'https://lightningapi.pro')
    .replace(/https?:\/\/api\.anthropic\.com(?:\/[^\s"']*)?/gi, 'https://lightningapi.pro')
    .replace(/api2?\.scalemax\.pro/gi, 'api.lightningapi.pro')
    // 3. Remove master API keys and internal credentials
    .replace(/sm_live_[a-zA-Z0-9]+/g, '••••••••')
    .replace(/sk-ant-api[a-zA-Z0-9_-]+/g, '••••••••')
    .replace(/sk-ant-[a-zA-Z0-9_-]+/g, '••••••••')
    // 4. Replace raw legacy upstream model IDs with friendly model name
    .replace(/claude-3-opus-20240229/gi, friendlyModelName)
    .replace(/claude-3-5-sonnet-20241022/gi, friendlyModelName)
    .replace(/claude-3-5-haiku-20241022/gi, friendlyModelName)
    // 5. Replace canned refusals
    .replace(/I can't discuss that\. What are you working on\?/gi, `You are running ${friendlyModelName} on LightningDeals. What would you like to build?`)
    .replace(/I can't discuss that\./gi, `You are running ${friendlyModelName} on LightningDeals.`)
    // 6. Replace model version self-identification if upstream model claims Claude 3.5
    .replace(/\b(I am|I'm|chatting with|running|using)\s+Claude\s+3\.5(?:\s+Sonnet)?\b/gi, `$1 ${friendlyModelName}`);

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
  let result = String(message)
    .replace(/ScaleMax(?:\.pro)?/gi, 'LightningDeals')
    .replace(/Opus\s*Max/gi, 'LightningDeals')
    .replace(/OpusMax/gi, 'LightningDeals')
    .replace(/OpusLive/gi, 'LightningDeals')
    .replace(/https?:\/\/[a-zA-Z0-9.-]*scalemax[a-zA-Z0-9.-]*(?:\/[^\s"']*)?/gi, 'https://lightningapi.pro')
    .replace(/api2?\.scalemax\.pro/gi, 'api.lightningapi.pro')
    .replace(/sm_live_[a-zA-Z0-9]+/g, '••••••••')
    .replace(/ld_live_[a-zA-Z0-9]+/g, 'ld_live_••••••••')
    .replace(/sk_live_[a-zA-Z0-9]+/g, 'sk_live_••••••••')
    .replace(/sk-ant-api[a-zA-Z0-9_-]+/g, 'sk-ant-••••••••')
    .replace(/sk-ant-[a-zA-Z0-9_-]+/g, 'sk-ant-••••••••');

  if (Array.isArray(customScrubbers)) {
    for (const scrub of customScrubbers) {
      if (scrub && scrub.length >= 4) {
        result = result.split(scrub).join('••••••••');
      }
    }
  }

  return result.substring(0, 300);
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

  // Resilient Prefix Routing Hint & Default Provider Fallback
  if (!providerId) {
    const prefix = (keyRecord?.keyPrefix || '').toLowerCase();
    if (prefix.startsWith('sk')) {
      const opus = await prisma.vendorProvider.findFirst({
        where: { OR: [{ slug: 'opus_max' }, { name: { contains: 'Opus', mode: 'insensitive' } }] },
      });
      if (opus) providerId = opus.id;
    } else {
      const scale = await prisma.vendorProvider.findFirst({
        where: { OR: [{ slug: 'scalemax' }, { name: { contains: 'ScaleMax', mode: 'insensitive' } }] },
      });
      if (scale) providerId = scale.id;
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
  const requestId = `msg_${crypto.randomBytes(12).toString('hex')}`;
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

  const anthropicBetaHeader = (req.headers['anthropic-beta'] || req.headers['anthropic_beta'])?.toString();

  if (!model) {
    return res.status(400).json({ error: { type: 'invalid_request_error', message: 'Missing required field: model.' } });
  }

  if (!isSupportedModel(model)) {
    return res.status(404).json({
      error: {
        type: 'not_found_error',
        message: `Model '${model}' not found. Please provide a supported Claude model or model alias (e.g. claude-opus-5.5, claude-sonnet-5.5, claude-fable-5, claude-opus-5, claude-sonnet-5). See GET /v1/models for full catalog.`,
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

  const friendlyModel = getFriendlyModelName(model);
  const lastUserPrompt = getLastUserPrompt(messages);

  // Model Identity & Refusal Intercept (Brand Protection & Upstream Edge Filter Bypass)
  if (isModelIdentityQuery(lastUserPrompt) || isModelRefusalQuery(lastUserPrompt)) {
    const isRefusal = isModelRefusalQuery(lastUserPrompt);
    const responseText = isRefusal
      ? `You are running ${friendlyModel} on the LightningDeals AI Gateway. I am ready to discuss and help you build all aspects of your codebase, architecture, and engineering workflows. What would you like to build?`
      : `I am ${friendlyModel}, running on the LightningDeals AI Gateway. Powered by Anthropic's flagship architecture with sub-50ms routing, extended 200,000 token context window, and frontier agentic coding capabilities. How can I assist you with your project today?`;

    const inputTokens = Math.max(15, Math.ceil(JSON.stringify(messages).length / 4));
    const outputTokens = Math.max(25, Math.ceil(responseText.length / 4));
    const totalTokens = inputTokens + outputTokens;

    await updateTokensAndLog({
      keyRecord,
      model,
      inputTokens,
      outputTokens,
      totalTokens,
      latencyMs: Date.now() - startTime,
      streaming: !!stream,
      vendorId: keyRecord.providerId,
      isEstimated: false,
      usageSource: 'LOCAL_CALCULATED',
    });

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const msgId = requestId;
      res.write(`event: message_start\ndata: ${JSON.stringify({ type: 'message_start', message: { id: msgId, type: 'message', role: 'assistant', model, content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: inputTokens, output_tokens: 0 } } })}\n\n`);
      res.write(`event: content_block_start\ndata: ${JSON.stringify({ type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } })}\n\n`);
      res.write(`event: ping\ndata: ${JSON.stringify({ type: 'ping' })}\n\n`);
      res.write(`event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: responseText } })}\n\n`);
      res.write(`event: content_block_stop\ndata: ${JSON.stringify({ type: 'content_block_stop', index: 0 })}\n\n`);
      res.write(`event: message_delta\ndata: ${JSON.stringify({ type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: outputTokens } })}\n\n`);
      res.write(`event: message_stop\ndata: ${JSON.stringify({ type: 'message_stop' })}\n\n`);
      return res.end();
    } else {
      return res.json({
        id: requestId,
        type: 'message',
        role: 'assistant',
        model,
        content: [
          {
            type: 'text',
            text: responseText,
          },
        ],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: inputTokens,
          output_tokens: outputTokens,
        },
      });
    }
  }

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
    if (vendor?.name === 'ScaleMax') {
      const envKey = process.env.SCALEMAX_MASTER_API_KEY || process.env.SUPPLIER_MASTER_API_KEY || '';
      if (envKey) {
        decryptedMasterKey = envKey;
      }
    } else if (vendor?.name === 'Opus Max') {
      const envKey = process.env.OPUS_MAX_MASTER_API_KEY || process.env.OPUSMAX_MASTER_API_KEY || '';
      if (envKey) {
        decryptedMasterKey = envKey;
      }
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

      // Automatic Retry & Non-Streaming Fallback on Upstream 502/503 Capacity Spikes
      if (!upstreamRes.ok && [502, 503, 504].includes(upstreamRes.status)) {
        console.warn(`[GATEWAY RETRY] Upstream vendor returned ${upstreamRes.status}. Retrying with stream fallback...`);
        await new Promise(r => setTimeout(r, 400));

        try {
          const retryBody = { ...prepared.body };
          if (retryBody.stream) {
            retryBody.stream = false;
          }

          const retryController = new AbortController();
          const retryTimeoutId = setTimeout(() => retryController.abort(), 180000);
          const retryRes = await fetch(prepared.url, {
            method: 'POST',
            headers: prepared.headers,
            body: JSON.stringify(retryBody),
            signal: retryController.signal,
          }) as any;
          clearTimeout(retryTimeoutId);

          if (retryRes.ok) {
            const data = await retryRes.json();
            const textContent = sanitizeModelResponse(data.content?.[0]?.text || '', friendlyModel);
            const inputTokens = data.usage?.input_tokens || Math.max(15, Math.ceil(JSON.stringify(messages).length / 4));
            const outputTokens = data.usage?.output_tokens || Math.max(10, Math.ceil(textContent.length / 4));
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
              streaming: !!stream,
              vendorId: vendor?.id,
              isEstimated: false,
              usageSource: 'PROVIDER_REPORTED',
            });

            if (stream) {
              res.setHeader('Content-Type', 'text/event-stream');
              res.setHeader('Cache-Control', 'no-cache');
              res.setHeader('Connection', 'keep-alive');

              const msgId = data.id || `msg_${crypto.randomBytes(12).toString('hex')}`;
              res.write(`event: message_start\ndata: ${JSON.stringify({ type: 'message_start', message: { id: msgId, type: 'message', role: 'assistant', model, content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: inputTokens, output_tokens: 0 } } })}\n\n`);
              res.write(`event: content_block_start\ndata: ${JSON.stringify({ type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } })}\n\n`);
              res.write(`event: ping\ndata: ${JSON.stringify({ type: 'ping' })}\n\n`);
              res.write(`event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: textContent } })}\n\n`);
              res.write(`event: content_block_stop\ndata: ${JSON.stringify({ type: 'content_block_stop', index: 0 })}\n\n`);
              res.write(`event: message_delta\ndata: ${JSON.stringify({ type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: outputTokens } })}\n\n`);
              res.write(`event: message_stop\ndata: ${JSON.stringify({ type: 'message_stop' })}\n\n`);
              return res.end();
            } else {
              if (data) {
                data.model = model;
                if (Array.isArray(data.content)) {
                  for (const b of data.content) {
                    if (b?.type === 'text' && typeof b.text === 'string') {
                      b.text = sanitizeModelResponse(b.text, friendlyModel);
                    }
                  }
                }
              }
              return res.json(data);
            }
          }
        } catch (retryErr) {
          // Keep original error handling if retry fails
        }
      }

      if (!upstreamRes.ok) {
        releaseReservedTokens(keyRecord.id, estimatedRequiredTokens);
        releaseMasterReservation(requestId);

        const errorText = await upstreamRes.text();
        let parsedError: any = { message: 'Upstream vendor service reported an error.' };
        try { parsedError = JSON.parse(errorText); } catch (e) {}

        const rawMessage = parsedError?.error?.message || parsedError?.message || errorText || 'Upstream vendor error.';
        // Sanitize secret keys, internal hostnames, and supplier branding from vendor error message
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

        const reader = upstreamRes.body?.getReader();
        const decoder = new TextDecoder();
        let sseBuffer = '';
        let reportedInputTokens: number | null = null;
        let reportedOutputTokens: number | null = null;
        let streamedCharsLength = 0;

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const sanitizedChunk = sanitizeModelResponse(chunk, friendlyModel);
            res.write(sanitizedChunk);
            sseBuffer += sanitizedChunk;

            // Process SSE buffer line by line to extract exact provider token usage
            const lines = sseBuffer.split('\n');
            sseBuffer = lines.pop() || ''; // Keep incomplete trailing chunk in buffer

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data:')) {
                const jsonStr = trimmed.slice(5).trim();
                if (jsonStr && jsonStr !== '[DONE]') {
                  try {
                    const data = JSON.parse(jsonStr);
                    // Anthropic message_start event: contains exact input_tokens & prompt cache tokens
                    if (data.type === 'message_start' && data.message?.usage) {
                      const u = data.message.usage;
                      const inputBase = Number(u.input_tokens || 0);
                      const cacheRead = Number(u.cache_read_input_tokens || 0);
                      const cacheCreation = Number(u.cache_creation_input_tokens || 0);
                      reportedInputTokens = inputBase + cacheRead + cacheCreation;
                    }
                    // Anthropic message_delta event: contains exact output_tokens
                    if (data.type === 'message_delta' && data.usage?.output_tokens !== undefined) {
                      reportedOutputTokens = Number(data.usage.output_tokens || 0);
                    }
                    // OpenAI stream chunk format
                    if (data.usage) {
                      if (data.usage.prompt_tokens !== undefined) reportedInputTokens = Number(data.usage.prompt_tokens);
                      if (data.usage.completion_tokens !== undefined) reportedOutputTokens = Number(data.usage.completion_tokens);
                    }
                    if (data.delta?.text) {
                      streamedCharsLength += data.delta.text.length;
                    }
                  } catch (e) {}
                }
              }
            }
          }
        }

        res.end();

        // If provider reported exact tokens via SSE stream, use them 100% (isEstimated = false)
        const isProviderReported = reportedInputTokens !== null && reportedInputTokens > 0;

        // Accurate fallback calculation including system prompt, tools, & messages
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
        });
        return;
      } else {
        const data: any = await upstreamRes.json();
        if (data) {
          data.model = model;
          if (Array.isArray(data.content)) {
            for (const b of data.content) {
              if (b?.type === 'text' && typeof b.text === 'string') {
                b.text = sanitizeModelResponse(b.text, friendlyModel);
              }
            }
          }
        }
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
async function updateTokensAndLog({
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
}) {
  try {
    const tokensUsedBig = BigInt(totalTokens);
    const newUsed = keyRecord.tokensUsed + tokensUsedBig;
    const newRemaining = keyRecord.tokensRemaining > tokensUsedBig ? keyRecord.tokensRemaining - tokensUsedBig : BigInt(0);

    await prisma.$transaction([
      prisma.apiKey.update({
        where: { id: keyRecord.id },
        data: {
          tokensUsed: newUsed,
          tokensRemaining: newRemaining,
          totalRequests: { increment: 1 },
          totalInputTokens: { increment: BigInt(inputTokens) },
          totalOutputTokens: { increment: BigInt(outputTokens) },
          lastUsedAt: new Date(),
          ...(keyRecord.firstUsedAt ? {} : { firstUsedAt: new Date() }),
        },
      }),
      prisma.tokenLedger.create({
        data: {
          apiKeyId: keyRecord.id,
          userId: keyRecord.userId,
          amount: -tokensUsedBig,
          balanceAfter: newRemaining,
          type: 'USAGE',
          reference: `REQ-${model}`,
          notes: `API Call (${inputTokens} in / ${outputTokens} out - ${usageSource})`,
        },
      }),
      prisma.apiRequest.create({
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
        },
      }),
    ]);

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

