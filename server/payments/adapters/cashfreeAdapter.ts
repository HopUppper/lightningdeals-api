import { Request } from 'express';
import crypto from 'crypto';
import {
  PaymentProviderAdapter,
  CreateOrderParams,
  CreateOrderResult,
  VerifyPaymentParams,
  VerifyPaymentResult,
  WebhookVerificationResult,
  ProviderHealthResult,
} from '../provider';

export class CashfreeAdapter implements PaymentProviderAdapter {
  name = 'CASHFREE';

  private get appId(): string {
    return process.env.CASHFREE_APP_ID || '';
  }

  private get secretKey(): string {
    return process.env.CASHFREE_SECRET_KEY || '';
  }

  private get env(): string {
    return (process.env.CASHFREE_ENVIRONMENT || 'SANDBOX').toUpperCase();
  }

  private get baseUrl(): string {
    return this.env === 'PRODUCTION'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';
  }

  private isConfigured(): boolean {
    return Boolean(this.appId && this.secretKey);
  }

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    if (!this.isConfigured()) {
      // Fallback Mode for local testing when Cashfree credentials are missing
      const mockSessionId = `session_cf_${crypto.randomBytes(8).toString('hex')}`;
      return {
        success: true,
        gatewayOrderId: params.internalOrderId,
        amount: params.amountInr,
        currency: params.currency || 'INR',
        checkoutUrl: `/checkout?order_id=${params.internalOrderId}&payment_session_id=${mockSessionId}`,
        metadata: {
          payment_session_id: mockSessionId,
          cf_order_id: `cf_${crypto.randomBytes(8).toString('hex')}`,
          mode: 'TEST_FALLBACK',
        },
      };
    }

