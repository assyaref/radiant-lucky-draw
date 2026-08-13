// Events Management Page
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineCalendarDays,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineXMark,
  HiOutlineMapPin,
} from 'react-icons/hi2';
import { eventApi, type EventData, type CreateEventPayload } from '@/api/event';

export default function EventsPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateEventPayload>({
    name: '',
    description: '',
    location: '',
    status: 'upcoming',
    theme: 'dark',
  });
  const [saving, setSaving] = useState(false);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await eventApi.list();
      setEvents(res.data ?? []);
      setError('');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadEvents();
  }, [loadEvents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await eventApi.update(editingId, form);
      } else {
        await eventApi.create(form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', description: '', location: '', status: 'upcoming', theme: 'dark' });
      await loadEvents();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (event: EventData) => {
    setEditingId(event.id);
    setForm({
      name: event.name,
      description: event.description,
      location: event.location,
      startDate: event.startDate,
      endDate: event.endDate,
      status: event.status,
      theme: event.theme,
      logoUrl: event.logoUrl,
      bannerUrl: event.bannerUrl,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    try {
      await eventApi.delete(id);
      await loadEvents();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Events</h1>
          <p className="text-sm text-dark-text-tertiary mt-1">{events.length} event(s)</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setForm({ name: '', description: '', location: '', status: 'upcoming', theme: 'dark' });
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 transition-colors"
        >
          <HiOutlinePlus className="w-4 h-4" /> New Event
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-danger-500/20 border border-danger-500/30 text-danger-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-dark-text-tertiary">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-20">
          <HiOutlineCalendarDays className="w-16 h-16 text-dark-text-tertiary/30 mx-auto mb-4" />
          <p className="text-dark-text-tertiary">No events yet. Create your first event!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-dark-border bg-dark-surface-secondary overflow-hidden hover:border-dark-border/80 transition-colors"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-white font-semibold text-lg truncate">{event.name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      event.status === 'active'
                        ? 'bg-success-500/20 text-success-400'
                        : event.status === 'completed'
                          ? 'bg-dark-text-tertiary/20 text-dark-text-tertiary'
                          : 'bg-primary-500/20 text-primary-400'
                    }`}
                  >
                    {event.status}
                  </span>
                </div>
                {event.description && (
                  <p className="text-dark-text-tertiary text-sm mb-3 line-clamp-2">
                    {event.description}
                  </p>
                )}
                {event.location && (
                  <p className="flex items-center gap-1 text-dark-text-tertiary text-xs mb-3">
                    <HiOutlineMapPin className="w-3 h-3" />
                    {event.location}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-dark-text-tertiary">
                  <span>👥 {event._count?.participants ?? 0}</span>
                  <span>🎁 {event._count?.prizes ?? 0}</span>
                  <span>🏆 {event._count?.winners ?? 0}</span>
                  <span>🏪 {event._count?.booths ?? 0}</span>
                </div>
              </div>
              <div className="flex border-t border-dark-border">
                <button
                  onClick={() => handleEdit(event)}
                  className="flex-1 py-2.5 text-sm text-dark-text-secondary hover:text-white hover:bg-dark-surface-tertiary transition-colors flex items-center justify-center gap-1"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
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
              className="w-full max-w-lg rounded-2xl border border-dark-border bg-dark-surface-secondary p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">
                  {editingId ? 'Edit Event' : 'New Event'}
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
                  <label className="block text-xs text-dark-text-tertiary mb-1">Event Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white text-sm outline-none focus:border-primary-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-dark-text-tertiary mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={form.description ?? ''}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white text-sm outline-none focus:border-primary-500/50 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-dark-text-tertiary mb-1">Location</label>
                    <input
                      value={form.location ?? ''}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white text-sm outline-none focus:border-primary-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-dark-text-tertiary mb-1">Status</label>
                    <select
                      value={form.status ?? 'upcoming'}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white text-sm outline-none focus:border-primary-500/50"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-dark-text-tertiary mb-1">Start Date</label>
                    <input
                      type="datetime-local"
                      value={form.startDate ? form.startDate.slice(0, 16) : ''}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          startDate: e.target.value
                            ? new Date(e.target.value).toISOString()
                            : undefined,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white text-sm outline-none focus:border-primary-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-dark-text-tertiary mb-1">End Date</label>
                    <input
                      type="datetime-local"
                      value={form.endDate ? form.endDate.slice(0, 16) : ''}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          endDate: e.target.value
                            ? new Date(e.target.value).toISOString()
                            : undefined,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white text-sm outline-none focus:border-primary-500/50"
                    />
                  </div>
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
