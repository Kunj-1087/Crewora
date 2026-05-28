/**
 * Job Service — Business Logic
 * Handles job CRUD, matching algorithm, status transitions.
 */

import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import { assertOwnership } from '../../utils/ownershipCheck';
import { sendEmail, jobMatchedEmail } from '../../utils/email';
import { logger } from '../../utils/logger';

const MAX_MATCH_RADIUS_METERS = 30000; // 30 km default
const MAX_WORKERS_TO_MATCH = 5;

export async function createJob(
  customerId: string,
  data: {
    title: string;
    description: string;
    tradeCategory: string;
    location: { address: string; coordinates: [number, number] };
    urgency: string;
    scheduledAt?: string;
  }
) {
  const job = await prisma.job.create({
    data: {
      customerId,
      title: data.title,
      description: data.description,
      tradeCategory: data.tradeCategory,
      address: data.location.address,
      latitude: data.location.coordinates[1],
      longitude: data.location.coordinates[0],
      urgency: data.urgency,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      status: 'open',
    },
  });

  // Trigger matching asynchronously
  matchWorkersForJob(job.id).catch((err) =>
    logger.error('Job matching failed', { jobId: job.id, err })
  );

  return {
    ...job,
    location: {
      address: job.address,
      coordinates: [job.longitude, job.latitude],
    },
  };
}

export async function getCustomerJobs(
  customerId: string,
  page: number,
  limit: number,
  status?: string
) {
  const where: any = { customerId };
  if (status) where.status = status;

  const skip = (page - 1) * limit;
  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.job.count({ where }),
  ]);

  const mappedJobs = jobs.map((job: any) => ({
    ...job,
    location: {
      address: job.address,
      coordinates: [job.longitude, job.latitude],
    },
  }));

  return {
    jobs: mappedJobs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getJobById(jobId: string, requestingUserId: string, userType: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      assignedWorker: {
        select: {
          id: true,
          name: true,
          tradeCategories: true,
          city: true,
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  if (!job) throw new AppError('Job not found', 404);

  // Customers can only see their own jobs; workers can see jobs assigned to them
  if (userType === 'customer') {
    assertOwnership(job.customerId, requestingUserId);
  } else if (userType === 'worker') {
    const match = await prisma.match.findUnique({
      where: {
        jobId_workerId: { jobId, workerId: requestingUserId },
      },
    });
    if (!match) throw new AppError('Job not found', 404);
  }

  return {
    ...job,
    assignedWorkerId: job.assignedWorker,
    location: {
      address: job.address,
      coordinates: [job.longitude, job.latitude],
    },
  };
}

export async function updateJob(
  jobId: string,
  customerId: string,
  updates: { title?: string; description?: string; scheduledAt?: string; status?: string; cancellationReason?: string }
) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new AppError('Job not found', 404);

  assertOwnership(job.customerId, customerId);

  if (['completed', 'cancelled'].includes(job.status)) {
    throw new AppError('Cannot update a completed or cancelled job', 400);
  }

  const allowedUpdates: Record<string, any> = {};
  if (updates.title) allowedUpdates.title = updates.title;
  if (updates.description) allowedUpdates.description = updates.description;
  if (updates.scheduledAt) allowedUpdates.scheduledAt = new Date(updates.scheduledAt);
  if (updates.status === 'cancelled') {
    allowedUpdates.status = 'cancelled';
    allowedUpdates.cancelledAt = new Date();
    allowedUpdates.cancellationReason = updates.cancellationReason;
  }

  const updated = await prisma.job.update({
    where: { id: jobId },
    data: allowedUpdates,
  });

  return {
    ...updated,
    location: {
      address: updated.address,
      coordinates: [updated.longitude, updated.latitude],
    },
  };
}

export async function getJobMatches(jobId: string, customerId: string) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new AppError('Job not found', 404);
  assertOwnership(job.customerId, customerId);

  const matches = await prisma.match.findMany({
    where: { jobId },
    include: {
      worker: {
        select: {
          id: true,
          name: true,
          tradeCategories: true,
          city: true,
          experienceYears: true,
          bio: true,
          verificationStatus: true,
          profilePhoto: true,
        },
      },
    },
    orderBy: { matchedAt: 'desc' },
  });

  return matches.map((match: any) => ({
    ...match,
    workerId: match.worker,
  }));
}

// ─── Worker-facing ────────────────────────────────────────────────────────────

export async function getWorkerJobFeed(
  workerId: string,
  page: number,
  limit: number,
  status: string = 'pending'
) {
  const skip = (page - 1) * limit;
  const matches = await prisma.match.findMany({
    where: { workerId, status },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          description: true,
          tradeCategory: true,
          address: true,
          latitude: true,
          longitude: true,
          urgency: true,
          scheduledAt: true,
          status: true,
          postedAt: true,
          customer: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      },
    },
    orderBy: { matchedAt: 'desc' },
    skip,
    take: limit,
  });

  return matches
    .filter((m: any) => m.job !== null)
    .map((m: any) => ({
      ...m,
      jobId: {
        ...m.job,
        location: {
          address: m.job.address,
          coordinates: [m.job.longitude, m.job.latitude],
        },
      },
    }));
}

