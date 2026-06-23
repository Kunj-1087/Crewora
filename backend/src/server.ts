/**
 * Server Entry Point
 * Initializes DB connection before starting the HTTP server.
 * Graceful shutdown on SIGTERM/SIGINT.
 */

import './config/env'; // Validate env first — crashes if invalid
import { connectDB } from './config/db';
import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

import { Server } from 'socket.io';
import { prisma } from './lib/prisma';
import { socketAuthMiddleware, validateRoomJoin } from './middleware/socketAuth';
import { initGracefulShutdown } from './utils/gracefulShutdown';

// ─── Constants ────────────────────────────────────────────────────────────────

const SEND_MESSAGE_LIMIT = 30;   // max 30 messages per minute per socket
const SEND_MESSAGE_WINDOW = 60_000; // 1 minute window

// In-memory rate limit tracker for socket events
const socketRateMap = new Map<string, { count: number; resetAt: number }>();

function checkSocketRateLimit(socketId: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = socketRateMap.get(socketId);
  if (!entry || now > entry.resetAt) {
    socketRateMap.set(socketId, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) {
    return false; // rate limited
  }
  entry.count += 1;
  return true;
}

// Clean up rate map periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of socketRateMap) {
    if (now > entry.resetAt) {
      socketRateMap.delete(key);
    }
  }
}, 60_000);

async function bootstrap() {
  try {
    await connectDB();

    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Crewora API running`, {
        port: env.PORT,
        environment: env.NODE_ENV,
      });
    });

    // Initialize Socket.io
    const io = new Server(server, {
      cors: {
        origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    // Apply authentication middleware to all connections
    io.use(socketAuthMiddleware);

    app.set('io', io);

    io.on('connection', (socket) => {
      const user = (socket as any).user;
      logger.info(`Socket connected: ${socket.id} (user: ${user?.id})`);

      // Join the socket to the authenticated user's room
      if (user?.id) {
        socket.join(user.id);
        logger.debug(`Socket ${socket.id} auto-joined room: ${user.id}`);
      }

      socket.on('join', (userId: string) => {
        if (!user || !validateRoomJoin(socket, userId)) {
          logger.warn(`Socket ${socket.id} attempted to join unauthorized room: ${userId}`);
          socket.emit('error', { message: 'Unauthorized room access' });
          return;
        }
        socket.join(userId);
        logger.info(`User joined room: ${userId}`);
      });

      socket.on('sendMessage', async (data: {
        senderId: string;
        senderRole: string;
        receiverId: string;
        receiverRole: string;
        content: string;
        jobId?: string;
      }) => {
        try {
          // Rate limit: max 30 messages per minute per socket
          if (!checkSocketRateLimit(socket.id, SEND_MESSAGE_LIMIT, SEND_MESSAGE_WINDOW)) {
            socket.emit('error', { message: 'Message rate limit exceeded. Please slow down.' });
            return;
          }

          // Validate sender matches authenticated user
          if (data.senderId !== user?.id) {
            logger.warn(`Socket ${socket.id} attempted to send message as another user`);
            socket.emit('error', { message: 'Unauthorized: cannot send as another user' });
            return;
          }

          // Validate message content
          if (!data.content || !data.content.trim() || data.content.trim().length > 2000) {
            socket.emit('error', { message: 'Message content must be between 1 and 2000 characters' });
            return;
          }

          const { senderId, senderRole, receiverId, receiverRole, content, jobId } = data;
          const trimmedContent = content.trim();

          const msg = await prisma.message.create({
            data: {
              jobId,
              senderId,
              senderRole,
              receiverId,
              receiverRole,
              content: trimmedContent,
            },
          });

          const mappedMsg = {
            id: msg.id,
            senderId: msg.senderId,
            senderRole: msg.senderRole,
            receiverId: msg.receiverId,
            receiverRole: msg.receiverRole,
            content: msg.content,
            createdAt: msg.createdAt,
            sender: 'other' as const,
            text: msg.content,
            time: msg.createdAt.toISOString()
          };

          // Emit to receiver room
          io.to(receiverId).emit('newMessage', mappedMsg);

          // Emit back to sender
          io.to(senderId).emit('newMessage', {
            ...mappedMsg,
            sender: 'me' as const
          });

        } catch (error) {
          logger.error('Socket message error', { error });
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
      });
    });

    // Graceful shutdown — uses dedicated handler with in-flight request tracking
    initGracefulShutdown(server);

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled promise rejection', { reason });
      // In production, crash fast so the process manager can restart
      if (env.NODE_ENV === 'production') process.exit(1);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error });
      process.exit(1);
    });
  } catch (error) {
    logger.error('Bootstrap failed', { error });
    process.exit(1);
  }
}

bootstrap();
