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

    app.set('io', io);

    io.on('connection', (socket) => {
      logger.info(`Socket connected: ${socket.id}`);

      socket.on('join', (userId: string) => {
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
          const { senderId, senderRole, receiverId, receiverRole, content, jobId } = data;
          if (!content || !content.trim()) return;

          const msg = await prisma.message.create({
            data: {
              jobId,
              senderId,
              senderRole,
              receiverId,
              receiverRole,
              content: content.trim(),
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
            sender: 'other',
            text: msg.content,
            time: msg.createdAt.toISOString()
          };

          // Emit to receiver room
          io.to(receiverId).emit('newMessage', mappedMsg);

          // Emit back to sender
          io.to(senderId).emit('newMessage', {
            ...mappedMsg,
            sender: 'me'
          });

        } catch (error) {
          logger.error('Socket message error', { error });
        }
      });

      socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
      });
    });

    // Graceful shutdown
    const shutdown = (signal: string) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

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
