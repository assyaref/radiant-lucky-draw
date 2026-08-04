import { useEffect, useCallback } from 'react';
import { usePrizeStore } from '../store/prizeStore';
import type { Prize, PrizeCreateParams } from '@/engine/types/prize';
import type { PrizeFilterOptions, BulkUpdatePayload } from '../types';

/**
 * Prize Management Hook.
 * 
 * Provides a clean API for components to interact with the prize store.
 * Handles initialization and cleanup.
 */
export function usePrizeManagement() {
  const store = usePrizeStore();

  // Initialize data on mount
  useEffect(() => {
    store.fetchPrizes();
    store.fetchStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(() => {
    store.fetchPrizes();
    store.fetchStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // State
    prizes: store.prizes,
    selectedPrize: store.selectedPrize,
    filters: store.filters,
    stats: store.stats,
    loading: store.loading,
    error: store.error,
    success: store.success,
    formOpen: store.formOpen,
    isEditing: store.isEditing,
    selectedIds: store.selectedIds,
    csvImportResult: store.csvImportResult,

    // CRUD
    createPrize: (params: PrizeCreateParams) => store.createPrize(params),
    updatePrize: (id: string, updates: Partial<Prize>) => store.updatePrize(id, updates),
    deletePrize: (id: string) => store.deletePrize(id),
    duplicatePrize: (id: string) => store.duplicatePrize(id),
    toggleEnabled: (id: string) => store.toggleEnabled(id),

    // Filters
    setFilters: (filters: Partial<PrizeFilterOptions>) => store.setFilters(filters),
    resetFilters: () => store.resetFilters(),

    // Bulk operations
    bulkUpdate: (payload: BulkUpdatePayload) => store.bulkUpdate(payload),
    reorderPrizes: (orderedIds: string[]) => store.reorderPrizes(orderedIds),

    // CSV
    exportCSV: () => store.exportCSV(),
    importCSV: (csvString: string) => store.importCSV(csvString),

    // UI
    openForm: (prize?: Prize) => store.openForm(prize),
    closeForm: () => store.closeForm(),
    toggleSelect: (id: string) => store.toggleSelect(id),
    selectAll: () => store.selectAll(),
    deselectAll: () => store.deselectAll(),
    clearMessages: () => store.clearMessages(),

    // Utility
    refresh,
  };
}