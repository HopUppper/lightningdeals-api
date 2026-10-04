import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { createUniversalPurchase, calculateReward } from '../rewards/rewardService';
import { OrderEngine } from '../orders/orderEngine';

export const integrationRouter = Router();

// Middleware: Authenticate integration requests via API key or Admin JWT
function authenticateIntegration(req: Request, res: Response, next: Function) {
  const integrationKey = req.headers['x-integration-key'] || req.headers['x-api-key'];
  const authHeader = req.headers['authorization'];

  const configuredKey = process.env.INTEGRATION_API_KEY || process.env.JWT_SECRET || 'lightning-integration-key-2026';

  if (integrationKey && (integrationKey === configuredKey || integrationKey === process.env.JWT_SECRET)) {
    return next();
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === configuredKey || token === process.env.JWT_SECRET) {
      return next();
    }
  }

  // Allow localhost / internal server development
  const origin = req.headers.origin || req.ip;
  if (req.ip === '127.0.0.1' || req.ip === '::1' || origin?.includes('localhost')) {
    return next();
  }

  return res.status(401).json({
    error: {
      code: 'UNAUTHORIZED_INTEGRATION',
      message: 'Missing or invalid integration key (x-integration-key).',
    },
  });
}

/**
 * POST /api/integrations/purchases
 * Universal endpoint for WhatsApp, Payment Webhooks, CRM, or external sales channels.
 */
integrationRouter.post('/purchases', authenticateIntegration, async (req: Request, res: Response) => {
  try {
    const {
      customerIdentifier,
      email,
      phone,
      userId,
      product,
      productName,
      amount,
      amountPaid,
      channel,
      status,
      description,
      referenceId,
      purchaseDate,
      notes,
    } = req.body;

    const identifier = (customerIdentifier || email || phone || userId || '').toString().trim();
    const finalProduct = (product || productName || '').toString().trim();
    const rawAmount = amount !== undefined ? amount : amountPaid;
    const finalAmount = Number(rawAmount);

    if (!identifier) {
      return res.status(400).json({
        error: {
          code: 'MISSING_CUSTOMER_IDENTIFIER',
          message: 'Customer identifier (email, phone, or userId) is required.',
        },
      });
    }

    if (!finalProduct) {
      return res.status(400).json({
        error: {
          code: 'MISSING_PRODUCT',
          message: 'Product name is required.',
        },
      });
    }

    if (isNaN(finalAmount) || finalAmount <= 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_AMOUNT',
          message: 'Valid positive purchase amount is required.',
        },
      });
    }

    // 1. Resolve Customer by Email, Phone, or User ID
    const customer = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: 'insensitive' } },
          { phone: { equals: identifier } },
          { id: { equals: identifier } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        availableCredits: true,
      },
    });

    if (!customer) {
      return res.status(404).json({
        error: {
          code: 'CUSTOMER_NOT_FOUND',
          message: `Customer account not found for identifier "${identifier}". The customer must have a registered LightningAPI.pro account to earn Lightning Credits.`,
          registrationUrl: 'https://lightningapi.pro/register',
        },
      });
    }

    // 2. Call Unified Universal Purchase & Reward Engine
    const result = await createUniversalPurchase({
      userId: customer.id,
      productName: finalProduct,
      description: description || `${finalProduct} purchased via ${channel || 'WHATSAPP'}`,
      amountPaid: finalAmount,
      channel: (channel || 'WHATSAPP').toUpperCase(),
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      status: (status || 'COMPLETED').toUpperCase(),
      referenceId: referenceId?.trim() || null,
      notes: notes?.trim() || null,
      createdBy: req.headers['x-integration-source']?.toString() || 'WHATSAPP_INTEGRATION',
    });

    return res.status(result.isDuplicate ? 200 : 201).json({
      success: true,
      idempotent: result.isDuplicate,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
      },
      ...result,
    });
  } catch (err: any) {
    return res.status(400).json({
      error: {
        code: 'PURCHASE_CREATION_FAILED',
        message: err.message,
      },
    });
  }
});

/**
 * POST /api/integrations/purchases/calculate
 * Dry-run calculate rewards for WhatsApp bot responses
 */
integrationRouter.post('/purchases/calculate', async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    const calculation = await calculateReward(Number(amount) || 0);
    res.json({ success: true, calculation });
  } catch (err: any) {
    res.status(400).json({ error: { message: err.message } });
  }
});

/**
 * POST /api/integrations/orders
 * Ingest orders from WhatsApp bot, CRM, or external sales channels.
 * Supports auto-fulfillment of API keys and subscriptions.
 */
integrationRouter.post('/orders', authenticateIntegration, async (req: Request, res: Response) => {
  try {
    const result = await OrderEngine.createExternalOrder({
      customerIdentifier: req.body.customerIdentifier || req.body.email || req.body.phone || req.body.userId,
      customerName: req.body.customerName,
      customerPhone: req.body.customerPhone,
      customerEmail: req.body.customerEmail,
      productName: req.body.productName || req.body.planName || 'API Subscription',
      planId: req.body.planId,
      amountPaid: req.body.amountPaid || req.body.amount,
      channel: (req.body.channel || 'WHATSAPP').toUpperCase(),
      referenceId: req.body.referenceId,
      notes: req.body.notes,
      description: req.body.description,
      status: (req.body.status || 'COMPLETED').toUpperCase(),
      autoFulfill: Boolean(req.body.autoFulfill),
      createdBy: req.headers['x-integration-source']?.toString() || 'WHATSAPP_INTEGRATION',
    });

    res.status(result.isDuplicate ? 200 : 201).json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    res.status(400).json({ error: { message: err.message } });
  }
});
