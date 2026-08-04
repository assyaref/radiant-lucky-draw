// ============================================================
// Export Menu Component
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnalyticsStore } from '../store/analyticsStore';
import type { ExportFormat } from '../types';

interface ExportMenuProps {
  className?: string;
}

export function ExportMenu({ className = '' }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const { exportData, exporting } = useAnalyticsStore();

  const handleExport = async (format: ExportFormat) => {
    await exportData(format);
    setOpen(false);
  };

  const exportOptions: { format: ExportFormat; label: string; icon: string; desc: string }[] = [
    { format: 'excel', label: 'Excel', icon: '📗', desc: 'Download as .xls file' },
    { format: 'csv', label: 'CSV', icon: '📊', desc: 'Download as .csv file' },
    { format: 'pdf', label: 'PDF', icon: '📄', desc: 'Download as .pdf file' },
  ];

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        disabled={exporting}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-colors text-sm font-medium disabled:opacity-50"
      >
        {exporting ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Exporting...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-dark-border bg-dark-surface-secondary shadow-2xl shadow-black/40 z-50 overflow-hidden"
            >
              <div className="px-4 py-2.5 border-b border-dark-border">
                <p className="text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">Export As</p>
              </div>
              <div className="p-1.5 space-y-0.5">
                {exportOptions.map((opt) => (
                  <button
                    key={opt.format}
                    onClick={() => handleExport(opt.format)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-dark-text-secondary hover:text-white hover:bg-dark-surface-tertiary transition-colors"
                  >
                    <span className="text-lg">{opt.icon}</span>
                    <div className="text-left">
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs text-dark-text-tertiary">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-dark-border">
                <button
                  onClick={() => window.print()}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-dark-text-secondary hover:text-white hover:bg-dark-surface-tertiary transition-colors"
                >
                  <span className="text-lg">🖨️</span>
                  <div className="text-left">
                    <p className="text-sm font-medium">Print</p>
                    <p className="text-xs text-dark-text-tertiary">Open print dialog</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
