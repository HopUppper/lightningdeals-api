export type SupportedLanguage = 'en' | 'hi' | 'hinglish';

export interface AgentContext {
  conversationId: string;
  whatsappNumber: string;
  customerName?: string | null;
  customerId?: string | null;
  customerEmail?: string | null;
  currentOrderId?: string | null;
  currentProductId?: string | null;
  currentState: string;
  status: string;
  isHumanTakeover: boolean;
  shortTermMemory?: Record<string, any>;
  longTermMemory?: Record<string, any>;
  conversationSummary?: string;
  recentMessages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt?: Date;
  }>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required?: string[];
  };
}

export interface ToolExecutionResult {
  toolName: string;
  success: boolean;
  data: any;
  error?: string;
  requiresFollowUp?: boolean;
}

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentResponse {
  messageText: string;
  intentDetected: string;
  confidence: number;
  language: SupportedLanguage;
  toolsUsed: string[];
  suggestedActions?: string[];
  requiresAdminAlert?: boolean;
  adminAlertReason?: string;
}

export interface KnowledgeItem {
  id: string;
  category: string;
  title: string;
  content: string;
  keywords?: string | null;
  tags?: string | null;
  priority: number;
  enabled: boolean;
}

export interface TrainingExampleItem {
  id: string;
  inputText: string;
  expectedIntent: string;
  preferredResponse: string;
  productId?: string | null;
  language: string;
  tags?: string | null;
  enabled: boolean;
}
