/**
 * Global Error Handler Middleware
 *
 * Catches all errors and returns a standardized error response.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils';
import { logger } from '../utils';
import { env } from '../config';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.requestId || 'unknown';

  if (err instanceof AppError) {
    logger.warn(`[${requestId}] ${err.code}: ${err.message}`, {
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    });

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: env.isDevelopment ? err.details : undefined,
      },
      requestId,
    });
    return;
  }

  // Unknown error
  logger.error(`[${requestId}] Unhandled error: ${err.message}`, {
    stack: env.isDevelopment ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: env.isProduction ? 'An unexpected error occurred' : err.message,
    },
    requestId,
  });
}
