import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';

export async function getConversations(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Fetch all messages where user is sender or receiver
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    const participantMap = new Map<string, { lastMessage: string; timestamp: Date; otherRole: string; unreadCount: number }>();

    for (const m of messages) {
      const isSenderMe = m.senderId === userId;
      const otherId = isSenderMe ? m.receiverId : m.senderId;
      const otherRole = isSenderMe ? m.receiverRole : m.senderRole;

      if (!participantMap.has(otherId)) {
        participantMap.set(otherId, {
          lastMessage: m.content,
          timestamp: m.createdAt,
          otherRole,
          unreadCount: !isSenderMe && !m.isRead ? 1 : 0
        });
      } else {
        if (!isSenderMe && !m.isRead) {
          const current = participantMap.get(otherId)!;
          current.unreadCount += 1;
        }
      }
    }

    const conversations = [];
    for (const [otherId, info] of participantMap.entries()) {
      let name = 'Crewora Support';
      let photo = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300';
      let role = 'Support Team';

      if (otherId === 'system') {
        name = 'Crewora Support';
        photo = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300';
        role = 'System Bot';
      } else if (info.otherRole === 'customer') {
        const cust = await prisma.customer.findUnique({
          where: { id: otherId },
          select: { name: true }
        });
        if (cust) {
          name = cust.name;
          role = 'Client';
          photo = `https://ui-avatars.com/api/?name=${encodeURIComponent(cust.name)}&background=0b1528&color=fff`;
        }
      } else if (info.otherRole === 'worker') {
        const wrk = await prisma.worker.findUnique({
          where: { id: otherId },
          select: { name: true, tradeCategories: true, profilePhoto: true }
        });
        if (wrk) {
          name = wrk.name;
          role = wrk.tradeCategories.join(', ') || 'Service Provider';
          photo = wrk.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(wrk.name)}&background=10b981&color=fff`;
        }
      }

      conversations.push({
        id: otherId,
        name,
        role,
        photo,
        lastMsg: info.lastMessage,
        time: info.timestamp.toISOString(),
        unread: info.unreadCount > 0,
        unreadCount: info.unreadCount
      });
    }

    res.status(200).json({ success: true, data: { conversations } });
  } catch (error) {
    next(error);
  }
}

export async function getMessages(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const { otherId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherId },
          { senderId: otherId, receiverId: userId }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });

    // Mark received messages as read
    await prisma.message.updateMany({
      where: {
        senderId: otherId,
        receiverId: userId,
        isRead: false
      },
      data: { isRead: true }
    });

    const mapped = messages.map((m: any) => ({
      id: m.id,
      sender: m.senderId === userId ? 'me' : 'other',
      text: m.content,
      time: m.createdAt.toISOString()
    }));

    res.status(200).json({ success: true, data: { messages: mapped } });
  } catch (error) {
    next(error);
  }
}

export async function sendMessage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.type;
    const { receiverId, receiverRole, content, jobId } = req.body;

    if (!userId || !userRole) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!content || !content.trim()) {
      res.status(400).json({ success: false, message: 'Message content is required' });
      return;
    }

    const msg = await prisma.message.create({
      data: {
        jobId,
        senderId: userId,
        senderRole: userRole,
        receiverId,
        receiverRole,
        content: content.trim()
      }
    });

    // Broadcast message via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(receiverId).emit('newMessage', {
        id: msg.id,
        senderId: msg.senderId,
        senderRole: msg.senderRole,
        receiverId: msg.receiverId,
        receiverRole: msg.receiverRole,
        content: msg.content,
        createdAt: msg.createdAt,
        sender: 'other'
      });
    }

    res.status(201).json({
      success: true,
      data: {
        message: {
          id: msg.id,
          sender: 'me',
          text: msg.content,
          time: msg.createdAt.toISOString()
        }
      }
    });
  } catch (error) {
    next(error);
  }
}
