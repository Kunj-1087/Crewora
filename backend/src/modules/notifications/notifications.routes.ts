import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';

const router = Router();

// Get all notifications for the authenticated user
router.get('/', requireAuth('customer', 'worker'), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: { notifications },
    });
  } catch (error) {
    next(error);
  }
});

// Mark all notifications as read for the authenticated user
router.patch('/read-all', requireAuth('customer', 'worker'), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
});

// Mark a specific notification as read
router.patch('/:id/read', requireAuth('customer', 'worker'), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Check if the notification exists and belongs to the user
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new AppError('Notification not found or unauthorized', 404);
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: { notification: updatedNotification },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
