import { prisma } from '../../db';
import { AgentContext, ToolDefinition, ToolExecutionResult } from './types';
import { PRODUCT_CATALOG_WITHOUT_PRICES, matchProduct } from '../whatsappEngine';
import { NegotiatedPriceService } from '../negotiatedPriceService';
import { ReferralEngine } from '../../referrals/referralEngine';
import { KnowledgeService } from './knowledgeService';

// Detailed descriptions for LLM tool selection
export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'getProducts',
    description: 'Browse the product catalog. Returns product names, descriptions, and feature lists. Does NOT include internal prices.',
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Optional category filter, e.g. "ai", "design", "coding", "productivity"' },
      },
    },
  },
  {
    name: 'searchProducts',
    description: 'Search products by keyword, developer need, or use case (e.g., "video editing", "coding", "cheap api", "thumbnails").',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The search term or customer requirement' },
      },
      required: ['query'],
    },
  },
  {
    name: 'authenticateCustomer',
    description: 'Link customer account by email to unlock their orders, subscriptions, credits, and active price quotes.',
    parameters: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'Customer registered email address' },
      },
      required: ['email'],
    },
  },
  {
    name: 'getCustomerOrders',
    description: 'Retrieve order history for an authenticated customer.',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'string', description: 'Number of orders to retrieve (default: 5)' },
      },
    },
  },
  {
    name: 'getCustomerSubscriptions',
    description: 'Retrieve active subscriptions and tool accesses for the authenticated customer.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'getCustomerCredits',
    description: 'Retrieve Lightning Credits balance and reward cashback information for the authenticated customer.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'getReferralCode',
    description: 'Retrieve customer referral link, code, and earnings stats.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'checkPaymentStatus',
    description: 'Authoritative payment verification. Checks whether PayU payment has actually been captured by backend. NEVER confirm payment without calling this.',
    parameters: {
      type: 'object',
      properties: {
        orderId: { type: 'string', description: 'Internal order ID to verify, or omit to check most recent pending order' },
      },
    },
  },
  {
    name: 'getApprovedPrice',
    description: 'Check if an active pre-approved negotiated discount price exists for this customer and product.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product identifier, e.g. prod_canva_pro' },
      },
      required: ['productId'],
    },
  },
  {
    name: 'createNegotiatedPriceRequest',
    description: 'Request a customized discounted price quote from admin when customer asks for pricing or discounts.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID requested' },
        productName: { type: 'string', description: 'Product name' },
        customerBudget: { type: 'string', description: 'Optional customer proposed budget or target amount' },
        notes: { type: 'string', description: 'Optional notes or duration requested' },
      },
      required: ['productId', 'productName'],
    },
  },
  {
    name: 'createPaymentOrder',
    description: 'Generate PayU payment link for an approved negotiated price or verified deal.',
    parameters: {
      type: 'object',
      properties: {
        negotiatedPriceId: { type: 'string', description: 'ID of the active NegotiatedPrice quote' },
      },
      required: ['negotiatedPriceId'],
    },
  },
  {
    name: 'requestHumanHandoff',
    description: 'Handoff conversation to a human support agent when customer explicitly asks or has a complex dispute.',
    parameters: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Why the customer needs a human agent' },
      },
      required: ['reason'],
    },
  },
  {
    name: 'searchKnowledgeBase',
    description: 'Search official enterprise knowledge base for policies, setup guides, FAQs, and objection handling.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Query to search knowledge articles' },
        category: { type: 'string', description: 'Optional category, e.g. "POLICY", "SETUP_GUIDE", "OBJECTION", "FAQ"' },
      },
      required: ['query'],
    },
  },
];

