// ============================================================
// Event Configuration Page
// Full event setup: name, date, location, status, description
// ============================================================

import { useState } from 'react';
import { HiOutlineCalendarDays, HiOutlineMapPin, HiOutlineDocumentText } from 'react-icons/hi2';

export default function EventConfigPage() {
  const [eventName, setEventName] = useState('Annual Gala Dinner 2026');
  const [eventDate, setEventDate] = useState('2026-12-15T18:00');
  const [eventLocation, setEventLocation] = useState('Grand Ballroom, Hotel Indonesia Kempinski');
  const [eventStatus, setEventStatus] = useState<'upcoming' | 'active' | 'completed'>('upcoming');
  const [eventDescription, setEventDescription] = useState('Acara gala dinner tahunan.');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Event Configuration</h1>
        <p className="text-sm text-dark-text-tertiary mt-1">Configure your event details</p>
      </div>
      <div className="rounded-xl border border-dark-border bg-dark-surface-secondary p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-dark-text-secondary mb-1.5">
            Event Name
          </label>
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            className="w-full max-w-lg px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white outline-none focus:border-primary-500/50 transition-colors text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-text-secondary mb-1.5 flex items-center gap-2">
            <HiOutlineCalendarDays className="w-4 h-4" /> Event Date & Time
          </label>
          <input
            type="datetime-local"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full max-w-lg px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white outline-none focus:border-primary-500/50 transition-colors text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-text-secondary mb-1.5 flex items-center gap-2">
            <HiOutlineMapPin className="w-4 h-4" /> Location
          </label>
          <input
            type="text"
            value={eventLocation}
            onChange={(e) => setEventLocation(e.target.value)}
            placeholder="Venue address..."
            className="w-full max-w-lg px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white placeholder-dark-text-tertiary outline-none focus:border-primary-500/50 transition-colors text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-text-secondary mb-1.5">
            Event Status
          </label>
          <div className="flex gap-2">
            {(['upcoming', 'active', 'completed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setEventStatus(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                  eventStatus === s
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'bg-dark-surface-tertiary text-dark-text-tertiary border border-dark-border hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-text-secondary mb-1.5 flex items-center gap-2">
            <HiOutlineDocumentText className="w-4 h-4" /> Description
          </label>
          <textarea
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            rows={3}
            className="w-full max-w-lg px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white placeholder-dark-text-tertiary outline-none focus:border-primary-500/50 transition-colors text-sm resize-none"
          />
        </div>
        <div className="flex items-center gap-3 pt-2 border-t border-dark-border">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-lg bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 transition-colors"
          >
            {saved ? 'Saved!' : 'Save Configuration'}
          </button>
          {saved && <span className="text-success-400 text-sm">Configuration saved!</span>}
        </div>
      </div>
    </div>
  );
}
