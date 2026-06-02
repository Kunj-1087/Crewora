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

import { translateBackend } from './lang';

async function getUserLanguage(userId: string): Promise<'en' | 'gu'> {
  const customer = await prisma.customer.findUnique({
    where: { id: userId },
    select: { languagePreference: true }
  });
  if (customer && customer.languagePreference) {
    return customer.languagePreference as 'en' | 'gu';
  }
  const worker = await prisma.worker.findUnique({
    where: { id: userId },
    select: { languagePreference: true }
  });
  if (worker && worker.languagePreference) {
    return worker.languagePreference as 'en' | 'gu';
  }
  return 'en';
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
    const lang = await getUserLanguage(userId);

    let translatedTitle = title;
    let translatedBody = body;

    if (lang === 'gu') {
      if (title === '🎉 Contractor Assigned!') {
        translatedTitle = translateBackend('notifications.contractor_assigned_title', 'gu');
        const matchAccept = body.match(/^(.+?) accepted your job: "(.+?)"\.$/);
        if (matchAccept) {
          const workerName = matchAccept[1];
          const jobTitle = matchAccept[2];
          translatedBody = translateBackend('notifications.contractor_assigned_body', 'gu', { workerName, jobTitle });
        }
      } else if (title === '🛠️ New Job Match!') {
        translatedTitle = translateBackend('notifications.new_job_match_title', 'gu');
        const matchMatch = body.match(/^A (.+?) is needed for "(.+?)"\. Urgency: (.+?)\.$/);
        if (matchMatch) {
          const tradeCategory = matchMatch[1];
          const jobTitle = matchMatch[2];
          const urgency = matchMatch[3];
          translatedBody = translateBackend('notifications.new_job_match_body', 'gu', { tradeCategory, jobTitle, urgency });
        }
      }
    }

    // Save to database for persistent notification history
    await prisma.notification.create({
      data: {
        userId,
        title: translatedTitle,
        body: translatedBody,
        link: data?.link || null,
      },
    });

    // Find all device tokens registered for this user
    const deviceTokens = await prisma.deviceToken.findMany({
      where: { userId }
    });

    if (deviceTokens.length === 0) {
      logger.debug(`No device tokens registered for user: ${userId}`);
      return;
    }

    const tokens = deviceTokens.map((t: any) => t.token);

    if (isFirebaseInitialized) {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: translatedTitle,
          body: translatedBody,
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
      logger.info(`[MOCK PUSH] To User: ${userId} | Title: "${translatedTitle}" | Body: "${translatedBody}" | Data:`, data || {});
    }
  } catch (error) {
    logger.error('Failed to send push notification', { userId, error });
  }
}
