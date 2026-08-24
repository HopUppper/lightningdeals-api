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

export class PayUAdapter implements PaymentProviderAdapter {
  name = 'PAYU';

  private get merchantKey(): string {
    return process.env.PAYU_MERCHANT_KEY || 'o32EBi';
  }

  private get merchantSalt(): string {
    return process.env.PAYU_MERCHANT_SALT || 'JFsGJFuOgMJJpbLaG0A0njKeAEfMTX2e';
  }

  private get env(): string {
    return (process.env.PAYU_ENVIRONMENT || 'PRODUCTION').toUpperCase();
  }

  private get paymentUrl(): string {
    return this.env === 'PRODUCTION'
      ? 'https://secure.payu.in/_payment'
      : 'https://test.payu.in/_payment';
  }

  private get verifyApiUrl(): string {
    return this.env === 'PRODUCTION'
      ? 'https://info.payu.in/merchant/postservice.php?form=2'
      : 'https://test.payu.in/merchant/postservice.php?form=2';
  }

  private isConfigured(): boolean {
    return Boolean(this.merchantKey && this.merchantSalt);
  }

  /**
   * Generates standard SHA-512 Hash for PayU payment initiation
   * Formula: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt)
   */
  generatePaymentHash(params: {
    txnid: string;
    amount: string;
    productinfo: string;
    firstname: string;
    email: string;
    udf1?: string;
    udf2?: string;
    udf3?: string;
    udf4?: string;
    udf5?: string;
  }): string {
    const hashString = `${this.merchantKey}|${params.txnid}|${params.amount}|${params.productinfo}|${params.firstname}|${params.email}|${params.udf1 || ''}|${params.udf2 || ''}|${params.udf3 || ''}|${params.udf4 || ''}|${params.udf5 || ''}||||||${this.merchantSalt}`;
    return crypto.createHash('sha512').update(hashString).digest('hex');
  }

  /**
   * Verifies SHA-512 Reverse Hash returned by PayU on payment completion
   * Standard Formula: sha512(salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
   * With Additional Charges: sha512(additionalCharges|salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
   */
  verifyResponseHash(body: Record<string, any>): boolean {
    const {
      key,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      status,
      hash,
      additionalCharges,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
    } = body;

    if (!hash || !status || !txnid) return false;

    let hashSequence = '';
    if (additionalCharges) {
      hashSequence = `${additionalCharges}|${this.merchantSalt}|${status}||||||${udf5 || ''}|${udf4 || ''}|${udf3 || ''}|${udf2 || ''}|${udf1 || ''}|${email || ''}|${firstname || ''}|${productinfo || ''}|${amount || ''}|${txnid || ''}|${key || this.merchantKey}`;
    } else {
      hashSequence = `${this.merchantSalt}|${status}||||||${udf5 || ''}|${udf4 || ''}|${udf3 || ''}|${udf2 || ''}|${udf1 || ''}|${email || ''}|${firstname || ''}|${productinfo || ''}|${amount || ''}|${txnid || ''}|${key || this.merchantKey}`;
    }

    const calculatedHash = crypto.createHash('sha512').update(hashSequence).digest('hex').toLowerCase();
    return calculatedHash === (hash || '').toLowerCase();
  }

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const appUrl = (process.env.APP_URL || process.env.VITE_APP_URL || 'https://lightningapi.pro').replace(/\/$/, '');
    const amountFormatted = Number(params.amountInr).toFixed(2);
    const cleanFirstName = (params.customerName || 'Customer').split(' ')[0].replace(/[^a-zA-Z0-9]/g, '') || 'Customer';
    const cleanProductInfo = params.planName.substring(0, 100);

    const udf1 = params.customerEmail;
    const udf2 = params.planId;
    const udf3 = params.internalOrderId;

    const hash = this.generatePaymentHash({
      txnid: params.internalOrderId,
      amount: amountFormatted,
      productinfo: cleanProductInfo,
      firstname: cleanFirstName,
      email: params.customerEmail,
      udf1,
      udf2,
      udf3,
    });

    const surl = `${appUrl}/api/checkout/payu/response`;
    const furl = `${appUrl}/api/checkout/payu/response`;

