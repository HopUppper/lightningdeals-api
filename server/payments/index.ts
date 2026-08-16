import { PaymentProviderAdapter } from './provider';
import { TestPaymentAdapter } from './adapters/testAdapter';

let currentAdapterInstance: PaymentProviderAdapter | null = null;

export function getPaymentProvider(): PaymentProviderAdapter {
  if (currentAdapterInstance) {
    return currentAdapterInstance;
  }

  const providerType = (process.env.PAYMENT_PROVIDER || 'TEST').toUpperCase();
  const isTestMode = process.env.PAYMENT_TEST_MODE === 'true' || process.env.NODE_ENV !== 'production';

  if (isTestMode || providerType === 'TEST' || providerType === 'MOCK') {
    currentAdapterInstance = new TestPaymentAdapter();
    return currentAdapterInstance;
  }

  // Fallback to Test Adapter if no production adapter is configured
  currentAdapterInstance = new TestPaymentAdapter();
  return currentAdapterInstance;
}

export * from './provider';
export * from './plans';
