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

const PRODUCT_CATALOG_WITHOUT_PRICES = [
  { id: 'prod_claude_max', name: 'Claude Max 5x (20M Tokens)' },
  { id: 'prod_claude_pro', name: 'Claude Pro Account' },
  { id: 'prod_cursor_pro', name: 'Cursor Pro AI IDE' },
  { id: 'prod_chatgpt_team', name: 'ChatGPT Team Workspace' },
  { id: 'prod_midjourney', name: 'Midjourney Mega Plan' },
  { id: 'prod_custom', name: 'Custom Developer API Bundle' },
];

export class WhatsAppEngine {
  /**
   * Main entry point for inbound customer WhatsApp messages.
   * Handles idempotency, state machine transitions, zero-price-leakage, and human handoff.
   */
  static async handleInboundMessage(params: InboundMessageParams): Promise<WhatsAppEngineResult> {
    const { from, body, providerMessageId, customerName } = params;
    const sanitizedFrom = from.replace(/\D/g, '');
    const cleanBody = (body || '').trim();

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
          currentState: identity ? 'START' : 'AWAITING_EMAIL',
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

    // 4. Human Handoff Check:
    // If conversation is already in HUMAN_HANDOFF, suppress bot auto-replies so admin has full control
    if (conversation.status === 'HUMAN_HANDOFF') {
      return {
        handled: true,
        conversationId: conversation.id,
        replySent: false,
        status: conversation.status,
        currentState: conversation.currentState,
      };
    }

    // 4. Adversarial Input Guard & Message Safety (Must run before handoff keywords)
    const lowerBody = cleanBody.toLowerCase();
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
      const reply = `We'll automatically update your order once the payment is verified through our secure payment gateway. ⚡\n\nIf you need immediate help, reply *8* to talk to an admin.`;
      await this.sendAndSaveBotReply(conversation.id, sanitizedFrom, reply);
      return {
        handled: true,
        conversationId: conversation.id,
        replySent: true,
        status: conversation.status,
        currentState: conversation.currentState,
      };
    }

    // 5. Human Handoff Check (Triggered via option 8 or explicit human request)
    if (
      lowerBody === '8' ||
      lowerBody.includes('talk to admin') ||
      lowerBody.includes('speak with agent') ||
      lowerBody.includes('support agent') ||
      lowerBody.includes('human handoff') ||
      lowerBody.trim() === 'human' ||
      lowerBody.trim() === 'admin'
    ) {
      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: {
          status: 'HUMAN_HANDOFF',
          currentState: 'HUMAN_HANDOFF',
        },
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

    // 6. Handle Customer Identification (Email entry)
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const emailMatch = cleanBody.match(emailRegex);

    if (emailMatch) {
      const foundEmail = emailMatch[1].toLowerCase();
      const existingUser = await prisma.user.findFirst({
        where: { email: { equals: foundEmail, mode: 'insensitive' } },
      });

      if (existingUser) {
        // Link customer to conversation
        await prisma.whatsAppConversation.update({
          where: { id: conversation.id },
          data: {
            customerId: existingUser.id,
            currentState: 'START',
            status: 'ACTIVE',
          },
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

        const reply = `⚡ *Welcome back, ${existingUser.name || 'Lightning Member'}!*\n\nWe've successfully verified your LightningAPI.pro account (*${foundEmail}*).\n\n${this.getMainMenuText()}`;
        await this.sendAndSaveBotReply(conversation.id, sanitizedFrom, reply);

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

        return {
          handled: true,
          conversationId: conversation.id,
          replySent: true,
          status: 'WAITING_CUSTOMER',
          currentState: 'AWAITING_EMAIL',
        };
      }
    }

    // 7. If conversation has no customer linked and user didn't enter email:
    if (!conversation.customerId) {
      const reply = `⚡ *Welcome to Lightning Deals!*\n\nTo view your orders, credits, or request negotiated pricing, please enter the *email address* registered with your LightningAPI.pro account.\n\nDon't have an account? Sign up in 10 seconds at:\n👉 https://lightningapi.pro/`;
      await this.sendAndSaveBotReply(conversation.id, sanitizedFrom, reply);

      return {
        handled: true,
        conversationId: conversation.id,
        replySent: true,
        status: 'WAITING_CUSTOMER',
        currentState: 'AWAITING_EMAIL',
      };
    }

    // 8. Customer is verified. Process Menu & Action Commands
    const customer = conversation.customer || (await prisma.user.findUnique({ where: { id: conversation.customerId } }));
    if (!customer) {
      const reply = `Account not found. Please type your registered email address.`;
      await this.sendAndSaveBotReply(conversation.id, sanitizedFrom, reply);
      return { handled: true, conversationId: conversation.id, status: 'WAITING_CUSTOMER', currentState: 'AWAITING_EMAIL' };
    }

    // Option 1: Browse Products (ZERO PRICES)
    if (lowerBody === '1' || lowerBody.includes('browse') || lowerBody.includes('catalog')) {
      let catalogText = `⚡ *AVAILABLE PRODUCTS & PLANS*\n_(Prices are individually customized per developer)_\n\n`;
      PRODUCT_CATALOG_WITHOUT_PRICES.forEach((p, idx) => {
        catalogText += `${idx + 1}️⃣ *${p.name}*\n`;
      });
      catalogText += `\nTo order a product, reply with the product number (e.g. *1* or *2*). Our admin will confirm your deal price personally. ⚡`;

      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: { currentState: 'PRODUCT_SELECTION' },
      });

      await this.sendAndSaveBotReply(conversation.id, sanitizedFrom, catalogText);
      return { handled: true, conversationId: conversation.id, replySent: true, status: conversation.status, currentState: 'PRODUCT_SELECTION' };
    }

    // Option 2 or Selecting Product from list
    if (
      lowerBody === '2' ||
      conversation.currentState === 'PRODUCT_SELECTION' ||
      PRODUCT_CATALOG_WITHOUT_PRICES.some(p => lowerBody.includes(p.name.toLowerCase().split(' ')[0]))
    ) {
      // Find matching product
      let selectedProduct = PRODUCT_CATALOG_WITHOUT_PRICES[0];
      if (lowerBody === '1' || lowerBody.includes('claude max')) selectedProduct = PRODUCT_CATALOG_WITHOUT_PRICES[0];
      else if (lowerBody === '2' || lowerBody.includes('claude pro')) selectedProduct = PRODUCT_CATALOG_WITHOUT_PRICES[1];
      else if (lowerBody === '3' || lowerBody.includes('cursor')) selectedProduct = PRODUCT_CATALOG_WITHOUT_PRICES[2];
      else if (lowerBody === '4' || lowerBody.includes('chatgpt')) selectedProduct = PRODUCT_CATALOG_WITHOUT_PRICES[3];
      else if (lowerBody === '5' || lowerBody.includes('midjourney')) selectedProduct = PRODUCT_CATALOG_WITHOUT_PRICES[4];
      else if (lowerBody === '6' || lowerBody.includes('custom')) selectedProduct = PRODUCT_CATALOG_WITHOUT_PRICES[5];

      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: {
          currentProductId: selectedProduct.id,
          currentProductName: selectedProduct.name,
          status: 'WAITING_ADMIN',
          currentState: 'AWAITING_ADMIN_PRICE',
          lastMessageSnippet: `Product selected: ${selectedProduct.name}`,
        },
      });

