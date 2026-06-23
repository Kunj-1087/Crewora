import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { uploadRateLimiter } from '../../config/rateLimits';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import * as workerService from './worker.service';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// ─── Validation Schemas ───────────────────────────────────────────────────────

const workerDiscoveryQuerySchema = z.object({
  tradeCategory: z.string().min(1).optional(),
  lat: z
    .string()
    .optional()
    .refine((v) => v === undefined || (!isNaN(Number(v)) && Number(v) >= -90 && Number(v) <= 90), {
      message: 'lat must be a valid latitude between -90 and 90',
    }),
  lng: z
    .string()
    .optional()
    .refine((v) => v === undefined || (!isNaN(Number(v)) && Number(v) >= -180 && Number(v) <= 180), {
      message: 'lng must be a valid longitude between -180 and 180',
    }),
  radius: z
    .string()
    .optional()
    .refine((v) => v === undefined || (!isNaN(Number(v)) && Number(v) > 0 && Number(v) <= 200), {
      message: 'radius must be a positive number up to 200 km',
    }),
  page: z.string().default('1').refine((v) => !isNaN(Number(v)) && Number(v) >= 1, {
    message: 'page must be a positive integer',
  }),
  limit: z.string().default('20').refine((v) => !isNaN(Number(v)) && Number(v) >= 1 && Number(v) <= 100, {
    message: 'limit must be between 1 and 100',
  }),
});

