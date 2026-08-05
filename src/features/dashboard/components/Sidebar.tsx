/**
 * Enterprise Admin Dashboard — Sidebar
 *
 * M2.3A — Premium navigation sidebar. Dashboard, Participants, Prizes,
 * Lucky Draw, Queue, Winners, Analytics, Reports, Settings.
 */

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import {
  HiOutlineChartBar,
  HiOutlineUsers,
  HiOutlineTrophy,
  HiOutlineQueueList,
  HiOutlineStar,
  HiOutlineCog6Tooth,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineArrowLeft,
} from 'react-icons/hi2';
import { colors, radius, shadows, transitions } from '@design-system/index';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: HiOutlineChartBar },
  { label: 'Participants', path: '/dashboard/participants', icon: HiOutlineUsers },
  { label: 'Prizes', path: '/dashboard/prizes', icon: HiOutlineTrophy },
  { label: 'Queue', path: '/dashboard/queue', icon: HiOutlineQueueList },
  { label: 'Winners', path: '/dashboard/winners', icon: HiOutlineStar },
  { label: 'Settings', path: '/dashboard/settings', icon: HiOutlineCog6Tooth },
];

export const Sidebar = memo(function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      className="relative z-30 flex h-full flex-col border-r backdrop-blur-xl"
      style={{
        background: colors.glass.dark,
        borderColor: colors.glass.line,
        width: collapsed ? '4.5rem' : '16rem',
      }}
      animate={{ width: collapsed ? '4.5rem' : '16rem' }}
      transition={transitions.luxury()}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-between px-4 py-5"
        style={{ borderBottom: `1px solid ${colors.glass.line}` }}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                background: colors.gradient.blueToGold,
                boxShadow: shadows.glow.blue.sm,
              }}
            >
              <HiOutlineTrophy className="h-4 w-4" style={{ color: colors.text.primary }} />
            </div>
            <span
              className="text-sm font-bold tracking-tight"
              style={{ color: colors.text.primary }}
            >
              Radiant<span style={{ color: colors.gold[400] }}>Ops</span>
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="rounded-lg p-1.5 transition-colors"
          style={{ color: colors.text.tertiary }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <HiOutlineBars3 className="h-5 w-5" />
          ) : (
            <HiOutlineXMark className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.label} to={item.path} end={item.path === '/dashboard'}>
              {({ isActive }) => (
                <motion.span
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"
                  style={{
                    background: isActive ? `${colors.brand[500]}1a` : 'transparent',
                    color: isActive ? colors.brand[300] : colors.text.secondary,
                    border: `1px solid ${isActive ? `${colors.brand[500]}33` : 'transparent'}`,
                    borderRadius: radius.card,
                  }}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={transitions.luxury(index * 0.04)}
                  whileHover={{ x: 4 }}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span className="truncate text-sm font-medium">{item.label}</span>}
                </motion.span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4" style={{ borderTop: `1px solid ${colors.glass.line}` }}>
        <NavLink
          to="/"
          className="flex items-center gap-2 text-[10px] uppercase tracking-widest transition-colors"
          style={{ color: colors.text.tertiary }}
        >
          <HiOutlineArrowLeft className="h-4 w-4" />
          {!collapsed && <span>Lucky Draw Booth</span>}
        </NavLink>
      </div>
    </motion.aside>
  );
});
