/**
 * Queue Controller
 */

import { Request, Response, NextFunction } from 'express';
import { QueueService } from '../services';
import { sendSuccess } from '../utils';

export class QueueController {
  constructor(private queueService: QueueService) {}

  getState = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.queueService.getState();
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  addToQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.queueService.addToQueue(req.body.participantId);
      sendSuccess(res, { message: 'Added to queue' }, undefined, 201);
    } catch (error) {
      next(error);
    }
  };

  callNext = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.queueService.callNext();
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  completeCurrent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.queueService.completeCurrent(req.body.participantId);
      sendSuccess(res, { message: 'Participant completed' });
    } catch (error) {
      next(error);
    }
  };

  skip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.queueService.skip(req.body.participantId);
      sendSuccess(res, { message: 'Participant skipped' });
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.queueService.cancel(req.body.participantId);
      sendSuccess(res, { message: 'Participant cancelled' });
    } catch (error) {
      next(error);
    }
  };
}
