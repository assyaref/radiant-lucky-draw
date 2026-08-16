/**
 * Participant Controller
 */

import { Request, Response, NextFunction } from 'express';
import { ParticipantService } from '../services';
import { sendSuccess, sendPaginated, logger } from '../utils';

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

  exportAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.participantService.listAll();
      sendSuccess(res, result);
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
      logger.info('[Participant] Public registration request', {
        name: req.body?.name,
        phone: req.body?.phone?.replace(/.(?=.{4})/g, '*'), // mask phone
        company: req.body?.company,
      });
      const result = await this.participantService.create(req.body);
      logger.info('[Participant] Public registration success', { participantId: result.id });
      sendSuccess(res, result, undefined, 201);
    } catch (error: any) {
      logger.error('[Participant] Public registration FAILED', {
        message: error?.message,
        code: error?.code,
      });
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
      const force = req.query.force === 'true';
      await this.participantService.delete(req.params.id, force);
      sendSuccess(res, { message: 'Participant deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}
