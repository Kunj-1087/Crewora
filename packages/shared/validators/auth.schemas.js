"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceTokenSchema = exports.adminLoginSchema = exports.loginSchema = exports.workerRegisterSchema = exports.customerRegisterSchema = exports.sendOtpSchema = void 0;
const zod_1 = require("zod");
exports.sendOtpSchema = zod_1.z.object({
    phone: zod_1.z.string().min(10, 'Phone number must be at least 10 digits').max(15),
});
// Phone schema: strips non-digits, then validates 10-15 digits
const phoneSchema = zod_1.z
    .string()
    .transform(function (val) { return val.replace(/\D/g, ''); })
    .pipe(zod_1.z.string().regex(/^\d{10,15}$/, 'Phone must be 10-15 digits (numbers only)'));

exports.customerRegisterSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
    phone: phoneSchema,
    otp: zod_1.z.string().length(6, 'OTP must be exactly 6 digits'),
});
exports.workerRegisterSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
    phone: phoneSchema,
    otp: zod_1.z.string().length(6, 'OTP must be exactly 6 digits'),
    tradeCategories: zod_1.z
        .array(zod_1.z.enum([
        'plumber', 'electrician', 'carpenter', 'painter',
        'welder', 'mason', 'hvac', 'tiler', 'roofer', 'other',
    ]))
        .min(1, 'At least one trade category is required'),
    city: zod_1.z.string().min(2, 'City is required').trim(),
});
exports.loginSchema = zod_1.z.object({
    phone: phoneSchema,
    otp: zod_1.z.string().length(6, 'OTP must be exactly 6 digits'),
});
exports.sendOtpSchema = zod_1.z.object({
    phone: phoneSchema,
});
exports.adminLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.deviceTokenSchema = zod_1.z.object({
    token: zod_1.z.string().min(10, 'Device token must be at least 10 characters'),
});
