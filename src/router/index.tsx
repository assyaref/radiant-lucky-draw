import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet, type RouteObject } from 'react-router-dom';
import { ProtectedRoute } from '@features/auth';

function LazyPage({ Component }: { Component: React.LazyExoticComponent<React.ComponentType> }) {
  return (
    <Suspense fallback={<div className="flex-center min-h-screen">Loading...</div>}>
      <Component />
    </Suspense>
  );
}

const Home = lazy(() => import('@pages/Home'));
const Login = lazy(() => import('@pages/Login'));
const Register = lazy(() => import('@pages/Register'));
const Draws = lazy(() => import('@pages/Draws'));
const DrawDetail = lazy(() => import('@pages/DrawDetail'));
const DrawCreate = lazy(() => import('@pages/DrawCreate'));
const DrawEdit = lazy(() => import('@pages/DrawEdit'));
const NotFound = lazy(() => import('@pages/NotFound'));
const RegistrationPage = lazy(() => import('@pages/registration/RegistrationPage'));
const QueueTVPage = lazy(() => import('@pages/queue/QueueTVPage'));
const OperatorPage = lazy(() => import('@pages/queue/OperatorPage'));
const LiveTVPage = lazy(() => import('@pages/live-tv/LiveTVPage'));
const PrizeManagement = lazy(() => import('@pages/PrizeManagement'));
const EnterpriseDashboard = lazy(() =>
  import('@features/dashboard/DashboardPage').then(({ DashboardPage }) => ({
    default: DashboardPage,
  })),
);

// ─── Operator Pages ──────────────────────────────────────────────────
const AdminLayout = lazy(() => import('@layouts/AdminLayout'));
const OperatorDashboard = lazy(() => import('@pages/operator/DashboardPage'));
const OperatorParticipants = lazy(() => import('@pages/operator/ParticipantsPage'));
const OperatorQueue = lazy(() => import('@pages/operator/QueuePage'));
const OperatorDraws = lazy(() => import('@pages/operator/DrawsPage'));
const OperatorPrizes = lazy(() => import('@pages/operator/PrizesPage'));
const OperatorSponsors = lazy(() => import('@pages/operator/SponsorsPage'));
const OperatorAnnouncements = lazy(() => import('@pages/operator/AnnouncementsPage'));
const OperatorReports = lazy(() => import('@pages/operator/ReportsPage'));
const OperatorSettings = lazy(() => import('@pages/operator/SettingsPage'));
const OperatorUsers = lazy(() => import('@pages/operator/UsersPage'));
const OperatorAuditLogs = lazy(() => import('@pages/operator/AuditLogsPage'));

// ─── Booth Enterprise Pages ───────────────────────────────────────────
const PublicBoothPage = lazy(() => import('@pages/booth/PublicBoothPage'));
const BoothParticipantsPage = lazy(() => import('@pages/booth/BoothParticipantsPage'));
const BoothWinnersPage = lazy(() => import('@pages/booth/BoothWinnersPage'));
const WinnerWall = lazy(() => import('@pages/WinnerWallPage'));

// ─── M3.3 Event Ready Pages ──────────────────────────────────────────
const EventConfigPage = lazy(() => import('@pages/operator/EventConfigPage'));
const BrandingSettingsPage = lazy(() => import('@pages/operator/BrandingSettingsPage'));
const MonitoringPage = lazy(() => import('@pages/operator/MonitoringPage'));
const BoothKioskPage = lazy(() => import('@pages/booth/BoothKioskPage'));

const routes: RouteObject[] = [
  // ─── Dashboard Routes ─────────────────────────────────────────────
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Outlet />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <LazyPage Component={EnterpriseDashboard} /> },
      {
        element: (
          <Suspense
            fallback={<div className="flex-center min-h-screen bg-dark-surface">Loading...</div>}
          >
            <AdminLayout />
          </Suspense>
        ),
        children: [
          { path: 'participants', element: <LazyPage Component={BoothParticipantsPage} /> },
          { path: 'prizes', element: <LazyPage Component={OperatorPrizes} /> },
          { path: 'queue', element: <LazyPage Component={OperatorQueue} /> },
          { path: 'winners', element: <LazyPage Component={BoothWinnersPage} /> },
          { path: 'settings', element: <LazyPage Component={OperatorSettings} /> },
        ],
      },
    ],
  },
  // ─── Operator Routes ──────────────────────────────────────────────
  {
    path: '/operator',
    element: (
      <ProtectedRoute>
        <Suspense
          fallback={<div className="flex-center min-h-screen bg-dark-surface">Loading...</div>}
        >
          <AdminLayout />
        </Suspense>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <LazyPage Component={OperatorDashboard} /> },
      { path: 'participants', element: <LazyPage Component={OperatorParticipants} /> },
      { path: 'queue', element: <LazyPage Component={OperatorQueue} /> },
      { path: 'draws', element: <LazyPage Component={OperatorDraws} /> },
      { path: 'prizes', element: <LazyPage Component={OperatorPrizes} /> },
      { path: 'sponsors', element: <LazyPage Component={OperatorSponsors} /> },
      { path: 'announcements', element: <LazyPage Component={OperatorAnnouncements} /> },
      { path: 'reports', element: <LazyPage Component={OperatorReports} /> },
      { path: 'settings', element: <LazyPage Component={OperatorSettings} /> },
      { path: 'users', element: <LazyPage Component={OperatorUsers} /> },
      { path: 'audit-logs', element: <LazyPage Component={OperatorAuditLogs} /> },
      { path: 'event-config', element: <LazyPage Component={EventConfigPage} /> },
      { path: 'branding', element: <LazyPage Component={BrandingSettingsPage} /> },
      { path: 'monitoring', element: <LazyPage Component={MonitoringPage} /> },
    ],
  },
  // ─── Public Routes ────────────────────────────────────────────────
  {
    path: '/',
    element: <LazyPage Component={Home} />,
  },
  {
    path: '/login',
    element: <LazyPage Component={Login} />,
  },
  {
    path: '/register',
    element: <LazyPage Component={Register} />,
  },
  {
    path: '/registration',
    element: <LazyPage Component={RegistrationPage} />,
  },
  {
    path: '/booth',
    element: <LazyPage Component={PublicBoothPage} />,
  },

  {
    path: '/queue/tv',
    element: <LazyPage Component={QueueTVPage} />,
  },
  {
    path: '/queue/operator',
    element: <LazyPage Component={OperatorPage} />,
  },
  {
    path: '/live-tv',
    element: <LazyPage Component={LiveTVPage} />,
  },
  {
    path: '/winner-wall',
    element: <LazyPage Component={WinnerWall} />,
  },
  {
    path: '/booth-kiosk',
    element: <LazyPage Component={BoothKioskPage} />,
  },
  {
    path: '/prizes',
    element: <LazyPage Component={PrizeManagement} />,
  },
  {
    path: '/draws',
    children: [
      {
        index: true,
        element: <LazyPage Component={Draws} />,
      },
      {
        path: ':id',
        element: <LazyPage Component={DrawDetail} />,
      },
      {
        path: 'create',
        element: <LazyPage Component={DrawCreate} />,
      },
      {
        path: ':id/edit',
        element: <LazyPage Component={DrawEdit} />,
      },
    ],
  },
  {
    path: '*',
    element: <LazyPage Component={NotFound} />,
  },
];

export const router = createBrowserRouter(routes);
