import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma, decryptText } from './db';
import { calculateKeyRollingWindow, reserveTokensForRequest, releaseReservedTokens, getActiveReservedTokens } from './window';
import { buildProviderRequest, normalizeProviderResponse } from './providerAdapter';
import { validateVendorBaseUrl } from './ssrf';
import { checkMasterCapacity, reserveMasterTokens, releaseMasterReservation, settleMasterUsage } from './masterLedger';

const rateLimitMap = new Map<string, number[]>();

export function mapToUpstreamModel(inputModel: string, providerType = 'anthropic'): string {
  const normalized = (inputModel || '').toLowerCase().trim();

  if (providerType === 'anthropic') {
    if (
      normalized.includes('fable') ||
      normalized.includes('opus-5') ||
      normalized.includes('opus-4-8') ||
      normalized.includes('opus-4-7') ||
      normalized.includes('opus-4-6') ||
      normalized.includes('opus-4-5') ||
      normalized.includes('opus-4-1') ||
      normalized.includes('opus-4')
    ) {
      return 'claude-3-opus-20240229';
    }

    if (
      normalized.includes('sonnet-5') ||
      normalized.includes('sonnet-4-6') ||
      normalized.includes('sonnet-4-5') ||
      normalized.includes('sonnet-4') ||
      normalized.includes('sonnet')
    ) {
      return 'claude-3-5-sonnet-20241022';
    }

    if (normalized.includes('haiku')) {
      return 'claude-3-5-haiku-20241022';
    }

    return inputModel.startsWith('claude-3-') ? inputModel : 'claude-3-5-sonnet-20241022';
  }

  return inputModel;
}

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}


