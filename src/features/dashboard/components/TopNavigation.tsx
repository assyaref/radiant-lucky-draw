/**
 * Enterprise Admin Dashboard — TopNavigation
 *
 * M2.3A — Company, Search, Notifications, Dark Mode, Current User,
 * Current Time.
 */

import { memo, useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineBell,
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineChevronDown,
  HiOutlineArrowRightOnRectangle,
} from 'react-icons/hi2';
import { colors, radius, shadows, transitions } from '@design-system/index';
import { useThemeContext } from '@contexts/ThemeContext';
import { useAuth } from '@features/auth';

export const TopNavigation = memo(function TopNavigation() {
  const { isDark, toggleTheme } = useThemeContext();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = now.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <motion.header
      className="flex items-center justify-between gap-4 border-b px-5 py-3 backdrop-blur-xl"
      style={{
        background: colors.glass.dark,
        borderColor: colors.glass.line,
      }}
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitions.luxury()}
    >
      {/* Company */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold tracking-tight" style={{ color: colors.text.primary }}>
          Radiant<span style={{ color: colors.gold[400] }}>Lucky Draw</span>
        </span>
        <span
          className="hidden rounded-full px-2 py-0.5 text-[10px] font-semibold sm:inline"
          style={{ color: colors.brand[300], background: `${colors.brand[500]}1a` }}
        >
          Enterprise
        </span>
      </div>

      {/* Search */}
      <div
        className="hidden flex-1 max-w-md items-center gap-2 rounded-xl border px-3 py-2 md:flex"
        style={{
          background: colors.glass.light,
          borderColor: colors.glass.line,
          borderRadius: radius.card,
        }}
      >
        <HiOutlineMagnifyingGlass className="h-4 w-4" style={{ color: colors.text.tertiary }} />
        <input
          type="text"
          placeholder="Search..."
          className="w-full bg-transparent text-sm outline-none"
          style={{ color: colors.text.primary }}
        />
        <kbd
          className="rounded px-1.5 py-0.5 text-[10px]"
          style={{ background: colors.glass.lighter, color: colors.text.tertiary }}
        >
          ⌘K
        </kbd>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Current time */}
        <div className="hidden flex-col items-end lg:flex">
          <span
            className="text-sm font-semibold tabular-nums"
            style={{ color: colors.text.primary }}
          >
            {timeString}
          </span>
          <span className="text-[10px]" style={{ color: colors.text.tertiary }}>
            {dateString}
          </span>
        </div>

        {/* Notifications */}
        <button
          className="relative rounded-lg p-2 transition-colors"
          style={{ color: colors.text.secondary }}
          aria-label="Notifications"
        >
          <HiOutlineBell className="h-5 w-5" />
          <span
            className="absolute right-1 top-1 flex h-2 w-2 rounded-full"
            style={{
              background: colors.status.disconnected,
              boxShadow: `0 0 6px ${colors.status.disconnected}`,
            }}
          />
        </button>

        {/* Dark mode */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 transition-colors"
          style={{ color: colors.text.secondary }}
          aria-label="Toggle dark mode"
        >
          {isDark ? (
            <HiOutlineSun className="h-5 w-5" style={{ color: colors.gold[400] }} />
          ) : (
            <HiOutlineMoon className="h-5 w-5" />
          )}
        </button>

        {/* Current user */}
        <button
          className="flex items-center gap-2 rounded-xl border px-2 py-1.5"
          style={{ borderColor: colors.glass.line, background: colors.glass.light }}
        >
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
            style={{
              background: colors.gradient.blueToGold,
              color: colors.text.primary,
              boxShadow: shadows.glow.blue.sm,
            }}
          >
            A
          </div>
          <span
            className="hidden text-sm font-medium sm:block"
            style={{ color: colors.text.primary }}
          >
            {user?.username ?? 'Admin'}
          </span>
          <HiOutlineChevronDown className="h-4 w-4" style={{ color: colors.text.tertiary }} />
        </button>
        <button
          onClick={() => void handleLogout()}
          className="rounded-lg p-2 transition-colors"
          style={{ color: colors.text.secondary }}
          aria-label="Sign out"
          title="Sign out"
        >
          <HiOutlineArrowRightOnRectangle className="h-5 w-5" />
        </button>
      </div>
    </motion.header>
  );
});
