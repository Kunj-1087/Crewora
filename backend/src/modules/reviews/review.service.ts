import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import { assertOwnership } from '../../utils/ownershipCheck';

export async function createReview(
  jobId: string,
  customerId: string,
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

  // Check ownership
  assertOwnership(job.customerId, customerId);

  // Check completion
  if (job.status !== 'completed') {
    throw new AppError('Can only review completed jobs', 400);
  }

  // Check worker assignment
  if (!job.assignedWorkerId) {
    throw new AppError('No worker was assigned to this job', 400);
  }

  // Prevent double reviews
  const existingReview = await prisma.review.findUnique({
    where: {
      jobId_reviewer: {
        jobId,
        reviewer: 'customer',
      },
    },
  });

  if (existingReview) {
    throw new AppError('Review already submitted for this job', 409);
  }

  // Create review
  const review = await prisma.review.create({
    data: {
      jobId,
      customerId,
      workerId: job.assignedWorkerId,
      rating: data.rating,
      comment: data.comment || null,
    },
  });

  return review;
}

export async function getWorkerReviews(
  workerId: string,
  page: number = 1,
  limit: number = 10
) {
  const skip = (page - 1) * limit;

  // Verify worker exists
  const worker = await prisma.worker.findUnique({
    where: { id: workerId },
  });

  if (!worker) {
    throw new AppError('Worker not found', 404);
  }

  const [reviews, aggregate, total] = await Promise.all([
    prisma.review.findMany({
      where: { workerId, reviewer: 'customer' },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.review.aggregate({
      where: { workerId, reviewer: 'customer' },
      _avg: { rating: true },
      _count: { id: true },
    }),
    prisma.review.count({ where: { workerId, reviewer: 'customer' } }),
  ]);

  const averageRating = aggregate._avg.rating ? parseFloat(aggregate._avg.rating.toFixed(1)) : 0.0;
  const totalReviews = aggregate._count.id || 0;

  return {
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      customerName: r.customer.name,
    })),
    stats: {
      averageRating,
      totalReviews,
    },
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
