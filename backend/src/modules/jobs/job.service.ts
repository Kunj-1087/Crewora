/**
 * Job Service — Business Logic
 * Handles job CRUD, matching algorithm, status transitions.
 */

import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import { assertOwnership } from '../../utils/ownershipCheck';
import { logger } from '../../utils/logger';
import { sendPushToUser } from '../../utils/notification';

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
  },
  io?: any
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
  matchWorkersForJob(job.id, io).catch((err) =>
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
          profilePhoto: true,
          phone: true,
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      reviews: true,
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
  updates: { title?: string; description?: string; scheduledAt?: string; status?: string; cancellationReason?: string; assignedWorkerId?: string },
  io?: any
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

  // Customer assigns a worker to the job (selects them from matches)
  if (updates.assignedWorkerId && job.status === 'open') {
    allowedUpdates.assignedWorkerId = updates.assignedWorkerId;
    allowedUpdates.status = 'matched';

    // Verify the worker has a pending match before assigning
    const pendingMatch = await prisma.match.findFirst({
      where: { jobId, workerId: updates.assignedWorkerId, status: 'pending' },
    });
    if (!pendingMatch) {
      throw new AppError('Worker is not a pending match for this job', 400);
    }

    // Decline all other pending matches for this job
    await prisma.match.updateMany({
      where: {
        jobId,
        workerId: { not: updates.assignedWorkerId },
        status: 'pending',
      },
      data: { status: 'declined' },
    });

    // Notify the selected worker
    if (io) {
      io.to(updates.assignedWorkerId).emit('new_job_invite_selected', {
        jobId,
        title: job.title,
      });
    }

    logger.info(`Customer assigned worker ${updates.assignedWorkerId} to job ${jobId}`);
  }

  if (updates.status === 'cancelled') {
    allowedUpdates.status = 'cancelled';
    allowedUpdates.cancelledAt = new Date();
    allowedUpdates.cancellationReason = updates.cancellationReason;

    // Find all pending matches for this job
    const pendingMatches = await prisma.match.findMany({
      where: { jobId, status: 'pending' },
    });

    // Update pending matches to declined/cancelled
    await prisma.match.updateMany({
      where: { jobId, status: 'pending' },
      data: { status: 'declined' },
    });

    // Emit event to all pending matched workers
    if (io) {
      for (const match of pendingMatches) {
        io.to(match.workerId).emit('job_cancelled', {
          jobId,
          matchId: match.id,
        });
      }
    }
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
  action: 'accept' | 'decline',
  io?: any
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

  if (action === 'accept') {
    const activeJob = await prisma.job.findFirst({
      where: {
        assignedWorkerId: workerId,
        status: { in: ['matched', 'in_progress'] }
      }
    });

    if (activeJob) {
      throw new AppError('You cannot accept a new job until your current active job is completed.', 400);
    }
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

  if (action === 'decline' && io && match.job.customerId) {
    io.to(match.job.customerId).emit('job_matches_updated', {
      jobId: match.jobId,
    });
  }

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
        logger.info(`Worker ${worker.name} accepted job "${job.title}" for customer ${customer.name}`);

        // Emit real-time socket event
        if (io) {
          io.to(job.customerId).emit('job_match_accepted', {
            jobId: job.id,
            jobTitle: job.title,
            workerId: worker.id,
            workerName: worker.name,
          });
        }

        // Send Background Push Notification (FCM)
        sendPushToUser(
          job.customerId,
          '🎉 Contractor Assigned!',
          `${worker.name} accepted your job: "${job.title}".`,
          {
            type: 'job_match_accepted',
            jobId: job.id,
          }
        ).catch((err) => logger.error('Failed to send acceptance push', { err }));
      }
    }
  }

  return updatedMatch;
}

// ─── Matching Algorithm ───────────────────────────────────────────────────────

