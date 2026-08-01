import { Link } from 'react-router-dom';
import logoIcon from '../../assets/logo_icon.png';
import { Zap, BarChart2, Bell, Shield } from 'lucide-react';

const features = [
  { icon: Zap,       label: 'Real-time Kanban boards' },
  { icon: BarChart2, label: 'Sprint velocity analytics' },
  { icon: Bell,      label: 'Smart notifications' },
  { icon: Shield,    label: 'Role-based access control' },
];

/**
 * AuthLayout — shared card layout for all auth pages.
 * Left: branding panel (hidden on mobile)
 * Right: form card
 */
export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-surface-900 bg-mesh flex">
      {/* ── Left branding panel (desktop only) ─────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[460px] flex-shrink-0 border-r border-surface-600 p-10 relative overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
        {/* Decorative glows */}
        <div className="absolute -bottom-32 -left-32 w-[450px] h-[450px] rounded-full blur-[120px] pointer-events-none"
             style={{ background: 'radial-gradient(circle, rgba(91,95,255,0.12) 0%, transparent 70%)' }} />
        <div className="absolute -top-20 right-0 w-[280px] h-[280px] rounded-full blur-[100px] pointer-events-none"
             style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)' }} />

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 z-10 relative w-fit group">
          <img src={logoIcon} alt="Sprint Hive" className="h-10 w-10 object-contain flex-shrink-0" />
          <span className="font-extrabold text-2xl tracking-tight text-white">
            Sprint<span className="bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text text-transparent">Hive</span>
          </span>
        </Link>

        {/* Tagline */}
        <div className="z-10 relative">
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
            Ship faster,<br />
            <span className="text-gradient">together.</span>
          </h2>
          <p className="text-surface-300 text-sm leading-relaxed mb-8">
            The modern project management platform for engineering teams. Real-time Kanban, sprint planning, and analytics — all in one place.
          </p>

          {/* Feature bullets */}
          <div className="space-y-3">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-brand-500/15 border border-brand-500/25 flex items-center justify-center flex-shrink-0">
                  <Icon size={13} className="text-brand-400" />
                </div>
                <span className="text-surface-200 text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-surface-500 text-xs z-10 relative">© {new Date().getFullYear()} Sprint Hive</p>
      </div>

      {/* ── Right form panel ────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <Link to="/" className="flex items-center gap-2.5 mb-8 lg:hidden">
          <img src={logoIcon} alt="Sprint Hive" className="w-9 h-9 object-contain" />
          <span className="font-extrabold text-xl tracking-tight text-white">
            Sprint<span className="bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text text-transparent">Hive</span>
          </span>
        </Link>

        <div className="w-full max-w-md">
          {/* Card header */}
          {(title || subtitle) && (
            <div className="mb-8">
              {title && <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">{title}</h1>}
              {subtitle && <p className="text-surface-300 text-sm">{subtitle}</p>}
            </div>
          )}

          {/* Form content */}
          {children}
        </div>
      </div>
    </div>
  );
}
