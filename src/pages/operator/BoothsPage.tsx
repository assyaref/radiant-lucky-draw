// Booths Management Page
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineBuildingStorefront,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineXMark,
  HiOutlineQrCode,
  HiOutlineMapPin,
} from 'react-icons/hi2';
import { boothMgmtApi, type BoothData, type CreateBoothPayload } from '@/api/booth-mgmt';
import { eventApi, type EventData } from '@/api/event';

export default function BoothsPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [booths, setBooths] = useState<BoothData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateBoothPayload>({
    name: '',
    code: '',
    location: '',
    eventId: '',
    theme: 'dark',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    eventApi
      .list({ limit: 100 })
      .then((res) => {
        setEvents(res.data ?? []);
        if (res.data && res.data.length > 0) {
          setSelectedEventId(res.data[0].id);
          setForm((f) => ({ ...f, eventId: res.data[0].id }));
        }
      })
      .catch(() => {});
  }, []);

  const loadBooths = useCallback(async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const res = await boothMgmtApi.listByEvent(selectedEventId);
      setBooths(res.data ?? []);
      setError('');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load booths');
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBooths();
  }, [loadBooths]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await boothMgmtApi.update(editingId, {
          name: form.name,
          code: form.code,
          location: form.location,
          status: form.status as any,
          theme: form.theme,
        });
      } else {
        await boothMgmtApi.create({ ...form, eventId: selectedEventId });
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', code: '', location: '', eventId: selectedEventId, theme: 'dark' });
      await loadBooths();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save booth');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (booth: BoothData) => {
    setEditingId(booth.id);
    setForm({
      name: booth.name,
      code: booth.code,
      location: booth.location ?? '',
      eventId: booth.eventId,
      theme: booth.theme ?? 'dark',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this booth?')) return;
    try {
      await boothMgmtApi.delete(id);
      await loadBooths();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Booths</h1>
          <p className="text-sm text-dark-text-tertiary mt-1">{booths.length} booth(s)</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setForm({ name: '', code: '', location: '', eventId: selectedEventId, theme: 'dark' });
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 transition-colors"
        >
          <HiOutlinePlus className="w-4 h-4" /> New Booth
        </button>
      </div>

      <div>
        <label className="block text-xs text-dark-text-tertiary mb-1.5">Filter by Event</label>
        <select
          value={selectedEventId}
          onChange={(e) => {
            setSelectedEventId(e.target.value);
            setForm((f) => ({ ...f, eventId: e.target.value }));
          }}
          className="w-full max-w-xs px-3 py-2 rounded-lg bg-dark-surface-secondary border border-dark-border text-white text-sm outline-none focus:border-primary-500/50"
        >
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-danger-500/20 border border-danger-500/30 text-danger-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-dark-text-tertiary">Loading booths...</div>
      ) : booths.length === 0 ? (
        <div className="text-center py-20">
          <HiOutlineBuildingStorefront className="w-16 h-16 text-dark-text-tertiary/30 mx-auto mb-4" />
          <p className="text-dark-text-tertiary">No booths yet for this event.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {booths.map((booth, i) => (
            <motion.div
              key={booth.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-dark-border bg-dark-surface-secondary overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-semibold">{booth.name}</h3>
                    <p className="text-dark-text-tertiary text-xs font-mono mt-0.5">{booth.code}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      booth.status === 'active'
                        ? 'bg-success-500/20 text-success-400'
                        : booth.status === 'inactive'
                          ? 'bg-dark-text-tertiary/20 text-dark-text-tertiary'
                          : 'bg-warning-500/20 text-warning-400'
                    }`}
                  >
                    {booth.status}
                  </span>
                </div>
                {booth.location && (
                  <p className="flex items-center gap-1 text-dark-text-tertiary text-xs mb-3">
                    <HiOutlineMapPin className="w-3 h-3" />
                    {booth.location}
                  </p>
                )}
                {booth.qrCode && (
                  <p className="flex items-center gap-1 text-dark-text-tertiary text-xs">
                    <HiOutlineQrCode className="w-3 h-3" />
                    QR Code available
                  </p>
                )}
              </div>
              <div className="flex border-t border-dark-border">
                <button
                  onClick={() => handleEdit(booth)}
                  className="flex-1 py-2.5 text-sm text-dark-text-secondary hover:text-white hover:bg-dark-surface-tertiary transition-colors flex items-center justify-center gap-1"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(booth.id)}
                  className="flex-1 py-2.5 text-sm text-danger-400 hover:text-danger-300 hover:bg-danger-500/10 transition-colors flex items-center justify-center gap-1 border-l border-dark-border"
                >
                  <HiOutlineTrash className="w-4 h-4" /> Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-dark-border bg-dark-surface-secondary p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">
                  {editingId ? 'Edit Booth' : 'New Booth'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1 rounded-lg text-dark-text-tertiary hover:text-white"
                >
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-dark-text-tertiary mb-1">Booth Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white text-sm outline-none focus:border-primary-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-dark-text-tertiary mb-1">Code *</label>
                  <input
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="e.g. BOOTH-A1"
                    className="w-full px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white text-sm outline-none focus:border-primary-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-dark-text-tertiary mb-1">Location</label>
                  <input
                    value={form.location ?? ''}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white text-sm outline-none focus:border-primary-500/50"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-dark-border">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-lg bg-dark-surface-tertiary text-dark-text-secondary text-sm hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
