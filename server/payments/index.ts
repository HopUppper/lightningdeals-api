import { PaymentProviderAdapter } from './provider';
import { PayUAdapter } from './adapters/payuAdapter';
import { CashfreeAdapter } from './adapters/cashfreeAdapter';
import { TestPaymentAdapter } from './adapters/testAdapter';

let currentAdapterInstance: PaymentProviderAdapter | null = null;

export function getPaymentProvider(): PaymentProviderAdapter {
  if (currentAdapterInstance) {
    return currentAdapterInstance;
  }

  const providerType = (process.env.PAYMENT_PROVIDER || 'PAYU').toUpperCase();
  const isExplicitTestMode = process.env.PAYMENT_TEST_MODE === 'true';

  if (!isExplicitTestMode && (providerType === 'PAYU' || Boolean(process.env.PAYU_MERCHANT_KEY))) {
    currentAdapterInstance = new PayUAdapter();
    return currentAdapterInstance;
  }

  if (!isExplicitTestMode && (providerType === 'CASHFREE' || Boolean(process.env.CASHFREE_APP_ID))) {
    currentAdapterInstance = new CashfreeAdapter();
    return currentAdapterInstance;
  }

  currentAdapterInstance = new PayUAdapter();
  return currentAdapterInstance;
}

export * from './provider';
export * from './plans';
