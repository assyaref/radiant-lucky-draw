/**
 * Draw Controller
 */

import { Request, Response, NextFunction } from 'express';
import { DrawService } from '../services';
import { sendSuccess, sendPaginated } from '../utils';

export class DrawController {
  constructor(private drawService: DrawService) {}

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await this.drawService.findAll(page, limit);
      sendPaginated(res, result.data, page, limit, result.total);
    } catch (error) {
      next(error);
    }
  };

  findRecent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await this.drawService.findRecent(limit);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.drawService.findById(req.params.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.drawService.create(req.body);
      sendSuccess(res, result, undefined, 201);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.drawService.updateStatus(req.params.id, req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.drawService.delete(req.params.id);
      sendSuccess(res, { message: 'Draw deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}
