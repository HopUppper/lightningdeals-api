import { Router, Request, Response } from 'express';
import { WhatsAppClient } from './whatsappClient';
import { WhatsAppEngine } from './whatsappEngine';

export const whatsappWebhookRouter = Router();

/**
 * 1. OFFICIAL WHATSAPP WEBHOOK VERIFICATION (GET)
 * Meta / Cloud API handshake challenge
 */
whatsappWebhookRouter.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string | undefined;
  const token = req.query['hub.verify_token'] as string | undefined;
  const challenge = req.query['hub.challenge'] as string | undefined;

  const verifiedChallenge = WhatsAppClient.verifyHandshake(mode, token, challenge);
  if (verifiedChallenge) {
    console.log('[WHATSAPP WEBHOOK] Handshake verified successfully.');
    return res.status(200).send(verifiedChallenge);
  }

  console.warn('[WHATSAPP WEBHOOK] Handshake verification failed. Forbidden.');
  return res.status(403).send('Forbidden');
});

/**
 * 2. OFFICIAL WHATSAPP INBOUND EVENT RECEIVER (POST)
 * Supports official Meta Cloud API JSON structures as well as direct test payloads.
 */
whatsappWebhookRouter.post('/webhook', async (req: Request, res: Response) => {
  try {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const signature = req.headers['x-hub-signature-256'] as string | undefined;

    // Verify HMAC signature if configured
    const isValidSignature = WhatsAppClient.verifySignature(signature, rawBody);
    if (!isValidSignature) {
      console.warn('[WHATSAPP WEBHOOK] Invalid X-Hub-Signature-256 header.');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const payload = req.body;

    // Check if official Meta Graph API payload
    if (payload.object === 'whatsapp_business_account' && Array.isArray(payload.entry)) {
      for (const entry of payload.entry) {
        if (!entry.changes) continue;
        for (const change of entry.changes) {
          const value = change.value;
          if (value && Array.isArray(value.messages)) {
            const contact = value.contacts?.[0];
            const customerName = contact?.profile?.name;

            for (const msg of value.messages) {
              const from = msg.from;
              const providerMessageId = msg.id;
              let body = '';

              if (msg.type === 'text') {
                body = msg.text?.body || '';
              } else if (msg.type === 'interactive') {
                body = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '';
              } else if (msg.type === 'button') {
                body = msg.button?.text || '';
              }

              if (from && body) {
                await WhatsAppEngine.handleInboundMessage({
                  from,
                  body,
                  providerMessageId,
                  customerName,
                });
              }
            }
          }
        }
      }

      // Meta requires immediate 200 OK
      return res.status(200).json({ status: 'EVENT_RECEIVED' });
    }

    // Direct / Test Inbound Message Format
    if (payload.from && (payload.body || payload.text)) {
      const from = String(payload.from);
      const body = String(payload.body || payload.text);
      const providerMessageId = payload.providerMessageId || payload.id;
      const customerName = payload.customerName || payload.name;

      const result = await WhatsAppEngine.handleInboundMessage({
        from,
        body,
        providerMessageId,
        customerName,
      });

      return res.status(200).json({
        success: true,
        ...result,
      });
    }

    // Non-message status updates (e.g. sent, delivered, read receipts)
    return res.status(200).json({ status: 'PROCESSED' });
  } catch (err: any) {
    console.error('[WHATSAPP WEBHOOK ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
});
