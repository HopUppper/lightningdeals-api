import { Router, Response } from 'express';
import { prisma } from './db.js';
import { authenticateJwt, AuthRequest } from './auth.js';

export const notificationsRouter = Router();

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

/**
 * Helper to create persistent notifications in server modules
 */
export async function createUserNotification(params: {
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}) {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type || 'info',
      },
    });
  } catch (err) {
    console.error('[NOTIFICATION CREATE ERROR]', err);
  }
}