    return {
      success: true,
      gatewayOrderId: params.internalOrderId,
      amount: params.amountInr,
      currency: params.currency || 'INR',
      metadata: {
        paymentGateway: 'PAYU',
        action: this.paymentUrl,
        key: this.merchantKey,
        txnid: params.internalOrderId,
        amount: amountFormatted,
        productinfo: cleanProductInfo,
        firstname: cleanFirstName,
        email: params.customerEmail,
        phone: params.customerPhone || '9999999999',
        surl,
        furl,
        hash,
        udf1,
        udf2,
        udf3,
        mode: this.env,
      },
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult> {
    const payload = params.payload || {};

    // 1. Check Reverse Hash Signature
    const isHashValid = this.verifyResponseHash(payload);
    const status = (payload.status || '').toLowerCase();
    const isSuccess = isHashValid && (status === 'success' || status === 'captured');

    const payuPaymentId = payload.mihpayid || payload.payuMoneyId || params.gatewayPaymentId;
    const paidAmount = Number(payload.amount || payload.net_amount_debit || 0);

    if (isSuccess) {
      return {
        isVerified: true,
        paymentStatus: 'CAPTURED',
        paidAmount: paidAmount > 0 ? paidAmount : 0,
        currency: 'INR',
        gatewayOrderId: params.internalOrderId,
        gatewayPaymentId: payuPaymentId,
      };
    }

    // 2. Server-to-Server Direct Verification Backup via PayU PostService
    try {
      const serverCheck = await this.getPaymentStatus(params.internalOrderId);
      if (serverCheck.isVerified) {
        return serverCheck;
      }
    } catch (e) {
      // Ignore API check error and return failure below
    }

    return {
      isVerified: false,
      paymentStatus: 'FAILED',
      paidAmount: 0,
      currency: 'INR',
      gatewayOrderId: params.internalOrderId,
      gatewayPaymentId: payuPaymentId,
      failureReason: payload.error_Message || payload.unmappedstatus || 'PayU hash verification or transaction failed.',
    };
  }

  async getPaymentStatus(internalOrderId: string): Promise<VerifyPaymentResult> {
    try {
      const command = 'verify_payment';
      const hashStr = `${this.merchantKey}|${command}|${internalOrderId}|${this.merchantSalt}`;
      const hash = crypto.createHash('sha512').update(hashStr).digest('hex');

      const formData = new URLSearchParams();
      formData.append('key', this.merchantKey);
      formData.append('command', command);
      formData.append('var1', internalOrderId);
      formData.append('hash', hash);

      const res = await fetch(this.verifyApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      if (!res.ok) {
        return {
          isVerified: false,
          paymentStatus: 'FAILED',
          paidAmount: 0,
          currency: 'INR',
          gatewayOrderId: internalOrderId,
          gatewayPaymentId: '',
          failureReason: `PayU verify_payment HTTP error: ${res.status}`,
        };
      }

      const data: any = await res.json();
      const txDetails = data.transaction_details?.[internalOrderId];

      if (txDetails && (txDetails.status === 'success' || txDetails.status === 'captured')) {
        return {
          isVerified: true,
          paymentStatus: 'CAPTURED',
          paidAmount: Number(txDetails.amt || txDetails.transaction_amount || 0),
          currency: 'INR',
          gatewayOrderId: internalOrderId,
          gatewayPaymentId: txDetails.mihpayid || txDetails.bank_ref_num || '',
        };
      }

      return {
        isVerified: false,
        paymentStatus: 'FAILED',
        paidAmount: 0,
        currency: 'INR',
        gatewayOrderId: internalOrderId,
        gatewayPaymentId: txDetails?.mihpayid || '',
        failureReason: txDetails?.unmappedstatus || txDetails?.error_message || 'Transaction not captured on PayU.',
      };
    } catch (err: any) {
      return {
        isVerified: false,
        paymentStatus: 'FAILED',
        paidAmount: 0,
        currency: 'INR',
        gatewayOrderId: internalOrderId,
        gatewayPaymentId: '',
        failureReason: err.message || 'Error querying PayU verify_payment API.',
      };
    }
  }

  async verifyWebhook(req: Request): Promise<WebhookVerificationResult> {
    const body = req.body || {};
    const isValid = this.verifyResponseHash(body);
    const status = (body.status || '').toLowerCase();
    const internalOrderId = body.txnid || body.udf3;
    const gatewayPaymentId = body.mihpayid || body.payuMoneyId || '';
    const paidAmount = Number(body.amount || body.net_amount_debit || 0);

    return {
      isValid,
      eventType: status === 'success' ? 'payment.captured' : 'payment.failed',
      gatewayOrderId: internalOrderId,
      gatewayPaymentId,
      internalOrderId,
      paidAmount,
      currency: 'INR',
      paymentStatus: status === 'success' ? 'CAPTURED' : 'FAILED',
      rawEventId: gatewayPaymentId || body.txnid,
      error: isValid ? undefined : 'PayU webhook hash mismatch.',
    };
  }

  async getHealthStatus(): Promise<ProviderHealthResult> {
    const isReady = this.isConfigured();
    return {
      status: isReady ? 'CONNECTED' : 'NOT_CONFIGURED',
      providerName: 'PayU Payments Gateway',
      mode: this.env === 'PRODUCTION' ? 'PRODUCTION' : 'TEST',
      message: isReady
        ? `PayU Payments active in ${this.env} mode (MID Key: ${this.merchantKey.substring(0, 3)}••••).`
        : 'PayU credentials not set.',
      lastCheckedAt: new Date().toISOString(),
    };
  }
}
