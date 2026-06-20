"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobQuerySchema = exports.jobIdSchema = exports.updateJobSchema = exports.createJobSchema = void 0;
const zod_1 = require("zod");
exports.createJobSchema = zod_1.z.object({
    title: zod_1.z.string().min(5, 'Title must be at least 5 characters').max(150),
    description: zod_1.z.string().min(20, 'Please provide a detailed description').max(2000),
    tradeCategory: zod_1.z.enum([
        'plumber', 'electrician', 'carpenter', 'painter',
        'welder', 'mason', 'hvac', 'tiler', 'roofer', 'other',
    ]),
    location: zod_1.z.object({
        address: zod_1.z.string().min(5, 'Location address is required'),
        coordinates: zod_1.z.tuple([
            zod_1.z.number().min(-180).max(180), // longitude
            zod_1.z.number().min(-90).max(90), // latitude
        ]),
    }),
    urgency: zod_1.z.enum(['asap', 'scheduled']),
    scheduledAt: zod_1.z.string().datetime().optional(),
});
exports.updateJobSchema = zod_1.z.object({
    title: zod_1.z.string().min(5).max(150).optional(),
    description: zod_1.z.string().min(20).max(2000).optional(),
    scheduledAt: zod_1.z.string().datetime().optional(),
    status: zod_1.z.enum(['cancelled']).optional(), // customers can only cancel
    cancellationReason: zod_1.z.string().max(500).optional(),
});
exports.jobIdSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid job ID'),
});
exports.jobQuerySchema = zod_1.z.object({
    page: zod_1.z.string().default('1').transform(Number),
    limit: zod_1.z.string().default('10').transform(Number),
    status: zod_1.z.string().optional(),
});
