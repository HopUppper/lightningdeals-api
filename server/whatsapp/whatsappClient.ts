import crypto from 'crypto';

export interface SendWhatsAppMessageParams {
  to: string; // E.164 phone number, e.g. "919876543210"
  text: string;
  previewUrl?: boolean;
}

export interface SendWhatsAppResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

/**
 * ============================================================================
 * ⚡ OFFICIAL WHATSAPP BUSINESS API CLIENT — LIGHTNINGAPI.PRO
 * ============================================================================
 * Clean provider-agnostic abstraction for WhatsApp Business Cloud API / Webhook.
 * In development or when credentials are not yet configured, cleanly simulates
 * delivery and returns high-entropy provider message IDs for end-to-end testing.
 */
export class WhatsAppClient {
  private static get apiToken(): string | undefined {
    return process.env.WHATSAPP_API_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
  }

  private static get phoneNumberId(): string | undefined {
    return process.env.WHATSAPP_PHONE_NUMBER_ID;
  }

  private static get appSecret(): string | undefined {
    return process.env.WHATSAPP_APP_SECRET || process.env.WHATSAPP_WEBHOOK_SECRET;
  }

  private static get verifyToken(): string {
    return process.env.WHATSAPP_VERIFY_TOKEN || 'lightningdeals_whatsapp_verify_2026';
  }

  /**
   * Verifies official WhatsApp Webhook Handshake (GET challenge)
   */
  static verifyHandshake(mode: string | undefined, token: string | undefined, challenge: string | undefined): string | null {
    if (mode === 'subscribe' && token === this.verifyToken) {
      return challenge || null;
    }
    return null;
  }

  /**
   * Verifies official Meta HMAC-SHA256 signature on inbound webhook payloads
   * Header: X-Hub-Signature-256: sha256=<hash>
   */
  static verifySignature(signatureHeader: string | undefined, rawBody: string | Buffer): boolean {
    const secret = this.appSecret;
    if (!secret) {
      // In local development or if secret is not set, allow webhook
      return true;
    }

    if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
      return false;
    }

    const signature = signatureHeader.substring(7);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch {
      return false;
    }
  }

  /**
   * Sends text message to customer via official WhatsApp Business API
   */
  static async sendMessage(params: SendWhatsAppMessageParams): Promise<SendWhatsAppResult> {
    const { to, text, previewUrl = false } = params;
    const sanitizedTo = to.replace(/\D/g, '');

    const token = this.apiToken;
    const phoneId = this.phoneNumberId;

    if (token && phoneId) {
      try {
        const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: sanitizedTo,
            type: 'text',
            text: {
              preview_url: previewUrl,
              body: text,
            },
          }),
        });

        const data: any = await res.json();
        if (!res.ok) {
          console.error('[WHATSAPP API ERROR]', data);
          return {
            success: false,
            error: data?.error?.message || `HTTP ${res.status} from WhatsApp API`,
          };
        }

        const messageId = data?.messages?.[0]?.id || `wamid.${crypto.randomBytes(16).toString('hex')}`;
        return {
          success: true,
          providerMessageId: messageId,
        };
      } catch (err: any) {
        console.error('[WHATSAPP DISPATCH NETWORK ERROR]', err.message);
        return {
          success: false,
          error: err.message,
        };
      }
    }

    // Provider simulation fallback (when live Cloud API credentials are not yet placed in .env)
    const simulatedMessageId = `sim_wamid_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    return {
      success: true,
      providerMessageId: simulatedMessageId,
    };
  }
}
