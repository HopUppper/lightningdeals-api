import crypto from 'crypto';
import { prisma } from '../db';
import { recordAuditEvent } from '../auditLogger';
import { WhatsAppClient } from './whatsappClient';

export interface InboundMessageParams {
  from: string; // e.g. "919876543210"
  body: string;
  providerMessageId?: string;
  customerName?: string;
}

export interface WhatsAppEngineResult {
  handled: boolean;
  conversationId: string;
  replySent?: boolean;
  status: string;
  currentState: string;
  isDuplicate?: boolean;
}

export interface CatalogProduct {
  id: string;
  name: string;
  aliases: string[];
}

export const PRODUCT_CATALOG_WITHOUT_PRICES: CatalogProduct[] = [
  { id: 'prod_canva_pro', name: 'Canva Pro', aliases: ['canva pro', 'canva'] },
  { id: 'prod_claude_max', name: 'Claude Max 5x (20M Tokens)', aliases: ['claude max', 'claude 5x', 'claude max 5x'] },
  { id: 'prod_claude_pro', name: 'Claude Pro Account', aliases: ['claude pro', 'claude'] },
  { id: 'prod_cursor_pro', name: 'Cursor Pro AI IDE', aliases: ['cursor pro', 'cursor'] },
  { id: 'prod_chatgpt_team', name: 'ChatGPT Team Workspace', aliases: ['chatgpt team', 'chatgpt', 'chat gpt', 'gpt'] },
  { id: 'prod_adobe_creative', name: 'Adobe Creative Cloud', aliases: ['adobe creative cloud', 'adobe cc', 'adobe'] },
  { id: 'prod_midjourney', name: 'Midjourney Mega Plan', aliases: ['midjourney mega', 'midjourney', 'mid journey'] },
  { id: 'prod_custom', name: 'Custom Developer API Bundle', aliases: ['custom developer api bundle', 'custom bundle', 'custom api', 'custom'] },
];

export function matchProduct(text: string): CatalogProduct | null {
  const clean = text.toLowerCase().trim();
  const sorted = [...PRODUCT_CATALOG_WITHOUT_PRICES].sort((a, b) => {
    const maxA = Math.max(...a.aliases.map((x) => x.length));
    const maxB = Math.max(...b.aliases.map((x) => x.length));
    return maxB - maxA;
  });

  for (const prod of sorted) {
    for (const alias of prod.aliases) {
      const regex = new RegExp(`(^|\\b)${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\b|$)`, 'i');
      if (regex.test(clean)) {
        return prod;
      }
    }
  }
  return null;
}

