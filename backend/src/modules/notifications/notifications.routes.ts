import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';

const router = Router();

const notificationIdParamSchema = z.object({
  id: z.string().uuid('Notification ID must be a valid UUID'),
});

// Get all notifications for the authenticated user
router.get('/', authenticate('customer', 'worker'), async (req, res, next) => {
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
router.patch('/read-all', authenticate('customer', 'worker'), async (req, res, next) => {
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
router.patch(
  '/:id/read',
  authenticate('customer', 'worker'),
  validate({ params: notificationIdParamSchema }),
  async (req, res, next) => {
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
  }
);

export default router;
