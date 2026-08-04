import type { Prize, PrizeCreateParams } from '@/engine/types/prize';
import type { PrizeFilterOptions, PrizeStats, BulkUpdatePayload, CSVImportResult, CSVExportRow } from '../types';
import { mockPrizeRepository } from '../repository/mockPrizeRepository';

/**
 * Prize Service Layer.
 * 
 * Abstraction over the repository. Currently uses mock data.
 * Ready for future API integration — swap the repository import.
 * 
 * Provides:
 * - Data transformation
 * - Error handling
 * - Business logic
 */
class PrizeService {
  /**
   * Fetch all prizes with optional filters.
   */
  async getAll(filters?: PrizeFilterOptions): Promise<Prize[]> {
    try {
      return await mockPrizeRepository.getAll(filters);
    } catch (error) {
      console.error('[PrizeService] Error fetching prizes:', error);
      throw new Error('Failed to fetch prizes');
    }
  }

  /**
   * Fetch a single prize by ID.
   */
  async getById(id: string): Promise<Prize | null> {
    try {
      return await mockPrizeRepository.getById(id);
    } catch (error) {
      console.error(`[PrizeService] Error fetching prize ${id}:`, error);
      throw new Error('Failed to fetch prize');
    }
  }

  /**
   * Create a new prize.
   */
  async create(params: PrizeCreateParams): Promise<Prize> {
    try {
      return await mockPrizeRepository.create(params);
    } catch (error) {
      console.error('[PrizeService] Error creating prize:', error);
      throw new Error('Failed to create prize');
    }
  }

  /**
   * Update an existing prize.
   */
  async update(id: string, updates: Partial<Prize>): Promise<Prize> {
    try {
      return await mockPrizeRepository.update(id, updates);
    } catch (error) {
      console.error(`[PrizeService] Error updating prize ${id}:`, error);
      throw new Error('Failed to update prize');
    }
  }

  /**
   * Delete a prize.
   */
  async delete(id: string): Promise<boolean> {
    try {
      return await mockPrizeRepository.delete(id);
    } catch (error) {
      console.error(`[PrizeService] Error deleting prize ${id}:`, error);
      throw new Error('Failed to delete prize');
    }
  }

  /**
   * Duplicate a prize.
   */
  async duplicate(id: string): Promise<Prize> {
    try {
      return await mockPrizeRepository.duplicate(id);
    } catch (error) {
      console.error(`[PrizeService] Error duplicating prize ${id}:`, error);
      throw new Error('Failed to duplicate prize');
    }
  }

  /**
   * Toggle prize enabled/disabled.
   */
  async toggleEnabled(id: string): Promise<Prize> {
    try {
      return await mockPrizeRepository.toggleEnabled(id);
    } catch (error) {
      console.error(`[PrizeService] Error toggling prize ${id}:`, error);
      throw new Error('Failed to toggle prize status');
    }
  }

  /**
   * Bulk update prizes.
   */
  async bulkUpdate(payload: BulkUpdatePayload): Promise<Prize[]> {
    try {
      return await mockPrizeRepository.bulkUpdate(payload);
    } catch (error) {
      console.error('[PrizeService] Error in bulk update:', error);
      throw new Error('Failed to bulk update prizes');
    }
  }

  /**
   * Reorder prizes (drag & drop).
   */
  async reorder(orderedIds: string[]): Promise<Prize[]> {
    try {
      return await mockPrizeRepository.reorder(orderedIds);
    } catch (error) {
      console.error('[PrizeService] Error reordering prizes:', error);
      throw new Error('Failed to reorder prizes');
    }
  }

  /**
   * Get prize statistics.
   */
  async getStats(): Promise<PrizeStats> {
    try {
      return await mockPrizeRepository.getStats();
    } catch (error) {
      console.error('[PrizeService] Error fetching stats:', error);
      throw new Error('Failed to fetch prize statistics');
    }
  }

  /**
   * Export prizes as CSV.
   */
  async exportCSV(): Promise<string> {
    try {
      const rows = await mockPrizeRepository.exportCSV();
      return this.convertToCSV(rows);
    } catch (error) {
      console.error('[PrizeService] Error exporting CSV:', error);
      throw new Error('Failed to export CSV');
    }
  }

  /**
   * Import prizes from CSV string.
   */
  async importCSV(csvString: string): Promise<CSVImportResult> {
    try {
      const rows = this.parseCSV(csvString);
      return await mockPrizeRepository.importCSV(rows);
    } catch (error) {
      console.error('[PrizeService] Error importing CSV:', error);
      throw new Error('Failed to import CSV');
    }
  }

  /**
   * Convert CSV export rows to CSV string.
   */
  private convertToCSV(rows: CSVExportRow[]): string {
    const headers = ['id', 'name', 'description', 'tier', 'color', 'weight', 'stock', 'maxDailyWinner', 'enabled', 'displayOrder'];
    const lines = [headers.join(',')];

    for (const row of rows) {
      const values = [
        this.escapeCSV(row.id),
        this.escapeCSV(row.name),
        this.escapeCSV(row.description),
        this.escapeCSV(row.tier),
        this.escapeCSV(row.color),
        String(row.weight),
        String(row.stock),
        String(row.maxDailyWinner),
        String(row.enabled),
        String(row.displayOrder),
      ];
      lines.push(values.join(','));
    }

    return lines.join('\n');
  }

  /**
   * Parse CSV string to export rows.
   */
  private parseCSV(csvString: string): CSVExportRow[] {
    const lines = csvString.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim());
    const rows: CSVExportRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length !== headers.length) continue;

      const row: Partial<CSVExportRow> = {};
      for (let j = 0; j < headers.length; j++) {
        const key = headers[j] as keyof CSVExportRow;
        const value = values[j];

        switch (key) {
          case 'weight':
          case 'stock':
          case 'maxDailyWinner':
          case 'displayOrder':
            (row as Record<string, unknown>)[key] = Number(value);
            break;
          case 'enabled':
            (row as Record<string, unknown>)[key] = value.toLowerCase() === 'true';
            break;
          default:
            (row as Record<string, unknown>)[key] = value;
        }
      }

      rows.push(row as CSVExportRow);
    }

    return rows;
  }

  /**
   * Escape a value for CSV output.
   */
  private escapeCSV(value: string | number | boolean): string {
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * Parse a single CSV line respecting quoted values.
   */
  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    return values;
  }
}

/** Singleton instance */
export const prizeService = new PrizeService();