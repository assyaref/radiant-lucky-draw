/**
 * Health Check Controller
 */

import { Request, Response } from 'express';
import { sendSuccess } from '../utils';

export class HealthController {
  check = (_req: Request, res: Response): void => {
    sendSuccess(res, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
    });
  };
}