export async function matchWorkersForJob(jobId: string, io?: any) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return;

  const lat = job.latitude;
  const lng = job.longitude;
  const radiusKm = MAX_MATCH_RADIUS_METERS / 1000; // 30 km

  // Find all active, available workers whose tradeCategories includes the job's tradeCategory
  const allPotentialWorkers = await prisma.worker.findMany({
    where: {
      isActive: true,
      availability: 'available',
      // In development mode, match any worker of matching trade category (allow approved or pending)
      // In production mode, match only approved workers
      verificationStatus: process.env.NODE_ENV === 'development'
        ? { in: ['approved', 'pending'] }
        : 'approved',
      tradeCategories: {
        has: job.tradeCategory,
      },
    },
  });

  const matchedWorkersMap = new Map<string, any>();

  for (const worker of allPotentialWorkers) {
    let distance: number | null = null;
    let matchesDistance = false;

    // Check if worker has coordinates
    if (
      worker.latitude !== null &&
      worker.longitude !== null &&
      lat !== null &&
      lng !== null
    ) {
      // Haversine distance formula in JS
      const R = 6371; // km
      const dLat = ((worker.latitude - lat) * Math.PI) / 180;
      const dLon = ((worker.longitude - lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((worker.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distance = R * c;

      if (distance <= radiusKm) {
        matchesDistance = true;
      }
    }

    // Fallback: match by city substring if worker doesn't have coordinates or distance is outside but city matches
    let matchesCity = false;
    if (worker.city && job.address) {
      const workerCityClean = worker.city.trim().toLowerCase();
      const jobAddressClean = job.address.toLowerCase();
      if (jobAddressClean.includes(workerCityClean) || workerCityClean.includes(jobAddressClean)) {
        matchesCity = true;
      }
    }

    // If matches geolocation OR fallback city check, include this worker
    if (matchesDistance || matchesCity) {
      matchedWorkersMap.set(worker.id, {
        ...worker,
        distance,
      });
    }
  }

  // Sort: Distance-matched first, then fallback matches
  const sortedWorkers = Array.from(matchedWorkersMap.values()).sort((a, b) => {
    if (a.distance !== null && b.distance !== null) {
      return a.distance - b.distance;
    }
    if (a.distance !== null) return -1;
    if (b.distance !== null) return 1;
    return 0;
  });

  const workers = sortedWorkers.slice(0, MAX_WORKERS_TO_MATCH);

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

    // Send real-time Socket.io notifications
    if (io) {
      const matches = await prisma.match.findMany({
        where: {
          jobId,
          workerId: { in: workers.map((w) => w.id) },
        },
      });

      for (const match of matches) {
        io.to(match.workerId).emit('new_job_invite', {
          matchId: match.id,
          jobId: job.id,
          title: job.title,
          description: job.description,
          tradeCategory: job.tradeCategory,
          urgency: job.urgency,
          address: job.address,
          scheduledAt: job.scheduledAt ? job.scheduledAt.toISOString() : null,
        });

        // Send Background Push Notification (FCM)
        sendPushToUser(
          match.workerId,
          '🛠️ New Job Match!',
          `A ${job.tradeCategory} is needed for "${job.title}". Urgency: ${job.urgency}.`,
          {
            type: 'new_job_invite',
            matchId: match.id,
            jobId: job.id,
          }
        ).catch((err) => logger.error('Failed to send match push', { err }));
      }

      // Notify customer that matches have been found/updated
      io.to(job.customerId).emit('job_matches_updated', {
        jobId: job.id,
      });
    }
  } catch (err) {
    logger.error('Failed to create match documents', { jobId, err });
  }
}

export async function completeJob(
  jobId: string,
  userId: string,
  userType: 'customer' | 'worker',
  data: { rating: number; comment?: string }
) {
  if (data.rating < 1 || data.rating > 5) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }

  // Find job
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new AppError('Job not found', 404);
  }

  // Verify ownership
  if (userType === 'customer') {
    if (job.customerId !== userId) {
      throw new AppError('Not authorized to complete this job', 403);
    }
  } else if (userType === 'worker') {
    if (job.assignedWorkerId !== userId) {
      throw new AppError('Not authorized to complete this job', 403);
    }
  } else {
    throw new AppError('Invalid user type', 403);
  }

  // Verify state
  if (job.status === 'cancelled') {
    throw new AppError('Cannot complete a cancelled job', 400);
  }

  // Update status if it is not completed yet
  let updatedJob = job;
  if (job.status !== 'completed') {
    updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });
  }

  if (!job.assignedWorkerId) {
    throw new AppError('No worker was assigned to this job', 400);
  }

  // Prevent double reviews from the same role
  const existingReview = await prisma.review.findUnique({
    where: {
      jobId_reviewer: {
        jobId,
        reviewer: userType,
      },
    },
  });

  if (existingReview) {
    throw new AppError('You have already submitted feedback for this job', 409);
  }

  // Create review
  const review = await prisma.review.create({
    data: {
      jobId,
      customerId: job.customerId,
      workerId: job.assignedWorkerId,
      reviewer: userType,
      rating: data.rating,
      comment: data.comment || null,
    },
  });

  return { job: updatedJob, review };
}

export async function matchOpenJobsForWorker(workerId: string) {
  try {
    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
    });
    if (!worker || !worker.isActive || worker.availability !== 'available') return;

    // Find all open jobs that match the worker's tradeCategories
    const matchingJobs = await prisma.job.findMany({
      where: {
        status: 'open',
        tradeCategory: { in: worker.tradeCategories },
      },
    });

    for (const job of matchingJobs) {
      await matchWorkersForJob(job.id);
    }
  } catch (err) {
    logger.error('Failed to match open jobs for worker', { workerId, err });
  }
}
