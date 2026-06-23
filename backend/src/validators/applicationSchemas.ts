/**
 * Application (Match) Validation Schemas
 *
 * - apply: worker applies to a request (request_id UUID)
 * - decision: accept or decline an application
 */

import { z } from 'zod';

export const applyRequestSchema = z.object({
  requestId: z.string().uuid('Request ID must be a valid UUID'),
});

export const matchDecisionSchema = z.object({
  action: z.enum(['accept', 'decline'], {
    errorMap: () => ({ message: 'Action must be "accept" or "decline"' }),
  }),
});

export const matchIdParamSchema = z.object({
  matchId: z.string().uuid('Match ID must be a valid UUID'),
});

export const requestParamsSchema = z.object({
  id: z.string().uuid('Request ID must be a valid UUID'),
});
