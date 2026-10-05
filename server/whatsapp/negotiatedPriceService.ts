import crypto from 'crypto';
import { prisma } from '../db';
import { recordAuditEvent } from '../auditLogger';
import { getPaymentProvider } from '../payments';
import { WhatsAppClient } from './whatsappClient';

export interface CreateNegotiatedPriceParams {
  customerId: string;
  whatsappConversationId?: string;
  productId: string;
  productName: string;
  amount: number;
  currency?: string;
  createdBy: string; // Admin userId
  notes?: string;
  expiresInHours?: number;
}

export interface ConvertNegotiatedPriceToOrderParams {
  negotiatedPriceId: string;
  adminId: string;
  customerPhone?: string;
}

export class NegotiatedPriceService {
  /**
   * Helper: Ensure a valid Customer exists for a WhatsApp conversation.
   * Auto-provisions shadow customer account if not yet linked.
   */
  static async ensureCustomerForConversation(conversationId: string) {
    const conv = await prisma.whatsAppConversation.findUnique({
      where: { id: conversationId },
      include: { customer: true },
    });
    if (!conv) {
      throw new Error(`WhatsApp conversation '${conversationId}' not found.`);
    }

    if (conv.customerId && conv.customer) {
      return conv.customer;
    }

    if (conv.customerId) {
      const existing = await prisma.user.findUnique({ where: { id: conv.customerId } });
      if (existing) return existing;
    }

    const cleanPhone = conv.whatsappNumber.replace(/\D/g, '');
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: conv.whatsappNumber },
          { phone: cleanPhone },
          { email: `wa_${cleanPhone}@lightningapi.pro` },
        ],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: conv.customerName || `Customer (${cleanPhone})`,
          email: `wa_${cleanPhone}@lightningapi.pro`,
          phone: cleanPhone,
          passwordHash: crypto.randomBytes(32).toString('hex'),
          role: 'user',
          status: 'active',
        },
      });
    }

    await prisma.whatsAppConversation.update({
      where: { id: conv.id },
      data: { customerId: user.id },
    });

    await prisma.whatsAppCustomerIdentity.upsert({
      where: { whatsappNumber: conv.whatsappNumber },
      create: {
        customerId: user.id,
        whatsappNumber: conv.whatsappNumber,
        verified: true,
      },
      update: {
        customerId: user.id,
      },
    }).catch(() => {});

    return user;
  }

  /**
   * 1. CREATE NEGOTIATED PRICE
   * Strictly authorized admin operation. Never exposes internal cost or website price.
   * Creates an auditable record with explicit expiry.
   */
  static async createNegotiatedPrice(params: CreateNegotiatedPriceParams) {
    const {
      customerId,
      whatsappConversationId,
      productId,
      productName,
      amount,
      currency = 'INR',
      createdBy,
      notes,
      expiresInHours = 48,
    } = params;

    // 1. Resolve or validate customer
    let targetCustomerId = customerId;
    if (!targetCustomerId && whatsappConversationId) {
      const customer = await this.ensureCustomerForConversation(whatsappConversationId);
      targetCustomerId = customer.id;
    } else if (targetCustomerId) {
      const customer = await prisma.user.findUnique({ where: { id: targetCustomerId } });
      if (!customer) {
        throw new Error(`Customer with ID '${targetCustomerId}' does not exist.`);
      }
    } else {
      throw new Error('Either customerId or whatsappConversationId must be provided.');
    }

    // 2. Validate amount security: strictly positive, non-zero, finite number
    const cleanAmount = Number(amount);
    if (isNaN(cleanAmount) || !isFinite(cleanAmount) || cleanAmount <= 0) {
      throw new Error('Negotiated amount must be a valid positive number greater than 0.');
    }

    // 3. Round to 2 decimal places
    const finalAmount = Math.round(cleanAmount * 100) / 100;

    // 4. Calculate expiration timestamp
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    // 5. Supersede any older active quotes for this product to keep price single-source-of-truth
    await prisma.negotiatedPrice.updateMany({
      where: {
        customerId: targetCustomerId,
        productId,
        status: 'ACTIVE',
      },
      data: { status: 'SUPERSEDED' },
    });

    // 5b. Cancel any stale unpaid orders with an outdated price so the new order reflects the latest price
    await prisma.order.updateMany({
      where: {
        userId: targetCustomerId,
        planId: productId,
        paymentStatus: { in: ['CREATED', 'PENDING'] },
        status: 'PENDING',
        amountInr: { not: finalAmount },
      },
      data: {
        status: 'CANCELLED',
        cancellationReason: `Price updated to ₹${finalAmount}`,
      },
    }).catch(() => {});

    // 6. Create NegotiatedPrice record
    const record = await prisma.negotiatedPrice.create({
      data: {
        customerId: targetCustomerId,
        whatsappConversationId,
        productId,
        productName: productName.trim(),
        amount: finalAmount,
        currency,
        createdBy,
        expiresAt,
        status: 'ACTIVE',
        notes: notes?.trim() || null,
      },
    });

    // 7. Record Tamper-Evident Audit Log
    await recordAuditEvent({
      eventType: 'NEGOTIATED_PRICE_CREATED',
      severity: 'INFO',
      actorType: 'ADMIN',
      actorId: createdBy,
      customerId: targetCustomerId,
      adminId: createdBy,
      resourceType: 'ORDER',
      resourceId: record.id,
      action: 'SET_CUSTOMER_PRICE',
      result: 'SUCCESS',
      metadata: {
        negotiatedPriceId: record.id,
        productId,
        productName: record.productName,
        amount: finalAmount,
        currency,
        whatsappConversationId,
        expiresAt,
        notes,
      },
    });

    // If conversation linked, update conversation status to PRICE_APPROVED
    if (whatsappConversationId) {
      await prisma.whatsAppConversation.update({
        where: { id: whatsappConversationId },
        data: {
          customerId: targetCustomerId,
          status: 'PRICE_APPROVED',
          currentState: 'AWAITING_CUSTOMER_CONFIRMATION',
          currentProductId: productId,
          currentProductName: productName.trim(),
          lastMessageAt: new Date(),
          lastMessageSnippet: `Agreed Price: ₹${finalAmount}`,
        },
      }).catch(() => {});
    }

    return record;
  }

  /**
   * 2. CONVERT NEGOTIATED PRICE TO ORDER & GENERATE PAYU PAYMENT LINK
   * Creates a formal Order through Universal Order Engine using:
   * channel = 'WHATSAPP', priceSource = 'ADMIN_NEGOTIATED'
   * Amount is strictly locked to negotiated price.
   */
  static async convertToOrderAndGeneratePaymentLink(params: ConvertNegotiatedPriceToOrderParams) {
    const { negotiatedPriceId, adminId, customerPhone } = params;

    const negotiatedPrice = await prisma.negotiatedPrice.findUnique({
      where: { id: negotiatedPriceId },
      include: {
        customer: true,
        whatsappConversation: true,
      },
    });

    if (!negotiatedPrice) {
      throw new Error(`Negotiated price quote '${negotiatedPriceId}' not found.`);
    }

    if (negotiatedPrice.status !== 'ACTIVE') {
      throw new Error(`Negotiated price is no longer active (current status: ${negotiatedPrice.status}).`);
    }

    if (new Date() > negotiatedPrice.expiresAt) {
      await prisma.negotiatedPrice.update({
        where: { id: negotiatedPrice.id },
        data: { status: 'EXPIRED' },
      });
      throw new Error('This negotiated price quote has expired.');
    }

    const customer = negotiatedPrice.customer;
    const internalOrderId = `LD-WA-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // 1. Check if corresponding Plan exists, or fallback to custom product plan
    let plan = await prisma.plan.findUnique({ where: { id: negotiatedPrice.productId } });
    if (!plan) {
      plan = await prisma.plan.findFirst({
        where: { name: { equals: negotiatedPrice.productName, mode: 'insensitive' } },
      });
    }

    // 2. Create Order atomically with ADMIN_NEGOTIATED priceSource
    const order = await prisma.order.create({
      data: {
        internalOrderId,
        userId: customer.id,
        planId: plan?.id || negotiatedPrice.productId,
        planName: negotiatedPrice.productName,
        tokenQuantity: plan?.tokenAllowance || 5000000n,
        windowHours: plan?.windowHours || 5,
        amountInr: negotiatedPrice.amount,
        originalAmountInr: negotiatedPrice.amount,
        currency: negotiatedPrice.currency,
        status: 'PENDING',
        paymentStatus: 'CREATED',
        fulfillmentStatus: 'NOT_FULFILLED',
        channel: 'WHATSAPP',
        priceSource: 'ADMIN_NEGOTIATED',
        whatsappConversationId: negotiatedPrice.whatsappConversationId,
        paymentGateway: 'PAYU',
      },
    });

    // 3. Mark NegotiatedPrice as USED and link to Order
    const updatedNegotiatedPrice = await prisma.negotiatedPrice.update({
      where: { id: negotiatedPrice.id },
      data: {
        status: 'USED',
        orderId: order.id,
      },
    });

    // 4. Sanitize phone number for PayU
    const rawPhone = customerPhone || customer.phone || negotiatedPrice.whatsappConversation?.whatsappNumber || '';
    let sanitizedPhone = rawPhone.replace(/\D/g, '');
    if (sanitizedPhone.length > 10) {
      sanitizedPhone = sanitizedPhone.slice(-10);
    }

    // 5. Generate PayU Gateway Request
    const provider = getPaymentProvider();
    const gatewayResult = await provider.createOrder({
      internalOrderId: order.internalOrderId,
      amountInr: order.amountInr,
      currency: order.currency,
      planId: order.planId,
      planName: order.planName,
      customerEmail: customer.email,
      customerName: customer.name,
      customerPhone: sanitizedPhone || undefined,
    });

    if (!gatewayResult.success) {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'FAILED', failureReason: gatewayResult.error },
      });
      throw new Error(gatewayResult.error || 'Failed to initialize PayU payment order.');
    }

    // 6. Update order with gateway info and paymentStatus PENDING
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PENDING',
        gatewayOrderId: gatewayResult.gatewayOrderId,
      },
    });

    // Determine checkout URL — points directly to auto-submitting PayU payment form
    const baseUrl = (process.env.LIGHTNINGDEALS_API_URL || process.env.VITE_APP_URL || 'https://lightningapi.pro').replace(/\/$/, '');
    const checkoutUrl = `${baseUrl}/pay/${updatedOrder.internalOrderId}`;

    // 7. If linked to WhatsApp conversation, update conversation and send payment message
    if (negotiatedPrice.whatsappConversationId) {
      await prisma.whatsAppConversation.update({
        where: { id: negotiatedPrice.whatsappConversationId },
        data: {
          currentOrderId: updatedOrder.id,
          status: 'PAYMENT_PENDING',
          currentState: 'PAYMENT_PENDING',
          lastMessageAt: new Date(),
          lastMessageSnippet: `Payment link sent: ₹${negotiatedPrice.amount}`,
        },
      });

      const messageContent = `⚡ *Your order is ready!*\n\nOrder ID: *${updatedOrder.internalOrderId}*\nProduct: *${negotiatedPrice.productName}*\nAmount: *₹${negotiatedPrice.amount.toLocaleString('en-IN')}*\n\nComplete your payment here:\n${checkoutUrl}\n\nOnce payment is confirmed, we'll process your order automatically. ⚡`;

      const sendResult = await WhatsAppClient.sendMessage({
        to: negotiatedPrice.whatsappConversation.whatsappNumber,
        text: messageContent,
        previewUrl: true,
      });

      // Save outbound message to chat history
      await prisma.whatsAppMessage.create({
        data: {
          conversationId: negotiatedPrice.whatsappConversationId,
          direction: 'OUTBOUND',
          messageType: 'TEXT',
          content: messageContent,
          providerMessageId: sendResult.providerMessageId || null,
          deliveryStatus: sendResult.success ? 'SENT' : 'FAILED',
          sentBy: 'BOT',
          metadata: JSON.stringify({
            orderId: updatedOrder.id,
            internalOrderId: updatedOrder.internalOrderId,
            amount: negotiatedPrice.amount,
            checkoutUrl,
          }),
        },
      });
    }

    // 8. Record Tamper-Evident Audit Log
    await recordAuditEvent({
      eventType: 'ORDER_CREATED_WHATSAPP_NEGOTIATED',
      severity: 'INFO',
      actorType: 'ADMIN',
      actorId: adminId,
      customerId: customer.id,
      adminId,
      resourceType: 'ORDER',
      resourceId: updatedOrder.id,
      action: 'GENERATE_PAYU_PAYMENT_LINK',
      result: 'SUCCESS',
      metadata: {
        orderId: updatedOrder.id,
        internalOrderId: updatedOrder.internalOrderId,
        negotiatedPriceId,
        amount: negotiatedPrice.amount,
        productName: negotiatedPrice.productName,
        checkoutUrl,
      },
    });

    return {
      success: true,
      order: updatedOrder,
      checkoutUrl,
      negotiatedPrice: updatedNegotiatedPrice,
    };
  }
}
