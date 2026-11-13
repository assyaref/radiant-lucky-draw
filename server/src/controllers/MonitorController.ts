/**
 * Monitor Controller
 */

import { Request, Response, NextFunction } from 'express';
import { MonitorService } from '../services';
import { sendSuccess } from '../utils';

export class MonitorController {
  constructor(private monitorService: MonitorService) {}

  get = (_req: Request, res: Response, next: NextFunction): void => {
    this.monitorService
      .get()
      .then((s) => sendSuccess(res, s))
      .catch(next);
  };

  update = (req: Request, res: Response, next: NextFunction): void => {
    this.monitorService
      .update(req.body)
      .then((s) => sendSuccess(res, s))
      .catch(next);
  };
}
