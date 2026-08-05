import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import useAuth from '../hooks/useAuth';
import { initAuth } from '../store/slices/authSlice';
import { fetchMyOrgs } from '../store/slices/orgSlice';
import logoIcon from '../assets/logo_icon.png';
import heroImg from '../assets/herodashboard.png';
import {
  Zap,
  Flag,
  Bug,
  BarChart2,
  Calendar,
  Bell,
  MessageSquare,
  Shield,
  Building2,
  ArrowRight,
  Check,
  Star,
  Menu,
  X,
  FolderKanban,
  Crown,
  UserCheck,
  Target,
  Code2,
  TestTube2,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';

/* ─── Data ─────────────────────────────────────────────────────── */

const features = [
  {
    icon: Zap,
    color: 'brand',
    title: 'Lightning-fast Kanban',
    desc: 'Drag-and-drop task boards with real-time synchronisation across every team member. Columns map 1-to-1 with your sprint workflow.',
    tags: ['Drag & Drop', 'Real-time', 'DnD Kit'],
  },
  {
    icon: Flag,
    color: 'blue',
    title: 'Sprint Planning',
    desc: 'Create time-boxed sprints, assign tasks, set goals, and track velocity. Built-in burndown tracking keeps the team on schedule.',
    tags: ['Sprints', 'Velocity', 'Burndown'],
  },
  {
    icon: Bug,
    color: 'red',
    title: 'Bug Tracker',
    desc: 'Report, triage, and resolve bugs without leaving your workspace. Priority levels, reproducibility fields, and status workflows.',
    tags: ['Bug Reports', 'Priority', 'Triage'],
  },
  {
    icon: BarChart2,
    color: 'green',
    title: 'Analytics & Reports',
    desc: 'Velocity charts, task-completion trends, and member contribution breakdowns. Export any project as a formatted PDF report.',
    tags: ['Recharts', 'PDF Export', 'Insights'],
  },
  {
    icon: Calendar,
    color: 'purple',
    title: 'Calendar View',
    desc: 'See every sprint and task deadline on a full-month or week calendar. Drag-to-reschedule and click-to-create out of the box.',
    tags: ['Calendar', 'Timeline', 'Scheduling'],
  },
  {
    icon: Bell,
    color: 'yellow',
    title: 'Real-time Notifications',
    desc: 'Socket.io powers live in-app notifications the moment a task is assigned, commented on, or moved.',
    tags: ['Socket.io', 'Live Updates', 'Push'],
  },
  {
    icon: MessageSquare,
    color: 'cyan',
    title: 'Task Comments & Files',
    desc: 'Threaded comments and file attachments on every task card. Drag files directly into a task card.',
    tags: ['Comments', 'Attachments', 'Files'],
  },
  {
    icon: Shield,
    color: 'indigo',
    title: 'Role-based Access',
    desc: 'Granular organisational roles — Owner, Manager, Team Lead, Developer, Tester. Each role controls what members can view and manage.',
    tags: ['RBAC', 'Permissions', 'Multi-role'],
  },
  {
    icon: Building2,
    color: 'teal',
    title: 'Multi-org Workspaces',
    desc: 'Create multiple organisations, each with their own projects, members, and settings. Invite collaborators by email.',
    tags: ['Multi-org', 'Invites', 'Workspaces'],
  },
];

const workflow = [
  {
    step: '01',
    title: 'Create your Organisation',
    desc: 'Register an account, set up your organisation, and invite teammates by email. Assign roles at invite time.',
  },
  {
    step: '02',
    title: 'Set up Projects',
    desc: 'Each organisation can have multiple projects. Projects hold sprints, tasks, bugs, and reports — all permission-controlled.',
  },
  {
    step: '03',
    title: 'Plan Sprints & Tasks',
    desc: 'Create a sprint with start/end dates, drag tasks from the backlog, set priorities, assignees, and due dates via the Kanban board.',
  },
  {
    step: '04',
    title: 'Track & Ship',
    desc: 'Watch real-time status changes roll in via Socket.io, triage bugs, review analytics, and export PDF reports for stakeholders.',
  },
];

const colorMap = {
  brand:  { icon: 'bg-brand-500/15 text-brand-400 border border-brand-500/25',  tag: 'bg-brand-500/15 text-brand-300' },
  blue:   { icon: 'bg-blue-500/15 text-blue-400 border border-blue-500/25',     tag: 'bg-blue-500/15 text-blue-300' },
  red:    { icon: 'bg-red-500/15 text-red-400 border border-red-500/25',        tag: 'bg-red-500/15 text-red-300' },
  green:  { icon: 'bg-green-500/15 text-green-400 border border-green-500/25',  tag: 'bg-green-500/15 text-green-300' },
  purple: { icon: 'bg-purple-500/15 text-purple-400 border border-purple-500/25', tag: 'bg-purple-500/15 text-purple-300' },
  yellow: { icon: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25', tag: 'bg-yellow-500/15 text-yellow-300' },
  cyan:   { icon: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25',     tag: 'bg-cyan-500/15 text-cyan-300' },
  indigo: { icon: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25', tag: 'bg-indigo-500/15 text-indigo-300' },
  teal:   { icon: 'bg-teal-500/15 text-teal-400 border border-teal-500/25',     tag: 'bg-teal-500/15 text-teal-300' },
};

/* ─── Navbar ─────────────────────────────────────────────────────── */
function Navbar() {
  const { isAuthenticated, isInitialized } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [gotoLoading, setGotoLoading] = useState(false);

  const handleGoToWorkspace = async () => {
    // Prevent double clicks
    if (gotoLoading) return;
    setGotoLoading(true);
    try {
      // Ensure auth is initialized / attempt session restore if needed
      if (!isInitialized || !isAuthenticated) {
        try {
          await dispatch(initAuth()).unwrap();
        } catch (err) {
          // No active session, redirect to login
          setGotoLoading(false);
          navigate('/login');
          return;
        }
      }

      // At this point the user is authenticated — fetch organizations and wait
      try {
        const orgsRes = await dispatch(fetchMyOrgs()).unwrap();
        const orgs = orgsRes?.orgs || [];
        if (!orgs.length) {
          navigate('/app/onboarding');
        } else {
          navigate('/app');
        }
      } catch (err) {
        // If orgs load fails, fall back to app; the app shell will surface errors
        console.error('Failed to load organizations on Go to Workspace:', err);
        navigate('/app');
      }
    } finally {
      setGotoLoading(false);
    }
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08]"
      style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(20px)' }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Brand mark: transparent logo icon + text mark */}
        <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
          <img
            src={logoIcon}
            alt="Sprint Hive"
            className="w-8 h-8 object-contain flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
          />
          <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1">
            Sprint<span className="bg-gradient-to-r from-brand-400 via-secondary-400 to-accent-400 bg-clip-text text-transparent">Hive</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8 text-sm text-surface-300">
          <a href="#features" className="hover:text-white transition-colors duration-150 font-medium">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors duration-150 font-medium">How it works</a>
          <a href="#roles" className="hover:text-white transition-colors duration-150 font-medium">Roles</a>
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          {isInitialized && isAuthenticated ? (
            <button
              type="button"
              onClick={handleGoToWorkspace}
              disabled={gotoLoading}
              className={`btn-primary btn-sm ${gotoLoading ? 'opacity-70 pointer-events-none' : ''}`}
            >
              {gotoLoading ? 'Loading…' : 'Go to Workspace'} {gotoLoading ? null : <ArrowRight size={14} />}
            </button>
          ) : (
            <>
              <Link to="/login" className="btn-ghost btn-sm">Log in</Link>
              <Link to="/register" className="btn-primary btn-sm">
                Get Started Free <ArrowRight size={14} />
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-surface-300 hover:text-white transition-colors p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden border-t border-white/[0.08] px-6 py-5 space-y-4 animate-slide-down"
          style={{ background: 'rgba(15, 23, 42, 0.98)' }}
        >
          <a href="#features" className="block text-sm text-surface-300 hover:text-white transition-colors" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#how-it-works" className="block text-sm text-surface-300 hover:text-white transition-colors" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#roles" className="block text-sm text-surface-300 hover:text-white transition-colors" onClick={() => setMenuOpen(false)}>Roles</a>
          <div className="pt-4 border-t border-surface-700 flex flex-col gap-3">
            {isInitialized && isAuthenticated ? (
              <button onClick={handleGoToWorkspace} disabled={gotoLoading} className={`btn-primary w-full justify-center ${gotoLoading ? 'opacity-70 pointer-events-none' : ''}`}>
                {gotoLoading ? 'Loading…' : 'Go to Workspace'}
              </button>
            ) : (
              <>
                <Link to="/login" className="btn-ghost w-full justify-center">Log in</Link>
                <Link to="/register" className="btn-primary w-full justify-center">Get Started Free</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

/* ─── Hero Section ───────────────────────────────────────────────── */
function HeroSection() {
  const { isAuthenticated, isInitialized } = useAuth();

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-20 overflow-hidden bg-mesh">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[150px] opacity-25"
          style={{ background: 'radial-gradient(circle, rgba(91,95,255,0.4) 0%, rgba(124,58,237,0.2) 50%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12 lg:gap-16">
          {/* Left Column: Heading & Value Proposition */}
          <div className="text-left animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-xs font-semibold mb-6 tracking-wide">
              <Sparkles size={13} className="text-brand-400" />
              <span>Sprint Hive 2.0 — Engineering OS</span>
            </div>

            <h1 className="text-4xl md:text-5xl xl:text-6xl font-black leading-[1.1] tracking-tight mb-6 text-white">
              Ship sprints <br />
              <span className="bg-gradient-to-r from-brand-400 via-secondary-400 to-accent-400 bg-clip-text text-transparent">
                faster with clarity.
              </span>
            </h1>

            <p className="text-surface-300 text-base md:text-lg max-w-lg mb-8 leading-relaxed">
              A high-performance project management platform built for modern engineering teams.
              Kanban boards, sprint planning, bug triage, real-time sync, and PDF analytics.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              {isInitialized && isAuthenticated ? (
                <Link to="/app" className="btn-primary btn-lg justify-center">
                  Go to Workspace <ArrowRight size={18} />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn-primary btn-lg justify-center">
                    Create Free Workspace <ArrowRight size={18} />
                  </Link>
                  <Link to="/login" className="btn-ghost btn-lg justify-center">
                    Sign In
                  </Link>
                </>
              )}
            </div>

            {/* Social proof */}
            <div className="mt-10 flex items-center gap-4 pt-6 border-t border-white/[0.06]">
              <div className="flex -space-x-2">
                {['#5B5FFF', '#7C3AED', '#22D3EE', '#22C55E', '#F59E0B'].map((c, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-surface-900 flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                    style={{ background: c }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <p className="text-surface-400 text-xs font-medium">
                Trusted by agile engineering teams worldwide
              </p>
            </div>
          </div>

          {/* Right Column: Centered Responsive Hero Image Container */}
          <div className="relative flex items-center justify-center animate-float">
            <div
              className="absolute inset-0 rounded-3xl blur-[50px] opacity-25"
              style={{ background: 'linear-gradient(135deg, rgba(91,95,255,0.4), rgba(34,211,238,0.3))' }}
            />
            <div className="relative w-full max-w-[560px] p-2 bg-surface-800/80 border border-surface-600 rounded-2xl shadow-2xl backdrop-blur-md">
              <img
                src={heroImg}
                alt="Sprint Hive Dashboard Interface"
                className="w-full h-auto max-h-[480px] object-contain rounded-xl mx-auto block"
              />
            </div>
          </div>
        </div>

        {/* Feature Highlights Bar */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: FolderKanban, label: 'Kanban Workspaces', sub: 'Multi-org support' },
            { icon: Zap,          label: 'Sprint Velocity',   sub: 'Burndown & goals' },
            { icon: Bug,          label: 'Bug Triage',        sub: 'Priority workflows' },
            { icon: BarChart2,    label: 'PDF Analytics',     sub: 'Live chart reports' },
          ].map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="card-glass rounded-2xl p-5 text-center border border-white/[0.06] hover:border-brand-500/40 transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/25 text-brand-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                <Icon size={20} />
              </div>
              <div className="font-bold text-white text-sm mb-0.5">{label}</div>
              <div className="text-xs text-surface-400">{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Features ───────────────────────────────────────────────────── */
function FeaturesSection() {
  return (
    <section id="features" className="py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="badge badge-primary mb-4">Built for velocity</span>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-white tracking-tight">
            Everything your team needs to <span className="text-gradient">ship</span>
          </h2>
          <p className="text-surface-300 max-w-xl mx-auto text-base leading-relaxed">
            Purpose-built workflows for modern developers, leads, and product owners.
            Zero bloat — just fast, reliable tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => {
            const Icon = f.icon;
            const { icon: iconCls, tag: tagCls } = colorMap[f.color];
            return (
              <div key={f.title} className="group card-hover flex flex-col gap-4 p-6 bg-surface-800/60 border border-surface-600 rounded-2xl">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${iconCls}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-base mb-2">{f.title}</h3>
                  <p className="text-sm text-surface-300 leading-relaxed">{f.desc}</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {f.tags.map((t) => (
                    <span key={t} className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${tagCls}`}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── How it Works ───────────────────────────────────────────────── */
function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-28 px-6 bg-surface-800/40 border-y border-white/[0.06]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="badge badge-cyan mb-4">Streamlined Process</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">How Sprint Hive works</h2>
          <p className="text-surface-300">From account setup to shipping your first sprint in under five minutes.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {workflow.map((w, i) => (
            <div key={w.step} className="relative">
              {i < workflow.length - 1 && (
                <div
                  className="hidden lg:block absolute top-8 left-full w-full h-px -z-10"
                  style={{ background: 'linear-gradient(90deg, rgba(91,95,255,0.4), transparent)' }}
                />
              )}
              <div className="card flex flex-col gap-3 h-full hover:border-brand-500/40 transition-all duration-200">
                <div className="text-3xl font-black text-gradient">{w.step}</div>
                <h3 className="font-bold text-white text-sm">{w.title}</h3>
                <p className="text-surface-300 text-xs leading-relaxed">{w.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Roles Section ──────────────────────────────────────────────── */
function RolesSection() {
  const roles = [
    { role: 'Owner', icon: Crown, color: 'text-yellow-400', border: 'border-yellow-500/20 bg-yellow-500/5', perms: ['Full admin access', 'Delete organisation', 'Manage billing', 'All member actions'] },
    { role: 'Manager', icon: UserCheck, color: 'text-blue-400', border: 'border-blue-500/20 bg-blue-500/5', perms: ['Create/delete projects', 'Manage members', 'Assign roles', 'View all reports'] },
    { role: 'Team Lead', icon: Target, color: 'text-brand-400', border: 'border-brand-500/20 bg-brand-500/5', perms: ['Manage sprints', 'Assign tasks', 'Close bugs', 'View analytics'] },
    { role: 'Developer', icon: Code2, color: 'text-green-400', border: 'border-green-500/20 bg-green-500/5', perms: ['Create & update tasks', 'Comment & attach files', 'Update task status', 'Report bugs'] },
    { role: 'Tester', icon: TestTube2, color: 'text-purple-400', border: 'border-purple-500/20 bg-purple-500/5', perms: ['Report & triage bugs', 'Change bug status', 'View all tasks', 'Add comments'] },
  ];

  return (
    <section id="roles" className="py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="badge badge-green mb-4">Access Control</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Role-based <span className="text-gradient">permissions</span>
          </h2>
          <p className="text-surface-300 max-w-lg mx-auto">
            Five granular roles ensure team members have precise permissions for maximum security.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {roles.map((r) => {
            const RoleIcon = r.icon;
            return (
              <div key={r.role} className={`card flex flex-col gap-3 hover:border-surface-500 transition-all duration-200 border ${r.border}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${r.color}`}>
                  <RoleIcon size={22} />
                </div>
                <div className={`font-bold text-sm ${r.color}`}>{r.role}</div>
                <ul className="space-y-1.5">
                  {r.perms.map((p) => (
                    <li key={p} className="flex items-start gap-1.5 text-xs text-surface-300">
                      <Check size={12} className="text-green-400 mt-0.5 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ────────────────────────────────────────────────────────── */
function CTASection() {
  return (
    <section className="py-24 px-6 bg-surface-800/30">
      <div className="max-w-3xl mx-auto text-center">
        <div
          className="relative rounded-3xl overflow-hidden p-10 md:p-14 border border-brand-500/25"
          style={{ background: 'linear-gradient(135deg, rgba(91,95,255,0.1) 0%, rgba(124,58,237,0.06) 100%)' }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(91,95,255,0.18) 0%, transparent 70%)' }}
          />

          <div className="relative z-10">
            <img src={logoIcon} alt="Sprint Hive" className="w-12 h-12 mb-5 mx-auto object-contain" />
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Ready to start shipping?
            </h2>
            <p className="text-surface-300 mb-8 max-w-md mx-auto leading-relaxed text-sm md:text-base">
              Create your organization, invite your engineering team, and execute your first sprint today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="btn-primary btn-lg w-full sm:w-auto justify-center">
                Create Free Account <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn-ghost btn-lg w-full sm:w-auto justify-center">
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-surface-600 py-10 px-6 bg-surface-900">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logoIcon} alt="Sprint Hive" className="w-7 h-7 object-contain" />
          <span className="font-extrabold text-base tracking-tight text-white">
            Sprint<span className="bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text text-transparent">Hive</span>
          </span>
        </Link>
        <p className="text-xs text-surface-400">
          © {new Date().getFullYear()} Sprint Hive. Engineering project management platform.
        </p>
        <div className="flex gap-6 text-xs text-surface-400">
          <Link to="/register" className="hover:text-white transition-colors">Register</Link>
          <Link to="/login" className="hover:text-white transition-colors">Login</Link>
        </div>
      </div>
    </footer>
  );
}

/* ─── Main Export ────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="dark min-h-screen bg-surface-900 text-white font-sans antialiased">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <RolesSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
