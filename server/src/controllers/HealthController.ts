/**
 * Health Check Controller
 */

import { Request, Response } from 'express';
import { sendSuccess } from '../utils';
import { prisma } from '../lib/prisma';

export class HealthController {
  check = async (_req: Request, res: Response): Promise<void> => {
    let dbStatus = 'healthy';
    let dbLatencyMs = 0;

    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - start;
    } catch {
      dbStatus = 'unhealthy';
    }

    const memoryUsage = process.memoryUsage();
    const activeConnections = (globalThis as any).__radiantRealtimeIO?.engine?.clientsCount ?? 0;

    sendSuccess(res, {
      status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      version: '1.0.0',
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      memory: {
        rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      },
      connections: {
        active: activeConnections,
      },
    });
  };
}
