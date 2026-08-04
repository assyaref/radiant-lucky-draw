/**
 * Settings Controller
 */

import { Request, Response, NextFunction } from 'express';
import { SettingsService } from '../services';
import { sendSuccess } from '../utils';

export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.settingsService.get();
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.settingsService.update(req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };
}
