/**
 * Request ID utility
 *
 * Generates and attaches a unique ID to each request for tracing.
 */

import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

declare module 'express' {
  interface Request {
    requestId: string;
  }
}

export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.requestId = (req.headers['x-request-id'] as string) || uuidv4();
  next();
}
