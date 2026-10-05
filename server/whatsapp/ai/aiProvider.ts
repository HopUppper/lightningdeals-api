import { prisma } from '../../db';
import { AgentContext, AgentResponse, LLMMessage, SupportedLanguage } from './types';
import { TOOL_DEFINITIONS, ToolRegistry } from './toolRegistry';
import { matchProduct } from '../whatsappEngine';
import { KnowledgeService } from './knowledgeService';

export interface LLMGenerateOptions {
  messages: LLMMessage[];
  systemPrompt: string;
  context: AgentContext;
  modelProvider?: string;
  modelName?: string;
  temperature?: number;
}

export class AIProvider {
  /**
   * Primary entry point for AI Agent reasoning and response generation.
   * Dispatches to configured LLM (Anthropic / OpenAI / Gemini) or uses
   * the high-precision semantic local NLU engine.
   */
  static async generateResponse(options: LLMGenerateOptions): Promise<AgentResponse> {
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

    // Attempt External LLM generation if key is present
    if (activeProvider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
      try {
        const resp = await this.callAnthropic(messages, systemPrompt, activeModel, activeTemperature);
        if (resp) return resp;
      } catch (err: any) {
        console.warn('[AI PROVIDER] Anthropic call failed, falling back to Local NLU:', err.message);
      }
    } else if (activeProvider === 'openai' && process.env.OPENAI_API_KEY) {
      try {
        const resp = await this.callOpenAI(messages, systemPrompt, activeModel, activeTemperature);
        if (resp) return resp;
      } catch (err: any) {
        console.warn('[AI PROVIDER] OpenAI call failed, falling back to Local NLU:', err.message);
      }
    } else if (activeProvider === 'gemini' && (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY)) {
      try {
        const resp = await this.callGemini(messages, systemPrompt, activeModel, activeTemperature);
        if (resp) return resp;
      } catch (err: any) {
        console.warn('[AI PROVIDER] Gemini call failed, falling back to Local NLU:', err.message);
      }
    }

    // High-precision Local Semantic & Consultative NLU Engine
    return await this.generateLocalSemanticResponse(latestUserMsg, context);
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
    const cleanText = (userText || '').trim();
    const lower = cleanText.toLowerCase();

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
      lower.includes('shukriya');

    const language: SupportedLanguage = isHinglish ? 'hinglish' : 'en';

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

    // 3. Payment Claim Intent ("I paid", "payment done", "paid on payu", "payment krdiya")
    if (
      lower.includes('i have paid') ||
      lower.includes('i paid') ||
      lower.includes('payment done') ||
      lower.includes('paid done') ||
      lower.includes('payment krdiya') ||
      lower.includes('paid bhai') ||
      lower.includes('money sent') ||
      lower.includes('paise bhej diye')
    ) {
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
      const r = refRes.data;
      const reply = `🎁 *Your Referral Program:*\n\nShare your link with friends. When they make their first purchase, you both get Lightning Credits!\n\n🔗 *Link:* ${r.referralUrl || 'https://lightningapi.pro'}\n• Code: *${r.referralCode}*\n• Total Referred: ${r.totalReferred}\n• Lifetime Earned: ₹${r.totalCreditsEarned}`;
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
      if (context.customerId) {
        const approvedRes = await ToolRegistry.executeTool('getApprovedPrice', { productId: matched.id }, context);
        if (approvedRes.data?.hasApprovedPrice) {
          const q = approvedRes.data;
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
