/**
 * User Management Controller
 */

import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services';
import type { Actor } from '../services/UserService';
import { sendSuccess, sendPaginated } from '../utils';

function actorOf(req: Request): Actor {
  return {
    userId: req.user!.userId,
    role: req.user!.role,
    ipAddress: req.ip || '',
    userAgent: (req.headers['user-agent'] as string) || '',
  };
}

type Handler = (req: Request, res: Response) => Promise<void>;
const wrap =
  (fn: Handler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res).catch(next);
  };

export class UserController {
  constructor(private userService: UserService) {}

  list = wrap(async (req, res) => {
    const q = req.query as Record<string, any>;
    const page = Number(q.page) || 1;
    const limit = Number(q.limit) || 20;
    const result = await this.userService.list({
      page,
      limit,
      search: q.search,
      role: q.role,
      status: q.status,
    });
    sendPaginated(res, result.data, page, limit, result.total);
  });

  getById = wrap(async (req, res) => {
    sendSuccess(res, await this.userService.getById(req.params.id));
  });

  create = wrap(async (req, res) => {
    sendSuccess(res, await this.userService.create(req.body, actorOf(req)), undefined, 201);
  });

  update = wrap(async (req, res) => {
    sendSuccess(res, await this.userService.update(req.params.id, req.body, actorOf(req)));
  });

  resetPassword = wrap(async (req, res) => {
    sendSuccess(res, await this.userService.resetPassword(req.params.id, req.body.password, actorOf(req)));
  });

  remove = wrap(async (req, res) => {
    sendSuccess(res, await this.userService.remove(req.params.id, actorOf(req)));
  });

  changeOwnPassword = wrap(async (req, res) => {
    sendSuccess(res, await this.userService.changeOwnPassword(req.body, actorOf(req)));
  });
}
