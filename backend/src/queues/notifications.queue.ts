/**
 * Notification Queue (BullMQ)
 *
 * Queues expensive notification dispatch (push + in-app) so the HTTP
 * response is not blocked. Backed by Redis.
 *
 * Jobs:
 * - send_push: Send push notification via FCM + save in-app notification
 * - send_email: Send transactional email
 * - batch_notify: Notify multiple workers about a new job
 */

import { Queue, Worker, type Job } from 'bullmq';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { sendPushToUser } from '../utils/notification';

// ─── Redis Connection ─────────────────────────────────────────────────────────

const connection = {
  url: env.REDIS_URL,
  maxRetriesPerRequest: 3,
};

// ─── Queue Definitions ────────────────────────────────────────────────────────

export const notificationQueue = new Queue('notifications', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // 2s, 4s, 8s
    },
    removeOnComplete: {
      age: 24 * 60 * 60, // Keep completed jobs for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 60 * 60, // Keep failed jobs for 7 days
      count: 5000,
    },
  },
});

// ─── Job Types ────────────────────────────────────────────────────────────────

export interface PushNotificationJob {
  type: 'send_push';
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface EmailNotificationJob {
  type: 'send_email';
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface BatchNotifyJob {
  type: 'batch_notify';
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

type NotificationJobData = PushNotificationJob | EmailNotificationJob | BatchNotifyJob;

// ─── Add Jobs ─────────────────────────────────────────────────────────────────

export async function queuePushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<Job<NotificationJobData>> {
  return notificationQueue.add('send_push', {
    type: 'send_push',
    userId,
    title,
    body,
    data,
  });
}

export async function queueBatchNotification(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<Job<NotificationJobData>> {
  return notificationQueue.add('batch_notify', {
    type: 'batch_notify',
    userIds,
    title,
    body,
    data,
  });
}

// ─── Worker ───────────────────────────────────────────────────────────────────

const worker = new Worker<NotificationJobData>(
  'notifications',
  async (job) => {
    const { data } = job;

    switch (data.type) {
      case 'send_push': {
        await sendPushToUser(data.userId, data.title, data.body, data.data);
        break;
      }

      case 'batch_notify': {
        const results = await Promise.allSettled(
          data.userIds.map((userId) =>
            sendPushToUser(userId, data.title, data.body, data.data)
          )
        );
        const succeeded = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.filter((r) => r.status === 'rejected').length;
        if (failed > 0) {
          logger.warn('Batch notification partial failure', {
            succeeded,
            failed,
            total: data.userIds.length,
          });
        }
        break;
      }

      case 'send_email': {
        // Email sending handled separately via nodemailer
        // const { sendEmail } = await import('../utils/email');
        // await sendEmail({ to: data.to, subject: data.subject, html: data.html });
        logger.info('Email queued (sending not yet implemented via queue)', {
          to: data.to,
          subject: data.subject,
        });
        break;
      }

      default:
        logger.warn('Unknown notification job type', { type: (data as any).type });
    }
  },
  {
    connection,
    concurrency: 5, // Process up to 5 notifications concurrently
    limiter: {
      max: 10, // Max 10 jobs per second (respect FCM rate limits)
      duration: 1000,
    },
  }
);

// ─── Worker Event Listeners ───────────────────────────────────────────────────

worker.on('completed', (job: any) => {
  logger.debug(`Notification job ${job.id} completed`, { type: job.data.type });
});

worker.on('failed', (job: any, err: any) => {
  if (job) {
    logger.error(`Notification job ${job.id} failed after ${job.attemptsMade} attempts`, {
      error: err.message,
      type: job.data.type,
    });
  }
});

worker.on('error', (err: any) => {
  logger.error('Notification queue worker error', { error: err.message });
});

// ─── Queue Management ─────────────────────────────────────────────────────────

export async function getNotificationQueueMetrics(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}> {
  const [waiting, active, completed, failed] = await Promise.all([
    notificationQueue.getWaitingCount(),
    notificationQueue.getActiveCount(),
    notificationQueue.getCompletedCount(),
    notificationQueue.getFailedCount(),
  ]);

  return { waiting, active, completed, failed };
}

export async function closeNotificationQueue(): Promise<void> {
  await worker.close();
  await notificationQueue.close();
  logger.info('Notification queue closed');
}

export { notificationQueue as default };
