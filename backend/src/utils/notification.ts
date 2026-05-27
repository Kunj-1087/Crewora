import * as admin from 'firebase-admin';
import { logger } from './logger';
import { prisma } from '../lib/prisma';

let isFirebaseInitialized = false;

try {
  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountEnv) {
    const serviceAccount = JSON.parse(serviceAccountEnv);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    isFirebaseInitialized = true;
    logger.info('Firebase Admin initialized successfully.');
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
    isFirebaseInitialized = true;
    logger.info('Firebase Admin initialized with applicationDefault.');
  } else {
    logger.info('Firebase credentials not set. Running Notification Service in MOCK mode (logging to console).');
  }
} catch (err) {
  logger.error('Firebase Admin initialization failed. Running in MOCK mode.', { err });
}

/**
 * Sends a push notification to all registered devices of a specific user.
 */
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  try {
    // Find all device tokens registered for this user
    const deviceTokens = await prisma.deviceToken.findMany({
      where: { userId }
    });

    if (deviceTokens.length === 0) {
      logger.debug(`No device tokens registered for user: ${userId}`);
      return;
    }

    const tokens = deviceTokens.map((t) => t.token);

    if (isFirebaseInitialized) {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          notification: {
            sound: 'default',
            priority: 'high',
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            }
          }
        }
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      logger.info(`Push notifications sent to user ${userId}`, {
        successCount: response.successCount,
        failureCount: response.failureCount,
      });

      // Cleanup failed/expired tokens automatically
      if (response.failureCount > 0) {
        const tokensToRemove: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errCode = resp.error?.code;
            if (
              errCode === 'messaging/invalid-registration-token' ||
              errCode === 'messaging/registration-token-not-registered'
            ) {
              tokensToRemove.push(tokens[idx]);
            }
          }
        });

        if (tokensToRemove.length > 0) {
          await prisma.deviceToken.deleteMany({
            where: { token: { in: tokensToRemove } }
          });
          logger.info(`Cleaned up ${tokensToRemove.length} inactive device tokens.`);
        }
      }
    } else {
      // Mock mode logging
      logger.info(`[MOCK PUSH] To User: ${userId} | Title: "${title}" | Body: "${body}" | Data:`, data || {});
    }
  } catch (error) {
    logger.error('Failed to send push notification', { userId, error });
  }
}
