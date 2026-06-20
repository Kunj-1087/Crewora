import { z } from 'zod';
export declare const createJobSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    tradeCategory: z.ZodEnum<["plumber", "electrician", "carpenter", "painter", "welder", "mason", "hvac", "tiler", "roofer", "other"]>;
    location: z.ZodObject<{
        address: z.ZodString;
        coordinates: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    }, "strip", z.ZodTypeAny, {
        address: string;
        coordinates: [number, number];
    }, {
        address: string;
        coordinates: [number, number];
    }>;
    urgency: z.ZodEnum<["asap", "scheduled"]>;
    scheduledAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    description: string;
    tradeCategory: "plumber" | "electrician" | "carpenter" | "painter" | "welder" | "mason" | "hvac" | "tiler" | "roofer" | "other";
    location: {
        address: string;
        coordinates: [number, number];
    };
    urgency: "asap" | "scheduled";
    scheduledAt?: string | undefined;
}, {
    title: string;
    description: string;
    tradeCategory: "plumber" | "electrician" | "carpenter" | "painter" | "welder" | "mason" | "hvac" | "tiler" | "roofer" | "other";
    location: {
        address: string;
        coordinates: [number, number];
    };
    urgency: "asap" | "scheduled";
    scheduledAt?: string | undefined;
}>;
export declare const updateJobSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    scheduledAt: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["cancelled"]>>;
    cancellationReason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "cancelled" | undefined;
    title?: string | undefined;
    description?: string | undefined;
    scheduledAt?: string | undefined;
    cancellationReason?: string | undefined;
}, {
    status?: "cancelled" | undefined;
    title?: string | undefined;
    description?: string | undefined;
    scheduledAt?: string | undefined;
    cancellationReason?: string | undefined;
}>;
export declare const jobIdSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const jobQuerySchema: z.ZodObject<{
    page: z.ZodEffects<z.ZodDefault<z.ZodString>, number, string | undefined>;
    limit: z.ZodEffects<z.ZodDefault<z.ZodString>, number, string | undefined>;
    status: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    status?: string | undefined;
}, {
    status?: string | undefined;
    page?: string | undefined;
    limit?: string | undefined;
}>;
