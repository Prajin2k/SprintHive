import { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Calendar,
  BarChart2,
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Crown,
  BriefcaseBusiness,
  Users,
  Code2,
  ShieldCheck,
} from 'lucide-react';

import useAuth from '../../hooks/useAuth';
import useOrg from '../../hooks/useOrg';
import { logoutUser } from '../../store/slices/authSlice';
import OrgSwitcher from './OrgSwitcher';
import NotificationBell from './NotificationBell';
import GlobalSearch from './GlobalSearch';
import logoIcon from '../../assets/logo_icon.png';

/* ── Sidebar role badge config ────────────────────────────────────── */
const SIDEBAR_ROLE = {
  owner:     { Icon: Crown,            label: 'Owner',     cls: 'text-purple-400' },
  manager:   { Icon: BriefcaseBusiness, label: 'Manager',   cls: 'text-blue-400'   },
  teamlead:  { Icon: Users,            label: 'Team Lead',  cls: 'text-indigo-400' },
  developer: { Icon: Code2,            label: 'Developer',  cls: 'text-emerald-400'},
  tester:    { Icon: ShieldCheck,      label: 'Tester',     cls: 'text-amber-400'  },
};

/* ── Nav item definition ──────────────────────────────────────────── */
const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',  to: '/app',           end: true },
  { icon: FolderKanban,    label: 'Projects',   to: '/app/projects',  end: false },
  { icon: CheckSquare,     label: 'My Tasks',   to: '/app/tasks',     end: false },
  { icon: Calendar,        label: 'Calendar',   to: '/app/calendar',  end: false },
  { icon: BarChart2,       label: 'Analytics',  to: '/app/analytics', end: false },
  { icon: Activity,        label: 'Activity',   to: '/app/activity',  end: false },
];

function SidebarNavItem({ icon: Icon, label, to, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
          isActive
            ? 'bg-brand-500/15 text-white border border-brand-500/20 shadow-sm'
            : 'text-surface-300 hover:text-white hover:bg-surface-800'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={17} className={isActive ? 'text-brand-400' : 'text-surface-400 group-hover:text-surface-200'} />
          <span>{label}</span>
          {isActive && <ChevronRight size={14} className="ml-auto text-brand-500/50" />}
        </>
      )}
    </NavLink>
  );
}

export default function AppShell() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeOrg, userOrgRole } = useOrg();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  /* Sidebar content — shared between desktop and mobile drawer */
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo area */}
      <div className="px-4 pt-5 pb-3 flex items-center gap-2.5 flex-shrink-0">
        <img src={logoIcon} alt="Sprint Hive" className="w-8 h-8 object-contain flex-shrink-0" />
        <span className="font-bold text-sm text-white tracking-tight">
          Sprint<span className="text-brand-400">Hive</span>
        </span>
      </div>

      {/* Org switcher */}
      <div className="px-3 pb-3 flex-shrink-0 border-b border-surface-600">
        <OrgSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-bold text-surface-500 uppercase tracking-widest">
          Workspace
        </p>
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem key={item.to} {...item} />
        ))}

        <div className="my-4 border-t border-surface-700" />

        <p className="px-3 mb-2 text-[10px] font-bold text-surface-500 uppercase tracking-widest">
          Settings
        </p>
        <NavLink
          to="/app/settings/organization"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
              isActive
                ? 'bg-brand-500/15 text-white border border-brand-500/20'
                : 'text-surface-300 hover:text-white hover:bg-surface-800'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Settings size={17} className={isActive ? 'text-brand-400' : 'text-surface-400 group-hover:text-surface-200'} />
              <span>Org Settings</span>
            </>
          )}
        </NavLink>
      </nav>

      {/* Bottom user section */}
      <div className="p-3 border-t border-surface-600 flex-shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-surface-800 transition-colors group cursor-pointer"
             onClick={() => navigate('/app/profile')}>
          {/* Avatar */}
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-sm font-bold text-brand-300 flex-shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user?.initials || '?'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            {/* Role badge */}
            {(() => {
              const roleKey = userOrgRole?.toLowerCase();
              const roleMeta = roleKey && SIDEBAR_ROLE[roleKey];
              if (!roleMeta) return (
                <p className="text-[10px] text-surface-400 truncate capitalize">{userOrgRole || '—'}</p>
              );
              const { Icon: RoleIcon, label, cls } = roleMeta;
              return (
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${cls} mt-0.5`}>
                  <RoleIcon size={10} strokeWidth={2.5} />
                  {label}
                </span>
              );
            })()}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleLogout(); }}
            title="Sign out"
            className="text-surface-500 hover:text-red-400 transition-colors flex-shrink-0 p-1 rounded-lg hover:bg-red-500/10"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface-900">
      {/* ── Desktop Sidebar ─────────────────────────────────── */}
      <aside className="hidden lg:flex w-60 flex-shrink-0 flex-col border-r border-surface-600"
             style={{ background: '#0F172A' }}>
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar Drawer ────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 border-r border-surface-600 z-10 animate-slide-down"
                 style={{ background: '#0F172A' }}>
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-surface-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-surface-600"
                style={{ background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(12px)' }}>
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-surface-300 hover:text-white transition-colors mr-3 p-1.5 rounded-lg hover:bg-surface-800"
          >
            <Menu size={20} />
          </button>

          {/* Sprint Hive wordmark (mobile) */}
          <Link to="/app" className="lg:hidden flex items-center gap-2">
            <img src={logoIcon} alt="Sprint Hive" className="w-6 h-6 object-contain" />
            <span className="text-sm font-bold">
              Sprint<span className="text-brand-400">Hive</span>
            </span>
          </Link>

          {/* Desktop: spacer */}
          <div className="hidden lg:block flex-1" />

          {/* Right: global search + notification bell + profile */}
          <div className="flex items-center gap-2.5 ml-auto">
            <GlobalSearch />
            <NotificationBell />
            <button
              onClick={() => navigate('/app/profile')}
              className="w-8 h-8 rounded-lg overflow-hidden bg-brand-500/20 border border-brand-500/30 hover:border-brand-400 transition-all duration-150 flex items-center justify-center text-sm font-bold text-brand-300"
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
