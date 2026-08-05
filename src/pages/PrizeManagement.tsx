import { useCallback, useRef, useState, useMemo } from 'react';
import { usePrizeManagement } from '@/features/prizes/hooks/usePrizeManagement';
import { PrizeCard } from '@/features/prizes/components/PrizeCard';
import { PrizeForm } from '@/features/prizes/components/PrizeForm';
import { PrizePreview } from '@/features/prizes/components/PrizePreview';
import { PrizeSearch } from '@/features/prizes/components/PrizeSearch';
import { PrizeFilter } from '@/features/prizes/components/PrizeFilter';
import { PrizeStats } from '@/features/prizes/components/PrizeStats';
import { BulkUpdate } from '@/features/prizes/components/BulkUpdate';
import type { PrizeCreateParams } from '@/engine/types/prize';

/**
 * Simple drag & drop reordering hook.
 * Uses native HTML5 drag & drop API — no external dependencies.
 */
function useDragReorder(items: { id: string }[], onReorder: (orderedIds: string[]) => void) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handlers = useMemo(
    () => ({
      handleDragStart(index: number) {
        setDragIndex(index);
      },
      handleDragOver(e: React.DragEvent, index: number) {
        e.preventDefault();
        setOverIndex(index);
      },
      handleDragLeave() {
        setOverIndex(null);
      },
      handleDrop(e: React.DragEvent) {
        e.preventDefault();
        if (dragIndex === null || dragIndex === overIndex) {
          setDragIndex(null);
          setOverIndex(null);
          return;
        }

        const reordered = [...items];
        const [moved] = reordered.splice(dragIndex, 1);
        reordered.splice(overIndex!, 0, moved);

        onReorder(reordered.map((item) => item.id));
        setDragIndex(null);
        setOverIndex(null);
      },
      handleDragEnd() {
        setDragIndex(null);
        setOverIndex(null);
      },
    }),
    [items, dragIndex, overIndex, onReorder],
  );

  return { dragIndex, overIndex, ...handlers };
}

