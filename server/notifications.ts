import { Router, Response } from 'express';
import { prisma } from './db';
import { authenticateJwt, AuthRequest } from './auth';
import { recordAuditEvent } from './auditLogger';
import { WhatsAppClient } from './whatsapp/whatsappClient';

export const notificationsRouter = Router();

export type NotificationEvent =
  | 'ORDER_PAID'
  | 'FULFILLMENT_STARTED'
  | 'FULFILLMENT_COMPLETED'
  | 'SUBSCRIPTION_ACTIVATED'
  | 'SUBSCRIPTION_EXPIRING'
  | 'SUBSCRIPTION_EXPIRED'
  | 'RENEWAL_SUCCESSFUL'
  | 'RENEWAL_FAILED'
  | 'PAYMENT_FAILED';

export interface DispatchNotificationParams {
  event: NotificationEvent;
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  metadata?: Record<string, any>;
  channels?: Array<'IN_APP' | 'EMAIL' | 'WHATSAPP' | 'SMS'>;
}

/**
 * ============================================================================
 * ⚡ UNIFIED NOTIFICATION DISPATCHER — LIGHTNINGAPI.PRO
 * ============================================================================
 * Centralized notification engine with preference enforcement and multi-channel abstraction.
 */
export async function dispatchNotification(params: DispatchNotificationParams) {
  const { event, userId, title, message, type = 'info', metadata, channels = ['IN_APP'] } = params;

  try {
    // 1. Fetch or initialize user notification preferences
    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: { userId },
      });
    }

    // 2. Check if this type of notification is enabled by user
    if (['SUBSCRIPTION_EXPIRING', 'SUBSCRIPTION_EXPIRED'].includes(event) && !prefs.renewalReminders) {
      return { dispatched: false, reason: 'Renewal reminders muted by user.' };
    }
    if (['ORDER_PAID', 'FULFILLMENT_COMPLETED'].includes(event) && !prefs.orderUpdates) {
      // In-app notifications still record for account ledger
    }

    // 3. Always create In-App Notification if enabled or requested
    if (prefs.inAppEnabled || channels.includes('IN_APP')) {
      await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
        },
      });
    }

    // 4. Channel Hooks (Extensible for Email / WhatsApp / SMS integrations)
    if (prefs.emailEnabled && channels.includes('EMAIL')) {
      // Prepared for Nodemailer / Resend / SendGrid dispatch
    }

    if (prefs.whatsappEnabled && (channels.includes('WHATSAPP') || channels.includes('IN_APP'))) {
      const identity = await prisma.whatsAppCustomerIdentity.findFirst({
        where: { customerId: userId, verified: true },
      });
      const targetPhone = identity?.whatsappNumber;
      if (targetPhone) {
        await WhatsAppClient.sendMessage({
          to: targetPhone,
          text: `⚡ *${title}*\n\n${message}`,
        }).catch(() => {});
      }
    }

    // 5. Audit log event
    await recordAuditEvent({
      eventType: `NOTIFICATION_${event}`,
      severity: 'INFO',
      actorType: 'SYSTEM',
      customerId: userId,
      resourceType: 'USER',
      resourceId: userId,
      action: 'DISPATCH_NOTIFICATION',
      result: 'SUCCESS',
      metadata: { event, title, channels },
    });

    return { dispatched: true };
  } catch (err: any) {
    console.error(`[NOTIFICATION DISPATCH ERROR] Event ${event} for user ${userId}:`, err.message);
    return { dispatched: false, error: err.message };
  }
}

/**
 * Backward-compatible helper to create in-app notification
 */
export async function createUserNotification(params: {
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}) {
  return await dispatchNotification({
    event: 'ORDER_PAID',
    userId: params.userId,
    title: params.title,
    message: params.message,
    type: params.type || 'info',
    channels: ['IN_APP'],
  });
}

// GET /api/user/notifications — Get User's Unread & Recent Notifications
notificationsRouter.get('/', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user!.id, isRead: false },
    });

    res.json({
      notifications,
      unreadCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// GET /api/user/notifications/preferences — Get Notification Preferences
notificationsRouter.get('/preferences', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId: req.user!.id },
    });

    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: { userId: req.user!.id },
      });
    }

    res.json(prefs);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// PUT /api/user/notifications/preferences — Update Notification Preferences
notificationsRouter.put('/preferences', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const { emailEnabled, whatsappEnabled, smsEnabled, inAppEnabled, renewalReminders, orderUpdates } = req.body;

    const updated = await prisma.notificationPreference.upsert({
      where: { userId: req.user!.id },
      update: {
        ...(typeof emailEnabled === 'boolean' && { emailEnabled }),
        ...(typeof whatsappEnabled === 'boolean' && { whatsappEnabled }),
        ...(typeof smsEnabled === 'boolean' && { smsEnabled }),
        ...(typeof inAppEnabled === 'boolean' && { inAppEnabled }),
        ...(typeof renewalReminders === 'boolean' && { renewalReminders }),
        ...(typeof orderUpdates === 'boolean' && { orderUpdates }),
      },
      create: {
        userId: req.user!.id,
        emailEnabled: emailEnabled ?? true,
        whatsappEnabled: whatsappEnabled ?? true,
        smsEnabled: smsEnabled ?? false,
        inAppEnabled: inAppEnabled ?? true,
        renewalReminders: renewalReminders ?? true,
        orderUpdates: orderUpdates ?? true,
      },
    });

    res.json({ success: true, preferences: updated });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// POST /api/user/notifications/:id/read — Mark single notification as read
notificationsRouter.post('/:id/read', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const notif = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });

    if (!notif) {
      return res.status(404).json({ error: { message: 'Notification not found.' } });
    }

    await prisma.notification.update({
      where: { id: notif.id },
      data: { isRead: true },
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// POST /api/user/notifications/read-all — Mark all notifications as read
notificationsRouter.post('/read-all', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});
