export interface ModelItem {
  id: string;
  name: string;
  family: string;
  compatibility: 'GPT-compatible' | 'Claude-compatible' | 'ApexScale';
  availability: 'Self-service' | 'Enterprise';
  inputPricePerM: number;
  outputPricePerM: number;
}

export interface PricingTier {
  id: string;
  name: string;
  payPrice: number;
  creditValue: number;
  multiplier: number;
  popular?: boolean;
  features: string[];
}


export interface FaqItem {
  question: string;
  answer: string;
}