// Rich Product Catalog with detailed consultative selling attributes
export const DETAILED_PRODUCTS = [
  {
    id: 'prod_canva_pro',
    name: 'Canva Pro',
    category: 'design',
    description: 'Unlimited access to 100M+ premium stock photos, graphics, videos, 1TB cloud storage, brand kits, and AI magic tools.',
    features: ['Unlimited Premium Templates', '1TB Cloud Storage', 'Background Remover & Magic Resizer', 'Custom Brand Kits & Fonts'],
    bestFor: 'Graphic designers, content creators, digital marketers, YouTube thumbnail creation',
  },
  {
    id: 'prod_cursor_pro',
    name: 'Cursor Pro AI IDE',
    category: 'coding',
    description: 'AI-first code editor with Claude 3.5 Sonnet codebase indexing, inline code generation, multi-file edits, and instant bug fixing.',
    features: ['Full Codebase Indexing', 'Multi-File Agent Edits', 'Unlimited Fast AI Completions', 'Terminal & Git Integration'],
    bestFor: 'Full-stack software developers, Python/JS/Rust programmers, DevOps engineers',
  },
  {
    id: 'prod_claude_max',
    name: 'Claude Max 5x (20M Tokens)',
    category: 'ai',
    description: 'Massive prepaid Claude 3.5 Sonnet token pool with 200k context window, high concurrency, and zero per-seat lock-in.',
    features: ['20 Million Tokens Allowance', 'Claude 3.5 Sonnet & Opus Access', 'High RPM / Concurrency', 'No Seat Expiry Restrictions'],
    bestFor: 'High-volume AI builders, agentic coding workflows, large document analysis',
  },
  {
    id: 'prod_claude_pro',
    name: 'Claude Pro Account',
    category: 'ai',
    description: 'Official private Anthropic Claude Pro account with Claude 3.5 Sonnet, Projects workspace, and Artifacts support.',
    features: ['5x More Usage than Free', 'Access to Claude 3.5 Sonnet', 'Projects & Knowledge Artifacts', 'Priority Access during Peak Hours'],
    bestFor: 'Writers, researchers, analysts, and general AI power users',
  },
  {
    id: 'prod_chatgpt_team',
    name: 'ChatGPT Team Workspace',
    category: 'ai',
    description: 'Enterprise-grade ChatGPT workspace with GPT-4o, OpenAI o1 reasoning, Advanced Data Analysis, DALL-E 3, and dedicated privacy.',
    features: ['GPT-4o & OpenAI o1 Reasoning', 'Higher Message Limits', 'Data Privacy (Not Used for Training)', 'Custom GPT Builder & Shared Team Workspace'],
    bestFor: 'Startup teams, agencies, researchers, and professional workflows',
  },
  {
    id: 'prod_adobe_creative',
    name: 'Adobe Creative Cloud',
    category: 'design',
    description: 'Complete suite of 20+ desktop creative apps including Photoshop, Premiere Pro, Illustrator, After Effects, and Adobe Firefly AI.',
    features: ['Photoshop, Premiere Pro, Illustrator, After Effects', 'Generative Fill with Adobe Firefly', '100GB Cloud Storage', 'Adobe Fonts & Creative Cloud Libraries'],
    bestFor: 'Professional video editors, photographers, digital artists, VFX animators',
  },
  {
    id: 'prod_midjourney',
    name: 'Midjourney Mega Plan',
    category: 'ai',
    description: 'Photorealistic AI image generation with Fast GPU hours, stealth mode generation, and commercial license.',
    features: ['Fast GPU Hours for Instant Image Gen', 'Stealth Mode (Private Generations)', 'Commercial Usage Rights', 'Unlimited Relaxed GPU Generations'],
    bestFor: 'Concept artists, game designers, advertising agencies, visual creators',
  },
  {
    id: 'prod_custom',
    name: 'Custom Developer API Bundle',
    category: 'coding',
    description: 'Unified high-throughput proxy for Anthropic Claude, OpenAI, and Google Gemini with token accounting and dashboard analytics.',
    features: ['Single API Endpoint for All Models', 'Zero Rate-Limit Headaches', 'Real-time Token Ledger', 'Custom Team Quotas'],
    bestFor: 'SaaS companies, AI product developers, enterprise backend teams',
  },
];

