/**
 * Booth Controller
 *
 * HTTP handlers for the Digital Lucky Draw Booth Enterprise flow.
 */

import { Request, Response, NextFunction } from 'express';
import { BoothService } from '../services';
import { sendSuccess, sendPaginated } from '../utils';

export class BoothController {
  constructor(private boothService: BoothService) {}

  getConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.boothService.getBoothConfig();
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.boothService.registerParticipant(req.body);
      sendSuccess(res, result, undefined, 201);
    } catch (error) {
      next(error);
    }
  };

  uploadPhoto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.boothService.uploadPhoto(req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  spin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.boothService.spin(req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  listWinners = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const claimStatus = req.query.claimStatus as string | undefined;
      const result = await this.boothService.listWinners(page, limit, claimStatus);
      sendPaginated(res, result.data, page, limit, result.total);
    } catch (error) {
      next(error);
    }
  };

  updateClaimStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.boothService.updateClaimStatus(req.params.id, req.body.claimStatus);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };
}