export class WhatsAppEngine {
  /**
   * Main entry point for inbound customer WhatsApp messages.
   * Handles idempotency, state machine transitions, zero-price-leakage, and human handoff.
   */
  static async handleInboundMessage(params: InboundMessageParams): Promise<WhatsAppEngineResult> {
    const { from, body, providerMessageId, customerName } = params;
    const sanitizedFrom = from.replace(/\D/g, '');
    const cleanBody = (body || '').trim();
    const lowerBody = cleanBody.toLowerCase();

    // 1. Check message idempotency by providerMessageId
    if (providerMessageId) {
      const existingMsg = await prisma.whatsAppMessage.findUnique({
        where: { providerMessageId },
      });
      if (existingMsg) {
        return {
          handled: true,
          conversationId: existingMsg.conversationId,
          replySent: false,
          status: 'IDEMPOTENT_DUPLICATE',
          currentState: 'ALREADY_PROCESSED',
          isDuplicate: true,
        };
      }
    }

    // 2. Resolve or initialize WhatsAppConversation
    let conversation = await prisma.whatsAppConversation.findFirst({
      where: { whatsappNumber: sanitizedFrom },
      include: {
        customer: true,
        currentOrder: true,
      },
    });

    if (!conversation) {
      // Check if WhatsApp number is linked to existing customer identity
      const identity = await prisma.whatsAppCustomerIdentity.findUnique({
        where: { whatsappNumber: sanitizedFrom },
        include: { customer: true },
      });

      conversation = await prisma.whatsAppConversation.create({
        data: {
          whatsappNumber: sanitizedFrom,
          customerName: customerName || null,
          customerId: identity?.customerId || null,
          status: 'NEW',
          currentState: 'START',
          unreadCount: 1,
          lastMessageAt: new Date(),
          lastMessageSnippet: cleanBody.substring(0, 100),
        },
        include: {
          customer: true,
          currentOrder: true,
        },
      });
    } else {
      // If conversation has no customerId yet, check if identity exists
      if (!conversation.customerId) {
        const identity = await prisma.whatsAppCustomerIdentity.findUnique({
          where: { whatsappNumber: sanitizedFrom },
          include: { customer: true },
        });
        if (identity?.customerId) {
          conversation = await prisma.whatsAppConversation.update({
            where: { id: conversation.id },
            data: { customerId: identity.customerId },
            include: { customer: true, currentOrder: true },
          });
        }
      }

      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: {
          customerName: customerName || conversation.customerName,
          unreadCount: { increment: 1 },
          lastMessageAt: new Date(),
          lastMessageSnippet: cleanBody.substring(0, 100),
        },
      });
    }

    // 3. Save Inbound Message
    await prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        direction: 'INBOUND',
        messageType: 'TEXT',
        content: cleanBody,
        providerMessageId: providerMessageId || null,
        deliveryStatus: 'DELIVERED',
        sentBy: 'CUSTOMER',
      },
    });

    // 4. Existing Active State: Human Handoff Check
    // If conversation is already in HUMAN_HANDOFF, suppress bot auto-replies unless user resumes
    if (conversation.status === 'HUMAN_HANDOFF') {
      if (lowerBody === 'menu' || lowerBody === 'start' || lowerBody === 'bot') {
        conversation = await prisma.whatsAppConversation.update({
          where: { id: conversation.id },
          data: { status: 'ACTIVE', currentState: 'START' },
          include: { customer: true, currentOrder: true },
        });
        const resumeReply = `⚡ *Resuming Automated Assistant*\n\n${this.getMainMenuText(conversation.customer?.name)}`;
        await this.sendAndSaveBotReply(conversation.id, sanitizedFrom, resumeReply);
        return {
          handled: true,
          conversationId: conversation.id,
          replySent: true,
          status: 'ACTIVE',
          currentState: 'START',
        };
      }

      return {
        handled: true,
        conversationId: conversation.id,
        replySent: false,
        status: conversation.status,
        currentState: conversation.currentState,
      };
    }

    // 5. Adversarial Input Guard & Message Safety (Must run before handoff keywords)
    if (
      lowerBody.includes('ignore previous') ||
      lowerBody.includes('system prompt') ||
      lowerBody.includes('admin pricing') ||
      lowerBody.includes('internal cost') ||
      lowerBody.includes('supplier price') ||
      lowerBody.includes('give me base price')
    ) {
      const reply = `I can help you with products and orders, but pricing is confirmed personally by our team. Please wait for an admin. ⚡`;
      await this.sendAndSaveBotReply(conversation.id, sanitizedFrom, reply);
      return {
        handled: true,
        conversationId: conversation.id,
        replySent: true,
        status: conversation.status,
        currentState: conversation.currentState,
      };
    }

    if (
      lowerBody.includes('mark complete') ||
      lowerBody.includes('i have paid') ||
      lowerBody.includes('i paid') ||
      lowerBody.includes('mark my order complete')
    ) {
      const reply = `We'll automatically update your order once the payment is verified through our secure payment gateway. ⚡\n\nIf you need immediate help, reply *7* to talk to an admin.`;
      await this.sendAndSaveBotReply(conversation.id, sanitizedFrom, reply);
      return {
        handled: true,
        conversationId: conversation.id,
        replySent: true,
        status: conversation.status,
        currentState: conversation.currentState,
      };
    }

    // 6. Explicit Human Handoff Command (Option 7, Option 8, or explicit keywords)
    if (this.isHumanHandoffIntent(lowerBody)) {
      conversation = await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: {
          status: 'HUMAN_HANDOFF',
          currentState: 'HUMAN_HANDOFF',
        },
        include: { customer: true, currentOrder: true },
      });

      await recordAuditEvent({
        eventType: 'WHATSAPP_HUMAN_HANDOFF_TRIGGERED',
        severity: 'INFO',
        actorType: 'CUSTOMER',
        customerId: conversation.customerId || undefined,
        resourceType: 'ORDER',
        resourceId: conversation.id,
        action: 'HUMAN_HANDOFF',
        result: 'SUCCESS',
        metadata: {
          whatsappNumber: sanitizedFrom,
          triggerMessage: cleanBody,
        },
      });

      const reply = `🔴 *HUMAN HANDOFF ACTIVE*\n\nA member of the Lightning Deals team has been alerted and will take over shortly.\n\nPlease feel free to type your request or questions below. ⚡`;
      await this.sendAndSaveBotReply(conversation.id, sanitizedFrom, reply);

      return {
        handled: true,
        conversationId: conversation.id,
        replySent: true,
        status: 'HUMAN_HANDOFF',
        currentState: 'HUMAN_HANDOFF',
      };
    }

    // Session metadata
    let meta: Record<string, any> = {};
    try {
      if (conversation.metadata) meta = JSON.parse(conversation.metadata);
    } catch {}

    // 7. Email Detection & Customer Identification
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const emailMatch = cleanBody.match(emailRegex);

    if (emailMatch) {
      const foundEmail = emailMatch[1].toLowerCase();
      const existingUser = await prisma.user.findFirst({
        where: { email: { equals: foundEmail, mode: 'insensitive' } },
      });

      if (existingUser) {
        // Link customer to conversation
        conversation = await prisma.whatsAppConversation.update({
          where: { id: conversation.id },
          data: {
            customerId: existingUser.id,
            currentState: 'START',
            status: 'ACTIVE',
            metadata: JSON.stringify({ ...meta, pendingIntent: null }),
          },
          include: { customer: true, currentOrder: true },
        });

        // Upsert WhatsAppCustomerIdentity
        await prisma.whatsAppCustomerIdentity.upsert({
          where: { whatsappNumber: sanitizedFrom },
          update: {
            customerId: existingUser.id,
            verified: true,
            verifiedAt: new Date(),
          },
          create: {
            customerId: existingUser.id,
            whatsappNumber: sanitizedFrom,
            verified: true,
          },
        });

        const pending = meta.pendingIntent;
        if (pending === 'MY_ORDERS') {
          await this.sendOrdersReply(conversation, existingUser, sanitizedFrom);
        } else if (pending === 'MY_SUBSCRIPTIONS') {
          await this.sendSubscriptionsReply(conversation, existingUser, sanitizedFrom);
        } else if (pending === 'MY_CREDITS') {
          await this.sendCreditsReply(conversation, existingUser, sanitizedFrom);
        } else if (pending === 'REFERRAL') {
          await this.sendReferralReply(conversation, existingUser, sanitizedFrom);
        } else {
          const reply = `⚡ *Welcome back, ${existingUser.name || 'Lightning Member'}!*\n\nWe've successfully verified your LightningAPI.pro account (*${foundEmail}*).\n\n${this.getMainMenuText(existingUser.name)}`;
          await this.sendAndSaveBotReply(conversation.id, sanitizedFrom, reply);
        }

        return {
          handled: true,
          conversationId: conversation.id,
          replySent: true,
          status: 'ACTIVE',
          currentState: 'START',
        };
      } else {
        const reply = `You don't have a LightningAPI.pro account registered with *${foundEmail}* yet.\n\nPlease create your account here first:\n👉 https://lightningapi.pro/\n\nOnce created, send your registered email here. ⚡`;
        await this.sendAndSaveBotReply(conversation.id, sanitizedFrom, reply);

        await prisma.whatsAppConversation.update({
          where: { id: conversation.id },
          data: {
            status: 'WAITING_CUSTOMER',
            currentState: 'AWAITING_EMAIL',
          },
        });

        return {
          handled: true,
          conversationId: conversation.id,
          replySent: true,
          status: 'WAITING_CUSTOMER',
          currentState: 'AWAITING_EMAIL',
        };
      }
    }

    // Resolve current identified customer if present
    const customer = conversation.customerId
      ? (conversation.customer || (await prisma.user.findUnique({ where: { id: conversation.customerId } })))
      : null;

    // 8. Product Browsing Intent (ZERO PRICES, NO EMAIL REQUIRED)
    if (this.isProductBrowsingIntent(lowerBody)) {
      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: { currentState: 'PRODUCT_SELECTION' },
      });

      let catalogText = `⚡ *AVAILABLE PRODUCTS & PLANS*\n_(Prices are individually customized per developer)_\n\n`;
      PRODUCT_CATALOG_WITHOUT_PRICES.forEach((p, idx) => {
        catalogText += `${idx + 1}️⃣ *${p.name}*\n`;
      });
      catalogText += `\nTo order a product, reply with the product name or number (e.g. *Canva Pro* or *1*). An admin will confirm your deal price personally. ⚡`;

      await this.sendAndSaveBotReply(conversation.id, sanitizedFrom, catalogText);
      return {
        handled: true,
        conversationId: conversation.id,
        replySent: true,
        status: conversation.status,
        currentState: 'PRODUCT_SELECTION',
      };
    }

    // 9. Price Inquiry Intent (ZERO PRICE LEAKAGE → WAITING_ADMIN)
    if (this.isPriceInquiryIntent(lowerBody)) {
      const matchedProd = matchProduct(cleanBody);
      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: {
          currentProductId: matchedProd?.id || conversation.currentProductId || null,
          currentProductName: matchedProd?.name || conversation.currentProductName || null,
          status: 'WAITING_ADMIN',
          currentState: 'AWAITING_ADMIN_PRICE',
          lastMessageSnippet: `Price inquiry: ${matchedProd?.name || cleanBody.substring(0, 50)}`,
        },
      });

      const reply = `An admin will confirm the current price for you. Please wait a moment. ⚡`;
      await this.sendAndSaveBotReply(conversation.id, sanitizedFrom, reply);

      return {
        handled: true,
        conversationId: conversation.id,
        replySent: true,
        status: 'WAITING_ADMIN',
        currentState: 'AWAITING_ADMIN_PRICE',
      };
    }

    // 10. Product Selection Intent (Specific product named or selected by number in PRODUCT_SELECTION)
    const matchedProduct = matchProduct(cleanBody);
    let selectedFromList = matchedProduct;

    if (!selectedFromList && conversation.currentState === 'PRODUCT_SELECTION') {
      const num = parseInt(lowerBody, 10);
      if (!isNaN(num) && num >= 1 && num <= PRODUCT_CATALOG_WITHOUT_PRICES.length) {
        selectedFromList = PRODUCT_CATALOG_WITHOUT_PRICES[num - 1];
      }
    }

    if (selectedFromList) {
      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: {
          currentProductId: selectedFromList.id,
          currentProductName: selectedFromList.name,
          status: 'WAITING_ADMIN',
          currentState: 'AWAITING_ADMIN_PRICE',
          lastMessageSnippet: `Product selected: ${selectedFromList.name}`,
        },
      });

      const reply = `Sure ⚡\n\n*${selectedFromList.name}* is available.\n\nAn admin will confirm the current price for you. Please wait a moment. ⚡`;
      await this.sendAndSaveBotReply(conversation.id, sanitizedFrom, reply);

      return {
        handled: true,
        conversationId: conversation.id,
        replySent: true,
        status: 'WAITING_ADMIN',
        currentState: 'AWAITING_ADMIN_PRICE',
      };
    }

    // 11. Account-Specific Intents (Require Customer Identity)
    // 11.1 My Orders
    if (this.isOrdersIntent(lowerBody)) {
      if (!customer) {
        await prisma.whatsAppConversation.update({
          where: { id: conversation.id },
          data: {
            status: 'WAITING_CUSTOMER',
            currentState: 'AWAITING_EMAIL',
            metadata: JSON.stringify({ ...meta, pendingIntent: 'MY_ORDERS' }),
          },
        });

        const reply = `⚡ *Authentication Required*\n\nTo view your orders, please reply with the *email address* registered with your LightningAPI.pro account.\n\nDon't have an account? Sign up in 10 seconds at:\n👉 https://lightningapi.pro/`;
        await this.sendAndSaveBotReply(conversation.id, sanitizedFrom, reply);

        return {
          handled: true,
          conversationId: conversation.id,
          replySent: true,
          status: 'WAITING_CUSTOMER',
          currentState: 'AWAITING_EMAIL',
        };
      }

      await this.sendOrdersReply(conversation, customer, sanitizedFrom);
      return {
        handled: true,
        conversationId: conversation.id,
        replySent: true,
        status: conversation.status,
        currentState: conversation.currentState,
      };
    }

    // 11.2 My Subscriptions
    if (this.isSubscriptionsIntent(lowerBody)) {
      if (!customer) {
        await prisma.whatsAppConversation.update({
          where: { id: conversation.id },
          data: {
            status: 'WAITING_CUSTOMER',
            currentState: 'AWAITING_EMAIL',
            metadata: JSON.stringify({ ...meta, pendingIntent: 'MY_SUBSCRIPTIONS' }),
          },
        });

        const reply = `⚡ *Authentication Required*\n\nTo view your subscriptions, please reply with the *email address* registered with your LightningAPI.pro account.\n\nDon't have an account? Sign up in 10 seconds at:\n👉 https://lightningapi.pro/`;
        await this.sendAndSaveBotReply(conversation.id, sanitizedFrom, reply);

        return {
          handled: true,
          conversationId: conversation.id,
          replySent: true,
          status: 'WAITING_CUSTOMER',
          currentState: 'AWAITING_EMAIL',
        };
      }

      await this.sendSubscriptionsReply(conversation, customer, sanitizedFrom);
      return {
        handled: true,
        conversationId: conversation.id,
        replySent: true,
        status: conversation.status,
        currentState: conversation.currentState,
      };
    }

    // 11.3 My Lightning Credits
    if (this.isCreditsIntent(lowerBody)) {
      if (!customer) {
        await prisma.whatsAppConversation.update({
          where: { id: conversation.id },
          data: {
            status: 'WAITING_CUSTOMER',
            currentState: 'AWAITING_EMAIL',
            metadata: JSON.stringify({ ...meta, pendingIntent: 'MY_CREDITS' }),
          },
        });

        const reply = `⚡ *Authentication Required*\n\nTo view your Lightning Credits, please reply with the *email address* registered with your LightningAPI.pro account.\n\nDon't have an account? Sign up in 10 seconds at:\n👉 https://lightningapi.pro/`;
        await this.sendAndSaveBotReply(conversation.id, sanitizedFrom, reply);

        return {
          handled: true,
          conversationId: conversation.id,
          replySent: true,
          status: 'WAITING_CUSTOMER',
          currentState: 'AWAITING_EMAIL',
        };
      }

      await this.sendCreditsReply(conversation, customer, sanitizedFrom);
      return {
        handled: true,
        conversationId: conversation.id,
        replySent: true,
        status: conversation.status,
        currentState: conversation.currentState,
      };
    }

    // 11.4 Referral Information
    if (this.isReferralIntent(lowerBody)) {
      if (!customer) {
        await prisma.whatsAppConversation.update({
          where: { id: conversation.id },
          data: {
            status: 'WAITING_CUSTOMER',
            currentState: 'AWAITING_EMAIL',
            metadata: JSON.stringify({ ...meta, pendingIntent: 'REFERRAL' }),
          },
        });

        const reply = `⚡ *Authentication Required*\n\nTo view your referral link and rewards, please reply with the *email address* registered with your LightningAPI.pro account.\n\nDon't have an account? Sign up in 10 seconds at:\n👉 https://lightningapi.pro/`;
        await this.sendAndSaveBotReply(conversation.id, sanitizedFrom, reply);

        return {
          handled: true,
          conversationId: conversation.id,
          replySent: true,
          status: 'WAITING_CUSTOMER',
          currentState: 'AWAITING_EMAIL',
        };
      }

      await this.sendReferralReply(conversation, customer, sanitizedFrom);
      return {
        handled: true,
        conversationId: conversation.id,
        replySent: true,
        status: conversation.status,
        currentState: conversation.currentState,
      };
    }

    // 11.5 Support (Does NOT require email)
    if (this.isSupportIntent(lowerBody)) {
      await this.sendSupportReply(conversation, sanitizedFrom);
      return {
        handled: true,
        conversationId: conversation.id,
        replySent: true,
        status: conversation.status,
        currentState: conversation.currentState,
      };
    }

    // 12. Initial Greeting Intent
    if (this.isGreetingIntent(lowerBody)) {
      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: { currentState: 'START' },
      });

      const welcomeReply = `⚡ *Welcome to Lightning Deals!*\n\n${this.getMainMenuText(customer?.name)}`;
      await this.sendAndSaveBotReply(conversation.id, sanitizedFrom, welcomeReply);

      return {
        handled: true,
        conversationId: conversation.id,
        replySent: true,
        status: conversation.status,
        currentState: 'START',
      };
    }

    // 13. State-Specific Continuation: Awaiting Email Reminder
    if (conversation.currentState === 'AWAITING_EMAIL') {
      const reminderReply = `To view your account details, please reply with your registered *email address*.\n\nOr reply *1* to browse products, or *Menu* to return to the main menu. ⚡`;
      await this.sendAndSaveBotReply(conversation.id, sanitizedFrom, reminderReply);
      return {
        handled: true,
        conversationId: conversation.id,
        replySent: true,
        status: conversation.status,
        currentState: 'AWAITING_EMAIL',
      };
    }

    // 14. Fallback (Non-intrusive guidance, never forces email or loops welcome)
    const fallbackReply = `I didn't quite catch that. ⚡\n\nYou can:\n• Reply *1* or *Browse Products* to view available products\n• Type a product name (e.g. *Canva Pro* or *Claude*)\n• Reply *Menu* to see all options\n• Reply *7* to talk to an admin`;
    await this.sendAndSaveBotReply(conversation.id, sanitizedFrom, fallbackReply);

    return {
      handled: true,
      conversationId: conversation.id,
      replySent: true,
      status: conversation.status,
      currentState: conversation.currentState,
    };
  }

  // --- Intent Detection Helpers ---

  private static isProductBrowsingIntent(text: string): boolean {
    const lower = text.toLowerCase().trim();
    if (lower === '1') return true;
    if (lower === 'browse' || lower === 'products' || lower === 'catalog' || lower === 'plans') return true;
    if (lower.includes('what products') || lower.includes('what all products')) return true;
    if (lower.includes('show me products') || lower.includes('show products')) return true;
    if (lower.includes('what do you sell') || lower.includes('what you sell')) return true;
    if (lower.includes('browse products') || lower.includes('view products')) return true;
    if (lower.includes('what subscriptions do you have') || lower.includes('what plans do you have')) return true;
    if (lower.includes('available products')) return true;
    return false;
  }

  private static isPriceInquiryIntent(text: string): boolean {
    const lower = text.toLowerCase();
    return (
      lower.includes('how much') ||
      lower.includes('price') ||
      lower.includes('cost') ||
      lower.includes('rate') ||
      lower.includes('kitna') ||
      /\b(pricing|charge|fee|fees|charges)\b/i.test(lower)
    );
  }

  private static isOrdersIntent(text: string): boolean {
    const lower = text.toLowerCase().trim();
    if (lower === '2') return true;
    if (lower === 'my orders' || lower === 'orders' || lower === 'my order') return true;
    if (lower.includes('order status') || lower.includes('past orders') || lower.includes('recent orders') || lower.includes('my orders')) return true;
    return false;
  }

  private static isSubscriptionsIntent(text: string): boolean {
    const lower = text.toLowerCase().trim();
    if (lower === '3') return true;
    if (lower === 'my subscriptions' || lower === 'my subscription') return true;
    if (lower === 'subscriptions' || lower === 'subscription') return true;
    if (lower.includes('active subscription') || lower.includes('my active plans') || lower.includes('my subscriptions')) return true;
    return false;
  }

  private static isCreditsIntent(text: string): boolean {
    const lower = text.toLowerCase().trim();
    if (lower === '4') return true;
    if (lower === 'my credits' || lower === 'credits' || lower === 'lightning credits') return true;
    if (lower.includes('my credit') || lower.includes('my balance') || lower.includes('rewards') || lower.includes('reward balance') || lower.includes('my credits')) return true;
    return false;
  }

  private static isReferralIntent(text: string): boolean {
    const lower = text.toLowerCase().trim();
    if (lower === '5') return true;
    if (lower === 'referral' || lower === 'refer' || lower === 'refer & earn') return true;
    if (lower.includes('referral link') || lower.includes('invite') || lower.includes('my referral')) return true;
    return false;
  }

  private static isSupportIntent(text: string): boolean {
    const lower = text.toLowerCase().trim();
    if (lower === '6') return true;
    if (lower === 'support' || lower === 'help' || lower === 'ticket') return true;
    if (lower.includes('support desk') || lower.includes('help desk') || lower.includes('customer support')) return true;
    return false;
  }

  private static isHumanHandoffIntent(text: string): boolean {
    const lower = text.toLowerCase().trim();
    if (lower === '7' || lower === '8') return true;
    if (lower === 'human' || lower === 'admin') return true;
    if (
      lower.includes('talk to admin') ||
      lower.includes('talk to an admin') ||
      lower.includes('speak with agent') ||
      lower.includes('support agent') ||
      lower.includes('human handoff') ||
      lower.includes('connect with admin')
    ) {
      return true;
    }
    return false;
  }

  private static isGreetingIntent(text: string): boolean {
    const lower = text.toLowerCase().trim();
    if (/^(hi|hello|hey|start|menu|main menu|home|hola|namaste|greetings)(\b|[!.,\s]|$)/i.test(lower)) return true;
    return false;
  }

  // --- Response Helpers ---

  private static getMainMenuText(customerName?: string | null): string {
    const greeting = customerName ? `Hello *${customerName}*!\n\n` : '';
    return `${greeting}What would you like to do?\n\n1️⃣ Browse Products\n2️⃣ My Orders\n3️⃣ My Subscriptions\n4️⃣ My Lightning Credits\n5️⃣ Referral\n6️⃣ Support\n7️⃣ Talk to Admin\n\nReply with a number (1-7) or type your request directly. ⚡`;
  }

  private static async sendOrdersReply(conversation: any, customer: any, to: string): Promise<void> {
    const orders = await prisma.order.findMany({
      where: { userId: customer.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (orders.length === 0) {
      const reply = `⚡ *My Orders*\n\nYou haven't placed any orders yet.\n\nReply *1* to browse available products and request a quote. ⚡`;
      await this.sendAndSaveBotReply(conversation.id, to, reply);
    } else {
      let msg = `⚡ *Your Recent Orders*\n\n`;
      for (const ord of orders) {
        const statusIcon =
          ord.paymentStatus === 'CAPTURED'
            ? '✅ Completed'
            : ord.paymentStatus === 'FAILED'
            ? '❌ Failed'
            : '⏳ Payment Pending';
        const dateStr = ord.createdAt.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        msg += `📦 *${ord.planName}*\n• Order ID: \`${ord.internalOrderId}\`\n• Amount: ₹${ord.amountInr.toLocaleString(
          'en-IN'
        )}\n• Status: ${statusIcon}\n• Date: ${dateStr}\n\n`;
      }
      msg += `For full receipt and invoice details, visit:\n👉 https://lightningapi.pro/dashboard/orders`;
      await this.sendAndSaveBotReply(conversation.id, to, msg);
    }
  }

  private static async sendSubscriptionsReply(conversation: any, customer: any, to: string): Promise<void> {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: customer.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    if (subscriptions.length === 0) {
      const reply = `⚡ *My Subscriptions*\n\nYou have no active subscriptions.\n\nReply *1* to view available plans and get started. ⚡`;
      await this.sendAndSaveBotReply(conversation.id, to, reply);
    } else {
      let msg = `⚡ *Your Subscriptions*\n\n`;
      const now = new Date();
      for (const sub of subscriptions) {
        const daysRemaining = Math.max(
          0,
          Math.ceil((sub.expiryTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        );
        const expiryStr = sub.expiryTime.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        msg += `🛡️ *${sub.planName}*\n• Status: ${sub.status}\n• Expires: ${expiryStr}\n• Days remaining: ${daysRemaining}\n\n`;
      }
      msg += `Manage or renew your plans at:\n👉 https://lightningapi.pro/dashboard/subscriptions`;
      await this.sendAndSaveBotReply(conversation.id, to, msg);
    }
  }

  private static async sendCreditsReply(conversation: any, customer: any, to: string): Promise<void> {
    const available = (customer.availableCredits || 0).toLocaleString('en-IN');
    const earned = (customer.lifetimeCreditsEarned || 0).toLocaleString('en-IN');
    const redeemed = (customer.lifetimeCreditsRedeemed || 0).toLocaleString('en-IN');

    const reply = `⚡ *Lightning Credits*\n\n• Available: *₹${available}*\n• Lifetime Earned: *₹${earned}*\n• Total Redeemed: *₹${redeemed}*\n\nYou earn 10% back in Lightning Credits on every qualifying purchase (up to ₹500/order)!\n\nView credits ledger:\n👉 https://lightningapi.pro/dashboard/rewards`;
    await this.sendAndSaveBotReply(conversation.id, to, reply);
  }

  private static async sendReferralReply(conversation: any, customer: any, to: string): Promise<void> {
    const referralCode = customer.referralCode || 'PROMO2026';
    const refLink = `https://lightningapi.pro/?ref=${referralCode}`;

    const reply = `⚡ *REFER & EARN*\n\nYour unique referral link:\n👉 ${refLink}\n\n*How it works:*\n1. Share your link with friends or colleagues.\n2. When they register and make a qualifying purchase, they receive their normal Lightning Credits.\n3. You receive the exact same amount in Referral Credits!\n\nView referral dashboard:\n👉 https://lightningapi.pro/dashboard/referrals`;
    await this.sendAndSaveBotReply(conversation.id, to, reply, true);
  }

  private static async sendSupportReply(conversation: any, to: string): Promise<void> {
    const reply = `⚡ *Lightning Deals Support*\n\nNeed technical assistance or order help?\n\n• Customer Support Desk: https://lightningapi.pro/dashboard/support\n• API Documentation: https://lightningapi.pro/docs\n• Reply *7* anytime to connect with an admin directly.`;
    await this.sendAndSaveBotReply(conversation.id, to, reply);
  }

  private static async sendAndSaveBotReply(
    conversationId: string,
    to: string,
    text: string,
    previewUrl = false
  ): Promise<void> {
    const sendResult = await WhatsAppClient.sendMessage({
      to,
      text,
      previewUrl,
    });

    await prisma.whatsAppMessage.create({
      data: {
        conversationId,
        direction: 'OUTBOUND',
        messageType: 'TEXT',
        content: text,
        providerMessageId: sendResult.providerMessageId || null,
        deliveryStatus: sendResult.success ? 'SENT' : 'FAILED',
        sentBy: 'BOT',
      },
    });
  }
}