const workerIdParamSchema = z.object({
  id: z.string().uuid('Worker ID must be a valid UUID'),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

// Public: discover workers
router.get('/', validate({ query: workerDiscoveryQuerySchema }), async (req, res, next) => {
  try {
    const { tradeCategory, lat, lng, radius, page, limit } = req.query as Record<string, string>;
    const result = await workerService.discoverWorkers({
      tradeCategory,
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      radiusKm: radius ? Number(radius) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

// Worker: get own profile
router.get('/me', authenticate('worker'), async (req, res, next) => {
  try {
    const worker = await workerService.getWorkerProfile(req.user!.id);

    // Fetch dynamic stats
    const completedJobsCount = await prisma.job.count({
      where: { assignedWorkerId: worker.id, status: 'completed' },
    });

    const reviewsAggregate = await prisma.review.aggregate({
      where: { workerId: worker.id, reviewer: 'customer' },
      _avg: { rating: true },
      _count: { id: true },
    });

    const averageRating = reviewsAggregate._avg.rating
      ? parseFloat(reviewsAggregate._avg.rating.toFixed(1))
      : 0;
    const totalReviews = reviewsAggregate._count.id || 0;
    const satisfactionRate = averageRating > 0
      ? Math.round((averageRating / 5) * 100)
      : 100;

    const workerWithStats = {
      ...worker,
      completedJobsCount,
      averageRating,
      totalReviews,
      satisfactionRate: `${satisfactionRate}%`,
    };

    res.json({ success: true, data: { worker: workerWithStats } });
  } catch (error) { next(error); }
});

// Worker: update own profile
router.patch(
  '/me',
  authenticate('worker'),
  validate({ body: workerService.updateWorkerProfileSchema }),
  async (req, res, next) => {
    try {
      const worker = await workerService.updateWorkerProfile(req.user!.id, req.user!.id, req.body);
      res.json({ success: true, message: 'Profile updated', data: { worker } });
    } catch (error) { next(error); }
  }
);

// Worker: update availability
router.patch(
  '/me/availability',
  authenticate('worker'),
  validate({ body: z.object({ availability: z.enum(['available', 'unavailable', 'on_a_job']) }) }),
  async (req, res, next) => {
    try {
      const worker = await workerService.updateAvailability(req.user!.id, req.user!.id, req.body.availability);
      res.json({ success: true, data: { worker } });
    } catch (error) { next(error); }
  }
);

// Public: get worker public profile (UUID-validated)
router.get('/:id', validate({ params: workerIdParamSchema }), async (req, res, next) => {
  try {
    const worker = await prisma.worker.findFirst({
      where: {
        id: req.params.id,
        verificationStatus: 'approved',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        tradeCategories: true,
        city: true,
        experienceYears: true,
        bio: true,
        availability: true,
        profilePhoto: true,
        certifications: true,
        hourlyRate: true,
        portfolioItems: {
          select: {
            id: true,
            title: true,
            image: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
    if (!worker) throw new AppError('Worker not found', 404);

    // Fetch dynamic stats
    const completedJobsCount = await prisma.job.count({
      where: { assignedWorkerId: worker.id, status: 'completed' },
    });

    const reviewsAggregate = await prisma.review.aggregate({
      where: { workerId: worker.id, reviewer: 'customer' },
      _avg: { rating: true },
      _count: { id: true },
    });

    const averageRating = reviewsAggregate._avg.rating
      ? parseFloat(reviewsAggregate._avg.rating.toFixed(1))
      : 0;
    const totalReviews = reviewsAggregate._count.id || 0;
    const satisfactionRate = averageRating > 0
      ? Math.round((averageRating / 5) * 100)
      : 100;

    const workerProfile = {
      ...worker,
      completedJobsCount,
      averageRating,
      totalReviews,
      satisfactionRate: `${satisfactionRate}%`,
    };

    res.json({ success: true, data: { worker: workerProfile } });
  } catch (error) { next(error); }
});

// Configure upload storage for worker profile photos
const uploadDir = path.join(__dirname, '../../../uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'profile-' + req.user!.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images (jpg, jpeg, png, webp) are allowed!'));
    }
  }
});

// Worker: upload and update own profile photo
router.post(
  '/me/profile-photo',
  authenticate('worker'),
  uploadRateLimiter,
  upload.single('photo'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new AppError('No photo file uploaded', 400);
      }

      const photoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

      // Fetch old profile photo to clean up later
      const existingWorker = await prisma.worker.findUnique({
        where: { id: req.user!.id },
        select: { profilePhoto: true },
      });

      const worker = await prisma.worker.update({
        where: { id: req.user!.id },
        data: { profilePhoto: photoUrl }
      });

      // Delete old profile photo file from disk
      if (existingWorker?.profilePhoto) {
        const oldFilename = existingWorker.profilePhoto.split('/').pop();
        if (oldFilename) {
          const oldPath = path.join(uploadDir, oldFilename);
          fs.unlink(oldPath, (err) => {
            if (err && err.code !== 'ENOENT') {
              logger.error('Failed to delete old profile photo', { path: oldPath, error: err });
            }
          });
        }
      }

      res.json({
        success: true,
        message: 'Profile photo updated successfully',
        data: { worker }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Configure upload storage for worker portfolio projects
const portfolioStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'portfolio-' + req.user!.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadPortfolio = multer({
  storage: portfolioStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images (jpg, jpeg, png, webp) are allowed!'));
    }
  }
});

// Worker: add portfolio item
router.post(
  '/me/portfolio',
  authenticate('worker'),
  uploadRateLimiter,
  uploadPortfolio.single('photo'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new AppError('No photo file uploaded', 400);
      }
      const { title } = req.body;
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        throw new AppError('Portfolio project title is required', 400);
      }

      const photoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      const portfolioItem = await workerService.addPortfolioItem(req.user!.id, title.trim(), photoUrl);

      res.json({
        success: true,
        message: 'Portfolio item added successfully',
        data: { portfolioItem }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Worker: delete portfolio item
router.delete(
  '/me/portfolio/:itemId',
  authenticate('worker'),
  validate({ params: z.object({ itemId: z.string().uuid('Portfolio item ID must be a valid UUID') }) }),
  async (req, res, next) => {
    try {
      const result = await workerService.removePortfolioItem(req.user!.id, req.params.itemId);
      res.json({
        success: true,
        message: 'Portfolio item deleted successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
