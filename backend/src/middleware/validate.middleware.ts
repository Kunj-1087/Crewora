/**
 * Request Validation Middleware
 *
 * Parses body/query/params with Zod schema.safeParse().
 * Returns structured 400 errors on failure:
 *   { success: false, error: { code: 'VALIDATION_ERROR', fields: { fieldName: 'message' } } }
 * Never passes unvalidated data to controllers or DB queries.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        const result = schemas.body.safeParse(req.body);
        if (!result.success) {
          res.status(400).json(formatValidationError(result.error));
          return;
        }
        req.body = result.data;
      }

      if (schemas.query) {
        const result = schemas.query.safeParse(req.query);
        if (!result.success) {
          res.status(400).json(formatValidationError(result.error));
          return;
        }
        req.query = result.data as typeof req.query;
      }

      if (schemas.params) {
        const result = schemas.params.safeParse(req.params);
        if (!result.success) {
          res.status(400).json(formatValidationError(result.error));
          return;
        }
        req.params = result.data as typeof req.params;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

function formatValidationError(error: ZodError) {
  const fields: Record<string, string> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.');
    // Keep the first error per field
    if (!fields[path]) {
      fields[path] = issue.message;
    }
  }

  return {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      fields,
    },
  };
}