export async function respondToMatch(
  matchId: string,
  workerId: string,
  action: 'accept' | 'decline'
) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { job: true },
  });
  if (!match) throw new AppError('Match not found', 404);
  assertOwnership(match.workerId, workerId);

  if (match.status !== 'pending') {
    throw new AppError('This match has already been responded to', 400);
  }

  const updatedStatus = action === 'accept' ? 'accepted' : 'declined';
  const respondedAt = new Date();

  const updatedMatch = await prisma.match.update({
    where: { id: matchId },
    data: {
      status: updatedStatus,
      respondedAt,
    },
  });

  if (action === 'accept') {
    const job = await prisma.job.update({
      where: { id: match.jobId },
      data: {
        status: 'matched',
        assignedWorkerId: workerId,
      },
    });

    // Decline all other pending matches for this job
    await prisma.match.updateMany({
      where: {
        jobId: match.jobId,
        id: { not: matchId },
        status: 'pending',
      },
      data: { status: 'declined' },
    });

    // Notify customer
    if (job) {
      const [customer, worker] = await Promise.all([
        prisma.customer.findUnique({ where: { id: job.customerId } }),
        prisma.worker.findUnique({ where: { id: workerId } }),
      ]);
      if (customer && worker) {
        sendEmail({
          to: customer.email,
          subject: 'Crewora — A worker accepted your job!',
          html: jobMatchedEmail(customer.name, job.title, worker.name),
        }).catch((err) => logger.error('Match notification email failed', { err }));
      }
    }
  }

  return updatedMatch;
}

// ─── Matching Algorithm ───────────────────────────────────────────────────────

async function matchWorkersForJob(jobId: string) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return;

  const lat = job.latitude;
  const lng = job.longitude;
  const radiusKm = MAX_MATCH_RADIUS_METERS / 1000; // 30 km

  // Find verified, available workers in the job's trade category within radius
  const workers: any[] = await prisma.$queryRaw`
    SELECT id, name, email, phone, "tradeCategories", city, availability, "verificationStatus"
    FROM "Worker"
    WHERE "verificationStatus" = 'approved'
      AND "availability" = 'available'
      AND "isActive" = true
      AND ${job.tradeCategory} = ANY("tradeCategories")
      AND "latitude" IS NOT NULL AND "longitude" IS NOT NULL
      AND (6371 * acos(cos(radians(${lat})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${lng})) + sin(radians(${lat})) * sin(radians(latitude)))) < ${radiusKm}
    ORDER BY (6371 * acos(cos(radians(${lat})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${lng})) + sin(radians(${lat})) * sin(radians(latitude)))) ASC
    LIMIT ${MAX_WORKERS_TO_MATCH}
  `;

  if (workers.length === 0) {
    logger.info('No workers found for job', { jobId });
    return;
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const matchData = workers.map((w) => ({
    jobId,
    workerId: w.id,
    status: 'pending',
    expiresAt,
  }));

  try {
    await prisma.match.createMany({
      data: matchData,
      skipDuplicates: true,
    });
    logger.info('Workers matched to job', { jobId, count: workers.length });
  } catch (err) {
    logger.error('Failed to create match documents', { jobId, err });
  }
}
