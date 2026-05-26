import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import * as inboxController from './inbox.controller';

const router = Router();

router.get(
  '/conversations',
  requireAuth('customer', 'worker'),
  inboxController.getConversations
);

router.get(
  '/messages/:otherId',
  requireAuth('customer', 'worker'),
  inboxController.getMessages
);

router.post(
  '/send',
  requireAuth('customer', 'worker'),
  inboxController.sendMessage
);

export default router;
