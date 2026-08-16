import crypto from 'crypto';
import { Request } from 'express';
import {
  PaymentProviderAdapter,
  CreateOrderParams,
  CreateOrderResult,
  VerifyPaymentParams,
  VerifyPaymentResult,
  WebhookVerificationResult,
  ProviderHealthResult,
} from '../provider';

export class TestPaymentAdapter implements PaymentProviderAdapter {
  public name = 'TEST_LOCAL_PAYMENT_GATEWAY';

  private secretKey = process.env.PAYMENT_API_SECRET || 'test_payment_gateway_secret_2026';

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const gatewayOrderId = `test_ord_${crypto.randomBytes(12).toString('hex')}`;

    return {
      success: true,
      gatewayOrderId,
      amount: params.amountInr,
      currency: params.currency || 'INR',
      metadata: {
        internalOrderId: params.internalOrderId,
        planId: params.planId,
        testMode: true,
        mockCheckoutSignature: this.generateSignature(gatewayOrderId, params.internalOrderId, params.amountInr),
      },
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult> {
    const { internalOrderId, gatewayOrderId, gatewayPaymentId, gatewaySignature, payload } = params;

    // Signature verification check if provided
    if (gatewaySignature) {
      const expectedSig = this.generateSignature(gatewayOrderId, internalOrderId, payload?.amount || 0);
      if (gatewaySignature !== expectedSig && !gatewaySignature.startsWith('test_sig_valid')) {
        return {
          isVerified: false,
          paymentStatus: 'VERIFICATION_FAILED',
          paidAmount: 0,
          currency: 'INR',
          gatewayOrderId,
          gatewayPaymentId: gatewayPaymentId || `test_pay_failed`,
          failureReason: 'Invalid payment gateway signature.',
        };
      }
    }

    const paidAmount = payload?.amount ? Number(payload.amount) : 0;

    return {
      isVerified: true,
      paymentStatus: 'CAPTURED',
      paidAmount,
      currency: 'INR',
      gatewayOrderId,
      gatewayPaymentId: gatewayPaymentId || `test_pay_${crypto.randomBytes(10).toString('hex')}`,
    };
  }

  async verifyWebhook(req: Request): Promise<WebhookVerificationResult> {
    const signature = req.headers['x-test-signature'] || req.headers['x-payment-signature'];
    const body = req.body || {};

    if (process.env.NODE_ENV === 'production' && process.env.PAYMENT_TEST_MODE !== 'true') {
      return {
        isValid: false,
        eventType: 'UNKNOWN',
        error: 'Test Payment Adapter is disabled in Production mode.',
      };
    }

    const eventId = body.eventId || `evt_${crypto.randomBytes(8).toString('hex')}`;
    const gatewayOrderId = body.gatewayOrderId;
    const gatewayPaymentId = body.gatewayPaymentId;
    const internalOrderId = body.internalOrderId;
    const amount = Number(body.amount || 0);

    return {
      isValid: true,
      eventType: body.event || 'payment.captured',
      gatewayOrderId,
      gatewayPaymentId,
      internalOrderId,
      paidAmount: amount,
      currency: body.currency || 'INR',
      paymentStatus: body.status === 'failed' ? 'FAILED' : 'CAPTURED',
      rawEventId: eventId,
    };
  }

  async getPaymentStatus(gatewayOrderId: string): Promise<VerifyPaymentResult> {
    return {
      isVerified: true,
      paymentStatus: 'CAPTURED',
      paidAmount: 0,
      currency: 'INR',
      gatewayOrderId,
      gatewayPaymentId: `test_pay_queried_${gatewayOrderId}`,
    };
  }

  async getHealthStatus(): Promise<ProviderHealthResult> {
    return {
      status: 'CONNECTED',
      providerName: 'Test Payment Gateway (Staging / Localhost)',
      mode: 'TEST',
      message: 'Local Test Payment Adapter active for development and staging tests.',
      lastCheckedAt: new Date().toISOString(),
    };
  }

  public generateSignature(gatewayOrderId: string, internalOrderId: string, amount: number): string {
    const data = `${gatewayOrderId}|${internalOrderId}|${amount}`;
    return `test_sig_${crypto.createHmac('sha256', this.secretKey).update(data).digest('hex')}`;
  }
}
