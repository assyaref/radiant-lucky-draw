// ============================================================
// Settings Page
// ============================================================

import { useState } from 'react';
import {
  HiOutlineCog6Tooth,
  HiOutlineBell,
  HiOutlinePaintBrush,
  HiOutlineShieldCheck,
  HiOutlineGlobeAlt,
  HiOutlineServer,
} from 'react-icons/hi2';

const settingsSections = [
  { id: 'general', label: 'General', icon: <HiOutlineCog6Tooth className="w-5 h-5" /> },
  { id: 'appearance', label: 'Appearance', icon: <HiOutlinePaintBrush className="w-5 h-5" /> },
  { id: 'notifications', label: 'Notifications', icon: <HiOutlineBell className="w-5 h-5" /> },
  { id: 'security', label: 'Security', icon: <HiOutlineShieldCheck className="w-5 h-5" /> },
  { id: 'localization', label: 'Localization', icon: <HiOutlineGlobeAlt className="w-5 h-5" /> },
  { id: 'system', label: 'System', icon: <HiOutlineServer className="w-5 h-5" /> },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-dark-text-tertiary mt-1">Manage your application preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {settingsSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeSection === section.id
                  ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                  : 'text-dark-text-tertiary hover:text-white hover:bg-dark-surface-tertiary border border-transparent'
              }`}
            >
              {section.icon}
              {section.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 rounded-xl border border-dark-border bg-dark-surface-secondary p-6">
          {activeSection === 'general' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">General Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-1.5">
                    Application Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Radiant Lucky Draw"
                    className="w-full max-w-md px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white outline-none focus:border-primary-500/50 transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-1.5">
                    Draw Interval (seconds)
                  </label>
                  <input
                    type="number"
                    defaultValue={30}
                    className="w-full max-w-md px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white outline-none focus:border-primary-500/50 transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-1.5">
                    Max Participants Per Draw
                  </label>
                  <input
                    type="number"
                    defaultValue={100}
                    className="w-full max-w-md px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white outline-none focus:border-primary-500/50 transition-colors text-sm"
                  />
                </div>
              </div>
              <button className="px-6 py-2 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-colors text-sm font-medium">
                Save Changes
              </button>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Appearance</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-1.5">
                    Theme
                  </label>
                  <div className="flex gap-3">
                    {['Light', 'Dark', 'System'].map((t) => (
                      <button
                        key={t}
                        className="px-4 py-2 rounded-lg bg-dark-surface-tertiary text-dark-text-secondary hover:text-white hover:bg-dark-surface-tertiary/80 transition-colors text-sm"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-1.5">
                    Primary Color
                  </label>
                  <div className="flex gap-2">
                    {['#0ea5e9', '#a855f7', '#22c55e', '#f59e0b', '#ef4444'].map((color) => (
                      <button
                        key={color}
                        className="w-8 h-8 rounded-full border-2 border-transparent hover:border-white transition-colors"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Notification Settings</h2>
              <div className="space-y-4">
                {[
                  { label: 'Draw Completed', desc: 'Notify when a draw completes' },
                  { label: 'New Winner', desc: 'Notify when a winner is selected' },
                  { label: 'Low Stock', desc: 'Notify when prize stock is low' },
                  { label: 'System Alerts', desc: 'Notify on system events' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm text-white">{item.label}</p>
                      <p className="text-xs text-dark-text-tertiary">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-9 h-5 rounded-full bg-dark-surface-tertiary peer-checked:bg-primary-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-4" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Security Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-1.5">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    defaultValue={60}
                    className="w-full max-w-md px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white outline-none focus:border-primary-500/50 transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-1.5">
                    Max Login Attempts
                  </label>
                  <input
                    type="number"
                    defaultValue={5}
                    className="w-full max-w-md px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white outline-none focus:border-primary-500/50 transition-colors text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'localization' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Localization</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-1.5">
                    Language
                  </label>
                  <select className="w-full max-w-md px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white outline-none focus:border-primary-500/50 transition-colors text-sm">
                    <option>English</option>
                    <option>Indonesian</option>
                    <option>Chinese</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-1.5">
                    Time Zone
                  </label>
                  <select className="w-full max-w-md px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white outline-none focus:border-primary-500/50 transition-colors text-sm">
                    <option>Asia/Jakarta (UTC+7)</option>
                    <option>Asia/Singapore (UTC+8)</option>
                    <option>UTC</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'system' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">System Information</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Version', value: '1.0.0' },
                  { label: 'Build', value: '2026.07.30' },
                  { label: 'Node', value: '22.x' },
                  { label: 'Database', value: 'PostgreSQL' },
                  { label: 'Uptime', value: '14d 6h 32m' },
                  { label: 'Memory Usage', value: '42%' },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-lg bg-dark-surface-tertiary/50">
                    <p className="text-xs text-dark-text-tertiary">{item.label}</p>
                    <p className="text-sm text-white font-medium mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
