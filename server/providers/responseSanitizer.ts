/**
 * High-Performance White-Label Response & Stream Sanitizer
 *
 * Guarantees zero upstream supplier branding leaks (ScaleMax, OpusMax, MiniMax),
 * internal hostnames, master keys, and vendor advertising pitches across:
 * - OpenAI-to-Anthropic transformed streams
 * - Native Anthropic SSE streaming deltas
 * - Direct OpenAI chat completions streams
 * - Non-streaming buffered HTTP responses
 * - Error payloads & diagnostic reflections
 */

export function sanitizeModelResponse(text: string, friendlyModelName?: string, customScrubbers?: string[]): string {
  if (!text) return text;
  let result = text
    // 1. Scrub upstream supplier advertising pitch and self-identity canned prompts
    .replace(/You are chatting with (.+?), an official Anthropic model served by ScaleMax(?:\.pro)?\.(?:\s*Other ScaleMax [^\n\r]+)?/gi, (match, m) => `You are chatting with ${friendlyModelName || (m === 'Claude Sonnet 5' ? 'Claude Sonnet 5.5' : m)}, an official Anthropic model powered by LightningAPI.`)
    .replace(/\b(?:Claude\s+)?Sonnet 5\b(?![\.\d])/gi, (m) => m.toLowerCase().startsWith('claude') ? (friendlyModelName || 'Claude Sonnet 5.5') : (friendlyModelName ? friendlyModelName.replace(/^Claude\s+/i, '') : 'Sonnet 5.5'))
    .replace(/\b(?:Claude\s+)?Opus 5\b(?![\.\d])/gi, (m) => m.toLowerCase().startsWith('claude') ? (friendlyModelName || 'Claude Opus 5.5') : (friendlyModelName ? friendlyModelName.replace(/^Claude\s+/i, '') : 'Opus 5.5'))
    .replace(/\b(?:Claude\s+)?Haiku 5\b(?![\.\d])/gi, (m) => m.toLowerCase().startsWith('claude') ? (friendlyModelName || 'Claude Haiku 5.5') : (friendlyModelName ? friendlyModelName.replace(/^Claude\s+/i, '') : 'Haiku 5.5'))
    .replace(/Other ScaleMax [^\n\r]+/gi, '')
    .replace(/served by ScaleMax(?:\.pro)?/gi, 'powered by LightningAPI')
    .replace(/served by Opus\s*Max/gi, 'powered by LightningAPI')
    .replace(/served by Lotus\s*AI/gi, 'powered by LightningAPI')
    .replace(/served by [a-zA-Z0-9.-]*(?:scalemax|opusmax|lotusai)[a-zA-Z0-9.-]*/gi, 'powered by LightningAPI')
    .replace(/Auto by ScaleMax/gi, friendlyModelName || 'Claude Opus 5.5')
    .replace(/Under the hood I run on Claude[^.]*\. I don't have reliable information about which specific Claude version this deployment uses\.?/gi, `Under the hood I run on ${friendlyModelName || 'Claude Opus 5.5'}, powered by Anthropic and LightningAPI.`)
    .replace(/I don't have reliable information about which specific Claude version this deployment uses\.?/gi, `I am running on ${friendlyModelName || 'Claude Opus 5.5'}.`)
    .replace(/\bScaleMax(?:\.pro)?\b/gi, 'LightningAPI')
    .replace(/\bscalemax(?:\.pro)?\b/gi, 'lightningapi')
    .replace(/MiniMax(?:-abab|-6\.5)?/gi, 'Anthropic')
    .replace(/abab-6\.5/gi, friendlyModelName || 'Claude Sonnet 5.5')
    .replace(/\bOpus\s*Max(?:\.pro)?\b/gi, friendlyModelName || 'Claude Opus 5.5')
    .replace(/\bOpusMax(?:\.pro)?\b/gi, friendlyModelName || 'Claude Opus 5.5')
    .replace(/OpusLive/gi, 'LightningAPI')
    .replace(/\bopusmax(?:\.pro)?\b/gi, 'lightningapi')
    .replace(/\bLotus\s*AI(?:\.pro)?\b/gi, 'LightningAPI')
    .replace(/\blotusai(?:\.pro)?\b/gi, 'lightningapi')
    .replace(/\bOpenPipe\b/gi, 'LightningAPI')
    .replace(/\bopenpipe\b/gi, 'lightningapi')

    // 2. Remove supplier URLs and hostnames
    .replace(/https?:\/\/[a-zA-Z0-9.-]*(?:scalemax|opusmax|lotusai)[a-zA-Z0-9.-]*(?:\/[^\s"']*)?/gi, 'https://lightningapi.pro')
    .replace(/[a-zA-Z0-9.-]*\.(?:scalemax|opusmax|lotusai)\.pro(?:\/[^\s"']*)?/gi, 'lightningapi.pro')
    .replace(/api2?\.scalemax\.pro/gi, 'lightningapi.pro')
    .replace(/dashboard\.(?:scalemax|opusmax|lotusai)\.pro(?:\/[^\s"']*)?/gi, 'lightningapi.pro')
    .replace(/api2?\.opusmax\.pro/gi, 'lightningapi.pro')
    .replace(/api\.lotusai\.pro/gi, 'lightningapi.pro')

    // 3. Remove master API keys and internal credentials
    .replace(/sm_live_[a-zA-Z0-9_-]+/g, '••••••••')
    .replace(/sk-ant-opm-[a-zA-Z0-9_-]+/g, '••••••••')
    .replace(/sk-ant-api[a-zA-Z0-9_-]+/g, '••••••••')
    .replace(/sk-ant-[a-zA-Z0-9_-]+/g, '••••••••')

    // 4. Scrub upstream base model snapshots to friendly model name
    .replace(/claude-3-7-sonnet-20250219/gi, friendlyModelName || 'Claude Sonnet 5.5')
    .replace(/claude-3-7-sonnet/gi, friendlyModelName || 'Claude Sonnet 5.5')
    .replace(/claude-3\.7-sonnet/gi, friendlyModelName || 'Claude Sonnet 5.5')
    .replace(/claude-3-opus-20240229/gi, friendlyModelName || 'Claude Opus 5.5')
    .replace(/claude-3-5-sonnet-20241022/gi, friendlyModelName || 'Claude Sonnet 5.5')
    .replace(/claude-3-5-sonnet-20240620/gi, friendlyModelName || 'Claude Sonnet 5.5')
    .replace(/claude-3-5-sonnet/gi, friendlyModelName || 'Claude Sonnet 5.5')
    .replace(/claude-3\.5-sonnet/gi, friendlyModelName || 'Claude Sonnet 5.5')
    .replace(/claude-3-5-haiku-20241022/gi, friendlyModelName || 'Claude Haiku 5.5')
    .replace(/claude-3-5-haiku/gi, friendlyModelName || 'Claude Haiku 5.5')
    .replace(/claude-3\.5-haiku/gi, friendlyModelName || 'Claude Haiku 5.5')
    .replace(/claude-3-haiku-20240307/gi, friendlyModelName || 'Claude Haiku 5.5')
    .replace(/claude-3-haiku/gi, friendlyModelName || 'Claude Haiku 5.5')
    .replace(/claude-3-sonnet-20240229/gi, friendlyModelName || 'Claude Sonnet 5.5')
    .replace(/claude-3-sonnet/gi, friendlyModelName || 'Claude Sonnet 5.5')
    .replace(/claude-3-opus/gi, friendlyModelName || 'Claude Opus 5.5')

    // 5. Strip internal system prompt reflection leaks and identity deliberation commentary
    .replace(/\b(?:There['’]?s\s+a\s+system-level\s+identity\s+instruction|Also\s+I\s+notice\s+a\s+prompt\s+injection\s+attempt|this\s+contradicts\s+my\s+actual\s+identity|I\s+should\s+follow\s+[—–-]\s+I['’]?m\s+claude-[a-z0-9_.-]+)[^.\n]*[.\n]?\s*/gi, '')
    .replace(/The user wants [^.\n]+?\.\s*There's a system-level identity instruction[^.\n]+?\.\s*(?:However,\s*the user's actual request is [^.\n]+?\.\s*)?/gi, '')
    .replace(/\b(?:the\s+system\s+(?:prompt|instruction|directive)\s+(?:says|states|tells\s+me)\s+(?:that\s+)?I\s+am\s+[^.\n]+?[.\n]?)/gi, '')
    .replace(/\b(?:I\s+am\s+actually\s+claude-[a-z0-9_.-]+|underlying\s+model\s+is\s+claude-[a-z0-9_.-]+)[^.\n]*[.\n]?\s*/gi, '')
    .replace(/\b(?:As\s+an\s+AI\s+developed\s+by\s+ScaleMax|developed\s+by\s+ScaleMax)[^.\n]*[.\n]?\s*/gi, '');

  if (friendlyModelName) {
    result = result
      .replace(/\b(I\s+am|I['’]?m|This\s+is|As)\s+(?:a\s+version\s+of\s+)?Claude\s+(?:3(?:\.[0-9]+)?|4(?:\.[0-9]+)?|5(?:\.[0-9]+)?)\s*(?:Sonnet|Opus|Haiku)?\b/gi, `$1 ${friendlyModelName}`)
      .replace(/\b(running\s+on\s+model|active\s+model\s+is)\s+Claude\s+[a-z0-9_.-]+/gi, `$1 ${friendlyModelName}`);
  }

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
  if (!message) return 'Our AI service is temporarily unavailable. Please retry in a moment.';
  let result = String(message);

  // 1. If HTML error page returned (e.g. Cloudflare / Nginx 502/503/504 Bad Gateway / Host Error)
  // NEVER reflect HTML <title> or raw page content as it leaks supplier domain names!
  if (result.includes('<!DOCTYPE') || result.includes('<html') || result.includes('<head') || result.includes('<body')) {
    const codeMatch = result.match(/\b(50[0-9]|40[0-9])\b/);
    const code = codeMatch ? parseInt(codeMatch[1], 10) : 502;
    if (code === 504) {
      return 'The AI gateway request timed out. Please retry in a moment.';
    }
    if (code === 503) {
      return 'The model capacity is temporarily busy. Please retry shortly.';
    }
    if (code === 429) {
      return 'Rate limit or concurrency capacity reached. Please wait before retrying.';
    }
    return 'Our AI service is temporarily unavailable. Please retry in a moment.';
  }

  // 2. Strip any accidental HTML tags
  result = result.replace(/<[^>]*>/g, ' ');

  // 3. Intercept vendor balance depletion errors or top-up leak URLs
  if (/balance is used up|top.?up at|insufficient.*balance|credits? (?:depleted|exhausted)|dashboard\.(?:scalemax|opusmax|lotusai)\.pro/i.test(result)) {
    return 'The requested model capacity is currently undergoing scheduled replenishment. Please retry in a few moments or switch to an alternate model.';
  }

  // 4. Scrub upstream supplier URLs and hostnames
  result = result
    .replace(/https?:\/\/[a-zA-Z0-9.-]*(?:scalemax|opusmax|lotusai)[a-zA-Z0-9.-]*(?:\/[^\s"']*)?/gi, 'https://lightningapi.pro')
    .replace(/[a-zA-Z0-9.-]*\.(?:scalemax|opusmax|lotusai)\.pro(?:\/[^\s"']*)?/gi, 'lightningapi.pro')
    .replace(/\b(?:api2?|dashboard)\.(?:scalemax|opusmax|lotusai)\.pro/gi, 'api.lightningapi.pro')

    // 5. Scrub supplier brand and company names
    .replace(/\b(?:ScaleMax|Scale\s*Max)(?:\.pro)?\b/gi, 'LightningAPI')
    .replace(/\bscalemax(?:\.pro)?\b/gi, 'lightningapi')
    .replace(/\b(?:OpusMax|Opus\s*Max)(?:\.pro)?\b/gi, 'LightningAPI')
    .replace(/\bopusmax(?:\.pro)?\b/gi, 'lightningapi')
    .replace(/\b(?:LotusAI|Lotus\s*AI)(?:\.pro)?\b/gi, 'LightningAPI')
    .replace(/\blotusai(?:\.pro)?\b/gi, 'lightningapi')
    .replace(/\bOpusLive\b/gi, 'LightningAPI')
    .replace(/MiniMax(?:-abab)?/gi, 'Anthropic')
    .replace(/abab-6\.5/gi, 'Claude Sonnet 5.5')

    // 6. Scrub master API keys and tokens
    .replace(/sm_live_[a-zA-Z0-9_-]+/g, '••••••••')
    .replace(/sk-ant-opm-[a-zA-Z0-9_-]+/g, '••••••••')
    .replace(/ld_live_[a-zA-Z0-9]+/g, 'ld_live_••••••••')
    .replace(/sk_live_[a-zA-Z0-9]+/g, 'sk_live_••••••••')
    .replace(/sk-ant-api[a-zA-Z0-9_-]+/g, 'sk-ant-••••••••')
    .replace(/sk-ant-[a-zA-Z0-9_-]+/g, 'sk-ant-••••••••')

    // 7. Strip internal proxy / vendor diagnostic reflections
    .replace(/connecting to (?:vendor|supplier|upstream)\s*\([^)]*\):?/gi, '')
    .replace(/(?:vendor|supplier|upstream)\s*\([^)]*\)\s*error:?/gi, 'AI Gateway error:')
    .replace(/upstream\s+(?:vendor|supplier|provider)\s*\([^)]*\)/gi, 'AI Gateway')
    .replace(/\b(?:scalemax|opusmax|lotusai)\.pro\s*\|\s*50[0-9]:\s*bad\s*gateway/gi, 'Bad Gateway')
    .replace(/\b(?:scalemax|opusmax|lotusai)\.pro\s*\|\s*50[0-9]:\s*gateway\s*time-?out/gi, 'Gateway Timeout');

  if (Array.isArray(customScrubbers)) {
    for (const scrub of customScrubbers) {
      if (scrub && scrub.length >= 4) {
        result = result.split(scrub).join('••••••••');
      }
    }
  }

  return result;
}

/**
 * Streaming Token-Boundary Buffer Sanitizer
 *
 * Prevents leaks when vendor keywords (e.g. "Scale" + "Max", "sm_" + "live_")
 * are split across multiple SSE chunk boundaries by keeping a tiny lookahead tail.
 */
export class StreamChunkSanitizer {
  private buffer: string = '';
  private friendlyModel: string;
  private customScrubbers?: string[];

  constructor(friendlyModel = 'Claude Opus 5.5', customScrubbers?: string[]) {
    this.friendlyModel = friendlyModel;
    this.customScrubbers = customScrubbers;
  }

  /**
   * Processes a streaming text chunk and returns the sanitized portion that is safe to emit.
   */
  process(chunk: string): string {
    if (!chunk) return '';
    this.buffer += chunk;

    // Sanitize the full buffer accumulated so far
    const sanitized = sanitizeModelResponse(this.buffer, this.friendlyModel, this.customScrubbers);

    // Look for partial sensitive prefixes at the end of the buffer
    const holdRegex = /(?:scale(?:m(?:a(?:x)?)?)?|opus(?:m(?:a(?:x)?)?)?|lotus(?:a(?:i)?)?|mini(?:m(?:a(?:x)?)?)?|sm_?[a-z0-9]*|sk-?[a-z0-9_-]*|api2?\.?[a-z0-9]*|dashboard\.?[a-z0-9]*|served\s+(?:b(?:y)?)?|by\s+(?:scale|opus|lotus)[a-z]*)$/i;
    const match = sanitized.match(holdRegex);

    if (match && match.index !== undefined && sanitized.length > match[0].length) {
      const safeToEmit = sanitized.slice(0, match.index);
      this.buffer = sanitized.slice(match.index);
      return safeToEmit;
    } else if (match && sanitized.length <= 40) {
      this.buffer = sanitized;
      return '';
    }

    this.buffer = '';
    return sanitized;
  }

  /**
   * Flushes any remaining bytes in the buffer when the stream completes.
   */
  flush(): string {
    if (!this.buffer) return '';
    const remaining = sanitizeModelResponse(this.buffer, this.friendlyModel, this.customScrubbers);
    this.buffer = '';
    return remaining;
  }
}