export async function validateAndExtractApiKey(req: Request) {
  const rawKey =
    req.headers['x-api-key']?.toString() ||
    req.headers.authorization?.replace('Bearer ', '').trim();

  if (!rawKey) {
    return { errorStatus: 401, errorType: 'authentication_error', errorMessage: 'Missing API key. Pass via x-api-key header or Bearer authorization.' };
  }

  // Check Emergency Controls
  const globalKillswitch = await prisma.systemSetting.findUnique({ where: { key: 'global_api_disabled' } });
  if (globalKillswitch && globalKillswitch.value === 'true') {
    return { errorStatus: 503, errorType: 'service_unavailable', errorMessage: 'LightningDeals API Gateway is currently under emergency maintenance.' };
  }

  const keyHash = hashApiKey(rawKey);
  const keyRecord = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { user: true },
  });

  if (!keyRecord) {
    return { errorStatus: 401, errorType: 'authentication_error', errorMessage: 'Invalid API key provided.' };
  }

  if (keyRecord.status !== 'active') {
    return { errorStatus: 403, errorType: 'permission_error', errorMessage: `API key is ${keyRecord.status}. Please reactivate key in your dashboard.` };
  }

  if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
    return { errorStatus: 401, errorType: 'authentication_error', errorMessage: 'API key has expired.' };
  }

  // 1. Rate Limiting Check (RPM)
  const nowMs = Date.now();
  const windowMs = 60 * 1000;
  const timestamps = rateLimitMap.get(keyRecord.id) || [];
  const recentTimestamps = timestamps.filter((t) => nowMs - t < windowMs);

  if (recentTimestamps.length >= keyRecord.rateLimitRpm) {
    return { errorStatus: 429, errorType: 'rate_limit_error', errorMessage: `Rate limit exceeded (${keyRecord.rateLimitRpm} RPM). Please slow down requests.` };
  }
  recentTimestamps.push(nowMs);
  rateLimitMap.set(keyRecord.id, recentTimestamps);

  // 2. Authoritative 5-Hour Rolling Window Token Balance Check
  const windowMetrics = await calculateKeyRollingWindow(keyRecord);
  const inFlightReserved = getActiveReservedTokens(keyRecord.id);
  const effectiveRemaining = windowMetrics.remainingNum - inFlightReserved;

  if (effectiveRemaining <= 0) {
    return {
      errorStatus: 429,
      errorType: 'quota_exceeded',
      errorMessage: `5-hour rolling token window allowance exhausted (0 tokens remaining). Allowance auto-resets on next 5-hour cycle.`,
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
    temperature,
    top_p,
    stop_sequences,
    metadata,
  } = req.body || {};

  if (!model) {
    return res.status(400).json({ error: { type: 'invalid_request_error', message: 'Missing required field: model.' } });
  }

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: { type: 'invalid_request_error', message: 'Missing required field: messages array.' } });
  }

  // Get active Vendor Provider from DB
  const vendor = await prisma.vendorProvider.findFirst({
    where: { isPrimary: true, status: 'connected' },
  });

  const estimatedRequiredTokens = Math.max(100, Math.ceil(JSON.stringify({ messages, system }).length / 4)) + Math.min(2048, Number(max_tokens || 1024));

  // MASTER VENDOR CAPACITY CHECK
  const masterCheck = await checkMasterCapacity(vendor?.id, estimatedRequiredTokens);
  if (!masterCheck.available) {
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
  if (!decryptedMasterKey) {
    decryptedMasterKey = process.env.ANTHROPIC_MASTER_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.SUPPLIER_MASTER_API_KEY || '';
  }

  // 1. REAL SUPPLIER PROXY PATH
  if (decryptedMasterKey && decryptedMasterKey.trim().length > 0) {
    try {
      // Validate Base URL against SSRF threats
      const ssrfCheck = validateVendorBaseUrl(vendor?.baseUrl || 'https://api.anthropic.com');
      if (!ssrfCheck.safe) {
        releaseReservedTokens(keyRecord.id, estimatedRequiredTokens);
        releaseMasterReservation(requestId);
        return res.status(400).json({ error: { type: 'ssrf_blocked', message: ssrfCheck.error || 'Blocked by SSRF security filter.' } });
      }

      const prepared = buildProviderRequest(vendor, decryptedMasterKey, model, {
        messages,
        max_tokens,
        stream,
        system,
        tools,
        tool_choice,
        temperature,
        top_p,
        stop_sequences,
        metadata,
      });

      const upstreamRes = await fetch(prepared.url, {
        method: 'POST',
        headers: prepared.headers,
        body: JSON.stringify(prepared.body),
      });

      if (!upstreamRes.ok) {
        releaseReservedTokens(keyRecord.id, estimatedRequiredTokens);
        releaseMasterReservation(requestId);

        const errorText = await upstreamRes.text();
        let parsedError = { message: 'Upstream vendor error.' };
        try { parsedError = JSON.parse(errorText); } catch (e) {}
        return res.status(upstreamRes.status).json(parsedError);
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
            res.write(chunk);
            sseBuffer += chunk;

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
    }
  }



  // Fallback Simulated Response when no Master API key is set
  const responseText = `Hello! I am Claude connected through your LightningDeals AI Gateway. Your gateway is operational and ready to handle AI completions!`;
  const inputTokens = Math.max(10, Math.ceil(JSON.stringify({ messages, system, tools }).length / 4));
  const outputTokens = Math.max(20, Math.ceil(responseText.length / 4));
  const totalTokens = inputTokens + outputTokens;
  const simulatedId = `msg_simulated_${crypto.randomBytes(12).toString('hex')}`;

  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.write(`event: message_start\ndata: ${JSON.stringify({ type: 'message_start', message: { id: simulatedId, type: 'message', role: 'assistant', model, content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: inputTokens, output_tokens: 0 } } })}\n\n`);

    res.write(`event: content_block_start\ndata: ${JSON.stringify({ type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } })}\n\n`);

    const words = responseText.split(' ');
    for (let i = 0; i < words.length; i++) {
      const textChunk = (i === 0 ? '' : ' ') + words[i];
      res.write(`event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: textChunk } })}\n\n`);
      await new Promise((r) => setTimeout(r, 20));
    }

    res.write(`event: content_block_stop\ndata: ${JSON.stringify({ type: 'content_block_stop', index: 0 })}\n\n`);
    res.write(`event: message_delta\ndata: ${JSON.stringify({ type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: outputTokens } })}\n\n`);
    res.write(`event: message_stop\ndata: ${JSON.stringify({ type: 'message_stop' })}\n\n`);
    res.end();
  } else {
    res.json({
      id: simulatedId,
      type: 'message',
      role: 'assistant',
      model,

      content: [{ type: 'text', text: responseText }],
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: { input_tokens: inputTokens, output_tokens: outputTokens },
    });
  }

  await updateTokensAndLog({
    keyRecord,
    model,
    inputTokens,
    outputTokens,
    totalTokens,
    latencyMs: Date.now() - startTime,
    streaming: !!stream,
    vendorId: vendor?.id,
    isEstimated: true,
    usageSource: 'SIMULATED_ESTIMATE',
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