export class ToolRegistry {
  /**
   * Executes a tool securely with parameter validation, error trapping, and audit logging
   */
  static async executeTool(
    toolName: string,
    args: Record<string, any>,
    context: AgentContext
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    let result: ToolExecutionResult;

    try {
      switch (toolName) {
        case 'getProducts':
          result = await this.handleGetProducts(args);
          break;
        case 'searchProducts':
          result = await this.handleSearchProducts(args);
          break;
        case 'authenticateCustomer':
          result = await this.handleAuthenticateCustomer(args, context);
          break;
        case 'getCustomerOrders':
          result = await this.handleGetCustomerOrders(args, context);
          break;
        case 'getCustomerSubscriptions':
          result = await this.handleGetCustomerSubscriptions(context);
          break;
        case 'getCustomerCredits':
          result = await this.handleGetCustomerCredits(context);
          break;
        case 'getReferralCode':
          result = await this.handleGetReferralCode(context);
          break;
        case 'checkPaymentStatus':
          result = await this.handleCheckPaymentStatus(args, context);
          break;
        case 'getApprovedPrice':
          result = await this.handleGetApprovedPrice(args, context);
          break;
        case 'createNegotiatedPriceRequest':
          result = await this.handleCreateNegotiatedPriceRequest(args, context);
          break;
        case 'createPaymentOrder':
          result = await this.handleCreatePaymentOrder(args, context);
          break;
        case 'requestHumanHandoff':
          result = await this.handleRequestHumanHandoff(args, context);
          break;
        case 'searchKnowledgeBase':
          result = await this.handleSearchKnowledgeBase(args);
          break;
        default:
          result = {
            toolName,
            success: false,
            data: null,
            error: `Unknown tool: ${toolName}`,
          };
      }
    } catch (err: any) {
      result = {
        toolName,
        success: false,
        data: null,
        error: err.message || 'Execution failed',
      };
    }

    const duration = Date.now() - startTime;

    // Log tool execution in database for observability
    try {
      await prisma.aIToolExecution.create({
        data: {
          conversationId: context.conversationId,
          toolName,
          inputPayload: JSON.stringify(args || {}),
          outputPayload: JSON.stringify(result.data || { error: result.error }),
          status: result.success ? 'SUCCESS' : 'FAILED',
          executionTimeMs: duration,
        },
      });
    } catch (logErr: any) {
      console.warn('[TOOL LOGGING ERROR]', logErr.message);
    }

    return result;
  }

  // --- TOOL IMPLEMENTATIONS ---

