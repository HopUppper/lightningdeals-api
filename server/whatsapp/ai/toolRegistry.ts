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
    name: 'getProduct',
    description: 'Get detailed product specifications, key features, activation procedure, and usage details by product name or ID.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product identifier, e.g. "prod_canva_pro" or "Canva Pro"' },
        productName: { type: 'string', description: 'Product name' },
      },
    },
  },
  {
    name: 'getProductRecommendations',
    description: 'Get tailored product recommendations for a customer use case (e.g. video editing, graphic design, programming).',
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Category or requirement, e.g. "video editing", "design", "coding", "ai"' },
        useCase: { type: 'string', description: 'Optional specific workflow description' },
      },
    },
  },
  {
    name: 'getCustomer',
    description: 'Get the profile and authentication status of the current WhatsApp customer.',
    parameters: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'Optional customer registered email' },
      },
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
    name: 'createOrder',
    description: 'Create an authoritative order from an approved negotiated price quote. Reuses existing Universal Order Engine.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Optional product ID, e.g. prod_canva_pro' },
        productName: { type: 'string', description: 'Product name, e.g. Canva Pro' },
        negotiatedPriceId: { type: 'string', description: 'Optional specific NegotiatedPrice ID' },
      },
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
    name: 'createPaymentLink',
    description: 'Retrieve or generate a secure PayU payment link for an unpaid order.',
    parameters: {
      type: 'object',
      properties: {
        orderId: { type: 'string', description: 'Optional internal order ID (LD-WA-XXXXX)' },
      },
    },
  },
  {
    name: 'getOrderPaymentLink',
    description: 'Retrieve the reusable PayU payment link for an existing unpaid order without creating duplicate orders.',
    parameters: {
      type: 'object',
      properties: {
        orderId: { type: 'string', description: 'Optional internal order ID (LD-WA-XXXXX)' },
      },
    },
  },
  {
    name: 'getOrder',
    description: 'Fetch detailed state, pricing, and fulfillment status for a specific customer order ID.',
    parameters: {
      type: 'object',
      properties: {
        orderId: { type: 'string', description: 'Internal order ID, e.g. LD-WA-XXXXX' },
      },
      required: ['orderId'],
    },
  },
  {
    name: 'renewSubscription',
    description: 'Initiate renewal order or quote for an existing customer subscription.',
    parameters: {
      type: 'object',
      properties: {
        subscriptionId: { type: 'string', description: 'Optional subscription ID' },
        toolName: { type: 'string', description: 'Name of the tool to renew, e.g. Canva Pro' },
      },
    },
  },
  {
    name: 'redeemCredits',
    description: 'Check available credit balance and apply credits toward an order discount.',
    parameters: {
      type: 'object',
      properties: {
        amount: { type: 'number', description: 'Credit amount in INR to redeem' },
        orderId: { type: 'string', description: 'Optional target order ID' },
      },
      required: ['amount'],
    },
  },
  {
    name: 'createSupportTicket',
    description: 'Create an official support ticket in the backend database for issues or disputes.',
    parameters: {
      type: 'object',
      properties: {
        subject: { type: 'string', description: 'Subject or title of the issue' },
        category: { type: 'string', description: 'Category: "Payment", "API issue", "API key", "Account", "Technical issue", or "Other"' },
        message: { type: 'string', description: 'Detailed issue description' },
      },
      required: ['subject', 'message'],
    },
  },
  {
    name: 'getSupportTickets',
    description: 'Retrieve status of existing support tickets submitted by the customer.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Optional ticket status filter: "Open", "Resolved", "Closed"' },
      },
    },
  },
  {
    name: 'cancelOrder',
    description: 'Cancel an unpaid pending order. Paid orders cannot be cancelled directly.',
    parameters: {
      type: 'object',
      properties: {
        orderId: { type: 'string', description: 'Order ID to cancel' },
        reason: { type: 'string', description: 'Cancellation reason' },
      },
    },
  },
  {
    name: 'requestRefund',
    description: 'Submit an official refund request for an eligible paid order for administrative review.',
    parameters: {
      type: 'object',
      properties: {
        orderId: { type: 'string', description: 'Order ID to refund' },
        reason: { type: 'string', description: 'Detailed refund reason' },
      },
      required: ['orderId', 'reason'],
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
        case 'getProduct':
          result = await this.handleGetProduct(args);
          break;
        case 'getProductRecommendations':
          result = await this.handleGetProductRecommendations(args);
          break;
        case 'getCustomer':
          result = await this.handleGetCustomer(args, context);
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
        case 'createOrder':
          result = await this.handleCreateOrder(args, context);
          break;
        case 'createPaymentOrder':
          result = await this.handleCreatePaymentOrder(args, context);
          break;
        case 'createPaymentLink':
        case 'getOrderPaymentLink':
          result = await this.handleGetOrderPaymentLink(args, context);
          break;
        case 'getOrder':
          result = await this.handleGetOrder(args, context);
          break;
        case 'renewSubscription':
          result = await this.handleRenewSubscription(args, context);
          break;
        case 'redeemCredits':
          result = await this.handleRedeemCredits(args, context);
          break;
        case 'createSupportTicket':
          result = await this.handleCreateSupportTicket(args, context);
          break;
        case 'getSupportTickets':
          result = await this.handleGetSupportTickets(args, context);
          break;
        case 'cancelOrder':
          result = await this.handleCancelOrder(args, context);
          break;
        case 'requestRefund':
          result = await this.handleRequestRefund(args, context);
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
      if (context.conversationId) {
        const convExists = await prisma.whatsAppConversation.findUnique({
          where: { id: context.conversationId },
          select: { id: true },
        });
        if (convExists) {
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
        }
      }
    } catch (logErr: any) {
      // Safe fallback
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

  private static async handleGetProduct(args: Record<string, any>): Promise<ToolExecutionResult> {
    const idOrName = (args.productId || args.productName || '').toLowerCase().trim();
    if (!idOrName) {
      return {
        toolName: 'getProduct',
        success: false,
        data: null,
        error: 'Please provide a product name or ID to lookup.',
      };
    }

    const matched = DETAILED_PRODUCTS.find(
      (p) =>
        p.id.toLowerCase() === idOrName ||
        p.name.toLowerCase().includes(idOrName) ||
        idOrName.includes(p.name.toLowerCase()) ||
        idOrName.split(/\s+/).some((w) => w.length > 3 && p.name.toLowerCase().includes(w))
    );

    if (!matched) {
      return {
        toolName: 'getProduct',
        success: false,
        data: null,
        error: `Product "${idOrName}" not found in current catalog.`,
      };
    }

    let activationInfo = 'Activation is processed digitally within 15-30 minutes after order confirmation. ';
    if (matched.id.includes('canva')) {
      activationInfo += 'For Canva Pro, activation is done via a direct email invitation added to your personal Canva account. No password sharing is ever required. Your existing designs and personal folders remain completely private and untouched.';
    } else if (matched.id.includes('cursor')) {
      activationInfo += 'Cursor Pro is activated directly on your email login or team invite with Claude 3.5 Sonnet codebase access.';
    } else if (matched.id.includes('claude')) {
      activationInfo += 'Claude Max high-throughput access is activated instantly with 20M token allocation via unified endpoint.';
    } else if (matched.id.includes('adobe')) {
      activationInfo += 'Adobe Creative Cloud 20+ apps are activated on your personal Adobe ID with cloud storage and Adobe Fonts.';
    }

    return {
      toolName: 'getProduct',
      success: true,
      data: {
        id: matched.id,
        name: matched.name,
        category: matched.category,
        description: matched.description,
        features: matched.features,
        bestFor: matched.bestFor,
        activationGuide: activationInfo,
        pricingNotice: 'Official enterprise discounts are customized per customer by our admin team.',
      },
    };
  }

  private static async handleGetProductRecommendations(args: Record<string, any>): Promise<ToolExecutionResult> {
    const query = (args.category || args.useCase || '').toLowerCase().trim();
    let recommended: any[] = [];

    if (query.includes('video') || query.includes('youtube') || query.includes('edit')) {
      recommended = DETAILED_PRODUCTS.filter((p) => p.id.includes('adobe') || p.id.includes('canva'));
    } else if (query.includes('code') || query.includes('program') || query.includes('dev')) {
      recommended = DETAILED_PRODUCTS.filter((p) => p.id.includes('cursor') || p.id.includes('custom'));
    } else if (query.includes('design') || query.includes('graphic') || query.includes('art') || query.includes('thumbnail')) {
      recommended = DETAILED_PRODUCTS.filter((p) => p.id.includes('canva') || p.id.includes('midjourney') || p.id.includes('adobe'));
    } else if (query.includes('ai') || query.includes('gpt') || query.includes('claude') || query.includes('writer')) {
      recommended = DETAILED_PRODUCTS.filter((p) => p.id.includes('claude') || p.id.includes('chatgpt'));
    } else {
      recommended = DETAILED_PRODUCTS.slice(0, 3);
    }

    return {
      toolName: 'getProductRecommendations',
      success: true,
      data: {
        query,
        count: recommended.length,
        recommendations: recommended.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          description: p.description,
          bestFor: p.bestFor,
          keyFeature: p.features[0],
        })),
      },
    };
  }

  private static async handleGetCustomer(args: Record<string, any>, context: AgentContext): Promise<ToolExecutionResult> {
    let customer = null;
    const email = args.email?.toLowerCase().trim();
    if (email) {
      customer = await prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true, email: true, availableCredits: true, role: true },
      });
    } else if (context.customerId) {
      customer = await prisma.user.findUnique({
        where: { id: context.customerId },
        select: { id: true, name: true, email: true, availableCredits: true, role: true },
      });
    }

    if (!customer) {
      return {
        toolName: 'getCustomer',
        success: true,
        data: {
          authenticated: false,
          customerId: null,
          phone: context.whatsappNumber,
          message: 'Customer is browsing as a guest. Call authenticateCustomer(email) if they want to access account history or credits.',
        },
      };
    }

    return {
      toolName: 'getCustomer',
      success: true,
      data: {
        authenticated: true,
        customerId: customer.id,
        name: customer.name || 'Valued Customer',
        email: customer.email,
        availableCredits: customer.availableCredits,
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
          toolName: s.planName || (s as any).toolName,
          status: s.status,
          planType: s.planId,
          expiresAt: s.expiryTime ? s.expiryTime.toISOString().split('T')[0] : 'Active',
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

    const overview = await ReferralEngine.getCustomerReferralOverview(context.customerId);
    return {
      toolName: 'getReferralCode',
      success: true,
      data: {
        referralCode: overview.referralCode,
        referralUrl: overview.referralUrl,
        totalReferred: overview.stats.totalReferrals,
        totalCreditsEarned: overview.stats.creditsEarned,
        stats: overview.stats,
      },
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
    const targetCustomerId = context.customerId;
    const productId = args.productId || context.currentProductId;
    const now = new Date();

    let quote = await prisma.negotiatedPrice.findFirst({
      where: {
        OR: [
          ...(targetCustomerId ? [{ customerId: targetCustomerId }] : []),
          ...(context.conversationId ? [{ whatsappConversationId: context.conversationId }] : []),
        ],
        status: 'ACTIVE',
        expiresAt: { gt: now },
        ...(productId && { productId }),
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!quote) {
      // Fallback: check for any active quote for this conversation or customer
      quote = await prisma.negotiatedPrice.findFirst({
        where: {
          OR: [
            ...(targetCustomerId ? [{ customerId: targetCustomerId }] : []),
            ...(context.conversationId ? [{ whatsappConversationId: context.conversationId }] : []),
          ],
          status: 'ACTIVE',
          expiresAt: { gt: now },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

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

      const baseUrl = (process.env.APP_URL || process.env.VITE_APP_URL || 'https://lightningapi.pro').replace(/\/$/, '');
      const paymentUrl = `${baseUrl}/pay/${result.order.internalOrderId}`;

      return {
        toolName: 'createPaymentOrder',
        success: true,
        data: {
          orderId: result.order.internalOrderId,
          productName: result.order.planName,
          amountInr: result.order.amountInr,
          paymentUrl,
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

  private static async handleCreateOrder(
    args: Record<string, any>,
    context: AgentContext
  ): Promise<ToolExecutionResult> {
    let targetCustomerId = context.customerId;
    if (!targetCustomerId && context.conversationId) {
      try {
        const customer = await NegotiatedPriceService.ensureCustomerForConversation(context.conversationId);
        targetCustomerId = customer.id;
        context.customerId = customer.id;
      } catch (e) {}
    }

    if (!targetCustomerId) {
      return {
        toolName: 'createOrder',
        success: false,
        data: null,
        error: 'Customer account could not be initialized to create an order.',
      };
    }

    let negotiatedPriceId = args.negotiatedPriceId;
    const productId = args.productId || context.currentProductId;

    // If no quote ID passed, look up latest active approved quote
    if (!negotiatedPriceId) {
      let activeQuote = await prisma.negotiatedPrice.findFirst({
        where: {
          OR: [
            { customerId: targetCustomerId },
            ...(context.conversationId ? [{ whatsappConversationId: context.conversationId }] : []),
          ],
          status: 'ACTIVE',
          expiresAt: { gt: new Date() },
          ...(productId && { productId }),
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!activeQuote) {
        // Fallback: any active quote for this customer/conversation
        activeQuote = await prisma.negotiatedPrice.findFirst({
          where: {
            OR: [
              { customerId: targetCustomerId },
              ...(context.conversationId ? [{ whatsappConversationId: context.conversationId }] : []),
            ],
            status: 'ACTIVE',
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: 'desc' },
        });
      }

      if (!activeQuote) {
        return {
          toolName: 'createOrder',
          success: false,
          data: null,
          error: 'No active approved price quote found. Admin must confirm the price quote before creating an order.',
        };
      }
      negotiatedPriceId = activeQuote.id;
    }

    try {
      const result = await NegotiatedPriceService.convertToOrderAndGeneratePaymentLink({
        negotiatedPriceId,
        adminId: 'system-ai-agent',
        customerPhone: context.whatsappNumber,
      });

      const baseUrl = (process.env.APP_URL || process.env.VITE_APP_URL || 'https://lightningapi.pro').replace(/\/$/, '');
      const paymentUrl = `${baseUrl}/pay/${result.order.internalOrderId}`;

      return {
        toolName: 'createOrder',
        success: true,
        data: {
          orderId: result.order.id,
          internalOrderId: result.order.internalOrderId,
          productName: result.order.planName,
          amountInr: result.order.amountInr,
          status: 'PENDING',
          paymentStatus: 'CREATED',
          channel: 'WHATSAPP',
          priceSource: 'ADMIN_NEGOTIATED',
          paymentUrl,
        },
      };
    } catch (e: any) {
      return {
        toolName: 'createOrder',
        success: false,
        data: null,
        error: e.message,
      };
    }
  }

  private static async handleGetOrderPaymentLink(
    args: Record<string, any>,
    context: AgentContext
  ): Promise<ToolExecutionResult> {
    let targetCustomerId = context.customerId;
    if (!targetCustomerId && context.conversationId) {
      try {
        const customer = await NegotiatedPriceService.ensureCustomerForConversation(context.conversationId);
        targetCustomerId = customer.id;
        context.customerId = customer.id;
      } catch (e) {}
    }

    const orderId = args.orderId?.trim();
    let order = null;

    if (orderId) {
      order = await prisma.order.findFirst({
        where: {
          OR: [{ internalOrderId: orderId }, { id: orderId }],
          ...(targetCustomerId && { userId: targetCustomerId }),
        },
      });
    } else if (context.currentOrderId) {
      order = await prisma.order.findUnique({
        where: { id: context.currentOrderId },
      });
    } else if (targetCustomerId) {
      order = await prisma.order.findFirst({
        where: {
          userId: targetCustomerId,
          paymentStatus: { in: ['CREATED', 'PENDING'] },
          status: 'PENDING',
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (context.conversationId) {
      order = await prisma.order.findFirst({
        where: {
          whatsappConversationId: context.conversationId,
          paymentStatus: { in: ['CREATED', 'PENDING'] },
          status: 'PENDING',
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Check for the LATEST active approved price quote
    const latestQuote = await prisma.negotiatedPrice.findFirst({
      where: {
        OR: [
          ...(targetCustomerId ? [{ customerId: targetCustomerId }] : []),
          ...(context.conversationId ? [{ whatsappConversationId: context.conversationId }] : []),
        ],
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    // If an unpaid order exists, check if its price matches the latest approved quote
    if (order && latestQuote && order.amountInr !== latestQuote.amount) {
      // The price was renegotiated! Cancel the outdated order
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          cancellationReason: `Price updated to ₹${latestQuote.amount}`,
        },
      }).catch(() => {});
      order = null;
    }

    // If no order exists (or old order was cancelled due to renegotiation), create a fresh order for the approved price
    if (!order && latestQuote) {
      const createRes = await this.handleCreateOrder(
        {
          negotiatedPriceId: latestQuote.id,
          productId: latestQuote.productId,
          productName: latestQuote.productName,
        },
        context
      );
      if (createRes.success && createRes.data?.paymentUrl) {
        return createRes;
      }
    }

    if (!order) {
      return {
        toolName: 'getOrderPaymentLink',
        success: false,
        data: null,
        error: 'No active order found. Please confirm your order first.',
      };
    }

    if (order.paymentStatus === 'PAID' || order.status === 'COMPLETED') {
      return {
        toolName: 'getOrderPaymentLink',
        success: false,
        data: { isPaid: true },
        error: `Order #${order.internalOrderId} has already been paid and fulfilled.`,
      };
    }

    const baseUrl = (process.env.APP_URL || process.env.VITE_APP_URL || 'https://lightningapi.pro').replace(/\/$/, '');
    const paymentUrl = `${baseUrl}/pay/${order.internalOrderId}`;

    return {
      toolName: 'getOrderPaymentLink',
      success: true,
      data: {
        orderId: order.id,
        internalOrderId: order.internalOrderId,
        productName: order.planName,
        amountInr: order.amountInr,
        paymentUrl,
        status: order.status,
      },
    };
  }

  private static async handleGetOrder(
    args: Record<string, any>,
    context: AgentContext
  ): Promise<ToolExecutionResult> {
    const orderId = args.orderId?.trim();
    if (!orderId) {
      return {
        toolName: 'getOrder',
        success: false,
        data: null,
        error: 'Order ID is required.',
      };
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ internalOrderId: orderId }, { id: orderId }],
        ...(context.customerId && { userId: context.customerId }),
      },
    });

    if (!order) {
      return {
        toolName: 'getOrder',
        success: false,
        data: null,
        error: `Order '${orderId}' not found.`,
      };
    }

    return {
      toolName: 'getOrder',
      success: true,
      data: {
        orderId: order.internalOrderId,
        productName: order.planName,
        amountInr: order.amountInr,
        status: order.status,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        createdAt: order.createdAt.toISOString(),
      },
    };
  }

  private static async handleRenewSubscription(
    args: Record<string, any>,
    context: AgentContext
  ): Promise<ToolExecutionResult> {
    if (!context.customerId) {
      return {
        toolName: 'renewSubscription',
        success: false,
        data: null,
        error: 'Customer must be authenticated with their email.',
      };
    }

    const toolName = (args.toolName || '').toLowerCase().trim();
    const subs = await prisma.subscription.findMany({
      where: { userId: context.customerId },
      orderBy: { createdAt: 'desc' },
    });

    let matchedSub = subs[0];
    if (toolName) {
      matchedSub = subs.find((s) => (s.planName || '').toLowerCase().includes(toolName)) || subs[0];
    }

    if (!matchedSub) {
      return {
        toolName: 'renewSubscription',
        success: false,
        data: null,
        error: 'No subscription found to renew.',
      };
    }

    const subName = matchedSub.planName || (matchedSub as any).toolName || 'Subscription';
    const subExpiry = matchedSub.expiryTime ? matchedSub.expiryTime.toISOString() : new Date().toISOString();

    // Check for approved renewal price
    const approved = await prisma.negotiatedPrice.findFirst({
      where: {
        customerId: context.customerId,
        productId: matchedSub.planId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (approved) {
      const orderRes = await this.handleCreateOrder({ negotiatedPriceId: approved.id }, context);
      return {
        toolName: 'renewSubscription',
        success: true,
        data: {
          action: 'ORDER_CREATED',
          subscription: subName,
          orderDetails: orderRes.data,
        },
      };
    }

    // Otherwise create renewal quote request
    await this.handleCreateNegotiatedPriceRequest(
      {
        productId: matchedSub.planId || 'sub_renewal',
        productName: `${subName} (Renewal)`,
        notes: `Customer requested renewal for subscription ID ${matchedSub.id}. Expiry: ${subExpiry}`,
      },
      context
    );

    return {
      toolName: 'renewSubscription',
      success: true,
      data: {
        action: 'QUOTE_REQUESTED',
        subscription: subName,
        currentExpiry: subExpiry,
        message: 'Renewal quotation request submitted to admin. Team will confirm special renewal rate.',
      },
    };
  }

  private static async handleRedeemCredits(
    args: Record<string, any>,
    context: AgentContext
  ): Promise<ToolExecutionResult> {
    if (!context.customerId) {
      return {
        toolName: 'redeemCredits',
        success: false,
        data: null,
        error: 'Customer must be authenticated with their email to use credits.',
      };
    }

    const requestedAmount = Number(args.amount);
    if (isNaN(requestedAmount) || requestedAmount <= 0) {
      return {
        toolName: 'redeemCredits',
        success: false,
        data: null,
        error: 'Please specify a positive credit amount to redeem.',
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: context.customerId },
      select: { availableCredits: true },
    });

    const balance = user?.availableCredits || 0;
    if (requestedAmount > balance) {
      return {
        toolName: 'redeemCredits',
        success: false,
        data: { availableCredits: balance, requestedAmount },
        error: `Requested redemption of ₹${requestedAmount} exceeds your available balance of ₹${balance}.`,
      };
    }

    return {
      toolName: 'redeemCredits',
      success: true,
      data: {
        availableCredits: balance,
        redeemableAmount: requestedAmount,
        remainingCredits: balance - requestedAmount,
        message: `₹${requestedAmount} Lightning Credits can be applied as an instant cash discount at checkout.`,
      },
    };
  }

  private static async handleCreateSupportTicket(
    args: Record<string, any>,
    context: AgentContext
  ): Promise<ToolExecutionResult> {
    if (!context.customerId) {
      return {
        toolName: 'createSupportTicket',
        success: false,
        data: null,
        error: 'Customer must be authenticated with their email to submit a support ticket.',
      };
    }

    const subject = (args.subject || 'WhatsApp Support Request').trim();
    const category = args.category || 'Technical issue';
    const message = (args.message || '').trim();

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: context.customerId,
        subject,
        category,
        status: 'Open',
        priority: 'Normal',
        messages: {
          create: {
            senderId: context.customerId,
            senderRole: 'user',
            content: message || subject,
          },
        },
      },
    });

    const ticketNumber = `TICK-${ticket.id.substring(0, 6).toUpperCase()}`;

    return {
      toolName: 'createSupportTicket',
      success: true,
      data: {
        ticketId: ticket.id,
        ticketNumber,
        subject: ticket.subject,
        category: ticket.category,
        status: ticket.status,
        message: 'Support ticket successfully registered. Our technical team has been alerted.',
      },
    };
  }

  private static async handleGetSupportTickets(
    args: Record<string, any>,
    context: AgentContext
  ): Promise<ToolExecutionResult> {
    if (!context.customerId) {
      return {
        toolName: 'getSupportTickets',
        success: false,
        data: null,
        error: 'Customer must be authenticated to view tickets.',
      };
    }

    const tickets = await prisma.supportTicket.findMany({
      where: {
        userId: context.customerId,
        ...(args.status && { status: args.status }),
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      toolName: 'getSupportTickets',
      success: true,
      data: {
        ticketCount: tickets.length,
        tickets: tickets.map((t) => ({
          ticketNumber: `TICK-${t.id.substring(0, 6).toUpperCase()}`,
          subject: t.subject,
          status: t.status,
          category: t.category,
          createdAt: t.createdAt.toISOString(),
        })),
      },
    };
  }

  private static async handleCancelOrder(
    args: Record<string, any>,
    context: AgentContext
  ): Promise<ToolExecutionResult> {
    if (!context.customerId) {
      return {
        toolName: 'cancelOrder',
        success: false,
        data: null,
        error: 'Customer must be authenticated with their email.',
      };
    }

    const orderId = args.orderId?.trim();
    let order = null;

    if (orderId) {
      order = await prisma.order.findFirst({
        where: {
          OR: [{ internalOrderId: orderId }, { id: orderId }],
          userId: context.customerId,
        },
      });
    } else {
      order = await prisma.order.findFirst({
        where: {
          userId: context.customerId,
          status: 'PENDING',
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!order) {
      return {
        toolName: 'cancelOrder',
        success: false,
        data: null,
        error: 'No active pending order found to cancel.',
      };
    }

    if (order.paymentStatus === 'PAID' || order.status === 'COMPLETED') {
      return {
        toolName: 'cancelOrder',
        success: false,
        data: { canRefund: true, orderId: order.internalOrderId },
        error: `Order #${order.internalOrderId} is already paid and completed. It cannot be cancelled directly; please request a refund instead.`,
      };
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        paymentStatus: 'CANCELLED',
        failureReason: args.reason || 'Cancelled by customer via WhatsApp',
      },
    });

    return {
      toolName: 'cancelOrder',
      success: true,
      data: {
        orderId: order.internalOrderId,
        status: 'CANCELLED',
        message: `Order #${order.internalOrderId} has been successfully cancelled.`,
      },
    };
  }

  private static async handleRequestRefund(
    args: Record<string, any>,
    context: AgentContext
  ): Promise<ToolExecutionResult> {
    if (!context.customerId) {
      return {
        toolName: 'requestRefund',
        success: false,
        data: null,
        error: 'Customer must be authenticated with their email.',
      };
    }

    const orderId = args.orderId?.trim();
    const reason = (args.reason || 'Customer requested refund via WhatsApp').trim();

    let order = null;
    if (orderId) {
      order = await prisma.order.findFirst({
        where: {
          OR: [{ internalOrderId: orderId }, { id: orderId }],
          userId: context.customerId,
        },
      });
    } else {
      order = await prisma.order.findFirst({
        where: {
          userId: context.customerId,
          status: { in: ['PAID', 'COMPLETED'] },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!order) {
      return {
        toolName: 'requestRefund',
        success: false,
        data: null,
        error: 'No eligible paid order found for refund request.',
      };
    }

    // Create high-priority Support Ticket for admin processing
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: context.customerId,
        subject: `Refund Request: Order #${order.internalOrderId}`,
        category: 'Payment',
        status: 'Open',
        priority: 'High',
        messages: {
          create: {
            senderId: context.customerId,
            senderRole: 'user',
            content: `Customer requested refund for Order #${order.internalOrderId} (${order.planName}, ₹${order.amountInr}). Reason: ${reason}`,
          },
        },
      },
    });

    const ticketNumber = `TICK-${ticket.id.substring(0, 6).toUpperCase()}`;

    return {
      toolName: 'requestRefund',
      success: true,
      data: {
        orderId: order.internalOrderId,
        productName: order.planName,
        amountInr: order.amountInr,
        ticketNumber,
        status: 'REFUND_TICKET_SUBMITTED',
        policy: 'Per our policy, all replacement/uptime guarantees are first priority. If unresolved, refund will be processed to original source within 3-5 business days.',
      },
    };
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
