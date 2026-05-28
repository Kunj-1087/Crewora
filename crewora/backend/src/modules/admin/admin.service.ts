/**
 * Admin Service
 * User verification, user management, platform oversight.
 */

import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import { sendEmail, workerApprovedEmail, workerRejectedEmail } from '../../utils/email';
import { logger } from '../../utils/logger';

export async function getPlatformStats() {
  const [
    totalCustomers,
    totalWorkers,
    pendingVerifications,
    activeJobs,
    completedJobs,
  ] = await Promise.all([
    prisma.customer.count({ where: { isActive: true } }),
    prisma.worker.count({ where: { isActive: true } }),
    prisma.worker.count({ where: { verificationStatus: 'pending', isActive: true } }),
    prisma.job.count({ where: { status: { in: ['open', 'matched', 'in_progress'] } } }),
    prisma.job.count({ where: { status: 'completed' } }),
  ]);

  return {
    totalCustomers,
    totalWorkers,
    pendingVerifications,
    activeJobs,
    completedJobs,
  };
}

export async function getVerificationQueue(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [workers, total] = await Promise.all([
    prisma.worker.findMany({
      where: { verificationStatus: 'pending', isActive: true },
      orderBy: { createdAt: 'asc' }, // oldest first
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        tradeCategories: true,
        city: true,
        bio: true,
        experienceYears: true,
        certifications: true,
        createdAt: true,
      },
    }),
    prisma.worker.count({ where: { verificationStatus: 'pending', isActive: true } }),
  ]);

  return { workers, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function approveWorker(workerId: string) {
  const worker = await prisma.worker.findUnique({ where: { id: workerId } });
  if (!worker) throw new AppError('Worker not found', 404);

  if (worker.verificationStatus === 'approved') {
    throw new AppError('Worker is already approved', 400);
  }

  const updatedWorker = await prisma.worker.update({
    where: { id: workerId },
    data: { verificationStatus: 'approved' },
  });

  sendEmail({
    to: updatedWorker.email,
    subject: 'Crewora — Your profile has been approved! ✅',
    html: workerApprovedEmail(updatedWorker.name),
  }).catch((err) => logger.error('Approval email failed', { err }));

  return updatedWorker;
}

export async function rejectWorker(workerId: string, reason: string) {
  const worker = await prisma.worker.findUnique({ where: { id: workerId } });
  if (!worker) throw new AppError('Worker not found', 404);

  const updatedWorker = await prisma.worker.update({
    where: { id: workerId },
    data: {
      verificationStatus: 'rejected',
      verificationRejectionReason: reason,
    },
  });

  sendEmail({
    to: updatedWorker.email,
    subject: 'Crewora — Action Required: Profile Update Needed',
    html: workerRejectedEmail(updatedWorker.name, reason),
  }).catch((err) => logger.error('Rejection email failed', { err }));

  return updatedWorker;
}

export async function getAllWorkers(page: number, limit: number, status?: string) {
  const skip = (page - 1) * limit;
  const where: any = { isActive: true };
  if (status) where.verificationStatus = status;

  const [workers, total] = await Promise.all([
    prisma.worker.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.worker.count({ where }),
  ]);
  return { workers, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function getAllCustomers(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.customer.count({ where: { isActive: true } }),
  ]);
  return { customers, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function getAllJobs(page: number, limit: number, status?: string) {
  const skip = (page - 1) * limit;
  const where: any = {};
  if (status) where.status = status;

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
        assignedWorker: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.job.count({ where }),
  ]);

  const mappedJobs = jobs.map((job: any) => ({
    ...job,
    customerId: job.customer,
    assignedWorkerId: job.assignedWorker,
  }));

  return { jobs: mappedJobs, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function deactivateUser(userId: string, userType: 'customer' | 'worker') {
  if (userType === 'customer') {
    const user = await prisma.customer.update({
      where: { id: userId },
      data: { isActive: false },
    });
    if (!user) throw new AppError('User not found', 404);
    return user;
  } else {
    const user = await prisma.worker.update({
      where: { id: userId },
      data: { isActive: false },
    });
    if (!user) throw new AppError('User not found', 404);
    return user;
  }
}
