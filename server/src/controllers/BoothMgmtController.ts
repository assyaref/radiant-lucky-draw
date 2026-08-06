import { Request, Response } from 'express';
import { BoothMgmtService } from '../services';
import { sendSuccess } from '../utils';

export class BoothMgmtController {
  constructor(private boothService: BoothMgmtService) {}

  listByEvent = async (req: Request, res: Response): Promise<void> => {
    const booths = await this.boothService.listByEvent(req.query.eventId as string);
    sendSuccess(res, booths);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const booth = await this.boothService.getById(req.params.id);
    sendSuccess(res, booth);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;
    const booth = await this.boothService.create(req.body, userId);
    sendSuccess(res, booth, undefined, 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;
    const booth = await this.boothService.update(req.params.id, req.body, userId);
    sendSuccess(res, booth);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;
    await this.boothService.delete(req.params.id, userId);
    sendSuccess(res, null);
  };
}
