/**
 * Worker Service — Profile management, discovery
 */

import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import { assertOwnership } from '../../utils/ownershipCheck';
import { z } from 'zod';
import { matchOpenJobsForWorker } from '../jobs/job.service';

export const updateWorkerProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  experienceYears: z.number().min(0).max(60).optional(),
  city: z.string().min(2).optional(),
  serviceRadius: z.number().min(1).max(100).optional(),
  availability: z.enum(['available', 'unavailable', 'on_a_job']).optional(),
  tradeCategories: z
    .array(z.enum(['plumber', 'electrician', 'carpenter', 'painter', 'welder', 'mason', 'hvac', 'tiler', 'roofer', 'other']))
    .min(1)
    .optional(),
  hourlyRate: z.number().min(0).optional(),
  certifications: z.array(z.string()).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export async function getWorkerProfile(workerId: string) {
  const worker = await prisma.worker.findUnique({
    where: { id: workerId },
    include: {
      portfolioItems: true,
    },
  });
  if (!worker || !worker.isActive) throw new AppError('Worker not found', 404);
  return worker;
}

export async function updateWorkerProfile(
  workerId: string,
  requestingUserId: string,
  updates: z.infer<typeof updateWorkerProfileSchema>
) {
  assertOwnership(workerId, requestingUserId);
  const worker = await prisma.worker.update({
    where: { id: workerId },
    data: updates,
  });
  if (!worker) throw new AppError('Worker not found', 404);

  // Trigger matching for open jobs asynchronously if relevant profile fields are updated
  if (
    updates.latitude !== undefined ||
    updates.longitude !== undefined ||
    updates.tradeCategories !== undefined ||
    updates.availability !== undefined ||
    updates.city !== undefined
  ) {
    matchOpenJobsForWorker(worker.id).catch((err) => {
      // Log errors but don't block profile update response
      console.error('Failed to match open jobs for worker on update', err);
    });
  }

  return worker;
}

export async function updateAvailability(
  workerId: string,
  requestingUserId: string,
  availability: 'available' | 'unavailable' | 'on_a_job'
) {
  assertOwnership(workerId, requestingUserId);
  const worker = await prisma.worker.update({
    where: { id: workerId },
    data: { availability },
  });
  if (!worker) throw new AppError('Worker not found', 404);
  return worker;
}

export async function discoverWorkers(query: {
  tradeCategory?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  page?: number;
  limit?: number;
}) {
  const { tradeCategory, lat, lng, radiusKm = 30, page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;

  let workers: any[] = [];
  let total = 0;

  if (lat !== undefined && lng !== undefined) {
    if (tradeCategory) {
      const countResult: any[] = await prisma.$queryRaw`
        SELECT COUNT(*)::integer as count FROM "Worker"
        WHERE "verificationStatus" = 'approved' AND "isActive" = true AND "availability" <> 'unavailable'
        AND "latitude" IS NOT NULL AND "longitude" IS NOT NULL
        AND ${tradeCategory} = ANY("tradeCategories")
        AND (6371 * acos(cos(radians(${lat})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${lng})) + sin(radians(${lat})) * sin(radians(latitude)))) < ${radiusKm}
      `;
      total = countResult[0]?.count || 0;

      workers = await prisma.$queryRaw`
        SELECT id, name, "tradeCategories", city, "experienceYears", bio, availability, "profilePhoto", "verificationStatus",
               (6371 * acos(cos(radians(${lat})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${lng})) + sin(radians(${lat})) * sin(radians(latitude)))) AS distance
        FROM "Worker"
        WHERE "verificationStatus" = 'approved' AND "isActive" = true AND "availability" <> 'unavailable'
        AND "latitude" IS NOT NULL AND "longitude" IS NOT NULL
        AND ${tradeCategory} = ANY("tradeCategories")
        AND (6371 * acos(cos(radians(${lat})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${lng})) + sin(radians(${lat})) * sin(radians(latitude)))) < ${radiusKm}
        ORDER BY distance ASC
        LIMIT ${limit} OFFSET ${skip}
      `;
    } else {
      const countResult: any[] = await prisma.$queryRaw`
        SELECT COUNT(*)::integer as count FROM "Worker"
        WHERE "verificationStatus" = 'approved' AND "isActive" = true AND "availability" <> 'unavailable'
        AND "latitude" IS NOT NULL AND "longitude" IS NOT NULL
        AND (6371 * acos(cos(radians(${lat})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${lng})) + sin(radians(${lat})) * sin(radians(latitude)))) < ${radiusKm}
      `;
      total = countResult[0]?.count || 0;

      workers = await prisma.$queryRaw`
        SELECT id, name, "tradeCategories", city, "experienceYears", bio, availability, "profilePhoto", "verificationStatus",
               (6371 * acos(cos(radians(${lat})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${lng})) + sin(radians(${lat})) * sin(radians(latitude)))) AS distance
        FROM "Worker"
        WHERE "verificationStatus" = 'approved' AND "isActive" = true AND "availability" <> 'unavailable'
        AND "latitude" IS NOT NULL AND "longitude" IS NOT NULL
        AND (6371 * acos(cos(radians(${lat})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${lng})) + sin(radians(${lat})) * sin(radians(latitude)))) < ${radiusKm}
        ORDER BY distance ASC
        LIMIT ${limit} OFFSET ${skip}
      `;
    }
  } else {
    const where: any = {
      verificationStatus: 'approved',
      isActive: true,
      availability: { not: 'unavailable' },
    };
    if (tradeCategory) {
      where.tradeCategories = { has: tradeCategory };
    }

    [workers, total] = await Promise.all([
      prisma.worker.findMany({
        where,
        select: {
          id: true,
          name: true,
          tradeCategories: true,
          city: true,
          experienceYears: true,
          bio: true,
          availability: true,
          profilePhoto: true,
          verificationStatus: true,
        },
        skip,
        take: limit,
      }),
      prisma.worker.count({ where }),
    ]);
  }

  return {
    workers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function addPortfolioItem(workerId: string, title: string, image: string) {
  const worker = await prisma.worker.findUnique({
    where: { id: workerId },
  });
  if (!worker) throw new AppError('Worker not found', 404);

  const portfolioItem = await prisma.portfolioItem.create({
    data: {
      workerId,
      title,
      image,
    },
  });

  return portfolioItem;
}

export async function removePortfolioItem(workerId: string, itemId: string) {
  const item = await prisma.portfolioItem.findUnique({
    where: { id: itemId },
  });
  if (!item) throw new AppError('Portfolio item not found', 404);
  if (item.workerId !== workerId) throw new AppError('Unauthorized', 403);

  await prisma.portfolioItem.delete({
    where: { id: itemId },
  });

  return { success: true };
}
