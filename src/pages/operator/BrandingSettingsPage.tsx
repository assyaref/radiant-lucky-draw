// Branding Event Page
import { useState } from 'react';
import { HiOutlinePhoto, HiOutlinePaintBrush, HiOutlineBuildingOffice } from 'react-icons/hi2';

export default function BrandingSettingsPage() {
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState('#8b5cf6');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Branding Settings</h1>
        <p className="text-sm text-dark-text-tertiary mt-1">
          Customize event branding and appearance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logo */}
        <div className="rounded-xl border border-dark-border bg-dark-surface-secondary p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <HiOutlinePhoto className="w-4 h-4 text-primary-400" /> Event Logo
          </h3>
          <div className="space-y-3">
            <div className="w-full h-40 rounded-lg bg-dark-surface-tertiary border border-dark-border flex items-center justify-center overflow-hidden">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="max-w-full max-h-full object-contain p-4"
                />
              ) : (
                <div className="text-center text-dark-text-tertiary">
                  <HiOutlinePhoto className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-sm">No logo uploaded</p>
                </div>
              )}
            </div>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="Logo URL..."
              className="w-full px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white placeholder-dark-text-tertiary outline-none focus:border-primary-500/50 text-sm"
            />
          </div>
        </div>

        {/* Banner */}
        <div className="rounded-xl border border-dark-border bg-dark-surface-secondary p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <HiOutlinePhoto className="w-4 h-4 text-secondary-400" /> Event Banner
          </h3>
          <div className="space-y-3">
            <div className="w-full h-40 rounded-lg bg-dark-surface-tertiary border border-dark-border flex items-center justify-center overflow-hidden">
              {bannerUrl ? (
                <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-dark-text-tertiary">
                  <HiOutlinePhoto className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-sm">No banner uploaded</p>
                </div>
              )}
            </div>
            <input
              type="text"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="Banner URL..."
              className="w-full px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white placeholder-dark-text-tertiary outline-none focus:border-primary-500/50 text-sm"
            />
          </div>
        </div>

        {/* Background */}
        <div className="rounded-xl border border-dark-border bg-dark-surface-secondary p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <HiOutlinePhoto className="w-4 h-4 text-amber-400" /> Background Image
          </h3>
          <div className="space-y-3">
            <div className="w-full h-40 rounded-lg bg-dark-surface-tertiary border border-dark-border flex items-center justify-center overflow-hidden">
              {backgroundUrl ? (
                <img src={backgroundUrl} alt="Background" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-dark-text-tertiary">
                  <HiOutlinePhoto className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-sm">No background set</p>
                </div>
              )}
            </div>
            <input
              type="text"
              value={backgroundUrl}
              onChange={(e) => setBackgroundUrl(e.target.value)}
              placeholder="Background URL..."
              className="w-full px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white placeholder-dark-text-tertiary outline-none focus:border-primary-500/50 text-sm"
            />
          </div>
        </div>

        {/* Colors */}
        <div className="rounded-xl border border-dark-border bg-dark-surface-secondary p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <HiOutlinePaintBrush className="w-4 h-4 text-pink-400" /> Theme Colors
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-dark-text-tertiary mb-1.5">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border-2 border-dark-border cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white font-mono text-sm outline-none focus:border-primary-500/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-dark-text-tertiary mb-1.5">
                Secondary Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border-2 border-dark-border cursor-pointer"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white font-mono text-sm outline-none focus:border-primary-500/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sponsor */}
        <div className="rounded-xl border border-dark-border bg-dark-surface-secondary p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <HiOutlineBuildingOffice className="w-4 h-4 text-success-400" /> Sponsor Management
          </h3>
          <p className="text-dark-text-tertiary text-sm">
            Manage sponsors from the Sponsors page in the operator menu.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 rounded-lg bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 transition-colors"
        >
          {saved ? 'Saved!' : 'Save Branding'}
        </button>
      </div>
    </div>
  );
}
