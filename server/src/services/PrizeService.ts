/**
 * Prize Service
 */

import { PrizeRepository } from '../repositories';
import { NotFoundError } from '../utils';
import type { CreatePrizeRequest, UpdatePrizeRequest, PrizeResponse } from '../dto';

export class PrizeService {
  constructor(private prizeRepository: PrizeRepository) {}

  async findAll(page: number = 1, limit: number = 20) {
    return this.prizeRepository.paginate(page, limit);
  }

  async findActive() {
    return this.prizeRepository.findActive();
  }

  async findById(id: string): Promise<PrizeResponse> {
    const prize = await this.prizeRepository.findById(id);
    if (!prize) throw new NotFoundError('Prize', id);
    return this.toResponse(prize);
  }

  async create(data: CreatePrizeRequest): Promise<PrizeResponse> {
    const prize = await this.prizeRepository.create({
      ...data,
      currency: data.currency || 'USD',
      remaining: data.quantity,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return this.toResponse(prize);
  }

  async update(id: string, data: UpdatePrizeRequest): Promise<PrizeResponse> {
    const updateData = { ...data, updatedAt: new Date().toISOString() };
    const prize = await this.prizeRepository.update(id, updateData);
    if (!prize) throw new NotFoundError('Prize', id);
    return this.toResponse(prize);
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.prizeRepository.delete(id);
    if (!deleted) throw new NotFoundError('Prize', id);
  }

  private toResponse(p: any): PrizeResponse {
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      value: p.value,
      currency: p.currency,
      quantity: p.quantity,
      remaining: p.remaining,
      imageUrl: p.imageUrl,
      sponsor: p.sponsor,
      tier: p.tier,
      isActive: p.isActive,
      createdAt: p.createdAt,
    };
  }
}