export default function PrizeManagement() {
  const {
    prizes,
    selectedPrize,
    filters,
    stats,
    loading,
    error,
    success,
    formOpen,
    isEditing,
    selectedIds,
    createPrize,
    updatePrize,
    deletePrize,
    duplicatePrize,
    toggleEnabled,
    setFilters,
    resetFilters,
    bulkUpdate,
    exportCSV,
    importCSV,
    openForm,
    closeForm,
    toggleSelect,
    selectAll,
    deselectAll,
    clearMessages,
    refresh,
    reorderPrizes,
  } = usePrizeManagement();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImportResult, setShowImportResult] = useState(false);

  const {
    dragIndex,
    overIndex,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  } = useDragReorder(prizes, reorderPrizes);

  const handleSubmit = useCallback(
    async (params: PrizeCreateParams) => {
      if (isEditing && selectedPrize) {
        await updatePrize(selectedPrize.id, params);
      } else {
        await createPrize(params);
      }
    },
    [isEditing, selectedPrize, createPrize, updatePrize],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (window.confirm('Are you sure you want to delete this prize?')) {
        await deletePrize(id);
      }
    },
    [deletePrize],
  );

  const handleExportCSV = useCallback(async () => {
    try {
      const csv = await exportCSV();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prizes-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Error handled by store
    }
  }, [exportCSV]);

  const handleImportCSV = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const result = await importCSV(text);
        if (result) {
          setShowImportResult(true);
          setTimeout(() => setShowImportResult(false), 5000);
        }
      } catch {
        // Error handled by store
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [importCSV],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950/20 to-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Prize Management</h1>
            <p className="text-white/50 mt-1">
              Manage your lucky draw prizes — CRUD, stock, tiers, and more
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              className="px-4 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors text-sm"
              title="Refresh"
            >
              ↻
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors text-sm"
            >
              Export CSV
            </button>
            <label className="px-4 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors text-sm cursor-pointer">
              Import CSV
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
              />
            </label>
            <button
              onClick={() => openForm()}
              className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors text-sm font-medium"
            >
              + Add Prize
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={clearMessages} className="text-red-400 hover:text-red-300">
              ✕
            </button>
          </div>
        )}
        {success && (
          <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-between">
            <span>{success}</span>
            <button onClick={clearMessages} className="text-emerald-400 hover:text-emerald-300">
              ✕
            </button>
          </div>
        )}

        {/* Import result */}
        {showImportResult && (
          <div className="p-4 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-between">
            <span>CSV import completed. Check the prize list for results.</span>
            <button
              onClick={() => setShowImportResult(false)}
              className="text-indigo-300 hover:text-indigo-200"
            >
              ✕
            </button>
          </div>
        )}

        {/* Stats */}
        <PrizeStats stats={stats} loading={loading} />

        {/* Search & Filters */}
        <div className="space-y-3">
          <PrizeSearch
            value={filters.search}
            onChange={(search) => setFilters({ search })}
            onReset={() => setFilters({ search: '' })}
          />
          <PrizeFilter filters={filters} onChange={setFilters} onReset={resetFilters} />
        </div>

        {/* Bulk Update */}
        {selectedIds.length > 0 && (
          <BulkUpdate selectedIds={selectedIds} onApply={bulkUpdate} onCancel={deselectAll} />
        )}

        {/* Selection controls */}
        {prizes.length > 0 && (
          <div className="flex items-center justify-between text-sm text-white/40">
            <span>
              {selectedIds.length > 0
                ? `${selectedIds.length} of ${prizes.length} selected`
                : `${prizes.length} prize${prizes.length !== 1 ? 's' : ''}`}
            </span>
            <div className="flex items-center gap-4">
              <span className="text-xs text-white/20">Drag ⠿ to reorder</span>
              <div className="flex gap-3">
                {selectedIds.length > 0 ? (
                  <button onClick={deselectAll} className="hover:text-white transition-colors">
                    Deselect All
                  </button>
                ) : (
                  <button onClick={selectAll} className="hover:text-white transition-colors">
                    Select All
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Prize Grid with Drag & Drop */}
        {loading && prizes.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : prizes.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎁</div>
            <h3 className="text-xl font-semibold text-white mb-2">No prizes found</h3>
            <p className="text-white/50 mb-6">
              {filters.search || filters.tier !== 'all' || filters.stockStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by adding your first prize'}
            </p>
            {!filters.search && filters.tier === 'all' && filters.stockStatus === 'all' && (
              <button
                onClick={() => openForm()}
                className="px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
              >
                + Add Prize
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prizes.map((prize, index) => (
              <div
                key={prize.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                className={`
                  transition-all duration-200
                  ${overIndex === index && dragIndex !== index ? 'scale-[1.02]' : ''}
                `}
              >
                {/* Drop indicator */}
                {overIndex === index && dragIndex !== index && (
                  <div className="h-1 rounded-full bg-indigo-500/50 mb-1" />
                )}

                <PrizeCard
                  prize={prize}
                  selected={selectedIds.includes(prize.id)}
                  onSelect={toggleSelect}
                  onEdit={openForm}
                  onDelete={handleDelete}
                  onDuplicate={duplicatePrize}
                  onToggleEnabled={toggleEnabled}
                  isDragging={dragIndex === index}
                />
              </div>
            ))}
          </div>
        )}

        {/* Form Modal */}
        {formOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-gray-900 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  {isEditing ? 'Edit Prize' : 'Add New Prize'}
                </h2>
                <button
                  onClick={closeForm}
                  className="text-white/40 hover:text-white transition-colors text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <PrizeForm
                    prize={selectedPrize}
                    isEditing={isEditing}
                    onSubmit={handleSubmit}
                    onCancel={closeForm}
                  />
                </div>
                <div className="hidden md:block">
                  {selectedPrize && (
                    <div className="sticky top-0 space-y-4">
                      <h3 className="text-sm font-medium text-white/50 mb-3">Preview</h3>
                      <PrizePreview prize={selectedPrize} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
