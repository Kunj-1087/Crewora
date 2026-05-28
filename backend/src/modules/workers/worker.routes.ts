import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
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
router.get('/me', requireAuth('worker'), async (req, res, next) => {
  try {
    const worker = await workerService.getWorkerProfile(req.user!.id);
    res.json({ success: true, data: { worker } });
  } catch (error) { next(error); }
});

// Worker: update own profile
router.patch(
  '/me',
  requireAuth('worker'),
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
  requireAuth('worker'),
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
      },
    });
    if (!worker) throw new AppError('Worker not found', 404);
    res.json({ success: true, data: { worker } });
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
  requireAuth('worker'),
  upload.single('photo'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new AppError('No photo file uploaded', 400);
      }

      const photoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

      const worker = await prisma.worker.update({
        where: { id: req.user!.id },
        data: { profilePhoto: photoUrl }
      });

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

export default router;
