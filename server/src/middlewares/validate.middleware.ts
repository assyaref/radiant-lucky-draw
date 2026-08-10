/**
 * Validation Middleware
 *
 * Zod-based request validation middleware.
 * Validates request body, query, and params against a schema.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as Record<string, string>;
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        // Use the first error's message as the primary message for
        // easier client-side pattern matching (e.g. "whatsapp: Format tidak valid")
        const primaryMessage = error.errors[0]?.message ?? 'Validation failed';
        throw new ValidationError(primaryMessage, details);
      }
      next(error);
    }
  };
}