      const reply = `Sure ⚡\n\n*${selectedProduct.name}* is available.\n\nAn admin will confirm the current price for you. Please wait a moment. ⚡`;
      await this.sendAndSaveBotReply(conversation.id, sanitizedFrom, reply);

      return {
        handled: true,
        conversationId: conversation.id,
        replySent: true,
        status: 'WAITING_ADMIN',
        currentState: 'AWAITING_ADMIN_PRICE',
      };
    }

    // If customer asks "how much?", "price?", "kitna"
    if (
      lowerBody.includes('how much') ||
      lowerBody.includes('price') ||
      lowerBody.includes('cost') ||
      lowerBody.includes('rate') ||
      lowerBody.includes('kitna')
    ) {
      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: {
          status: 'WAITING_ADMIN',
          currentState: 'AWAITING_ADMIN_PRICE',
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

    // Option 3: My Orders
    if (lowerBody === '3' || lowerBody.includes('order')) {
      const orders = await prisma.order.findMany({
        where: { userId: customer.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      if (orders.length === 0) {
        const reply = `⚡ *My Orders*\n\nYou haven't placed any orders yet.\n\nType *1* to browse available products and request a quote. ⚡`;
        await this.sendAndSaveBotReply(conversation.id, sanitizedFrom, reply);
      } else {
        let msg = `⚡ *Your Recent Orders*\n\n`;
        for (const ord of orders) {
          const statusIcon = ord.paymentStatus === 'CAPTURED' ? '✅ Completed' : ord.paymentStatus === 'FAILED' ? '❌ Failed' : '⏳ Payment Pending';
          const dateStr = ord.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
          msg += `📦 *${ord.planName}*\n• Order ID: \`${ord.internalOrderId}\`\n• Amount: ₹${ord.amountInr.toLocaleString('en-IN')}\n• Status: ${statusIcon}\n• Date: ${dateStr}\n\n`;
        }
        msg += `For full receipt and invoice details, visit:\n👉 https://lightningapi.pro/dashboard/orders`;
        await this.sendAndSaveBotReply(conversation.id, sanitizedFrom, msg);
      }

      return { handled: true, conversationId: conversation.id, replySent: true, status: conversation.status, currentState: conversation.currentState };
    }

    // Option 4: My Subscriptions
    if (lowerBody === '4' || lowerBody.includes('subscription')) {
      const subscriptions = await prisma.subscription.findMany({
        where: { userId: customer.id },
        orderBy: { createdAt: 'desc' },
        take: 3,
      });

      if (subscriptions.length === 0) {
        const reply = `⚡ *My Subscriptions*\n\nYou have no active subscriptions.\n\nType *1* to view available plans and get started. ⚡`;
        await this.sendAndSaveBotReply(conversation.id, sanitizedFrom, reply);
      } else {
        let msg = `⚡ *Your Subscriptions*\n\n`;
        const now = new Date();
        for (const sub of subscriptions) {
          const daysRemaining = Math.max(0, Math.ceil((sub.expiryTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          const expiryStr = sub.expiryTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
          msg += `🛡️ *${sub.planName}*\n• Status: ${sub.status}\n• Expires: ${expiryStr}\n• Days remaining: ${daysRemaining}\n\n`;
        }
        msg += `Manage or renew your plans at:\n👉 https://lightningapi.pro/dashboard/subscriptions`;
        await this.sendAndSaveBotReply(conversation.id, sanitizedFrom, msg);
      }

      return { handled: true, conversationId: conversation.id, replySent: true, status: conversation.status, currentState: conversation.currentState };
    }

    // Option 5: Lightning Credits
    if (lowerBody === '5' || lowerBody.includes('credit') || lowerBody.includes('reward')) {
      const available = (customer.availableCredits || 0).toLocaleString('en-IN');
      const earned = (customer.lifetimeCreditsEarned || 0).toLocaleString('en-IN');
      const redeemed = (customer.lifetimeCreditsRedeemed || 0).toLocaleString('en-IN');

      const reply = `⚡ *Lightning Credits*\n\n• Available: *₹${available}*\n• Lifetime Earned: *₹${earned}*\n• Total Redeemed: *₹${redeemed}*\n\nYou earn 10% back in Lightning Credits on every qualifying purchase (up to ₹500/order)!\n\nView credits ledger:\n👉 https://lightningapi.pro/dashboard/rewards`;
      await this.sendAndSaveBotReply(conversation.id, sanitizedFrom, reply);

      return { handled: true, conversationId: conversation.id, replySent: true, status: conversation.status, currentState: conversation.currentState };
    }

    // Option 6: Refer & Earn
    if (lowerBody === '6' || lowerBody.includes('refer')) {
      const referralCode = customer.referralCode || 'PROMO2026';
      const refLink = `https://lightningapi.pro/?ref=${referralCode}`;

      const reply = `⚡ *REFER & EARN*\n\nYour unique referral link:\n👉 ${refLink}\n\n*How it works:*\n1. Share your link with friends or colleagues.\n2. When they register and make a qualifying purchase, they receive their normal Lightning Credits.\n3. You receive the exact same amount in Referral Credits!\n\nView referral dashboard:\n👉 https://lightningapi.pro/dashboard/referrals`;
      await this.sendAndSaveBotReply(conversation.id, sanitizedFrom, reply, true);

      return { handled: true, conversationId: conversation.id, replySent: true, status: conversation.status, currentState: conversation.currentState };
    }

    // Option 7: Support
    if (lowerBody === '7' || lowerBody.includes('help')) {
      const reply = `⚡ *Lightning Deals Support*\n\nNeed technical assistance or order help?\n\n• Customer Support Desk: https://lightningapi.pro/dashboard/support\n• API Documentation: https://lightningapi.pro/docs\n• Reply *8* anytime to connect with an admin directly.`;
      await this.sendAndSaveBotReply(conversation.id, sanitizedFrom, reply);

      return { handled: true, conversationId: conversation.id, replySent: true, status: conversation.status, currentState: conversation.currentState };
    }

    // Default Fallback: Present Main Menu
    const fallbackReply = `⚡ *LIGHTNING DEALS*\n\n${this.getMainMenuText()}`;
    await this.sendAndSaveBotReply(conversation.id, sanitizedFrom, fallbackReply);

    return {
      handled: true,
      conversationId: conversation.id,
      replySent: true,
      status: conversation.status,
      currentState: conversation.currentState,
    };
  }

  private static getMainMenuText(): string {
    return `What would you like to do?\n\n1️⃣ Browse Products\n2️⃣ Buy Something\n3️⃣ My Orders\n4️⃣ My Subscriptions\n5️⃣ Lightning Credits\n6️⃣ Refer & Earn\n7️⃣ Support\n8️⃣ Talk to an Admin\n\nReply with a number (1-8) to choose.`;
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
