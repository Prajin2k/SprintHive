import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { initAuth } from './store/slices/authSlice';
import { fetchMyOrgs } from './store/slices/orgSlice';
import useAuth from './hooks/useAuth';
import useOrg from './hooks/useOrg';

// Public pages
import LandingPage from './pages/LandingPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

// Auth pages
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx';
import VerifyEmailPage from './pages/auth/VerifyEmailPage.jsx';

// App pages
import AppShell from './components/layout/AppShell.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import ProfilePage from './pages/app/ProfilePage.jsx';
import OnboardingPage from './pages/app/OnboardingPage.jsx';
import OrgSettingsPage from './pages/app/OrgSettingsPage.jsx';
import AcceptInvitePage from './pages/app/AcceptInvitePage.jsx';

import DashboardPage from './pages/app/DashboardPage.jsx';
import ProjectListPage from './pages/app/ProjectListPage.jsx';
import ProjectDetailPage from './pages/app/ProjectDetailPage.jsx';
import CalendarPage from './pages/app/CalendarPage.jsx';
import AnalyticsPage from './pages/app/AnalyticsPage.jsx';
import ActivityPage from './pages/app/ActivityPage.jsx';
import SettingsPage from './pages/app/SettingsPage.jsx';

import { socket } from './services/socket';

// ── Guest Route — redirect authenticated users away from auth pages ──
function GuestRoute({ children }) {
  const { isAuthenticated, isInitialized } = useAuth();
  if (!isInitialized) return null;
  if (isAuthenticated) return <Navigate to="/app" replace />;
  return children;
}

// ── App shell wrapper with org loading ─────────────────────────
function AppWithOrgs() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useAuth();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const { activeOrg } = useOrg();

 useEffect(() => {
  console.log("isAuthenticated:", isAuthenticated);
  console.log("accessToken:", accessToken);

  if (isAuthenticated && accessToken) {
    console.log("Calling fetchMyOrgs...");
    dispatch(fetchMyOrgs());
  }
}, [isAuthenticated, accessToken, dispatch]);

  useEffect(() => {
    if (isAuthenticated && user && accessToken) {
      socket.auth = {
        token: accessToken,
        orgId: activeOrg?._id || undefined,
      };
      if (socket.connected) {
        socket.disconnect();
      }
      socket.connect();
      return () => socket.disconnect();
    }
  }, [isAuthenticated, user, accessToken, activeOrg?._id]);

  return <AppShell />;
}

export default function App() {
  const dispatch = useDispatch();

  // Restore session from httpOnly cookie on every page load
  useEffect(() => {
    dispatch(initAuth());
  }, [dispatch]);
 
  return (
    <Routes>
      {/* ── Public ────────────────────────────────────────── */}
      <Route path="/" element={<LandingPage />} />

      {/* ── Auth (guest only) ─────────────────────────────── */}
      <Route path="/login"             element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register"          element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/forgot-password"   element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/verify-email/:token"   element={<VerifyEmailPage />} />

      {/* ── Invite acceptance (public + authenticated) ──────── */}
      <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />

      {/* ── Standalone protected pages (own layout) ─────────── */}
      <Route path="/app/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/app/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

      {/* ── App Shell + nested routes ─────────────────────── */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppWithOrgs />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="settings/organization" element={<OrgSettingsPage />} />
        <Route path="projects" element={<ProjectListPage />} />
        <Route path="projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="tasks" element={<div className="p-8 text-white">My Tasks — coming soon</div>} />
      </Route>

      {/* ── 404 ──────────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
