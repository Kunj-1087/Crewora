import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

export async function comparePassword(candidate: string, hash: string): Promise<boolean> {
  return bcrypt.compare(candidate, hash);
}

export function isLocked(lockUntil: Date | null | undefined): boolean {
  return !!(lockUntil && lockUntil > new Date());
}

export async function incrementLoginAttempts(
  type: 'customer' | 'worker',
  id: string,
  currentAttempts: number,
  lockUntil: Date | null | undefined
) {
  const MAX_ATTEMPTS = 5;
  const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  const now = new Date();

  if (lockUntil && lockUntil < now) {
    // Lock expired - reset attempts to 1 and remove lock
    if (type === 'customer') {
      await (prisma.customer as any).update({
        where: { id },
        data: { loginAttempts: 1, lockUntil: null },
      });
    } else {
      await (prisma.worker as any).update({
        where: { id },
        data: { loginAttempts: 1, lockUntil: null },
      });
    }
    return;
  }

  const nextAttempts = currentAttempts + 1;
  const data: any = { loginAttempts: nextAttempts };

  if (nextAttempts >= MAX_ATTEMPTS) {
    data.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
  }

  if (type === 'customer') {
    await (prisma.customer as any).update({
      where: { id },
      data,
    });
  } else {
    await (prisma.worker as any).update({
      where: { id },
      data,
    });
  }
}

export async function resetLoginAttempts(type: 'customer' | 'worker', id: string) {
  const data = { loginAttempts: 0, lockUntil: null };
  if (type === 'customer') {
    await (prisma.customer as any).update({
      where: { id },
      data,
    });
  } else {
    await (prisma.worker as any).update({
      where: { id },
      data,
    });
  }
}
