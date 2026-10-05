import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticateJwt, AuthRequest } from '../auth';
import { recordAuditEvent } from '../auditLogger';
import { WhatsAppClient } from './whatsappClient';
import { NegotiatedPriceService } from './negotiatedPriceService';

export const adminWhatsAppRouter = Router();

// Strict Admin-only middleware
const requireAdmin = (req: AuthRequest, res: Response, next: Function) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
};

adminWhatsAppRouter.use(authenticateJwt, requireAdmin);

/**
 * 1. LIST CONVERSATIONS (With filtering & customer details)
 */
adminWhatsAppRouter.get('/conversations', async (req: AuthRequest, res: Response) => {
  try {
    const { status, search, limit = '50', offset = '0' } = req.query;

    const whereClause: any = {};
    if (status && typeof status === 'string' && status !== 'ALL') {
      whereClause.status = status;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { whatsappNumber: { contains: q, mode: 'insensitive' } },
        { customerName: { contains: q, mode: 'insensitive' } },
        { customer: { email: { contains: q, mode: 'insensitive' } } },
        { customer: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [conversations, totalCount] = await Promise.all([
      prisma.whatsAppConversation.findMany({
        where: whereClause,
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              availableCredits: true,
              referralCode: true,
            },
          },
          currentOrder: {
            select: {
              id: true,
              internalOrderId: true,
              planName: true,
              amountInr: true,
              paymentStatus: true,
              fulfillmentStatus: true,
            },
          },
          assignedAdmin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { lastMessageAt: 'desc' },
        take: parseInt(limit as string, 10),
        skip: parseInt(offset as string, 10),
      }),
      prisma.whatsAppConversation.count({ where: whereClause }),
    ]);

    return res.json({
      conversations,
      totalCount,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    });
  } catch (err: any) {
    console.error('[ADMIN WHATSAPP CONVERSATIONS ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 2. GET SINGLE CONVERSATION DETAILS & DOSSIER
 */
adminWhatsAppRouter.get('/conversations/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const conversation = await prisma.whatsAppConversation.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            availableCredits: true,
            lifetimeCreditsEarned: true,
            lifetimeCreditsRedeemed: true,
            referralCode: true,
            createdAt: true,
          },
        },
        currentOrder: true,
        assignedAdmin: {
          select: { id: true, name: true, email: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 100,
        },
        negotiatedPrices: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    // Reset unread count when admin opens conversation
    if (conversation.unreadCount > 0) {
      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: { unreadCount: 0 },
      });
    }

    // Fetch customer's full order history & active subscriptions if customer linked
    let customerOrders: any[] = [];
    let customerSubscriptions: any[] = [];
    if (conversation.customerId) {
      [customerOrders, customerSubscriptions] = await Promise.all([
        prisma.order.findMany({
          where: { userId: conversation.customerId },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        prisma.subscription.findMany({
          where: { userId: conversation.customerId },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ]);
    }

    return res.json({
      conversation,
      customerOrders,
      customerSubscriptions,
    });
  } catch (err: any) {
    console.error('[ADMIN WHATSAPP CONVERSATION ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
});

import { matchProduct } from './whatsappEngine';

function extractPriceFromText(text: string): number | null {
  if (!text) return null;
  const clean = text.trim();

  // 1. Currency symbols: ₹1499, Rs. 1499, 1499 rs, 1499 inr, 1499 rupees
  const currMatch = clean.match(/(?:₹|rs\.?|inr)\s*(\d+(?:\.\d{1,2})?)/i) || 
                    clean.match(/(\d+(?:\.\d{1,2})?)\s*(?:₹|rs\.?|inr|rupees)/i);
  if (currMatch) {
    const val = parseFloat(currMatch[1]);
    if (!isNaN(val) && val >= 10 && val <= 100000) return val;
  }

  // 2. Keyword patterns: "price 1499", "for 1499", "at 1499", "final 1499", "deal 1499", "pay 1499", "1499 me", "1499 mein", "1499 final"
  const kwMatch = clean.match(/(?:price|rate|cost|final|deal|for|at|pay|give|discount|mil\s*jayega|padega)\s*(?:is|of|hai|h|ko)?\s*(?:₹|rs\.?)?\s*(\d{2,6})/i) ||
                  clean.match(/(\d{2,6})\s*(?:only|me|mein|bhai|final|tk|tak)/i);
  if (kwMatch) {
    const val = parseFloat(kwMatch[1]);
    if (!isNaN(val) && val >= 10 && val <= 100000) return val;
  }

  // 3. Standalone number message: "1499" or "1200" or "₹1499"
  const shortNumMatch = clean.match(/^(?:₹|rs\.?)?\s*(\d{2,6})\s*(?:rs|rupees|inr|only)?$/i);
  if (shortNumMatch) {
    const val = parseFloat(shortNumMatch[1]);
    if (!isNaN(val) && val >= 10 && val <= 100000) return val;
  }

  return null;
}

/**
 * 3. SEND ADMIN MESSAGE TO WHATSAPP CUSTOMER
 * Also detects if admin manually quoted a price in chat, automatically recording it as the active negotiated price!
 */
adminWhatsAppRouter.post('/conversations/:id/messages', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    const conversation = await prisma.whatsAppConversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    const cleanText = text.trim();

    // Send via WhatsApp Client
    const sendResult = await WhatsAppClient.sendMessage({
      to: conversation.whatsappNumber,
      text: cleanText,
    });

    // Save outbound message
    const savedMsg = await prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        direction: 'OUTBOUND',
        messageType: 'TEXT',
        content: cleanText,
        providerMessageId: sendResult.providerMessageId || null,
        deliveryStatus: sendResult.success ? 'SENT' : 'FAILED',
        sentBy: 'ADMIN',
        senderId: req.user!.id,
      },
    });

    // Check if the admin manually offered a price in the message (e.g. "1499", "₹1200", "Claude for 1200")
    const detectedPrice = extractPriceFromText(cleanText);
    if (detectedPrice && detectedPrice > 0) {
      try {
        let targetProductId = conversation.currentProductId || 'claude_max_5x';
        let targetProductName = conversation.currentProductName || 'Claude Max 5x (20M Tokens)';

        const matched = matchProduct(cleanText);
        if (matched) {
          targetProductId = matched.id;
          targetProductName = matched.name;
        }

        await NegotiatedPriceService.createNegotiatedPrice({
          whatsappConversationId: conversation.id,
          customerId: conversation.customerId || undefined,
          productId: targetProductId,
          productName: targetProductName,
          amount: detectedPrice,
          createdBy: req.user!.id,
          notes: `Auto-captured from admin chat message: "${cleanText}"`,
        });

        console.log(`⚡ [ADMIN AUTO-QUOTE] Auto-recorded negotiated price of ₹${detectedPrice} for ${targetProductName} from admin message`);
      } catch (quoteErr: any) {
        console.warn('[ADMIN AUTO-QUOTE WARNING] Could not auto-record price from admin message:', quoteErr.message);
      }
    }

    // Update conversation last message timestamp & snippet
    await prisma.whatsAppConversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        lastMessageSnippet: cleanText.substring(0, 100),
      },
    });

    // Record audit event
    await recordAuditEvent({
      eventType: 'WHATSAPP_ADMIN_MESSAGE_SENT',
      severity: 'INFO',
      actorType: 'ADMIN',
      actorId: req.user!.id,
      customerId: conversation.customerId || undefined,
      adminId: req.user!.id,
      resourceType: 'ORDER',
      resourceId: conversation.id,
      action: 'SEND_WHATSAPP_MESSAGE',
      result: sendResult.success ? 'SUCCESS' : 'FAILED',
      metadata: {
        conversationId: conversation.id,
        whatsappNumber: conversation.whatsappNumber,
        textSnippet: cleanText.substring(0, 100),
      },
      req,
    });

    return res.json({
      success: true,
      message: savedMsg,
    });
  } catch (err: any) {
    console.error('[ADMIN WHATSAPP SEND MESSAGE ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 4. SET CUSTOMER NEGOTIATED PRICE (Admin Modal / API)
 */
adminWhatsAppRouter.post('/negotiate-price', async (req: AuthRequest, res: Response) => {
  try {
    const {
      customerId,
      whatsappConversationId,
      productId,
      productName,
      amount,
      currency,
      notes,
      expiresInHours,
    } = req.body;

    if (!productId || !productName || amount === undefined) {
      return res.status(400).json({
        error: 'productId, productName, and amount are required.',
      });
    }

    if (!customerId && !whatsappConversationId) {
      return res.status(400).json({
        error: 'Either customerId or whatsappConversationId is required.',
      });
    }

    const negotiatedPrice = await NegotiatedPriceService.createNegotiatedPrice({
      customerId: customerId || undefined,
      whatsappConversationId: whatsappConversationId || undefined,
      productId,
      productName,
      amount: Number(amount),
      currency: currency || 'INR',
      createdBy: req.user!.id,
      notes,
      expiresInHours: expiresInHours ? Number(expiresInHours) : 48,
    });

    // Notify customer on WhatsApp about approved deal
    if (whatsappConversationId) {
      const conv = await prisma.whatsAppConversation.findUnique({
        where: { id: whatsappConversationId },
      });
      if (conv) {
        const quoteMsg = `⚡ *Special Approved Price: ₹${Number(amount).toLocaleString('en-IN')}*\n\nOur team has approved your custom price for *${productName.trim()}*!\n\n👉 Reply *"Yes"* or *"Send Link"* to receive your secure PayU checkout link! ⚡`;
        await WhatsAppClient.sendMessage({
          to: conv.whatsappNumber,
          text: quoteMsg,
        }).catch(() => {});

        await prisma.whatsAppMessage.create({
          data: {
            conversationId: conv.id,
            direction: 'OUTBOUND',
            messageType: 'TEXT',
            content: quoteMsg,
            sentBy: 'BOT',
            deliveryStatus: 'SENT',
          },
        }).catch(() => {});
      }
    }

    return res.json({
      success: true,
      negotiatedPrice,
    });
  } catch (err: any) {
    console.error('[ADMIN SET NEGOTIATED PRICE ERROR]', err);
    return res.status(400).json({ error: err.message });
  }
});

/**
 * 5. CREATE ORDER & GENERATE PAYU PAYMENT LINK (Admin Only)
 */
adminWhatsAppRouter.post('/create-order', async (req: AuthRequest, res: Response) => {
  try {
    const { negotiatedPriceId, customerPhone } = req.body;

    if (!negotiatedPriceId) {
      return res.status(400).json({ error: 'negotiatedPriceId is required.' });
    }

    const result = await NegotiatedPriceService.convertToOrderAndGeneratePaymentLink({
      negotiatedPriceId,
      adminId: req.user!.id,
      customerPhone,
    });

    return res.json(result);
  } catch (err: any) {
    console.error('[ADMIN CONVERT NEGOTIATED ORDER ERROR]', err);
    return res.status(400).json({ error: err.message });
  }
});

/**
 * 6. UPDATE CONVERSATION STATUS / ASSIGN ADMIN / ADD NOTES
 */
adminWhatsAppRouter.post('/conversations/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, assignedAdminId } = req.body;

    const dataToUpdate: any = {};
    if (status) dataToUpdate.status = status;
    if (adminNotes !== undefined) dataToUpdate.adminNotes = adminNotes;
    if (assignedAdminId !== undefined) dataToUpdate.assignedAdminId = assignedAdminId;

    const updated = await prisma.whatsAppConversation.update({
      where: { id },
      data: dataToUpdate,
    });

    await recordAuditEvent({
      eventType: 'WHATSAPP_CONVERSATION_UPDATED',
      severity: 'INFO',
      actorType: 'ADMIN',
      actorId: req.user!.id,
      adminId: req.user!.id,
      customerId: updated.customerId || undefined,
      resourceType: 'ORDER',
      resourceId: updated.id,
      action: 'UPDATE_CONVERSATION',
      result: 'SUCCESS',
      metadata: dataToUpdate,
      req,
    });

    return res.json({ success: true, conversation: updated });
  } catch (err: any) {
    console.error('[ADMIN UPDATE STATUS ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 7. TOGGLE HUMAN HANDOFF
 */
adminWhatsAppRouter.post('/conversations/:id/toggle-handoff', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { enableHandoff } = req.body;

    const conversation = await prisma.whatsAppConversation.findUnique({ where: { id } });
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    const newStatus = enableHandoff ? 'HUMAN_HANDOFF' : 'ACTIVE';
    const newState = enableHandoff ? 'HUMAN_HANDOFF' : 'START';

    const updated = await prisma.whatsAppConversation.update({
      where: { id },
      data: {
        status: newStatus,
        currentState: newState,
        assignedAdminId: enableHandoff ? req.user!.id : conversation.assignedAdminId,
      },
    });

    // Notify customer on WhatsApp
    const notificationText = enableHandoff
      ? `🔴 A team administrator has joined this chat. How can we help you? ⚡`
      : `🟢 Automation resumed. You can reply with a number from the menu anytime. ⚡`;

    await WhatsAppClient.sendMessage({
      to: conversation.whatsappNumber,
      text: notificationText,
    });

    await prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        direction: 'OUTBOUND',
        messageType: 'SYSTEM_NOTE',
        content: notificationText,
        deliveryStatus: 'SENT',
        sentBy: 'ADMIN',
        senderId: req.user!.id,
      },
    });

    return res.json({ success: true, conversation: updated });
  } catch (err: any) {
    console.error('[ADMIN TOGGLE HANDOFF ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 8. REAL DATABASE WHATSAPP ANALYTICS
 * Section 31: Real data only, no fake statistics.
 */
adminWhatsAppRouter.get('/analytics', async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalConversations,
      awaitingAdminCount,
      paymentPendingCount,
      humanHandoffCount,
      completedCount,
      allWhatsAppOrders,
    ] = await Promise.all([
      prisma.whatsAppConversation.count(),
      prisma.whatsAppConversation.count({ where: { status: 'WAITING_ADMIN' } }),
      prisma.whatsAppConversation.count({ where: { status: 'PAYMENT_PENDING' } }),
      prisma.whatsAppConversation.count({ where: { status: 'HUMAN_HANDOFF' } }),
      prisma.whatsAppConversation.count({ where: { status: 'COMPLETED' } }),
      prisma.order.findMany({
        where: { channel: 'WHATSAPP' },
        select: {
          id: true,
          amountInr: true,
          paidAmountInr: true,
          status: true,
          paymentStatus: true,
          planName: true,
          createdAt: true,
        },
      }),
    ]);

    const totalOrdersCreated = allWhatsAppOrders.length;
    const paidOrders = allWhatsAppOrders.filter(
      (o) => o.status === 'PAID' || o.paymentStatus === 'CAPTURED'
    );
    const completedPaymentCount = paidOrders.length;
    const totalRevenueInr = paidOrders.reduce(
      (sum, o) => sum + (o.paidAmountInr || o.amountInr || 0),
      0
    );
    const averageOrderValueInr =
      completedPaymentCount > 0 ? Math.round(totalRevenueInr / completedPaymentCount) : 0;
    const conversionRate =
      totalOrdersCreated > 0
        ? Math.round((completedPaymentCount / totalOrdersCreated) * 1000) / 10
        : 0;

    // Top products aggregation
    const productCounts: Record<string, number> = {};
    for (const o of allWhatsAppOrders) {
      const p = o.planName || 'Other';
      productCounts[p] = (productCounts[p] || 0) + 1;
    }
    const topProducts = Object.entries(productCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return res.json({
      totalConversations,
      awaitingAdminCount,
      paymentPendingCount,
      humanHandoffCount,
      completedCount,
      totalOrdersCreated,
      completedPaymentCount,
      totalRevenueInr,
      averageOrderValueInr,
      conversionRate,
      topProducts,
    });
  } catch (err: any) {
    console.error('[ADMIN WHATSAPP ANALYTICS ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
});
