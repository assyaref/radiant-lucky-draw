/**
 * Prize Controller
 */

import { Request, Response, NextFunction } from 'express';
import { PrizeService } from '../services';
import { sendSuccess, sendPaginated } from '../utils';

export class PrizeController {
  constructor(private prizeService: PrizeService) {}

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await this.prizeService.findAll(page, limit);
      sendPaginated(res, result.data, page, limit, result.total);
    } catch (error) {
      next(error);
    }
  };

  findActive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.prizeService.findActive();
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.prizeService.findById(req.params.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.prizeService.create(req.body);
      sendSuccess(res, result, undefined, 201);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.prizeService.update(req.params.id, req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.prizeService.delete(req.params.id);
      sendSuccess(res, { message: 'Prize deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}