  private static async handleGetProducts(args: Record<string, any>): Promise<ToolExecutionResult> {
    const category = args.category?.toLowerCase();
    let prods = DETAILED_PRODUCTS;
    if (category) {
      prods = prods.filter((p) => p.category.includes(category) || p.name.toLowerCase().includes(category));
    }
    return {
      toolName: 'getProducts',
      success: true,
      data: {
        products: prods.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          description: p.description,
          features: p.features,
          bestFor: p.bestFor,
        })),
        notice: 'Official enterprise discounts are customized per customer by our team.',
      },
    };
  }

  private static async handleSearchProducts(args: Record<string, any>): Promise<ToolExecutionResult> {
    const query = (args.query || '').toLowerCase().trim();
    if (!query) {
      return this.handleGetProducts({});
    }

    const matches = DETAILED_PRODUCTS.filter((p) => {
      const text = `${p.name} ${p.category} ${p.description} ${p.features.join(' ')} ${p.bestFor}`.toLowerCase();
      return text.includes(query) || query.split(/\s+/).some((token) => token.length > 2 && text.includes(token));
    });

    return {
      toolName: 'searchProducts',
      success: true,
      data: {
        matchedCount: matches.length,
        products: matches.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          bestFor: p.bestFor,
          keyFeature: p.features[0],
        })),
      },
    };
  }

  private static async handleAuthenticateCustomer(
    args: Record<string, any>,
    context: AgentContext
  ): Promise<ToolExecutionResult> {
    const email = (args.email || '').toLowerCase().trim();
    if (!email || !email.includes('@')) {
      return {
        toolName: 'authenticateCustomer',
        success: false,
        data: null,
        error: 'Please provide a valid email address.',
      };
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        subscriptions: { where: { status: 'ACTIVE' }, take: 3 },
        orders: { take: 3, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!user) {
      return {
        toolName: 'authenticateCustomer',
        success: false,
        data: { found: false, email },
        error: `No account registered with ${email}. Customer can register quickly on lightningapi.pro.`,
      };
    }

    // Link customer to conversation
    await prisma.whatsAppConversation.update({
      where: { id: context.conversationId },
      data: {
        customerId: user.id,
        customerName: user.name || context.customerName,
      },
    });

    // Ensure WhatsAppCustomerIdentity record exists
    await prisma.whatsAppCustomerIdentity.upsert({
      where: { whatsappNumber: context.whatsappNumber },
      create: {
        customerId: user.id,
        whatsappNumber: context.whatsappNumber,
        verified: true,
      },
      update: {
        customerId: user.id,
        verified: true,
      },
    });

    return {
      toolName: 'authenticateCustomer',
      success: true,
      data: {
        found: true,
        customerId: user.id,
        name: user.name,
        email: user.email,
        availableCredits: user.availableCredits,
        activeSubscriptionsCount: user.subscriptions.length,
        recentOrdersCount: user.orders.length,
      },
    };
  }

  private static async handleGetCustomerOrders(
    args: Record<string, any>,
    context: AgentContext
  ): Promise<ToolExecutionResult> {
    if (!context.customerId) {
      return {
        toolName: 'getCustomerOrders',
        success: false,
        data: null,
        error: 'Customer is not authenticated yet. Please ask for their registered email address.',
      };
    }

    const limit = parseInt(args.limit || '5', 10);
    const orders = await prisma.order.findMany({
      where: { userId: context.customerId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 10),
      select: {
        id: true,
        internalOrderId: true,
        planName: true,
        amountInr: true,
        status: true,
        paymentStatus: true,
        fulfillmentStatus: true,
        createdAt: true,
      },
    });

    return {
      toolName: 'getCustomerOrders',
      success: true,
      data: {
        totalOrders: orders.length,
        orders: orders.map((o) => ({
          orderId: o.internalOrderId,
          product: o.planName,
          amount: `₹${o.amountInr}`,
          status: o.status,
          date: o.createdAt.toISOString().split('T')[0],
        })),
      },
    };
  }

  private static async handleGetCustomerSubscriptions(context: AgentContext): Promise<ToolExecutionResult> {
    if (!context.customerId) {
      return {
        toolName: 'getCustomerSubscriptions',
        success: false,
        data: null,
        error: 'Customer is not authenticated yet. Please ask for their registered email address.',
      };
    }

    const subs = await prisma.subscription.findMany({
      where: { userId: context.customerId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      toolName: 'getCustomerSubscriptions',
      success: true,
      data: {
        subscriptions: subs.map((s) => ({
          toolName: s.toolName,
          status: s.status,
          planType: s.planType,
          expiresAt: s.currentPeriodEnd ? s.currentPeriodEnd.toISOString().split('T')[0] : 'Active',
        })),
      },
    };
  }

  private static async handleGetCustomerCredits(context: AgentContext): Promise<ToolExecutionResult> {
    if (!context.customerId) {
      return {
        toolName: 'getCustomerCredits',
        success: false,
        data: null,
        error: 'Customer is not authenticated yet. Please ask for their registered email address.',
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: context.customerId },
      select: {
        availableCredits: true,
        lifetimeCreditsEarned: true,
        lifetimeCreditsRedeemed: true,
      },
    });

    return {
      toolName: 'getCustomerCredits',
      success: true,
      data: {
        availableCredits: user?.availableCredits || 0,
        lifetimeEarned: user?.lifetimeCreditsEarned || 0,
        lifetimeRedeemed: user?.lifetimeCreditsRedeemed || 0,
        cashValue: `₹${user?.availableCredits || 0} discount value`,
      },
    };
  }

  private static async handleGetReferralCode(context: AgentContext): Promise<ToolExecutionResult> {
    if (!context.customerId) {
      return {
        toolName: 'getReferralCode',
        success: false,
        data: null,
        error: 'Customer is not authenticated yet. Please ask for their registered email address.',
      };
    }

    const stats = await ReferralEngine.getReferralStats(context.customerId);
    return {
      toolName: 'getReferralCode',
      success: true,
      data: stats,
    };
  }

  private static async handleCheckPaymentStatus(
    args: Record<string, any>,
    context: AgentContext
  ): Promise<ToolExecutionResult> {
    const orderId = args.orderId?.trim();

    let order = null;
    if (orderId) {
      order = await prisma.order.findFirst({
        where: {
          OR: [{ internalOrderId: orderId }, { id: orderId }],
        },
      });
    } else if (context.currentOrderId) {
      order = await prisma.order.findUnique({
        where: { id: context.currentOrderId },
      });
    } else if (context.customerId) {
      order = await prisma.order.findFirst({
        where: { userId: context.customerId },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!order) {
      return {
        toolName: 'checkPaymentStatus',
        success: false,
        data: {
          verified: false,
          status: 'NOT_FOUND',
        },
        error: 'No matching order found to verify.',
      };
    }

    const isPaid = order.paymentStatus === 'PAID' || order.status === 'COMPLETED';

    return {
      toolName: 'checkPaymentStatus',
      success: true,
      data: {
        orderId: order.internalOrderId,
        productName: order.planName,
        amountInr: order.amountInr,
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
        fulfillmentStatus: order.fulfillmentStatus,
        verified: isPaid,
        advice: isPaid
          ? 'Payment is verified! Order is confirmed.'
          : 'Payment is not yet confirmed by the bank/gateway. Advise customer to wait 1-2 minutes or check PayU transaction ID.',
      },
    };
  }

  private static async handleGetApprovedPrice(
    args: Record<string, any>,
    context: AgentContext
  ): Promise<ToolExecutionResult> {
    if (!context.customerId) {
      return {
        toolName: 'getApprovedPrice',
        success: false,
        data: null,
        error: 'Customer must be authenticated with their email to retrieve personalized quotes.',
      };
    }

    const productId = args.productId;
    const now = new Date();

    const quote = await prisma.negotiatedPrice.findFirst({
      where: {
        customerId: context.customerId,
        status: 'ACTIVE',
        expiresAt: { gt: now },
        ...(productId && { productId }),
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!quote) {
      return {
        toolName: 'getApprovedPrice',
        success: true,
        data: {
          hasApprovedPrice: false,
          message: 'No pre-approved price quote currently active for this product.',
        },
      };
    }

    return {
      toolName: 'getApprovedPrice',
      success: true,
      data: {
        hasApprovedPrice: true,
        negotiatedPriceId: quote.id,
        productId: quote.productId,
        productName: quote.productName,
        amount: quote.amount,
        currency: quote.currency,
        expiresAt: quote.expiresAt.toISOString(),
      },
    };
  }

  private static async handleCreateNegotiatedPriceRequest(
    args: Record<string, any>,
    context: AgentContext
  ): Promise<ToolExecutionResult> {
    const { productId, productName, customerBudget, notes } = args;

    // Check if customer already has an active price quote
    if (context.customerId) {
      const activeQuote = await prisma.negotiatedPrice.findFirst({
        where: {
          customerId: context.customerId,
          productId,
          status: 'ACTIVE',
          expiresAt: { gt: new Date() },
        },
      });

      if (activeQuote) {
        return {
          toolName: 'createNegotiatedPriceRequest',
          success: true,
          data: {
            status: 'ALREADY_APPROVED',
            quote: {
              id: activeQuote.id,
              amount: activeQuote.amount,
              productName: activeQuote.productName,
            },
          },
        };
      }
    }

    // Flag conversation as WAITING_ADMIN with price inquiry metadata
    await prisma.whatsAppConversation.update({
      where: { id: context.conversationId },
      data: {
        status: 'WAITING_ADMIN',
        currentState: 'AWAITING_ADMIN_PRICE',
        currentProductId: productId,
        currentProductName: productName,
        adminNotes: `Price request for ${productName}. Budget: ${customerBudget || 'Not specified'}. Notes: ${notes || 'None'}`,
      },
    });

    return {
      toolName: 'createNegotiatedPriceRequest',
      success: true,
      data: {
        status: 'REQUEST_SUBMITTED',
        message: 'Price quotation request logged for admin. Team will review and approve custom discount.',
      },
    };
  }

  private static async handleCreatePaymentOrder(
    args: Record<string, any>,
    context: AgentContext
  ): Promise<ToolExecutionResult> {
    const { negotiatedPriceId } = args;
    if (!negotiatedPriceId) {
      return {
        toolName: 'createPaymentOrder',
        success: false,
        data: null,
        error: 'Negotiated price ID is required to generate payment link.',
      };
    }

    try {
      const result = await NegotiatedPriceService.convertToOrderAndGeneratePaymentLink({
        negotiatedPriceId,
        adminId: 'system-ai-agent',
        customerPhone: context.whatsappNumber,
      });

      return {
        toolName: 'createPaymentOrder',
        success: true,
        data: {
          orderId: result.order.internalOrderId,
          productName: result.order.planName,
          amountInr: result.order.amountInr,
          paymentUrl: result.paymentUrl,
        },
      };
    } catch (e: any) {
      return {
        toolName: 'createPaymentOrder',
        success: false,
        data: null,
        error: e.message,
      };
    }
  }

  private static async handleRequestHumanHandoff(
    args: Record<string, any>,
    context: AgentContext
  ): Promise<ToolExecutionResult> {
    const reason = args.reason || 'Customer requested human support';

    await prisma.whatsAppConversation.update({
      where: { id: context.conversationId },
      data: {
        status: 'HUMAN_HANDOFF',
        currentState: 'HUMAN_HANDOFF',
        isHumanTakeover: true,
        takeoverReason: reason,
        takenOverAt: new Date(),
        adminNotes: `Human handoff triggered: ${reason}`,
      },
    });

    return {
      toolName: 'requestHumanHandoff',
      success: true,
      data: {
        status: 'HUMAN_HANDOFF_ACTIVATED',
        reason,
      },
    };
  }

  private static async handleSearchKnowledgeBase(args: Record<string, any>): Promise<ToolExecutionResult> {
    const query = args.query || '';
    const category = args.category;
    const articles = await KnowledgeService.searchKnowledge(query, category, 2);

    return {
      toolName: 'searchKnowledgeBase',
      success: true,
      data: {
        articles: articles.map((a) => ({
          title: a.title,
          category: a.category,
          content: a.content,
        })),
      },
    };
  }
}
