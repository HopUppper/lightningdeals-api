import { PaymentProviderAdapter } from './provider';
import { CashfreeAdapter } from './adapters/cashfreeAdapter';
import { TestPaymentAdapter } from './adapters/testAdapter';

let currentAdapterInstance: PaymentProviderAdapter | null = null;

export function getPaymentProvider(): PaymentProviderAdapter {
  if (currentAdapterInstance) {
    return currentAdapterInstance;
  }

  const providerType = (process.env.PAYMENT_PROVIDER || 'CASHFREE').toUpperCase();
  const isExplicitTestMode = process.env.PAYMENT_TEST_MODE === 'true';

  if (!isExplicitTestMode && (providerType === 'CASHFREE' || Boolean(process.env.CASHFREE_APP_ID))) {
    currentAdapterInstance = new CashfreeAdapter();
    return currentAdapterInstance;
  }

  currentAdapterInstance = new CashfreeAdapter();
  return currentAdapterInstance;
}

export * from './provider';
export * from './plans';
