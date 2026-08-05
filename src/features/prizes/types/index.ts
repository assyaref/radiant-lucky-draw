import type { Prize, PrizeTier } from '@/engine/types/prize';

/**
 * Prize management specific types.
 * Extends the core Prize model with management-specific fields.
 */

/**
 * Prize form data for create/edit operations.
 * Omits runtime state fields.
 */
export interface PrizeFormData {
  name: string;
  description: string;
  tier: PrizeTier;
  image: string;
  color: string;
  weight: number;
  stock: number;
  maxDailyWinner: number;
  enabled: boolean;
  displayOrder: number;
}

/**
 * Prize filter options.
 */
export interface PrizeFilterOptions {
  search: string;
  tier: PrizeTier | 'all';
  enabled: boolean | 'all';
  stockStatus: 'all' | 'in_stock' | 'out_of_stock' | 'low_stock';
  sortBy: 'name' | 'tier' | 'weight' | 'stock' | 'displayOrder' | 'dailyWinnerCount';
  sortDirection: 'asc' | 'desc';
}

/**
 * Default filter options.
 */
export const DEFAULT_FILTER_OPTIONS: PrizeFilterOptions = {
  search: '',
  tier: 'all',
  enabled: 'all',
  stockStatus: 'all',
  sortBy: 'displayOrder',
  sortDirection: 'asc',
};

/**
 * Prize statistics for the management dashboard.
 */
export interface PrizeStats {
  totalPrizes: number;
  enabledPrizes: number;
  disabledPrizes: number;
  totalStock: number;
  totalDailyWinners: number;
  tierDistribution: Record<string, number>;
  outOfStockCount: number;
  lowStockCount: number;
}

/**
 * Bulk update payload.
 */
export interface BulkUpdatePayload {
  prizeIds: string[];
  updates: Partial<{
    tier: PrizeTier;
    weight: number;
    enabled: boolean;
    maxDailyWinner: number;
    color: string;
  }>;
}

/**
 * CSV import result.
 */
export interface CSVImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  prizes: Prize[];
}

/**
 * CSV export data shape.
 */
export interface CSVExportRow {
  id: string;
  name: string;
  description: string;
  tier: string;
  color: string;
  weight: number;
  stock: number;
  maxDailyWinner: number;
  enabled: boolean;
  displayOrder: number;
}

/**
 * Schedule configuration for a prize.
 */
export interface PrizeSchedule {
  prizeId: string;
  startDate: string | null;
  endDate: string | null;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  startTime: string;
  endTime: string;
}

/**
 * Image upload placeholder data.
 */
export interface ImageUploadData {
  file: File | null;
  previewUrl: string;
  uploadedAt: string | null;
}
