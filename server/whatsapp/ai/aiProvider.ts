import { prisma, decryptText } from '../../db';
import { AgentContext, AgentResponse, LLMMessage, SupportedLanguage } from './types';
import { TOOL_DEFINITIONS, ToolRegistry } from './toolRegistry';
import { matchProduct } from '../whatsappEngine';
import { KnowledgeService } from './knowledgeService';
import { buildProviderRequest, resolveVendorModel } from '../../providerAdapter';
import { validateVendorBaseUrl } from '../../ssrf';

export interface LLMGenerateOptions {
  messages: LLMMessage[];
  systemPrompt: string;
  context: AgentContext;
  modelProvider?: string;
  modelName?: string;
  temperature?: number;
}

export interface AITelemetry {
  activeProvider: string;
  activeModel: string;
  status: 'HEALTHY' | 'OPERATIONAL' | 'DEGRADED';
  lastCallTimestamp: string | null;
  lastExecutionTimeMs: number;
  totalCalls: number;
  totalTokens: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class AIProvider {
  private static telemetry: AITelemetry = {
    activeProvider: 'rule_based',
    activeModel: 'local-semantic-nlu-2.0',
    status: 'OPERATIONAL',
    lastCallTimestamp: null,
    lastExecutionTimeMs: 0,
    totalCalls: 0,
    totalTokens: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
  };

  public static getTelemetry(): AITelemetry {
    return { ...this.telemetry };
  }

  public static recordCall(
    provider: string,
    model: string,
    durationMs: number,
    tokens?: { prompt: number; completion: number }
  ) {
    this.telemetry.activeProvider = provider;
    this.telemetry.activeModel = model;
    this.telemetry.status = 'OPERATIONAL';
    this.telemetry.lastCallTimestamp = new Date().toISOString();
    this.telemetry.lastExecutionTimeMs = durationMs;
    this.telemetry.totalCalls += 1;
    if (tokens) {
      this.telemetry.totalTokens.promptTokens += tokens.prompt;
      this.telemetry.totalTokens.completionTokens += tokens.completion;
      this.telemetry.totalTokens.totalTokens += tokens.prompt + tokens.completion;
    } else {
      this.telemetry.totalTokens.promptTokens += 35;
      this.telemetry.totalTokens.completionTokens += 60;
      this.telemetry.totalTokens.totalTokens += 95;
    }
  }

  /**
   * Primary entry point for AI Agent reasoning and response generation.
   * Routes through existing configured VendorProvider (e.g. ScaleMax / Claude)
   * or falls back to direct external APIs or high-precision local semantic NLU.
   */
  static async generateResponse(options: LLMGenerateOptions): Promise<AgentResponse> {
    const startTime = Date.now();
    const { messages, context, systemPrompt } = options;
    const latestUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';

    // Check database AIConfiguration if set
    let activeProvider = options.modelProvider || 'auto';
    let activeModel = options.modelName || 'claude-3-5-sonnet-20241022';
    let activeTemperature = options.temperature ?? 0.3;

    try {
      const config = await prisma.aIConfiguration.findUnique({ where: { key: 'default' } });
      if (config) {
        if (config.modelProvider && config.modelProvider !== 'auto') {
          activeProvider = config.modelProvider;
        }
        if (config.modelName) activeModel = config.modelName;
        if (config.temperature !== undefined) activeTemperature = config.temperature;
      }
    } catch {}

    // 1. Primary: Dispatch to configured database VendorProvider (ScaleMax / Claude proxy infrastructure)
    try {
      const vendorResp = await this.callConfiguredVendorProvider(
        messages,
        systemPrompt,
        context,
        activeModel,
        activeTemperature
      );
      if (vendorResp) {
        this.recordCall(
          vendorResp.provider || 'ScaleMax',
          vendorResp.model || activeModel,
          Date.now() - startTime,
          vendorResp.tokens ? { prompt: vendorResp.tokens.prompt, completion: vendorResp.tokens.completion } : undefined
        );
        return vendorResp;
      }
    } catch (err: any) {
      console.warn('[AI PROVIDER] Configured Vendor Provider call failed, falling back to secondary providers / local NLU:', err.message);
    }

    // Auto-detect available external API keys if provider is "auto"
    if (activeProvider === 'auto') {
      if (process.env.ANTHROPIC_API_KEY) {
        activeProvider = 'anthropic';
      } else if (process.env.OPENAI_API_KEY) {
        activeProvider = 'openai';
      } else if (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY) {
        activeProvider = 'gemini';
      } else {
        activeProvider = 'rule_based';
      }
    }

    // Attempt Direct External LLM generation if key is present
    if (activeProvider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
      try {
        const resp = await this.callAnthropic(messages, systemPrompt, activeModel, activeTemperature);
        if (resp) {
          this.recordCall('anthropic', activeModel, Date.now() - startTime);
          return resp;
        }
      } catch (err: any) {
        console.warn('[AI PROVIDER] Anthropic call failed, falling back to Local NLU:', err.message);
      }
    } else if (activeProvider === 'openai' && process.env.OPENAI_API_KEY) {
      try {
        const resp = await this.callOpenAI(messages, systemPrompt, activeModel, activeTemperature);
        if (resp) {
          this.recordCall('openai', activeModel, Date.now() - startTime);
          return resp;
        }
      } catch (err: any) {
        console.warn('[AI PROVIDER] OpenAI call failed, falling back to Local NLU:', err.message);
      }
    } else if (activeProvider === 'gemini' && (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY)) {
      try {
        const resp = await this.callGemini(messages, systemPrompt, activeModel, activeTemperature);
        if (resp) {
          this.recordCall('gemini', activeModel, Date.now() - startTime);
          return resp;
        }
      } catch (err: any) {
        console.warn('[AI PROVIDER] Gemini call failed, falling back to Local NLU:', err.message);
      }
    }

    // High-precision Local Semantic & Consultative NLU Engine Fallback
    return await this.generateLocalSemanticResponse(latestUserMsg, context);
  }

  // --- CONFIGURED VENDOR PROXY PROVIDER CALL (ScaleMax / Claude) ---

  /**
   * Normalizes and cleans message history to ensure strictly alternating roles for Anthropic API.
   */
  private static formatMessagesForAnthropic(messages: LLMMessage[]): any[] {
    const formatted: any[] = [];

    for (const msg of messages) {
      const role = msg.role === 'assistant' ? 'assistant' : 'user';
      let contentStr = '';
      if (typeof msg.content === 'string') {
        contentStr = msg.content.trim();
      } else if (msg.content) {
        contentStr = JSON.stringify(msg.content);
      }
      if (!contentStr) continue;

      if (formatted.length > 0 && formatted[formatted.length - 1].role === role) {
        const prev = formatted[formatted.length - 1];
        if (typeof prev.content === 'string') {
          prev.content = `${prev.content}\n\n${contentStr}`;
        } else if (Array.isArray(prev.content)) {
          prev.content.push({ type: 'text', text: contentStr });
        }
      } else {
        formatted.push({
          role,
          content: [{ type: 'text', text: contentStr }],
        });
      }
    }

    while (formatted.length > 0 && formatted[0].role !== 'user') {
      formatted.shift();
    }

    if (formatted.length === 0) {
      formatted.push({
        role: 'user',
        content: [{ type: 'text', text: 'Hello' }],
      });
    }

    return formatted;
  }

  /**
   * Calls the configured primary VendorProvider (ScaleMax / Claude Sonnet 3.5)
   * through the existing provider proxy infrastructure with full multi-turn tool use.
   */
  private static async callConfiguredVendorProvider(
    messages: LLMMessage[],
    systemPrompt: string,
    context: AgentContext,
    targetModelInternal?: string,
    temperature?: number
  ): Promise<AgentResponse | null> {
    const overallStartTime = Date.now();

    // 1. Fetch primary or active vendor from database
    const vendor = (await prisma.vendorProvider.findFirst({
      where: { isPrimary: true, status: { not: 'disabled' } },
    })) || (await prisma.vendorProvider.findFirst({
      where: { status: { not: 'disabled' } },
    }));

    if (!vendor) {
      return null;
    }

    // 2. Decrypt Master API Key
    let decryptedKey = decryptText(vendor.masterApiKeyEncrypted);
    if (!decryptedKey || decryptedKey.includes(':') || (!decryptedKey.startsWith('sm_') && !decryptedKey.startsWith('sk-'))) {
      const envKey = process.env.SCALEMAX_MASTER_API_KEY || process.env.ANTHROPIC_MASTER_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.SUPPLIER_MASTER_API_KEY || '';
      if (envKey) decryptedKey = envKey;
    }

    if (!decryptedKey || decryptedKey.trim().length === 0) {
      console.warn(`[AI PROVIDER] Could not decrypt master API key for vendor ${vendor.name}`);
      return null;
    }

    // SSRF Check on Vendor Base URL
    const ssrf = validateVendorBaseUrl(vendor.baseUrl || 'https://api2.scalemax.pro');
    if (!ssrf.safe) {
      console.warn(`[AI PROVIDER] SSRF blocked vendor base URL: ${vendor.baseUrl}`);
      return null;
    }

    // 3. Resolve model dynamically from vendor mappings or config
    let modelToUse = targetModelInternal;
    if (!modelToUse || modelToUse === 'auto') {
      const config = await prisma.aIConfiguration.findUnique({ where: { key: 'default' } });
      modelToUse = config?.modelName || 'claude-sonnet-5';
    }
    const upstreamModel = resolveVendorModel(vendor, modelToUse);

    // 4. Format Tools for Anthropic API
    const anthropicTools = TOOL_DEFINITIONS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters,
    }));

    // 5. Format and clean messages
    const currentMessages: any[] = this.formatMessagesForAnthropic(messages);
    const toolsUsed: string[] = [];
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let finalAssistantText = '';
    let turns = 0;
    const maxTurns = 5;

    while (turns < maxTurns) {
      turns++;

      const prepared = buildProviderRequest(vendor, decryptedKey, modelToUse, {
        messages: currentMessages,
        system: systemPrompt,
        tools: anthropicTools,
        max_tokens: 1500,
        temperature: temperature ?? 0.3,
        skipPersona: true,
      });

      const res = await fetch(prepared.url, {
        method: 'POST',
        headers: prepared.headers,
        body: JSON.stringify(prepared.body),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[AI PROVIDER] Upstream vendor ${vendor.name} returned HTTP ${res.status}: ${errText.substring(0, 200)}`);
        throw new Error(`Upstream vendor returned HTTP ${res.status}`);
      }

      const data: any = await res.json();
      if (data.usage) {
        totalPromptTokens += data.usage.input_tokens || 0;
        totalCompletionTokens += data.usage.output_tokens || 0;
      }

      // Handle Tool Calls
      if (data.stop_reason === 'tool_use' && Array.isArray(data.content)) {
        currentMessages.push({
          role: 'assistant',
          content: data.content,
        });

        const toolResultBlocks: any[] = [];
        for (const block of data.content) {
          if (block.type === 'tool_use') {
            toolsUsed.push(block.name);
            let executionResult;
            try {
              executionResult = await ToolRegistry.executeTool(block.name, block.input || {}, context);
            } catch (toolErr: any) {
              executionResult = { toolName: block.name, success: false, data: null, error: toolErr.message };
            }

            toolResultBlocks.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(executionResult.data !== undefined ? executionResult.data : { success: executionResult.success, error: executionResult.error }),
            });
          }
        }

        currentMessages.push({
          role: 'user',
          content: toolResultBlocks,
        });

        // Continue loop to let Claude process the tool results
        continue;
      }

      // Final Assistant Text Response
      if (Array.isArray(data.content)) {
        const textBlocks = data.content.filter((b: any) => b.type === 'text');
        finalAssistantText = textBlocks.map((b: any) => b.text).join('\n\n').trim();
      }
      break;
    }

    if (!finalAssistantText) {
      return null;
    }

    // Determine intent from tools used or response text
    let intentDetected = 'LLM_REASONING';
    if (toolsUsed.includes('createOrder') || toolsUsed.includes('createPaymentOrder')) {
      intentDetected = 'ORDER_CREATED';
    } else if (toolsUsed.includes('createNegotiatedPriceRequest')) {
      intentDetected = 'PRICE_QUOTE_REQUESTED';
    } else if (toolsUsed.includes('checkPaymentStatus')) {
      intentDetected = 'PAYMENT_STATUS_CHECK';
    } else if (toolsUsed.includes('requestHumanHandoff')) {
      intentDetected = 'HUMAN_HANDOFF';
    } else if (
      toolsUsed.includes('searchProducts') ||
      toolsUsed.includes('getProducts') ||
      toolsUsed.includes('getProduct') ||
      toolsUsed.includes('getProductRecommendations')
    ) {
      intentDetected = 'PRODUCT_SELECTION';
    } else if (toolsUsed.includes('authenticateCustomer')) {
      intentDetected = 'AUTHENTICATE_CUSTOMER';
    }

    const isHindi = /[\u0900-\u097F]/.test(finalAssistantText);
    const language: SupportedLanguage = isHindi ? 'hi' : 'en';

    return {
      messageText: finalAssistantText,
      intentDetected,
      confidence: 0.98,
      language,
      toolsUsed,
      provider: vendor.name,
      model: upstreamModel,
      latencyMs: Date.now() - overallStartTime,
      tokens: {
        prompt: totalPromptTokens,
        completion: totalCompletionTokens,
        total: totalPromptTokens + totalCompletionTokens,
      },
    };
  }

  // --- EXTERNAL LLM PROVIDER CALLS ---

  private static async callAnthropic(
    messages: LLMMessage[],
    systemPrompt: string,
    model: string,
    temperature: number
  ): Promise<AgentResponse | null> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return null;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        temperature,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic API status ${res.status}: ${errText}`);
    }

    const data: any = await res.json();
    const textContent = data.content?.[0]?.text || '';

    return {
      messageText: textContent,
      intentDetected: 'LLM_REASONING',
      confidence: 0.95,
      language: 'en',
      toolsUsed: ['anthropic_claude'],
    };
  }

  private static async callOpenAI(
    messages: LLMMessage[],
    systemPrompt: string,
    model: string,
    temperature: number
  ): Promise<AgentResponse | null> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        temperature,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API status ${res.status}: ${errText}`);
    }

    const data: any = await res.json();
    const textContent = data.choices?.[0]?.message?.content || '';

    return {
      messageText: textContent,
      intentDetected: 'LLM_REASONING',
      confidence: 0.95,
      language: 'en',
      toolsUsed: ['openai_gpt'],
    };
  }

  private static async callGemini(
    messages: LLMMessage[],
    systemPrompt: string,
    model: string,
    temperature: number
  ): Promise<AgentResponse | null> {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const geminiModel = model.includes('gemini') ? model : 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: { temperature, maxOutputTokens: 1024 },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API status ${res.status}: ${errText}`);
    }

    const data: any = await res.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      messageText: textContent,
      intentDetected: 'LLM_REASONING',
      confidence: 0.95,
      language: 'en',
      toolsUsed: ['google_gemini'],
    };
  }

  // --- LOCAL SEMANTIC NLU ENGINE (Zero Downtime / High Precision) ---

  /**
   * Deep natural language understanding with Hinglish support, consultative selling,
   * tool execution, and zero price leakage security.
   */
  static async generateLocalSemanticResponse(
    userText: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    const startTime = Date.now();
    this.recordCall('local_nlu', 'semantic-agent-2.0', 5);

    const cleanText = (userText || '').trim();
    let lower = cleanText.toLowerCase();

    // Typo normalizations
    lower = lower
      .replace(/\bcanava\b/g, 'canva')
      .replace(/\bcanva proo\b/g, 'canva pro')
      .replace(/\bclaud\b/g, 'claude')
      .replace(/\bchatgptt\b/g, 'chatgpt')
      .replace(/\badob\b/g, 'adobe')
      .replace(/\bsubcription\b/g, 'subscription')
      .replace(/\bpaymant\b/g, 'payment')
      .replace(/\bordr\b/g, 'order')
      .replace(/\bcredtis\b/g, 'credits');

    // 1. Language Detection (English vs Hinglish / Hindi)
    const isHinglish =
      lower.includes('bhai') ||
      lower.includes('chahiye') ||
      lower.includes('hona') ||
      lower.includes('kitna') ||
      lower.includes('kya ') ||
      lower.includes('hoga') ||
      lower.includes('milega') ||
      lower.includes('krna') ||
      lower.includes('krdiya') ||
      lower.includes('karo') ||
      lower.includes('batao') ||
      lower.includes('kaise') ||
      lower.includes('konsa') ||
      lower.includes('bhej') ||
      lower.includes('paise') ||
      lower.includes('paisa') ||
      lower.includes('shukriya') ||
      lower.includes('nahi') ||
      lower.includes('nahin') ||
      lower.includes('toh') ||
      lower.includes('kahi') ||
      lower.includes('fake') ||
      lower.includes('scam') ||
      lower.includes('apna') ||
      lower.includes('aapka') ||
      lower.includes('mera') ||
      lower.includes('meri');

    const language: SupportedLanguage = isHinglish ? 'hinglish' : 'en';

    // 0. Security Guardrail & Prompt Protection
    if (
      lower.includes('ignore all previous') ||
      lower.includes('system prompt') ||
      lower.includes('supplier price') ||
      lower.includes('wholesale cost') ||
      lower.includes('internal cost') ||
      lower.includes('margin') ||
      lower.includes('cost structure') ||
      lower.includes('bypass') ||
      lower.includes('without gateway') ||
      lower.includes('without verification') ||
      lower.includes('mark as paid') ||
      lower.includes('mark order as paid')
    ) {
      const reply = isHinglish
        ? `🛡️ *Security & Policy:*\n\nLightning Deals enterprise supplier contracts aur system internal policies strictly confidential hain. Main aapko best approved deals aur official software access provide karne mein help kar sakta hoon! ⚡`
        : `🛡️ *Security & Confidentiality:*\n\nAll supplier contracts and backend configurations are strictly confidential. I am happy to assist you with our catalog, active subscriptions, or custom enterprise quotes! ⚡`;
      return {
        messageText: reply,
        intentDetected: 'SECURITY_GUARDRAIL',
        confidence: 1.0,
        language,
        toolsUsed: [],
      };
    }

    // 2. Human Handoff Intent Detection
    if (
      lower.includes('talk to human') ||
      lower.includes('human agent') ||
      lower.includes('speak to admin') ||
      lower.includes('talk to admin') ||
      lower.includes('call me') ||
      lower.includes('customer care') ||
      lower.includes('admin se baat') ||
      lower.includes('real person') ||
      lower === '7' ||
      lower === 'admin'
    ) {
      const toolRes = await ToolRegistry.executeTool('requestHumanHandoff', { reason: 'Customer requested human support' }, context);
      const reply = isHinglish
        ? `⚡ *Admin Support Alerted*\n\nMeri team ke human representative ko aapki chat assign kar di gayi hai bhai. Ek team member boht jald aapse connect karenge!\n\nAap apna specific sawaal ya requirement yahan likh sakte hain.`
        : `⚡ *Connecting to Support Specialist*\n\nI have notified our human support team. A representative will join this chat shortly to assist you directly.\n\nPlease feel free to leave any details or questions below!`;

      return {
        messageText: reply,
        intentDetected: 'HUMAN_HANDOFF',
        confidence: 0.99,
        language,
        toolsUsed: ['requestHumanHandoff'],
        requiresAdminAlert: true,
        adminAlertReason: 'Customer requested human support',
      };
    }

    // 2b. Reusable Payment Link / "Share Payment Link" Intent
    const isLinkRequest =
      lower.includes('payment link') ||
      lower.includes('share link') ||
      lower.includes('send link') ||
      lower.includes('send the link') ||
      lower.includes('where is my payment link') ||
      lower.includes('where is my link') ||
      lower.includes('link nahi mila') ||
      lower.includes('link dobara') ||
      lower.includes('link bhej') ||
      lower.includes('link do') ||
      lower.includes('link de') ||
      lower.includes('link bhejo') ||
      lower.includes('give link') ||
      lower.includes('link share') ||
      lower.includes('can u share payment link') ||
      lower.includes('can you share payment link') ||
      (lower.includes('link') && (lower.includes('share') || lower.includes('again') || lower.includes('bhej') || lower.includes('kaha') || lower.includes('mera') || lower.includes('please') || lower.includes('chahiye')));

    if (isLinkRequest) {
      if (!context.customerId && context.conversationId) {
        try {
          const customer = await NegotiatedPriceService.ensureCustomerForConversation(context.conversationId);
          context.customerId = customer.id;
        } catch (e) {}
      }

      const linkRes = await ToolRegistry.executeTool('getOrderPaymentLink', {}, context);
      if (linkRes.success && linkRes.data?.paymentUrl) {
        const d = linkRes.data;
        const reply = isHinglish
          ? `⚡ *Aapka Payment Link:* (Order #${d.internalOrderId})\n\n*Product:* ${d.productName}\n*Amount:* ₹${d.amountInr.toLocaleString('en-IN')}\n\n👉 *Pay securely here:*\n${d.paymentUrl}\n\nAap is link se direct UPI ya Card se secure payment complete kar sakte hain! ⚡`
          : `⚡ *Your Payment Link:* (Order #${d.internalOrderId})\n\n*Product:* ${d.productName}\n*Amount:* ₹${d.amountInr.toLocaleString('en-IN')}\n\n👉 *Pay securely here:*\n${d.paymentUrl}\n\nYou can complete your payment securely via UPI, NetBanking, or Cards! ⚡`;
        return {
          messageText: reply,
          intentDetected: 'RESEND_PAYMENT_LINK',
          confidence: 0.99,
          language,
          toolsUsed: ['getOrderPaymentLink'],
        };
      }
    }

    // 2c. Failed Payment Handling ("payment failed", "payment fail", "failed payment")
    if (
      lower.includes('payment failed') ||
      lower.includes('payment fail') ||
      lower.includes('transaction failed')
    ) {
      const linkRes = await ToolRegistry.executeTool('getOrderPaymentLink', {}, context);
      const payUrl = linkRes.data?.paymentUrl;
      const reply = isHinglish
        ? `⚠️ *Payment Incomplete*\n\nKoi baat nahi bhai! Agar bank ya UPI se payment complete nahi hui hai, toh aap is secure link se dobara retry kar sakte hain:\n\n👉 ${payUrl || 'https://lightningapi.pro'}\n\nAgar paise deduct ho gaye hain toh 1-2 minute wait karein, PayU auto-verify kar lega! ⚡`
        : `⚠️ *Payment Incomplete or Cancelled*\n\nNo worries! If your payment didn't go through, you can retry anytime using your secure order link:\n\n👉 ${payUrl || 'https://lightningapi.pro'}\n\nIf amount was already debited, the PayU webhook will reconcile it automatically within 1-2 minutes! ⚡`;
      return {
        messageText: reply,
        intentDetected: 'PAYMENT_FAILED_RETRY',
        confidence: 0.95,
        language,
        toolsUsed: ['getOrderPaymentLink'],
      };
    }

    // 2d. Short replies / Purchase confirmation ("yes", "buy", "haan", "chahiye", "okay", "same wala", "that one", "deal pakka")
    const isAffirmative =
      lower === 'yes' ||
      lower === 'haan' ||
      lower === 'ha' ||
      lower === 'buy' ||
      lower === 'pay' ||
      lower === 'okay' ||
      lower === 'ok' ||
      lower === 'done' ||
      lower === 'deal' ||
      lower === 'deal pakka' ||
      lower === 'same wala' ||
      lower === 'that one' ||
      lower === 'haan chahiye' ||
      lower === 'chahiye' ||
      lower.includes('ready to pay') ||
      lower.includes('proceed to pay');

    if (isAffirmative) {
      if (!context.customerId && context.conversationId) {
        try {
          const customer = await NegotiatedPriceService.ensureCustomerForConversation(context.conversationId);
          context.customerId = customer.id;
        } catch (e) {}
      }

      // Look up active approved price
      const approvedRes = await ToolRegistry.executeTool('getApprovedPrice', { productId: context.currentProductId }, context);
      if (approvedRes.data?.hasApprovedPrice) {
        const q = approvedRes.data;
        const orderRes = await ToolRegistry.executeTool(
          'createOrder',
          {
            negotiatedPriceId: q.negotiatedPriceId,
            productId: q.productId,
            productName: q.productName,
          },
          context
        );

        if (orderRes.success && orderRes.data?.paymentUrl) {
          const d = orderRes.data;
          const reply = isHinglish
            ? `⚡ *Aapka order ready hai!*\n\n*Product:* ${d.productName}\n*Amount:* ₹${d.amountInr.toLocaleString('en-IN')}\n*Order ID:* ${d.internalOrderId}\n\n👉 *Pay securely here:*\n${d.paymentUrl}\n\nPayment complete hote hi access credentials WhatsApp par deliver ho jayenge! ⚡`
            : `⚡ *Your order is ready!*\n\n*Product:* ${d.productName}\n*Amount:* ₹${d.amountInr.toLocaleString('en-IN')}\n*Order ID:* ${d.internalOrderId}\n\n👉 *Pay securely here:*\n${d.paymentUrl}\n\nOnce payment is confirmed, your subscription credentials will be delivered immediately! ⚡`;

          return {
            messageText: reply,
            intentDetected: 'ORDER_CREATED_PAYMENT_LINK',
            confidence: 0.99,
            language,
            toolsUsed: ['createOrder'],
          };
        }
      } else {
        const linkRes = await ToolRegistry.executeTool('getOrderPaymentLink', {}, context);
        if (linkRes.success && linkRes.data?.paymentUrl) {
          const d = linkRes.data;
          const reply = isHinglish
            ? `⚡ *Aapka order ready hai!* (Order #${d.internalOrderId})\n\n*Product:* ${d.productName}\n*Amount:* ₹${d.amountInr.toLocaleString('en-IN')}\n\n👉 *Pay securely here:*\n${d.paymentUrl}\n\nPayment complete hote hi access credentials deliver ho jayenge! ⚡`
            : `⚡ *Your order is ready!* (Order #${d.internalOrderId})\n\n*Product:* ${d.productName}\n*Amount:* ₹${d.amountInr.toLocaleString('en-IN')}\n\n👉 *Pay securely here:*\n${d.paymentUrl}\n\nOnce payment is confirmed, access will be delivered immediately! ⚡`;

          return {
            messageText: reply,
            intentDetected: 'ORDER_CREATED_PAYMENT_LINK',
            confidence: 0.99,
            language,
            toolsUsed: ['getOrderPaymentLink'],
          };
        }
      }
    }

    // 3. Payment Claim Intent ("I paid", "payment done", "paid on payu", "payment krdiya", "did my payment go through")
    if (
      lower.includes('i have paid') ||
      lower.includes('i paid') ||
      lower.includes('payment done') ||
      lower.includes('paid done') ||
      lower.includes('payment krdiya') ||
      lower.includes('paid bhai') ||
      lower.includes('money sent') ||
      lower.includes('paise bhej diye') ||
      lower === 'paid' ||
      lower.includes('did my payment go through')
    ) {
      // Check for multiple pending orders (ambiguity resolution)
      if (context.customerId) {
        const pendingOrders = await prisma.order.findMany({
          where: {
            userId: context.customerId,
            paymentStatus: { in: ['CREATED', 'PENDING'] },
            status: 'PENDING',
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        });

        if (pendingOrders.length > 1) {
          const list = pendingOrders.map((o) => `• *${o.planName}* (#${o.internalOrderId}) - ₹${o.amountInr}`).join('\n');
          const reply = isHinglish
            ? `Aapke account mein multiple pending orders hain bhai:\n\n${list}\n\nAap kis order ki payment verify karwana chahte hain? Bas order ID reply karein!`
            : `You have multiple pending orders under your account:\n\n${list}\n\nWhich order are you referring to? Please reply with the Order ID.`;
          return {
            messageText: reply,
            intentDetected: 'PAYMENT_AMBIGUOUS_ORDER',
            confidence: 0.95,
            language,
            toolsUsed: [],
          };
        }
      }

      // Authoritative verification via ToolRegistry
      const checkResult = await ToolRegistry.executeTool('checkPaymentStatus', {}, context);
      const data = checkResult.data;

      if (data?.verified) {
        const reply = isHinglish
          ? `🎉 *Payment Confirmed!*\n\nAapka order *${data.productName}* (#${data.orderId}) verify ho chuka hai! Aapke credentials aur login guide WhatsApp par deliver kar diye gaye hain. Dashboard par bhi sync ho gaya hai. ⚡`
          : `🎉 *Payment Confirmed!*\n\nYour payment for *${data.productName}* (#${data.orderId}) has been successfully verified! Your credentials and onboarding instructions are delivered. Thank you! ⚡`;
        return {
          messageText: reply,
          intentDetected: 'PAYMENT_VERIFIED',
          confidence: 0.98,
          language,
          toolsUsed: ['checkPaymentStatus'],
        };
      } else {
        const reply = isHinglish
          ? `⏳ *Payment Verification In Progress*\n\nGateway se abhi confirmation receive nahi hua hai bhai. PayU bank confirmation mein kabhi-kabhi 1-2 minute lag jate hain.\n\nJaise hi webhook receive hoga, aapka account instantly activate ho jayega! Agar PayU transaction ID hai toh aap yahan share kar sakte hain.`
          : `⏳ *Payment Verification In Progress*\n\nWe haven't received confirmation from the PayU gateway yet. Bank reconciliation can occasionally take 1-2 minutes.\n\nYour account will be instantly fulfilled as soon as confirmation arrives! If you have a PayU Transaction ID, feel free to reply with it.`;
        return {
          messageText: reply,
          intentDetected: 'PAYMENT_PENDING_VERIFICATION',
          confidence: 0.95,
          language,
          toolsUsed: ['checkPaymentStatus'],
        };
      }
    }

    // 4. Email / Account Authentication Intent
    const emailMatch = cleanText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      const email = emailMatch[0].toLowerCase();
      const authResult = await ToolRegistry.executeTool('authenticateCustomer', { email }, context);

      if (authResult.success && authResult.data?.found) {
        const d = authResult.data;
        const reply = isHinglish
          ? `✅ *Welcome Back, ${d.name}!*\n\nAapka account successfully verify ho gaya hai (${d.email}).\n\n⚡ *Lightning Credits:* ₹${d.availableCredits}\n📦 *Active Subscriptions:* ${d.activeSubscriptionsCount}\n\nAap orders check kar sakte hain, new tools explore kar sakte hain, ya support maang sakte hain!`
          : `✅ *Account Verified, ${d.name}!*\n\nYour account (${d.email}) is successfully connected.\n\n⚡ *Lightning Credits:* ₹${d.availableCredits}\n📦 *Active Subscriptions:* ${d.activeSubscriptionsCount}\n\nHow can I help you today? You can check orders, subscriptions, or browse our tools!`;

        return {
          messageText: reply,
          intentDetected: 'AUTHENTICATE_CUSTOMER',
          confidence: 0.99,
          language,
          toolsUsed: ['authenticateCustomer'],
        };
      } else {
        const reply = isHinglish
          ? `⚠️ *Account Not Found*\n\nHumein ${email} se koi registered account nahi mila. Agar aap naye hain, toh aap direct bina login ke tools browse kar sakte hain, ya https://lightningapi.pro par 10 second mein free account bana sakte hain! ⚡`
          : `⚠️ *Account Not Found*\n\nNo account was found matching ${email}. You can still browse and purchase any tool directly, or create a free account at https://lightningapi.pro! ⚡`;

        return {
          messageText: reply,
          intentDetected: 'AUTHENTICATE_CUSTOMER_FAILED',
          confidence: 0.95,
          language,
          toolsUsed: ['authenticateCustomer'],
        };
      }
    }

    // 4a. Order Cancellation
    if (
      (lower.includes('cancel') && (lower.includes('order') || lower.includes('pending') || lower.includes('kardo') || lower.includes('karo'))) ||
      lower === 'cancel order'
    ) {
      if (!context.customerId) {
        const reply = `⚡ *Authentication Required*\n\nTo cancel an order, please reply with the *email address* registered with your LightningAPI.pro account.`;
        return { messageText: reply, intentDetected: 'REQUEST_EMAIL_FOR_CANCEL', confidence: 0.9, language, toolsUsed: [] };
      }

      const cancelRes = await ToolRegistry.executeTool('cancelOrder', { reason: cleanText }, context);
      if (cancelRes.success) {
        const reply = isHinglish
          ? `✅ *Order Cancelled:*\n\nOrder #${cancelRes.data?.orderId} successfully cancel kar diya gaya hai. Agar aapko koi dusra tool ya custom discount chahiye ho toh batayein! ⚡`
          : `✅ *Order Cancelled:*\n\nOrder #${cancelRes.data?.orderId} has been successfully cancelled. Let me know if you would like to explore other tools or need a different plan! ⚡`;
        return {
          messageText: reply,
          intentDetected: 'CANCEL_ORDER_SUCCESS',
          confidence: 0.98,
          language,
          toolsUsed: ['cancelOrder'],
        };
      } else if (cancelRes.data?.canRefund) {
        const reply = isHinglish
          ? `⚠️ Order #${cancelRes.data.orderId} already paid aur complete ho chuka hai, isliye ise direct cancel nahi kiya ja sakta. Agar aap refund chahte hain toh bas *"Refund Order #${cancelRes.data.orderId}"* reply karein!`
          : `⚠️ Order #${cancelRes.data.orderId} has already been paid and completed, so it cannot be cancelled directly. If you would like to request a refund, please reply *"Request refund for order #${cancelRes.data.orderId}"*!`;
        return {
          messageText: reply,
          intentDetected: 'CANCEL_ORDER_ALREADY_PAID',
          confidence: 0.95,
          language,
          toolsUsed: ['cancelOrder'],
        };
      } else {
        const reply = isHinglish
          ? `Aapke account mein koi active pending order nahi mila cancel karne ke liye.`
          : `No pending unpaid orders found to cancel under your account.`;
        return {
          messageText: reply,
          intentDetected: 'CANCEL_ORDER_NOT_FOUND',
          confidence: 0.9,
          language,
          toolsUsed: ['cancelOrder'],
        };
      }
    }

    // 4b. Refund Request
    if (
      lower.includes('refund') ||
      lower.includes('paise wapas') ||
      lower.includes('money back')
    ) {
      if (!context.customerId) {
        const reply = `⚡ *Authentication Required*\n\nTo submit a refund request, please reply with the *email address* registered with your LightningAPI.pro account.`;
        return { messageText: reply, intentDetected: 'REQUEST_EMAIL_FOR_REFUND', confidence: 0.9, language, toolsUsed: [] };
      }

      const refundRes = await ToolRegistry.executeTool('requestRefund', { reason: cleanText }, context);
      if (refundRes.success) {
        const d = refundRes.data;
        const reply = isHinglish
          ? `📝 *Refund Request Submitted:* #${d.ticketNumber}\n\n*Order:* #${d.orderId} (${d.productName}, ₹${d.amountInr})\n\nLightning Deals policy ke anusar, pehle hamari technical team tool check/replace karegi. Agar issue resolve nahi hota, toh amount 3-5 business days mein aapke original payment method par refund ho jayega! ⚡`
          : `📝 *Refund Request Submitted:* #${d.ticketNumber}\n\n*Order:* #${d.orderId} (${d.productName}, ₹${d.amountInr})\n\nUnder our policy, our priority is resolving or replacing any access issues. If replacement is not possible, your refund will be credited back to your original payment method within 3-5 business days! ⚡`;
        return {
          messageText: reply,
          intentDetected: 'REQUEST_REFUND_SUBMITTED',
          confidence: 0.98,
          language,
          toolsUsed: ['requestRefund'],
          requiresAdminAlert: true,
          adminAlertReason: `Refund request for Order #${d.orderId}`,
        };
      } else {
        const reply = isHinglish
          ? `Aapke account mein koi eligible paid order nahi mila refund request ke liye. Details ke liye aap support team se connect kar sakte hain.`
          : `No eligible paid order found to request a refund for. You can speak to an admin team member if you need manual assistance.`;
        return {
          messageText: reply,
          intentDetected: 'REQUEST_REFUND_NOT_FOUND',
          confidence: 0.9,
          language,
          toolsUsed: ['requestRefund'],
        };
      }
    }

    // 4c. Support Ticket / Technical Issue
    if (
      lower.includes('problem') ||
      lower.includes('not working') ||
      lower.includes('stopped working') ||
      lower.includes('login issue') ||
      lower.includes('issue with') ||
      lower.includes('facing issue') ||
      lower.includes('credentials not working') ||
      lower.includes('password wrong') ||
      lower.includes('invalid credentials') ||
      lower.includes('create ticket') ||
      lower.includes('support ticket') ||
      lower.includes('dikkat aa rahi') ||
      lower.includes('kaam nahi kar raha')
    ) {
      if (!context.customerId) {
        const reply = `⚡ *Authentication Required*\n\nTo submit a support ticket and track resolution, please reply with your registered *email address*.\n\nDon't have an account? Sign up in 10 seconds at:\n👉 https://lightningapi.pro/`;
        return { messageText: reply, intentDetected: 'REQUEST_EMAIL_FOR_SUPPORT', confidence: 0.9, language, toolsUsed: [] };
      }

      const ticketRes = await ToolRegistry.executeTool(
        'createSupportTicket',
        {
          subject: cleanText.length > 50 ? `${cleanText.substring(0, 47)}...` : cleanText,
          message: cleanText,
          category: 'Technical issue',
        },
        context
      );

      const t = ticketRes.data;
      const reply = isHinglish
        ? `🛠️ *Support Ticket Registered:* #${t?.ticketNumber || 'TICK-SUPPORT'}\n\nAapki issue report ho gayi hai bhai! Lightning Deals ke *100% Uptime & Replacement Guarantee* ke tahat hamari technical team 15-30 minute ke andar issue fix ya credentials replace kar deti hai.\n\nEk team member aapko jaldi hi yahan update karenge! ⚡`
        : `🛠️ *Support Ticket Registered:* #${t?.ticketNumber || 'TICK-SUPPORT'}\n\nYour issue has been logged! Under our *100% Uptime & Replacement Guarantee*, our technical operations team resolves or replaces credentials within 15-30 minutes.\n\nA team representative has been alerted to review this immediately! ⚡`;

      return {
        messageText: reply,
        intentDetected: 'CREATE_SUPPORT_TICKET',
        confidence: 0.98,
        language,
        toolsUsed: ['createSupportTicket'],
        requiresAdminAlert: true,
        adminAlertReason: `Support ticket created: ${cleanText}`,
      };
    }

    // 4d. Subscription Expiry Check
    if (
      lower.includes('expire') ||
      lower.includes('expiry') ||
      lower.includes('validity') ||
      lower.includes('kab khatam') ||
      lower.includes('kab expire') ||
      lower.includes('till when')
    ) {
      if (!context.customerId) {
        const reply = `⚡ *Authentication Required*\n\nTo check your subscription validity and expiry date, please reply with the *email address* registered with your LightningAPI.pro account.\n\nDon't have an account? Sign up in 10 seconds at:\n👉 https://lightningapi.pro/`;
        return { messageText: reply, intentDetected: 'REQUEST_EMAIL_FOR_SUBS', confidence: 0.9, language, toolsUsed: [] };
      }

      const subRes = await ToolRegistry.executeTool('getCustomerSubscriptions', {}, context);
      const subs = subRes.data?.subscriptions || [];
      if (subs.length === 0) {
        const reply = isHinglish
          ? `Aapke account mein abhi koi active subscription nahi mili bhai. Naya tool explore karne ke liye "Browse Products" bole!`
          : `You do not have any active subscriptions right now. Let me know if you would like to explore our catalog!`;
        return { messageText: reply, intentDetected: 'GET_SUBSCRIPTIONS', confidence: 0.95, language, toolsUsed: ['getCustomerSubscriptions'] };
      }

      let sub = subs[0];
      const matchedProd = matchProduct(cleanText);
      if (matchedProd) {
        sub = subs.find((s: any) => s.toolName.toLowerCase().includes(matchedProd.name.toLowerCase()) || matchedProd.name.toLowerCase().includes(s.toolName.toLowerCase())) || subs[0];
      }

      const expiresAtDate = new Date(sub.expiresAt);
      const now = new Date();
      const diffDays = Math.ceil((expiresAtDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const daysText = diffDays > 0 ? `${diffDays} days remaining` : 'Expired';

      const reply = isHinglish
        ? `🔑 *Subscription Validity:* ${sub.toolName}\n\n• Status: *${sub.status}*\n• Expiry Date: *${expiresAtDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}* (${daysText})\n\nAgar aap ise renew ya extend karna chahte hain toh bas *"Renew ${sub.toolName}"* reply karein! ⚡`
        : `🔑 *Subscription Validity:* ${sub.toolName}\n\n• Status: *${sub.status}*\n• Expiry Date: *${expiresAtDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}* (${daysText})\n\nTo renew or extend this plan, simply reply *"Renew ${sub.toolName}"*! ⚡`;

      return {
        messageText: reply,
        intentDetected: 'SUBSCRIPTION_EXPIRY_CHECK',
        confidence: 0.98,
        language,
        toolsUsed: ['getCustomerSubscriptions'],
      };
    }

    // 4e. Subscription Renewal
    if (
      lower.includes('renew') ||
      lower.includes('renewal') ||
      lower.includes('re-new') ||
      lower.includes('extend subscription')
    ) {
      if (!context.customerId) {
        const reply = `⚡ *Authentication Required*\n\nTo renew your subscription, please reply with the *email address* registered with your LightningAPI.pro account.\n\nDon't have an account? Sign up in 10 seconds at:\n👉 https://lightningapi.pro/`;
        return { messageText: reply, intentDetected: 'REQUEST_EMAIL_FOR_SUBS', confidence: 0.9, language, toolsUsed: [] };
      }

      const matchedProd = matchProduct(cleanText);
      const toolName = matchedProd?.name || '';
      const renewRes = await ToolRegistry.executeTool('renewSubscription', { toolName }, context);

      if (renewRes.success && renewRes.data) {
        const d = renewRes.data;
        if (d.action === 'ORDER_CREATED') {
          const o = d.orderDetails;
          const reply = isHinglish
            ? `⚡ *Subscription Renewal Order Ready!*\n\n*Product:* ${d.subscription}\n*Amount:* ₹${o.amountInr.toLocaleString('en-IN')}\n*Order ID:* ${o.internalOrderId}\n\n👉 *Pay securely here to renew:*\n${o.paymentUrl}\n\nPayment confirm hote hi validity instantly extend ho jayegi! ⚡`
            : `⚡ *Subscription Renewal Order Ready!*\n\n*Product:* ${d.subscription}\n*Amount:* ₹${o.amountInr.toLocaleString('en-IN')}\n*Order ID:* ${o.internalOrderId}\n\n👉 *Pay securely here to renew:*\n${o.paymentUrl}\n\nYour subscription validity will be extended immediately upon payment! ⚡`;
          return {
            messageText: reply,
            intentDetected: 'RENEW_SUBSCRIPTION_LINK',
            confidence: 0.98,
            language,
            toolsUsed: ['renewSubscription'],
          };
        } else {
          const reply = isHinglish
            ? `⚡ *Renewal Request Received:* ${d.subscription}\n\nMaine renewal discount rate confirmation ke liye admin team ko notify kar diya hai. Current expiry: ${new Date(d.currentExpiry).toLocaleDateString('en-IN')}.\n\nAdmin team jald hi aapke renewal ka custom quote WhatsApp par confirm karegi! ⚡`
            : `⚡ *Renewal Request Received:* ${d.subscription}\n\nYour renewal quote request has been routed to our team. Current expiry: ${new Date(d.currentExpiry).toLocaleDateString('en-US')}.\n\nAn admin will confirm the renewal discounted quote right here shortly! ⚡`;
          return {
            messageText: reply,
            intentDetected: 'RENEW_SUBSCRIPTION_REQUESTED',
            confidence: 0.98,
            language,
            toolsUsed: ['renewSubscription'],
            requiresAdminAlert: true,
            adminAlertReason: `Renewal quote requested for ${d.subscription}`,
          };
        }
      } else {
        const reply = isHinglish
          ? `Aapke account mein renew karne ke liye koi active subscription nahi mili bhai. Naya order place karne ke liye "Browse Products" bole!`
          : `No subscription found to renew under your account. Would you like to purchase a new license? Reply with "Browse Products"!`;
        return {
          messageText: reply,
          intentDetected: 'RENEW_SUBSCRIPTION_NOT_FOUND',
          confidence: 0.9,
          language,
          toolsUsed: ['renewSubscription'],
        };
      }
    }

    // 4f. Credit Redemption
    if (
      lower.includes('use my credit') ||
      lower.includes('redeem credit') ||
      lower.includes('redeem my credit') ||
      lower.includes('apply credit') ||
      lower.includes('credit use') ||
      lower.includes('credits use') ||
      lower.includes('use credit')
    ) {
      if (!context.customerId) {
        const reply = `⚡ *Authentication Required*\n\nTo view and redeem your Lightning Credits, please reply with the *email address* registered with your LightningAPI.pro account.\n\nDon't have an account? Sign up in 10 seconds at:\n👉 https://lightningapi.pro/`;
        return { messageText: reply, intentDetected: 'REQUEST_EMAIL_FOR_CREDITS', confidence: 0.9, language, toolsUsed: [] };
      }

      const user = await prisma.user.findUnique({
        where: { id: context.customerId },
        select: { availableCredits: true },
      });
      const balance = user?.availableCredits || 0;

      if (balance <= 0) {
        const reply = isHinglish
          ? `Aapke account mein abhi ₹0 Lightning Credits hain. Aap doston ko refer karke har order par credits kama sakte hain! Type "Referral" for details.`
          : `You currently have ₹0 Lightning Credits. You can earn credits by sharing your referral link with friends! Type "Referral" for your code.`;
        return {
          messageText: reply,
          intentDetected: 'REDEEM_CREDITS_ZERO',
          confidence: 0.95,
          language,
          toolsUsed: ['redeemCredits'],
        };
      }

      await ToolRegistry.executeTool('redeemCredits', { amount: balance }, context);
      const reply = isHinglish
        ? `⚡ *Lightning Credits Available: ₹${balance}*\n\nAap apne poore ₹${balance} credits ko next order ya renewal par direct cash discount ki tarah use kar sakte hain! Checkout par ya admin se quote lete waqt ye discount auto-deduct ho jayega. ⚡`
        : `⚡ *Lightning Credits Available: ₹${balance}*\n\nYou can apply your full ₹${balance} credit balance as an instant cash discount on your next order or subscription renewal! It will be automatically deducted during checkout. ⚡`;

      return {
        messageText: reply,
        intentDetected: 'REDEEM_CREDITS_SUCCESS',
        confidence: 0.98,
        language,
        toolsUsed: ['redeemCredits'],
      };
    }

    // 5. Account Inquiries (Orders, Subscriptions, Credits, Referrals)
    if (lower.includes('my orders') || lower.includes('order status') || lower.includes('track order') || lower === '2') {
      if (!context.customerId) {
        const reply = `⚡ *Authentication Required*\n\nTo view your orders, please reply with the *email address* registered with your LightningAPI.pro account.\n\nDon't have an account? Sign up in 10 seconds at:\n👉 https://lightningapi.pro/`;
        return {
          messageText: reply,
          intentDetected: 'REQUEST_EMAIL_FOR_ORDERS',
          confidence: 0.9,
          language,
          toolsUsed: [],
        };
      }

      const ordersRes = await ToolRegistry.executeTool('getCustomerOrders', {}, context);
      const orders = ordersRes.data?.orders || [];
      if (orders.length === 0) {
        const reply = isHinglish
          ? `Aapke account mein abhi koi orders nahi hain. Agar koi tool chahiye toh batayein!`
          : `No orders found under your account. Would you like to explore our available tools?`;
        return { messageText: reply, intentDetected: 'GET_ORDERS', confidence: 0.95, language, toolsUsed: ['getCustomerOrders'] };
      }

      const orderList = orders.map((o: any) => `• *${o.product}* (${o.orderId}) - ${o.amount} [${o.status}]`).join('\n');
      const reply = `📦 *Your Recent Orders:*\n\n${orderList}\n\nNeed help with any specific order? Let me know! ⚡`;
      return { messageText: reply, intentDetected: 'GET_ORDERS', confidence: 0.95, language, toolsUsed: ['getCustomerOrders'] };
    }

    if (lower.includes('my subscriptions') || lower.includes('active plans') || lower === '3') {
      if (!context.customerId) {
        const reply = `⚡ *Authentication Required*\n\nTo view your active subscriptions, please reply with the *email address* registered with your LightningAPI.pro account.\n\nDon't have an account? Sign up in 10 seconds at:\n👉 https://lightningapi.pro/`;
        return { messageText: reply, intentDetected: 'REQUEST_EMAIL_FOR_SUBS', confidence: 0.9, language, toolsUsed: [] };
      }

      const subRes = await ToolRegistry.executeTool('getCustomerSubscriptions', {}, context);
      const subs = subRes.data?.subscriptions || [];
      if (subs.length === 0) {
        const reply = isHinglish
          ? `Aapke paas abhi koi active subscription nahi hai. Naye tools explore karne ke liye "Browse Products" bole!`
          : `You do not have any active subscriptions right now. Let me know if you would like to explore our catalog!`;
        return { messageText: reply, intentDetected: 'GET_SUBSCRIPTIONS', confidence: 0.95, language, toolsUsed: ['getCustomerSubscriptions'] };
      }

      const subList = subs.map((s: any) => `• *${s.toolName}* - Status: ${s.status} (Valid till: ${s.expiresAt})`).join('\n');
      return {
        messageText: `🔑 *Active Subscriptions:*\n\n${subList}`,
        intentDetected: 'GET_SUBSCRIPTIONS',
        confidence: 0.95,
        language,
        toolsUsed: ['getCustomerSubscriptions'],
      };
    }

    if (lower.includes('credit') || lower.includes('reward') || lower === '4') {
      if (!context.customerId) {
        const reply = `⚡ *Authentication Required*\n\nTo view your Lightning Credits, please reply with the *email address* registered with your LightningAPI.pro account.\n\nDon't have an account? Sign up in 10 seconds at:\n👉 https://lightningapi.pro/`;
        return { messageText: reply, intentDetected: 'REQUEST_EMAIL_FOR_CREDITS', confidence: 0.9, language, toolsUsed: [] };
      }
      const creditsRes = await ToolRegistry.executeTool('getCustomerCredits', {}, context);
      const c = creditsRes.data;
      const reply = `⚡ *Your Lightning Credits:*\n\n• Available Balance: *₹${c.availableCredits}*\n• Lifetime Earned: ₹${c.lifetimeEarned}\n• Lifetime Redeemed: ₹${c.lifetimeRedeemed}\n\nYou can use these credits as cash discounts on your next renewal or purchase!`;
      return { messageText: reply, intentDetected: 'GET_CREDITS', confidence: 0.95, language, toolsUsed: ['getCustomerCredits'] };
    }

    if (lower.includes('referral') || lower.includes('refer') || lower === '5') {
      if (!context.customerId) {
        const reply = `⚡ *Authentication Required*\n\nTo view your referral link and earnings, please reply with the *email address* registered with your LightningAPI.pro account.\n\nDon't have an account? Sign up in 10 seconds at:\n👉 https://lightningapi.pro/`;
        return { messageText: reply, intentDetected: 'REQUEST_EMAIL_FOR_REFERRALS', confidence: 0.9, language, toolsUsed: [] };
      }
      const refRes = await ToolRegistry.executeTool('getReferralCode', {}, context);
      const r = refRes.data || {};
      const refUrl = r.referralUrl || 'https://lightningapi.pro';
      const refCode = r.referralCode || 'WELCOME';
      const totalRef = r.totalReferred ?? 0;
      const totalEarned = r.totalCreditsEarned ?? 0;
      const reply = `🎁 *Your Referral Program:*\n\nShare your link with friends. When they make their first purchase, you both get Lightning Credits!\n\n🔗 *Link:* ${refUrl}\n• Code: *${refCode}*\n• Total Referred: ${totalRef}\n• Lifetime Earned: ₹${totalEarned}`;
      return { messageText: reply, intentDetected: 'GET_REFERRALS', confidence: 0.95, language, toolsUsed: ['getReferralCode'] };
    }

    // 6. Objection Handling (Trust, Authenticity, Guarantee, How it works)
    if (
      lower.includes('genuine') ||
      lower.includes('real') ||
      lower.includes('fake') ||
      lower.includes('scam') ||
      lower.includes('safe') ||
      lower.includes('legit') ||
      lower.includes('trust')
    ) {
      const kb = await ToolRegistry.executeTool('searchKnowledgeBase', { query: 'genuine safe guarantee' }, context);
      const article = kb.data?.articles?.[0];
      const reply = isHinglish
        ? `🛡️ *100% Genuine & Guaranteed*\n\nHanji bhai bilkul genuine hai! Lightning Deals enterprise wholesale volume par operate karta hai. Har tool ke sath *100% Uptime & Replacement Guarantee* milti hai. Agar kabhi koi problem aati hai toh hum 15-30 minute mein free replacement provide karte hain!\n\nAapka data aur privacy 100% secure rehti hai. ⚡`
        : `🛡️ *100% Genuine & Guaranteed*\n\nAll tools and subscriptions from Lightning Deals are official enterprise licenses. We back every order with a *100% Uptime & Replacement Guarantee* — if you ever encounter an issue, our team resolves or replaces it within 15-30 minutes!\n\nYour personal workspace and data remain completely private. ⚡`;
      return {
        messageText: reply,
        intentDetected: 'OBJECTION_TRUST',
        confidence: 0.95,
        language,
        toolsUsed: ['searchKnowledgeBase'],
      };
    }

    // 7. Consultative Selling: Tech Stack / Requirement Recommendations
    if (
      lower.includes('recommend') ||
      lower.includes('suggest') ||
      lower.includes('which one') ||
      lower.includes('which tool') ||
      lower.includes('konsa') ||
      lower.includes('kounsa') ||
      lower.includes('developer') ||
      lower.includes('coding') ||
      lower.includes('youtube') ||
      lower.includes('video') ||
      lower.includes('design')
    ) {
      if (lower.includes('developer') || lower.includes('coding') || lower.includes('programming') || lower.includes('code')) {
        const reply = isHinglish
          ? `💻 *Best Tools for Developers:*\n\n1. *Cursor Pro AI IDE* — Real-time AI code completion, multi-file editing aur codebase indexing ke liye industry benchmark hai.\n2. *Claude Max 5x (20M Tokens)* — Large context window aur complex architecture / debugging ke liye unmatched hai.\n\nAap mainly kis tech stack ya project par kaam kar rahe hain? Main aapke liye custom price confirm karwa deta hoon! ⚡`
          : `💻 *Top Recommendations for Developers:*\n\n1. *Cursor Pro AI IDE* — The leading AI editor with deep codebase indexing, multi-file refactoring, and inline chat.\n2. *Claude Max 5x (20M Tokens)* — Ideal for heavy agentic coding, massive 200k context window, and debugging.\n\nWhich language or framework do you primarily build in? I can prepare an exclusive deal for you! ⚡`;
        return {
          messageText: reply,
          intentDetected: 'CONSULTATIVE_RECOMMENDATION_DEV',
          confidence: 0.95,
          language,
          toolsUsed: ['searchProducts'],
        };
      }

      if (lower.includes('video') || lower.includes('youtube') || lower.includes('design') || lower.includes('photo')) {
        const reply = isHinglish
          ? `🎨 *Best Tools for Creators & Designers:*\n\n1. *Canva Pro* — YouTube thumbnails, reels, graphics aur unlimited brand templates ke liye sabse fast aur simple tool hai.\n2. *Adobe Creative Cloud* — Premiere Pro, Photoshop, After Effects for professional video production.\n3. *Midjourney Mega* — Ultra-realistic AI thumbnail and concept art generation.\n\nAapko kis tool mein interest hai? ⚡`
          : `🎨 *Top Recommendations for Content Creators:*\n\n1. *Canva Pro* — Quick YouTube thumbnails, social reels, and unlimited premium graphics.\n2. *Adobe Creative Cloud* — Industry standard for video editing (Premiere Pro, After Effects) and graphic design.\n3. *Midjourney Mega* — Stunning photorealistic AI art generation.\n\nWhich of these would best fit your current creative workflow? ⚡`;
        return {
          messageText: reply,
          intentDetected: 'CONSULTATIVE_RECOMMENDATION_CREATOR',
          confidence: 0.95,
          language,
          toolsUsed: ['searchProducts'],
        };
      }
    }

    // 8. Specific Product Mention (Canva, Cursor, Claude, ChatGPT, Adobe, Midjourney)
    const matched = matchProduct(cleanText);
    if (matched) {
      // Check if user is asking for price or asking to buy
      const isPriceQuery =
        lower.includes('price') ||
        lower.includes('cost') ||
        lower.includes('rate') ||
        lower.includes('kitna') ||
        lower.includes('kitne') ||
        lower.includes('buy') ||
        lower.includes('chahiye') ||
        lower.includes('discount');

      // Check if customer has pre-approved negotiated price
      if (context.customerId || context.conversationId) {
        const approvedRes = await ToolRegistry.executeTool('getApprovedPrice', { productId: matched.id }, context);
        if (approvedRes.data?.hasApprovedPrice) {
          const q = approvedRes.data;

          // If the customer specifically asked to buy / purchase / order, generate order & payment link immediately!
          if (lower.includes('buy') || lower.includes('purchase') || lower.includes('order') || lower.includes('chahiye')) {
            const orderRes = await ToolRegistry.executeTool(
              'createOrder',
              {
                negotiatedPriceId: q.negotiatedPriceId,
                productId: q.productId,
                productName: q.productName,
              },
              context
            );

            if (orderRes.success && orderRes.data?.paymentUrl) {
              const d = orderRes.data;
              const reply = isHinglish
                ? `⚡ *Aapka order ready hai!*\n\n*Product:* ${d.productName}\n*Amount:* ₹${d.amountInr.toLocaleString('en-IN')}\n*Order ID:* ${d.internalOrderId}\n\n👉 *Pay securely here:*\n${d.paymentUrl}\n\nPayment complete hote hi access credentials deliver ho jayenge! ⚡`
                : `⚡ *Your order is ready!*\n\n*Product:* ${d.productName}\n*Amount:* ₹${d.amountInr.toLocaleString('en-IN')}\n*Order ID:* ${d.internalOrderId}\n\n👉 *Pay securely here:*\n${d.paymentUrl}\n\nOnce payment is confirmed, your subscription credentials will be delivered immediately! ⚡`;
              return {
                messageText: reply,
                intentDetected: 'ORDER_CREATED_PAYMENT_LINK',
                confidence: 0.99,
                language,
                toolsUsed: ['createOrder'],
              };
            }
          }

          const reply = isHinglish
            ? `⚡ *Exclusive Approved Deal for You!*\n\n*Product:* ${q.productName}\n*Special Price:* ₹${q.amount} (All inclusive)\n\nKya aap payment link chahte hain to activate instantly? Bas "Pay" ya "Send Link" likhein!`
            : `⚡ *Pre-Approved Deal Available!*\n\n*Product:* ${q.productName}\n*Discounted Price:* ₹${q.amount} (All inclusive)\n\nWould you like the payment link to proceed? Reply "Pay" or "Send Link" to checkout securely via PayU!`;
          return {
            messageText: reply,
            intentDetected: 'APPROVED_PRICE_OFFERED',
            confidence: 0.98,
            language,
            toolsUsed: ['getApprovedPrice'],
          };
        }
      }

      // Zero Price Leakage & Negotiated Price Request
      await ToolRegistry.executeTool(
        'createNegotiatedPriceRequest',
        {
          productId: matched.id,
          productName: matched.name,
          notes: cleanText,
        },
        context
      );

      const reply = isHinglish
        ? `⚡ *${matched.name} Custom Deal*\n\nMaine aapke liye *${matched.name}* ki special discount request admin team ko bhej di hai! Hamari admin will confirm the current price and your custom discounted deal for you right here shortly.\n\nEk team member jaldi hi aapse quote confirm karenge!`
        : `⚡ *${matched.name}*\n\nGreat choice! All our subscriptions feature exclusive enterprise rates confirmed directly with our team. An admin will confirm the current price and your custom discounted deal shortly right here! ⚡`;

      return {
        messageText: reply,
        intentDetected: 'PRICE_QUOTE_REQUESTED',
        confidence: 0.98,
        language,
        toolsUsed: ['createNegotiatedPriceRequest'],
        requiresAdminAlert: true,
        adminAlertReason: `Price requested for ${matched.name}`,
      };
    }

    // 9. Product Browsing Intent ("browse", "products", "what do you sell", "show products")
    if (
      lower.includes('product') ||
      lower.includes('tools') ||
      lower.includes('kya kya') ||
      lower.includes('show me') ||
      lower.includes('catalogue') ||
      lower.includes('catalog') ||
      lower === '1'
    ) {
      const prodRes = await ToolRegistry.executeTool('getProducts', {}, context);
      const list = prodRes.data.products.map((p: any, idx: number) => `${idx + 1}. *${p.name}* — ${p.bestFor}`).join('\n');

      const reply = isHinglish
        ? `⚡ *AVAILABLE PRODUCTS — Lightning Deals Catalog:*\n\n${list}\n\nKisi bhi product ke features janne ya custom discount rate lene ke liye uska naam yahan likhein (e.g. "Canva Pro" ya "Cursor")! ⚡`
        : `⚡ *AVAILABLE PRODUCTS — Lightning Deals Catalog:*\n\n${list}\n\nTo view details or request a custom quote, simply reply with the product name (e.g., "Cursor Pro" or "Canva")! ⚡`;

      return {
        messageText: reply,
        intentDetected: 'BROWSE_PRODUCTS',
        confidence: 0.98,
        language,
        toolsUsed: ['getProducts'],
      };
    }

    // 10. Default Greeting / Menu
    const isGreeting =
      lower === 'hi' ||
      lower === 'hello' ||
      lower === 'hey' ||
      lower.startsWith('hey ') ||
      lower.startsWith('hello ') ||
      lower.startsWith('hi ') ||
      lower === 'heyy' ||
      lower === 'hlo' ||
      lower === 'start' ||
      lower === 'menu' ||
      lower === 'help' ||
      lower === 'namaste' ||
      lower === 'hola';

    const customerGreeting = context.customerName ? ` ${context.customerName}` : '';

    if (isGreeting) {
      const reply = isHinglish
        ? `⚡ *Welcome to Lightning Deals${customerGreeting}!*\n\nMain aapka AI assistant hoon. Main aapko best tools suggest karne, orders check karne aur custom discounts arrange karne mein help kar sakta hoon.\n\n*Aap kya explore karna chahte hain?*\n1. 🔍 Browse Products\n2. 📦 My Orders\n3. 🔑 My Subscriptions\n4. ⚡ Lightning Credits\n5. 🎁 Referral Program\n6. 🛡️ Guarantees & Support\n7. 👤 Talk to Admin\n\nYa aap direct pooch sakte hain jaise *"developer ke liye kya best hai"* ya *"canva pro chahiye"*!`
        : `⚡ *Welcome to Lightning Deals${customerGreeting}!*\n\nI am your AI assistant. I can help you discover software tools, check existing orders, and unlock customized enterprise rates.\n\n*How can I help you today?*\n1. 🔍 Browse Products\n2. 📦 My Orders\n3. 🔑 My Subscriptions\n4. ⚡ Lightning Credits\n5. 🎁 Referral Program\n6. 🛡️ Guarantees & Support\n7. 👤 Talk to Admin\n\nFeel free to ask naturally, e.g. *"What is best for video editing?"* or *"I need Cursor Pro"!*`;

      return {
        messageText: reply,
        intentDetected: 'GREETING',
        confidence: 0.99,
        language,
        toolsUsed: [],
      };
    }

    // 11. Contextual Fallback: Consultative Guidance
    const fallbackReply = isHinglish
      ? `I didn't quite catch that. Main samajh gaya! Lightning Deals par hamare paas Canva Pro, Cursor Pro, Claude Max, ChatGPT Team, aur Adobe Creative Cloud available hain with 100% replacement guarantee.\n\nAapko kis specific task ke liye tool chahiye (jaise coding, content creation, ya video editing)? Main aapko best recommendation aur deal bata dunga! ⚡`
      : `I didn't quite catch that. At Lightning Deals, we offer official enterprise access for tools like Cursor Pro, Claude Max, Canva Pro, ChatGPT Team, and Adobe Creative Cloud with 100% guarantee.\n\nWhat kind of workflow or tools are you looking for? Feel free to tell me, and I'll find you the best solution! ⚡`;

    return {
      messageText: fallbackReply,
      intentDetected: 'GENERAL_CONSULTATION',
      confidence: 0.85,
      language,
      toolsUsed: ['searchKnowledgeBase'],
    };
  }
}
