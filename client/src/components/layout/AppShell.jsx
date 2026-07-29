import { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';

import useAuth from '../../hooks/useAuth';
import useOrg from '../../hooks/useOrg';
import { logoutUser } from '../../store/slices/authSlice';
import OrgSwitcher from './OrgSwitcher';

import NotificationBell from './NotificationBell';
import GlobalSearch from './GlobalSearch';

// ── Nav item definition ──────────────────────────────────────────
const NAV_ITEMS = [
  { icon: '🏠', label: 'Dashboard', to: '/app', end: true },
  { icon: '📋', label: 'Projects', to: '/app/projects', end: false },
  { icon: '✅', label: 'My Tasks', to: '/app/tasks', end: false },
  { icon: '📅', label: 'Calendar', to: '/app/calendar', end: false },
  { icon: '📊', label: 'Analytics', to: '/app/analytics', end: false },
  { icon: '🕐', label: 'Activity', to: '/app/activity', end: false },
];

function SidebarNavItem({ icon, label, to, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
          isActive
            ? 'bg-brand-500/15 text-brand-400 shadow-sm'
            : 'text-slate-400 hover:text-white hover:bg-surface-700/60'
        }`
      }
    >
      <span className="text-base w-5 text-center">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

export default function AppShell() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeOrg, userOrgRole, hasOrgs } = useOrg();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  // Sidebar content — shared between desktop and mobile drawer
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Org switcher */}
      <div className="px-4 py-4 border-b border-surface-700">
        <OrgSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
          Workspace
        </p>
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem key={item.to} {...item} />
        ))}

        <p className="px-3 mt-6 mb-2 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
          Settings
        </p>
        <NavLink
          to="/app/settings/organization"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              isActive
                ? 'bg-brand-500/15 text-brand-400'
                : 'text-slate-400 hover:text-white hover:bg-surface-700/60'
            }`
          }
        >
          <span className="text-base w-5 text-center">⚙️</span>
          <span>Org Settings</span>
        </NavLink>
      </nav>

      {/* Bottom user section */}
      <div className="p-4 border-t border-surface-700">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-lg overflow-hidden bg-surface-600 border border-surface-500 flex items-center justify-center text-sm font-bold text-brand-400 flex-shrink-0 cursor-pointer"
            onClick={() => navigate('/app/profile')}
            title="Profile"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user?.initials || '?'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate capitalize">{userOrgRole || '—'}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="text-slate-500 hover:text-white transition-colors text-xs flex-shrink-0"
          >
            ↪
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface-900">
      {/* ── Desktop Sidebar ─────────────────────────────────── */}
      <aside className="hidden lg:flex w-60 flex-shrink-0 flex-col bg-surface-800 border-r border-surface-700">
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar Drawer ────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-surface-800 border-r border-surface-700 z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-surface-700 bg-surface-900/80 backdrop-blur-md">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-400 hover:text-white transition-colors mr-3"
          >
            ☰
          </button>

          {/* Sprint Hive wordmark (mobile) */}
          <Link to="/app" className="lg:hidden flex items-center gap-2">
            <span className="text-base">🐝</span>
            <span className="text-sm font-bold">
              Sprint<span className="text-brand-400">Hive</span>
            </span>
          </Link>

          {/* Desktop: breadcrumb / page title area (filled by children via context in Phase 4+) */}
          <div className="hidden lg:block flex-1" />

          {/* Right: global search + notification bell + profile */}
          <div className="flex items-center gap-3 ml-auto">
            <GlobalSearch />
            <NotificationBell />
            <button
              onClick={() => navigate('/app/profile')}
              className="w-8 h-8 rounded-lg overflow-hidden bg-surface-600 border border-surface-600 hover:border-brand-500 transition-colors flex items-center justify-center text-sm font-bold text-brand-400"
              title="Profile"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.initials || '?'
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
