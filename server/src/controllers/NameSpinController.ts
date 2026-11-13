/**
 * Name Spin Controller
 */

import { Request, Response, NextFunction } from 'express';
import { NameSpinService } from '../services';
import { sendSuccess } from '../utils';

export class NameSpinController {
  constructor(private nameSpinService: NameSpinService) {}

  spin = (req: Request, res: Response, next: NextFunction): void => {
    this.nameSpinService
      .spin(req.body)
      .then((result) => sendSuccess(res, result))
      .catch(next);
  };
}