    try {
      const returnUrl = `${process.env.APP_URL || 'http://localhost:3000'}/dashboard/orders?order_id=${params.internalOrderId}`;
      const payload = {
        order_id: params.internalOrderId,
        order_amount: params.amountInr,
        order_currency: params.currency || 'INR',
        customer_details: {
          customer_id: `cust_${params.internalOrderId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)}`,
          customer_name: params.customerName || 'Customer',
          customer_email: params.customerEmail,
          customer_phone: params.customerPhone || '9999999999',
        },
        order_meta: {
          return_url: returnUrl,
          notify_url: `${process.env.APP_URL || 'http://localhost:3000'}/api/webhooks/cashfree`,
        },
      };

      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'x-client-id': this.appId,
          'x-client-secret': this.secretKey,
          'x-api-version': '2023-08-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          gatewayOrderId: params.internalOrderId,
          amount: params.amountInr,
          currency: params.currency || 'INR',
          error: data.message || 'Cashfree API returned an error initializing order.',
        };
      }

      return {
        success: true,
        gatewayOrderId: data.order_id || params.internalOrderId,
        amount: data.order_amount || params.amountInr,
        currency: data.order_currency || 'INR',
        checkoutUrl: data.payment_session_id
          ? `/checkout?order_id=${data.order_id}&payment_session_id=${data.payment_session_id}`
          : undefined,
        metadata: {
          payment_session_id: data.payment_session_id,
          cf_order_id: data.cf_order_id,
          order_status: data.order_status,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        gatewayOrderId: params.internalOrderId,
        amount: params.amountInr,
        currency: params.currency || 'INR',
        error: err.message || 'Network exception calling Cashfree gateway.',
      };
    }
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult> {
    if (!this.isConfigured()) {
      // Test mode verification
      return {
        isVerified: true,
        paymentStatus: 'CAPTURED',
        paidAmount: params.payload?.amount || 2499,
        currency: 'INR',
        gatewayOrderId: params.gatewayOrderId,
        gatewayPaymentId: params.gatewayPaymentId || `cf_pay_${crypto.randomBytes(6).toString('hex')}`,
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/orders/${params.gatewayOrderId}`, {
        method: 'GET',
        headers: {
          'x-client-id': this.appId,
          'x-client-secret': this.secretKey,
          'x-api-version': '2023-08-01',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          isVerified: false,
          paymentStatus: 'VERIFICATION_FAILED',
          paidAmount: 0,
          currency: 'INR',
          gatewayOrderId: params.gatewayOrderId,
          gatewayPaymentId: params.gatewayPaymentId,
          failureReason: data.message || 'Unable to fetch order status from Cashfree.',
        };
      }

      const isPaid = data.order_status === 'PAID';

      return {
        isVerified: isPaid,
        paymentStatus: isPaid ? 'CAPTURED' : 'PENDING',
        paidAmount: data.order_amount || 0,
        currency: data.order_currency || 'INR',
        gatewayOrderId: data.order_id,
        gatewayPaymentId: params.gatewayPaymentId || `cf_${data.order_id}`,
        failureReason: isPaid ? undefined : `Cashfree order status is '${data.order_status}'.`,
      };
    } catch (err: any) {
      return {
        isVerified: false,
        paymentStatus: 'VERIFICATION_FAILED',
        paidAmount: 0,
        currency: 'INR',
        gatewayOrderId: params.gatewayOrderId,
        gatewayPaymentId: params.gatewayPaymentId,
        failureReason: err.message,
      };
    }
  }

  async verifyWebhook(req: Request): Promise<WebhookVerificationResult> {
    const signature = (req.headers['x-webhook-signature'] || req.headers['x-cashfree-signature'] || '') as string;
    const timestamp = (req.headers['x-webhook-timestamp'] || '') as string;

    const body = req.body || {};
    const data = body.data || body;
    const order = data.order || {};
    const payment = data.payment || {};

    const gatewayOrderId = order.order_id || body.order_id;
    const gatewayPaymentId = payment.cf_payment_id || body.cf_payment_id;
    const paidAmount = order.order_amount || payment.payment_amount || body.order_amount;
    const eventType = body.type || 'PAYMENT_SUCCESS_WEBHOOK';

    // Signature verification logic
    if (this.isConfigured() && signature && timestamp) {
      try {
        const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        const computedSignature = crypto
          .createHmac('sha256', this.secretKey)
          .update(timestamp + rawBody)
          .digest('base64');

        if (computedSignature !== signature) {
          return { isValid: false, eventType, error: 'Cashfree webhook signature mismatch.' };
        }
      } catch (e: any) {
        return { isValid: false, eventType, error: `Signature verification exception: ${e.message}` };
      }
    }

    const isSuccess = eventType.includes('SUCCESS') || data.payment_status === 'SUCCESS' || order.order_status === 'PAID';

    return {
      isValid: true,
      eventType: isSuccess ? 'payment.captured' : 'payment.failed',
      gatewayOrderId,
      gatewayPaymentId,
      internalOrderId: gatewayOrderId,
      paidAmount: Number(paidAmount || 0),
      currency: 'INR',
      paymentStatus: isSuccess ? 'CAPTURED' : 'FAILED',
      rawEventId: body.event_time ? `cf_evt_${body.event_time}_${gatewayOrderId}` : undefined,
    };
  }

  async getPaymentStatus(gatewayOrderId: string): Promise<VerifyPaymentResult> {
    return this.verifyPayment({ internalOrderId: gatewayOrderId, gatewayOrderId, gatewayPaymentId: '' });
  }

  async getHealthStatus(): Promise<ProviderHealthResult> {
    return {
      status: this.isConfigured() ? 'CONNECTED' : 'NOT_CONFIGURED',
      providerName: 'Cashfree Payments Gateway',
      mode: this.env as any,
      message: this.isConfigured()
        ? `Cashfree Payments operational in ${this.env} mode.`
        : 'Cashfree credentials not set. Operating in local test fallback mode.',
      lastCheckedAt: new Date().toISOString(),
    };
  }
}
