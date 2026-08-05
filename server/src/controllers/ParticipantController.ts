/**
 * Participant Controller
 */

import { Request, Response, NextFunction } from 'express';
import { ParticipantService } from '../services';
import { sendSuccess, sendPaginated } from '../utils';

export class ParticipantController {
  constructor(private participantService: ParticipantService) {}

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await this.participantService.findAll(page, limit);
      sendPaginated(res, result.data, page, limit, result.total);
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.participantService.findById(req.params.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.participantService.create(req.body);
      sendSuccess(res, result, undefined, 201);
    } catch (error) {
      next(error);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.participantService.create(req.body);
      sendSuccess(res, result, undefined, 201);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.participantService.update(req.params.id, req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.participantService.delete(req.params.id);
      sendSuccess(res, { message: 'Participant deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}
