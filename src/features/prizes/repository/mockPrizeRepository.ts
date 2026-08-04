import type { Prize, PrizeCreateParams } from '@/engine/types/prize';
import { PrizeTier } from '@/engine/types/prize';
import type { PrizeFilterOptions, PrizeStats, BulkUpdatePayload, CSVImportResult, CSVExportRow } from '../types';
import { generateId } from '@/engine/utils/math';

/**
 * Mock Prize Repository.
 * 
 * Simulates a backend API for CRUD operations on prizes.
 * Ready for future API integration — swap this with an API repository.
 * 
 * All operations are async to simulate network latency.
 */
class MockPrizeRepository {
  private prizes: Prize[] = [];
  private initialized = false;

  /**
   * Initialize with default sample prizes.
   */
  private initialize(): void {
    if (this.initialized) return;
    this.prizes = this.createSamplePrizes();
    this.initialized = true;
  }

  /**
   * Simulate network delay.
   */
  private async delay(ms = 150): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get all prizes with optional filtering.
   */
  async getAll(filters?: PrizeFilterOptions): Promise<Prize[]> {
    await this.delay();
    this.initialize();

    let result = [...this.prizes];

    if (!filters) return result;

    // Search filter
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q),
      );
    }

    // Tier filter
    if (filters.tier !== 'all') {
      result = result.filter((p) => p.tier === filters.tier);
    }

    // Enabled filter
    if (filters.enabled !== 'all') {
      result = result.filter((p) => p.enabled === filters.enabled);
    }

    // Stock status filter
    if (filters.stockStatus !== 'all') {
      switch (filters.stockStatus) {
        case 'in_stock':
          result = result.filter((p) => p.stock > 10);
          break;
        case 'low_stock':
          result = result.filter((p) => p.stock > 0 && p.stock <= 10);
          break;
        case 'out_of_stock':
          result = result.filter((p) => p.stock === 0);
          break;
      }
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[filters.sortBy];
      const bVal = b[filters.sortBy];
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return filters.sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }

  /**
   * Get a single prize by ID.
   */
  async getById(id: string): Promise<Prize | null> {
    await this.delay(50);
    this.initialize();
    return this.prizes.find((p) => p.id === id) ?? null;
  }

  /**
   * Create a new prize.
   */
  async create(params: PrizeCreateParams): Promise<Prize> {
    await this.delay();
    this.initialize();

    const prize: Prize = {
      id: params.id || generateId(),
      name: params.name,
      description: params.description ?? '',
      tier: params.tier,
      image: params.image ?? '',
      color: params.color ?? '#94a3b8',
      weight: params.weight ?? this.getDefaultWeight(params.tier),
      stock: params.stock,
      maxDailyWinner: params.maxDailyWinner ?? 0,
      enabled: params.enabled ?? true,
      displayOrder: params.displayOrder ?? this.prizes.length + 1,
      dailyWinnerCount: 0,
    };

    this.prizes.push(prize);
    return { ...prize };
  }

  /**
   * Update an existing prize.
   */
  async update(id: string, updates: Partial<Prize>): Promise<Prize> {
    await this.delay();
    this.initialize();

    const index = this.prizes.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Prize with id "${id}" not found`);
    }

    this.prizes[index] = { ...this.prizes[index], ...updates };
    return { ...this.prizes[index] };
  }

  /**
   * Delete a prize by ID.
   */
  async delete(id: string): Promise<boolean> {
    await this.delay();
    this.initialize();

    const index = this.prizes.findIndex((p) => p.id === id);
    if (index === -1) return false;

    this.prizes.splice(index, 1);
    return true;
  }

  /**
   * Duplicate a prize (creates a copy with new ID).
   */
  async duplicate(id: string): Promise<Prize> {
    await this.delay();
    this.initialize();

    const original = this.prizes.find((p) => p.id === id);
    if (!original) {
      throw new Error(`Prize with id "${id}" not found`);
    }

    const duplicate: Prize = {
      ...original,
      id: generateId(),
      name: `${original.name} (Copy)`,
      stock: original.stock,
      dailyWinnerCount: 0,
      displayOrder: this.prizes.length + 1,
    };

    this.prizes.push(duplicate);
    return { ...duplicate };
  }

  /**
   * Toggle prize enabled/disabled status.
   */
  async toggleEnabled(id: string): Promise<Prize> {
    await this.delay(50);
    this.initialize();

    const index = this.prizes.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Prize with id "${id}" not found`);
    }

    this.prizes[index].enabled = !this.prizes[index].enabled;
    return { ...this.prizes[index] };
  }

  /**
   * Bulk update prizes.
   */
  async bulkUpdate(payload: BulkUpdatePayload): Promise<Prize[]> {
    await this.delay(300);
    this.initialize();

    const updated: Prize[] = [];
    for (const id of payload.prizeIds) {
      const index = this.prizes.findIndex((p) => p.id === id);
      if (index !== -1) {
        this.prizes[index] = { ...this.prizes[index], ...payload.updates };
        updated.push({ ...this.prizes[index] });
      }
    }
    return updated;
  }

  /**
   * Reorder prizes (drag & drop sorting).
   */
  async reorder(orderedIds: string[]): Promise<Prize[]> {
    await this.delay(200);
    this.initialize();

    const reordered: Prize[] = [];
    for (let i = 0; i < orderedIds.length; i++) {
      const prize = this.prizes.find((p) => p.id === orderedIds[i]);
      if (prize) {
        prize.displayOrder = i + 1;
        reordered.push({ ...prize });
      }
    }

    this.prizes = reordered.sort((a, b) => a.displayOrder - b.displayOrder);
    return [...this.prizes];
  }

  /**
   * Get prize statistics.
   */
  async getStats(): Promise<PrizeStats> {
    await this.delay(100);
    this.initialize();

    const totalPrizes = this.prizes.length;
    const enabledPrizes = this.prizes.filter((p) => p.enabled).length;
    const disabledPrizes = totalPrizes - enabledPrizes;
    const totalStock = this.prizes.reduce((sum, p) => sum + p.stock, 0);
    const totalDailyWinners = this.prizes.reduce((sum, p) => sum + p.dailyWinnerCount, 0);

    const tierDistribution: Record<string, number> = {};
    for (const prize of this.prizes) {
      tierDistribution[prize.tier] = (tierDistribution[prize.tier] ?? 0) + 1;
    }

    const outOfStockCount = this.prizes.filter((p) => p.stock === 0).length;
    const lowStockCount = this.prizes.filter((p) => p.stock > 0 && p.stock <= 10).length;

    return {
      totalPrizes,
      enabledPrizes,
      disabledPrizes,
      totalStock,
      totalDailyWinners,
      tierDistribution,
      outOfStockCount,
      lowStockCount,
    };
  }

  /**
   * Export prizes as CSV rows.
   */
  async exportCSV(): Promise<CSVExportRow[]> {
    await this.delay(200);
    this.initialize();

    return this.prizes.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      tier: p.tier,
      color: p.color,
      weight: p.weight,
      stock: p.stock,
      maxDailyWinner: p.maxDailyWinner,
      enabled: p.enabled,
      displayOrder: p.displayOrder,
    }));
  }

  /**
   * Import prizes from CSV data.
   */
  async importCSV(rows: CSVExportRow[]): Promise<CSVImportResult> {
    await this.delay(500);
    this.initialize();

    const result: CSVImportResult = {
      success: true,
      imported: 0,
      skipped: 0,
      errors: [],
      prizes: [],
    };

    for (const row of rows) {
      try {
        if (!row.name || !row.tier) {
          result.skipped++;
          result.errors.push(`Row skipped: missing name or tier (${row.name ?? 'unnamed'})`);
          continue;
        }

        const prize: Prize = {
          id: row.id || generateId(),
          name: row.name,
          description: row.description ?? '',
          tier: row.tier as PrizeTier,
          image: '',
          color: row.color ?? '#94a3b8',
          weight: row.weight ?? this.getDefaultWeight(row.tier as PrizeTier),
          stock: row.stock ?? 0,
          maxDailyWinner: row.maxDailyWinner ?? 0,
          enabled: row.enabled ?? true,
          displayOrder: row.displayOrder ?? this.prizes.length + 1,
          dailyWinnerCount: 0,
        };

        this.prizes.push(prize);
        result.imported++;
        result.prizes.push(prize);
      } catch (error) {
        result.skipped++;
        result.errors.push(`Error importing row: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return result;
  }

  /**
   * Get default weight for a tier.
   */
  private getDefaultWeight(tier: PrizeTier): number {
    const weights: Record<PrizeTier, number> = {
      [PrizeTier.GRAND]: 0.5,
      [PrizeTier.VERY_RARE]: 1,
      [PrizeTier.RARE]: 3,
      [PrizeTier.NORMAL]: 15,
      [PrizeTier.COMMON]: 80,
    };
    return weights[tier] ?? 10;
  }

  /**
   * Create sample prizes for initial data.
   */
  private createSamplePrizes(): Prize[] {
    return [
      {
        id: 'prize-1',
        name: 'Smart TV 55" 4K',
        description: '55-inch Ultra HD Smart TV with HDR support',
        tier: PrizeTier.GRAND,
        image: '',
        color: '#fbbf24',
        weight: 0.5,
        stock: 1,
        maxDailyWinner: 1,
        enabled: true,
        displayOrder: 1,
        dailyWinnerCount: 0,
      },
      {
        id: 'prize-2',
        name: 'Premium Laptop',
        description: 'High-performance laptop for professionals',
        tier: PrizeTier.VERY_RARE,
        image: '',
        color: '#a78bfa',
        weight: 1,
        stock: 2,
        maxDailyWinner: 1,
        enabled: true,
        displayOrder: 2,
        dailyWinnerCount: 0,
      },
      {
        id: 'prize-3',
        name: 'Tablet Pro 12.9"',
        description: 'Latest generation tablet with stylus support',
        tier: PrizeTier.RARE,
        image: '',
        color: '#60a5fa',
        weight: 3,
        stock: 5,
        maxDailyWinner: 2,
        enabled: true,
        displayOrder: 3,
        dailyWinnerCount: 0,
      },
      {
        id: 'prize-4',
        name: 'Smart Watch Ultra',
        description: 'Premium fitness tracking smartwatch',
        tier: PrizeTier.RARE,
        image: '',
        color: '#34d399',
        weight: 3,
        stock: 10,
        maxDailyWinner: 3,
        enabled: true,
        displayOrder: 4,
        dailyWinnerCount: 0,
      },
      {
        id: 'prize-5',
        name: 'Wireless Earbuds Pro',
        description: 'Noise-cancelling wireless earbuds',
        tier: PrizeTier.NORMAL,
        image: '',
        color: '#f59e0b',
        weight: 15,
        stock: 25,
        maxDailyWinner: 5,
        enabled: true,
        displayOrder: 5,
        dailyWinnerCount: 0,
      },
      {
        id: 'prize-6',
        name: 'Power Bank 20000mAh',
        description: 'High-capacity portable charger with fast charging',
        tier: PrizeTier.NORMAL,
        image: '',
        color: '#ef4444',
        weight: 15,
        stock: 50,
        maxDailyWinner: 10,
        enabled: true,
        displayOrder: 6,
        dailyWinnerCount: 0,
      },
      {
        id: 'prize-7',
        name: 'Premium Tumbler',
        description: 'Stainless steel insulated tumbler 500ml',
        tier: PrizeTier.NORMAL,
        image: '',
        color: '#8b5cf6',
        weight: 15,
        stock: 100,
        maxDailyWinner: 20,
        enabled: true,
        displayOrder: 7,
        dailyWinnerCount: 0,
      },
      {
        id: 'prize-8',
        name: 'Branded Umbrella',
        description: 'Automatic open/close umbrella with windproof design',
        tier: PrizeTier.COMMON,
        image: '',
        color: '#94a3b8',
        weight: 40,
        stock: 200,
        maxDailyWinner: 50,
        enabled: true,
        displayOrder: 8,
        dailyWinnerCount: 0,
      },
      {
        id: 'prize-9',
        name: 'Shopping Voucher Rp50.000',
        description: 'Shopping voucher valid at all partner stores',
        tier: PrizeTier.COMMON,
        image: '',
        color: '#64748b',
        weight: 40,
        stock: 500,
        maxDailyWinner: 100,
        enabled: true,
        displayOrder: 9,
        dailyWinnerCount: 0,
      },
      {
        id: 'prize-10',
        name: 'Exclusive Sticker Pack',
        description: 'Limited edition Radiant Group sticker pack',
        tier: PrizeTier.COMMON,
        image: '',
        color: '#475569',
        weight: 80,
        stock: 1000,
        maxDailyWinner: 200,
        enabled: true,
        displayOrder: 10,
        dailyWinnerCount: 0,
      },
    ];
  }
}

/** Singleton instance */
export const mockPrizeRepository = new MockPrizeRepository();