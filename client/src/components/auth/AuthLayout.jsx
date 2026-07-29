import { Link } from 'react-router-dom';

/**
 * AuthLayout — shared card layout for all auth pages.
 * Left: branding panel (hidden on mobile)
 * Right: form card
 */
export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-surface-900 bg-mesh flex">
      {/* ── Left branding panel (desktop only) ─────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 bg-surface-800 border-r border-surface-600 p-10 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-brand-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute -top-16 right-0 w-[250px] h-[250px] rounded-full bg-purple-600/8 blur-[80px] pointer-events-none" />

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-xl shadow-glow-sm">
            🐝
          </div>
          <span className="text-xl font-bold">
            Sprint<span className="text-brand-400">Hive</span>
          </span>
        </Link>

        {/* Tagline */}
        <div className="z-10">
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
            Ship faster,<br />
            <span className="text-gradient">together.</span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            The modern project management platform for engineering teams. Real-time Kanban, sprint planning, and analytics — all in one place.
          </p>

          {/* Feature bullets */}
          {[
            '⚡ Real-time Kanban boards',
            '📊 Sprint velocity analytics',
            '🔔 Smart notifications',
            '🔐 Role-based access control',
          ].map((f) => (
            <div key={f} className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />
              <span className="text-slate-300 text-sm">{f}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-slate-600 text-xs z-10">© {new Date().getFullYear()} Sprint Hive</p>
      </div>

      {/* ── Right form panel ────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-lg">🐝</div>
          <span className="font-bold">Sprint<span className="text-brand-400">Hive</span></span>
        </Link>

        <div className="w-full max-w-md">
          {/* Card header */}
          {(title || subtitle) && (
            <div className="mb-8">
              {title && <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>}
              {subtitle && <p className="text-slate-400 text-sm">{subtitle}</p>}
            </div>
          )}

          {/* Form content */}
          {children}
        </div>
      </div>
    </div>
  );
}
