import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { z } from 'zod';
import * as inboxController from './inbox.controller';

const router = Router();

const inboxQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

const otherIdParamSchema = z.object({
  otherId: z.string().uuid('User ID must be a valid UUID'),
});

const sendMessageSchema = z.object({
  receiverId: z.string().uuid('Receiver ID must be a valid UUID'),
  receiverRole: z.enum(['customer', 'worker']),
  content: z.string().min(1, 'Message content is required').max(2000, 'Message is too long (max 2000 chars)'),
  jobId: z.string().uuid().optional(),
});

router.get(
  '/conversations',
  authenticate('customer', 'worker'),
  validate({ query: inboxQuerySchema }),
  inboxController.getConversations
);

router.get(
  '/messages/:otherId',
  authenticate('customer', 'worker'),
  validate({ params: otherIdParamSchema }),
  inboxController.getMessages
);

router.post(
  '/send',
  authenticate('customer', 'worker'),
  validate({ body: sendMessageSchema }),
  inboxController.sendMessage
);

export default router;
