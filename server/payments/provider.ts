import { Request } from 'express';

export interface CreateOrderParams {
  internalOrderId: string;
  amountInr: number;
  currency: string;
  planId: string;
  planName: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
}

export interface CreateOrderResult {
  success: boolean;
  gatewayOrderId: string;
  amount: number;
  currency: string;
  checkoutUrl?: string;
  metadata?: Record<string, any>;
  error?: string;
}

export interface VerifyPaymentParams {
  internalOrderId: string;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  gatewaySignature?: string;
  payload?: Record<string, any>;
}

export interface VerifyPaymentResult {
  isVerified: boolean;
  paymentStatus: 'CAPTURED' | 'AUTHORIZED' | 'PENDING' | 'FAILED' | 'VERIFICATION_FAILED';
  paidAmount: number;
  currency: string;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  failureReason?: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  eventType: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  internalOrderId?: string;
  paidAmount?: number;
  currency?: string;
  paymentStatus?: 'CAPTURED' | 'FAILED' | 'REFUNDED';
  rawEventId?: string;
  error?: string;
}

export interface ProviderHealthResult {
  status: 'CONNECTED' | 'DEGRADED' | 'OFFLINE' | 'NOT_CONFIGURED';
  providerName: string;
  mode: 'PRODUCTION' | 'STAGING' | 'TEST';
  message: string;
  lastCheckedAt: string;
}

export interface PaymentProviderAdapter {
  name: string;
  createOrder(params: CreateOrderParams): Promise<CreateOrderResult>;
  verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult>;
  verifyWebhook(req: Request): Promise<WebhookVerificationResult>;
  getPaymentStatus(gatewayOrderId: string): Promise<VerifyPaymentResult>;
  getHealthStatus(): Promise<ProviderHealthResult>;
  refundPayment?(gatewayPaymentId: string, amount?: number): Promise<{ success: boolean; refundId?: string; error?: string }>;
}
