// ============================================================
// Enterprise Admin Layout — Sidebar + Header + Content
// ============================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useThemeContext } from '@contexts/ThemeContext';
import { DevelopmentModeBanner, useAuth } from '@features/auth';
import { useDashboardStore } from '@store/operator/dashboardStore';
import { AnimatePresence, motion } from 'framer-motion';
import {
  HiOutlineChartBar,
  HiOutlineUsers,
  HiOutlineQueueList,
  HiOutlineTrophy,
  HiOutlineCog6Tooth,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineBell,
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineMagnifyingGlass,
  HiOutlineCommandLine,
  HiOutlineArrowRightOnRectangle,
  HiOutlineArrowLeft,
  HiOutlineChevronDown,
} from 'react-icons/hi2';

// ─── Navigation Items ────────────────────────────────────────────────

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <HiOutlineChartBar className="w-5 h-5" /> },
  {
    label: 'Participants',
    path: '/dashboard/participants',
    icon: <HiOutlineUsers className="w-5 h-5" />,
  },
  { label: 'Prizes', path: '/dashboard/prizes', icon: <HiOutlineTrophy className="w-5 h-5" /> },
  { label: 'Queue', path: '/dashboard/queue', icon: <HiOutlineQueueList className="w-5 h-5" /> },
  { label: 'Winners', path: '/dashboard/winners', icon: <HiOutlineTrophy className="w-5 h-5" /> },
  {
    label: 'Settings',
    path: '/dashboard/settings',
    icon: <HiOutlineCog6Tooth className="w-5 h-5" />,
  },
];

