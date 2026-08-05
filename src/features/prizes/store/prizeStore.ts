import { create } from 'zustand';
import type { Prize, PrizeCreateParams } from '@/engine/types/prize';
import type { PrizeFilterOptions, PrizeStats, BulkUpdatePayload, CSVImportResult } from '../types';
import { DEFAULT_FILTER_OPTIONS } from '../types';
import { prizeService } from '../services/prizeService';

/**
 * Prize Management Store.
 *
 * Zustand store that manages the prize management UI state.
 * Wraps the PrizeService for reactive state management.
 */
export interface PrizeStoreState {
  /** All prizes */
  prizes: Prize[];
  /** Currently selected prize for editing */
  selectedPrize: Prize | null;
  /** Current filter options */
  filters: PrizeFilterOptions;
  /** Prize statistics */
  stats: PrizeStats | null;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Success message */
  success: string | null;
  /** Whether the form modal is open */
  formOpen: boolean;
  /** Whether editing or creating */
  isEditing: boolean;
  /** Selected prize IDs for bulk operations */
  selectedIds: string[];
  /** CSV import result */
  csvImportResult: CSVImportResult | null;

  // Actions
  fetchPrizes: () => Promise<void>;
  fetchStats: () => Promise<void>;
  setFilters: (filters: Partial<PrizeFilterOptions>) => void;
  resetFilters: () => void;
  createPrize: (params: PrizeCreateParams) => Promise<Prize>;
  updatePrize: (id: string, updates: Partial<Prize>) => Promise<Prize>;
  deletePrize: (id: string) => Promise<boolean>;
  duplicatePrize: (id: string) => Promise<Prize>;
  toggleEnabled: (id: string) => Promise<Prize>;
  bulkUpdate: (payload: BulkUpdatePayload) => Promise<void>;
  reorderPrizes: (orderedIds: string[]) => Promise<void>;
  exportCSV: () => Promise<string>;
  importCSV: (csvString: string) => Promise<CSVImportResult>;
  openForm: (prize?: Prize) => void;
  closeForm: () => void;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  clearMessages: () => void;
}

export const usePrizeStore = create<PrizeStoreState>((set, get) => ({
  prizes: [],
  selectedPrize: null,
  filters: { ...DEFAULT_FILTER_OPTIONS },
  stats: null,
  loading: false,
  error: null,
  success: null,
  formOpen: false,
  isEditing: false,
  selectedIds: [],
  csvImportResult: null,

  fetchPrizes: async () => {
    set({ loading: true, error: null });
    try {
      const prizes = await prizeService.getAll(get().filters);
      set({ prizes, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch prizes',
        loading: false,
      });
    }
  },

  fetchStats: async () => {
    try {
      const stats = await prizeService.getStats();
      set({ stats });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  },

  setFilters: (filters: Partial<PrizeFilterOptions>) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
    get().fetchPrizes();
  },

  resetFilters: () => {
    set({ filters: { ...DEFAULT_FILTER_OPTIONS } });
    get().fetchPrizes();
  },

  createPrize: async (params: PrizeCreateParams) => {
    set({ loading: true, error: null });
    try {
      const prize = await prizeService.create(params);
      set({
        loading: false,
        success: `Prize "${prize.name}" created successfully`,
        formOpen: false,
      });
      get().fetchPrizes();
      get().fetchStats();
      return prize;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create prize',
        loading: false,
      });
      throw error;
    }
  },

  updatePrize: async (id: string, updates: Partial<Prize>) => {
    set({ loading: true, error: null });
    try {
      const prize = await prizeService.update(id, updates);
      set({
        loading: false,
        success: `Prize "${prize.name}" updated successfully`,
        formOpen: false,
        selectedPrize: null,
      });
      get().fetchPrizes();
      get().fetchStats();
      return prize;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update prize',
        loading: false,
      });
      throw error;
    }
  },

  deletePrize: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const result = await prizeService.delete(id);
      set({ loading: false, success: 'Prize deleted successfully' });
      get().fetchPrizes();
      get().fetchStats();
      return result;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete prize',
        loading: false,
      });
      throw error;
    }
  },

  duplicatePrize: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const prize = await prizeService.duplicate(id);
      set({ loading: false, success: `Prize duplicated as "${prize.name}"` });
      get().fetchPrizes();
      get().fetchStats();
      return prize;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to duplicate prize',
        loading: false,
      });
      throw error;
    }
  },

  toggleEnabled: async (id: string) => {
    try {
      const prize = await prizeService.toggleEnabled(id);
      set({ success: `Prize "${prize.name}" ${prize.enabled ? 'enabled' : 'disabled'}` });
      get().fetchPrizes();
      get().fetchStats();
      return prize;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to toggle prize status' });
      throw error;
    }
  },

  bulkUpdate: async (payload: BulkUpdatePayload) => {
    set({ loading: true, error: null });
    try {
      await prizeService.bulkUpdate(payload);
      set({
        loading: false,
        success: `${payload.prizeIds.length} prizes updated`,
        selectedIds: [],
      });
      get().fetchPrizes();
      get().fetchStats();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to bulk update',
        loading: false,
      });
    }
  },

  reorderPrizes: async (orderedIds: string[]) => {
    try {
      await prizeService.reorder(orderedIds);
      get().fetchPrizes();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to reorder prizes' });
    }
  },

  exportCSV: async () => {
    try {
      return await prizeService.exportCSV();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to export CSV' });
      throw error;
    }
  },

  importCSV: async (csvString: string) => {
    set({ loading: true, error: null });
    try {
      const result = await prizeService.importCSV(csvString);
      set({
        loading: false,
        csvImportResult: result,
        success: `Imported ${result.imported} prizes`,
      });
      get().fetchPrizes();
      get().fetchStats();
      return result;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to import CSV',
        loading: false,
      });
      throw error;
    }
  },

  openForm: (prize?: Prize) => {
    set({ formOpen: true, isEditing: !!prize, selectedPrize: prize ?? null, error: null });
  },

  closeForm: () => {
    set({ formOpen: false, isEditing: false, selectedPrize: null });
  },

  toggleSelect: (id: string) => {
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((sid) => sid !== id)
        : [...state.selectedIds, id],
    }));
  },

  selectAll: () => {
    set((state) => ({ selectedIds: state.prizes.map((p) => p.id) }));
  },

  deselectAll: () => {
    set({ selectedIds: [] });
  },

  clearMessages: () => {
    set({ error: null, success: null, csvImportResult: null });
  },
}));
