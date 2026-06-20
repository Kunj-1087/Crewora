import { z } from 'zod';
export declare const sendOtpSchema: z.ZodObject<{
    phone: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
}, {
    phone: string;
}>;
export declare const customerRegisterSchema: z.ZodObject<{
    name: z.ZodString;
    phone: z.ZodString;
    otp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
    name: string;
    otp: string;
}, {
    phone: string;
    name: string;
    otp: string;
}>;
export declare const workerRegisterSchema: z.ZodObject<{
    name: z.ZodString;
    phone: z.ZodString;
    otp: z.ZodString;
    tradeCategories: z.ZodArray<z.ZodEnum<["plumber", "electrician", "carpenter", "painter", "welder", "mason", "hvac", "tiler", "roofer", "other"]>, "many">;
    city: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
    name: string;
    otp: string;
    tradeCategories: ("plumber" | "electrician" | "carpenter" | "painter" | "welder" | "mason" | "hvac" | "tiler" | "roofer" | "other")[];
    city: string;
}, {
    phone: string;
    name: string;
    otp: string;
    tradeCategories: ("plumber" | "electrician" | "carpenter" | "painter" | "welder" | "mason" | "hvac" | "tiler" | "roofer" | "other")[];
    city: string;
}>;
export declare const loginSchema: z.ZodObject<{
    phone: z.ZodString;
    otp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
    otp: string;
}, {
    phone: string;
    otp: string;
}>;
export declare const adminLoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const deviceTokenSchema: z.ZodObject<{
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
}, {
    token: string;
}>;