// ─── Sidebar ─────────────────────────────────────────────────────────

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside
      className={`
        fixed top-0 left-0 z-40 h-screen
        bg-dark-surface-secondary border-r border-dark-border
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-dark-border">
        {!collapsed && (
          <span className="text-lg font-bold text-white tracking-tight">
            Radiant<span className="text-primary-400">Ops</span>
          </span>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-dark-text-tertiary hover:text-white hover:bg-dark-surface-tertiary transition-colors"
        >
          {collapsed ? (
            <HiOutlineBars3 className="w-5 h-5" />
          ) : (
            <HiOutlineXMark className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-4rem)]">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
                isActive
                  ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                  : 'text-dark-text-tertiary hover:text-white hover:bg-dark-surface-tertiary border border-transparent'
              }`
            }
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && (
              <>
                <span className="text-sm font-medium truncate">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto px-2 py-0.5 text-xs font-medium rounded-full bg-primary-500/20 text-primary-400">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

// ─── Notification Panel ──────────────────────────────────────────────

function NotificationPanel({ onClose: _onClose }: { onClose: () => void }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } =
    useDashboardStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 w-96 max-h-[480px] overflow-hidden rounded-xl border border-dark-border bg-dark-surface-secondary shadow-2xl shadow-black/40 z-50"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border">
        <h3 className="text-sm font-semibold text-white">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-primary-500/20 text-primary-400">
              {unreadCount}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={clearNotifications}
            className="text-xs text-dark-text-tertiary hover:text-white transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="overflow-y-auto max-h-[400px]">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-dark-text-tertiary text-sm">No notifications</div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => markAsRead(n.id)}
              className={`w-full text-left px-4 py-3 border-b border-dark-border/50 hover:bg-dark-surface-tertiary/50 transition-colors ${
                n.read ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                    n.type === 'error'
                      ? 'bg-danger-500'
                      : n.type === 'warning'
                        ? 'bg-warning-500'
                        : n.type === 'success'
                          ? 'bg-success-500'
                          : 'bg-primary-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{n.title}</p>
                  <p className="text-xs text-dark-text-tertiary mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-xs text-dark-text-tertiary/50 mt-1">
                    {new Date(n.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </motion.div>
  );
}

// ─── Command Palette ─────────────────────────────────────────────────

function CommandPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filteredItems = navItems.filter(
    (item) =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.path.toLowerCase().includes(query.toLowerCase()),
  );

  const handleSelect = useCallback(
    (path: string) => {
      navigate(path);
      onClose();
    },
    [navigate, onClose],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-lg rounded-xl border border-dark-border bg-dark-surface-secondary shadow-2xl shadow-black/40 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-dark-border">
          <HiOutlineMagnifyingGlass className="w-5 h-5 text-dark-text-tertiary" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, actions..."
            className="flex-1 bg-transparent text-white placeholder-dark-text-tertiary outline-none text-sm"
          />
          <kbd className="px-1.5 py-0.5 text-xs rounded bg-dark-surface-tertiary text-dark-text-tertiary">
            ESC
          </kbd>
        </div>
        <div className="max-h-64 overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="p-4 text-center text-dark-text-tertiary text-sm">No results found</div>
          ) : (
            filteredItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleSelect(item.path)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-dark-text-secondary hover:text-white hover:bg-dark-surface-tertiary transition-colors"
              >
                <span className="text-dark-text-tertiary">{item.icon}</span>
                <span>{item.label}</span>
                <span className="ml-auto text-xs text-dark-text-tertiary">{item.path}</span>
              </button>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Header ──────────────────────────────────────────────────────────

function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { isDark, toggleTheme } = useThemeContext();
  const { logout, user } = useAuth();
  const { stats, unreadCount } = useDashboardStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 h-16 border-b border-dark-border bg-dark-surface/80 backdrop-blur-xl">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          {/* Left */}
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg text-dark-text-tertiary hover:text-white hover:bg-dark-surface-tertiary transition-colors lg:hidden"
            >
              <HiOutlineBars3 className="w-5 h-5" />
            </button>

            {/* Connection Status */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-surface-tertiary/50">
              <span
                className={`w-2 h-2 rounded-full ${
                  stats.connectionStatus === 'connected'
                    ? 'bg-success-500 animate-pulse'
                    : stats.connectionStatus === 'reconnecting'
                      ? 'bg-warning-500'
                      : 'bg-danger-500'
                }`}
              />
              <span className="text-xs text-dark-text-secondary capitalize">
                {stats.connectionStatus}
              </span>
            </div>

            {/* TV Status */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-surface-tertiary/50">
              <span
                className={`w-2 h-2 rounded-full ${
                  stats.tvStatus === 'online'
                    ? 'bg-success-500'
                    : stats.tvStatus === 'standby'
                      ? 'bg-warning-500'
                      : 'bg-danger-500'
                }`}
              />
              <span className="text-xs text-dark-text-secondary">TV: {stats.tvStatus}</span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-dark-text-tertiary hover:text-white hover:bg-dark-surface-tertiary transition-colors border border-dark-border"
              title="Open lucky draw booth"
            >
              <HiOutlineArrowLeft className="w-4 h-4" />
              <span className="hidden sm:block">Booth</span>
            </button>

            {/* Command Palette Trigger */}
            <button
              onClick={() => setShowCommandPalette(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-dark-text-tertiary hover:text-white hover:bg-dark-surface-tertiary transition-colors border border-dark-border"
            >
              <HiOutlineCommandLine className="w-4 h-4" />
              <span>Search</span>
              <kbd className="px-1 py-0.5 rounded bg-dark-surface text-dark-text-tertiary text-[10px]">
                ⌘K
              </kbd>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-dark-text-tertiary hover:text-white hover:bg-dark-surface-tertiary transition-colors"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? (
                <HiOutlineSun className="w-5 h-5" />
              ) : (
                <HiOutlineMoon className="w-5 h-5" />
              )}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg text-dark-text-tertiary hover:text-white hover:bg-dark-surface-tertiary transition-colors relative"
              >
                <HiOutlineBell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center text-[10px] font-bold text-white bg-danger-500 rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <NotificationPanel onClose={() => setShowNotifications(false)} />
                )}
              </AnimatePresence>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-dark-surface-tertiary transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-xs font-bold text-white">
                  {user?.username.charAt(0).toUpperCase() ?? 'A'}
                </div>
                <span className="hidden sm:block text-sm text-white">
                  {user?.username ?? 'Admin'}
                </span>
                <HiOutlineChevronDown className="w-4 h-4 text-dark-text-tertiary" />
              </button>
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-dark-border bg-dark-surface-secondary shadow-2xl shadow-black/40 z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-dark-border">
                      <p className="text-sm font-medium text-white">{user?.username ?? 'Admin'}</p>
                      <p className="text-xs text-dark-text-tertiary">{user?.email ?? ''}</p>
                    </div>
                    <div className="p-1">
                      <button
                        onClick={() => {
                          navigate('/dashboard/settings');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-dark-text-secondary hover:text-white hover:bg-dark-surface-tertiary transition-colors"
                      >
                        <HiOutlineCog6Tooth className="w-4 h-4" />
                        Settings
                      </button>
                      <button
                        onClick={() => {
                          void handleLogout();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-danger-400 hover:text-danger-300 hover:bg-danger-500/10 transition-colors"
                      >
                        <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Command Palette Overlay */}
      <AnimatePresence>
        {showCommandPalette && <CommandPalette onClose={() => setShowCommandPalette(false)} />}
      </AnimatePresence>
    </>
  );
}

// ─── Main Layout ─────────────────────────────────────────────────────

export default function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-dark-surface">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="p-4 lg:p-6">
          <div className="mb-4">
            <DevelopmentModeBanner />
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
