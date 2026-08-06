import { Request, Response } from 'express';
import { EventService } from '../services';
import { sendSuccess, sendPaginated } from '../utils';

export class EventController {
  constructor(private eventService: EventService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await this.eventService.list(page, limit);
    sendPaginated(res, result.data, result.page, result.limit, result.total);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const event = await this.eventService.getById(req.params.id);
    sendSuccess(res, event);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;
    const event = await this.eventService.create(req.body, userId);
    sendSuccess(res, event, undefined, 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;
    const event = await this.eventService.update(req.params.id, req.body, userId);
    sendSuccess(res, event);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;
    await this.eventService.delete(req.params.id, userId);
    sendSuccess(res, null);
  };
}
