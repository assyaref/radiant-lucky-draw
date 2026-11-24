/**
 * Audit Log Routes — /api/audit-logs
 *
 * Read-only, paginated view of the audit trail. Requires `audit:read`.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { requirePermission } from '../middlewares';
import { createAuthenticate } from '../middlewares/auth.middleware';
import { TokenService } from '../services';
import { PERMISSIONS } from '../auth';
import { prisma } from '../lib/prisma';
import { sendPaginated } from '../utils';

export function createAuditLogRoutes(tokenService: TokenService): Router {
  const router = Router();
  router.use(createAuthenticate(tokenService));

  router.get(
    '/',
    requirePermission(PERMISSIONS.AUDIT_READ),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const q = req.query as Record<string, string | undefined>;
        const page = Math.max(1, Number(q.page) || 1);
        const limit = Math.min(200, Math.max(1, Number(q.limit) || 50));
        const where: Record<string, unknown> = {};
        if (q.action) where.action = String(q.action);
        if (q.entity) where.entity = String(q.entity);

        const [records, total] = await Promise.all([
          prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            include: { user: { select: { id: true, username: true, email: true, role: true } } },
          }),
          prisma.auditLog.count({ where }),
        ]);

        const data = records.map((r: any) => ({
          id: r.id,
          action: r.action,
          entity: r.entity,
          entityId: r.entityId ?? null,
          metadata: r.metadata ?? null,
          ipAddress: r.ipAddress ?? '',
          userAgent: r.userAgent ?? '',
          createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
          user: r.user ? { id: r.user.id, username: r.user.username, email: r.user.email, role: r.user.role } : null,
        }));
        sendPaginated(res, data, page, limit, total);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
