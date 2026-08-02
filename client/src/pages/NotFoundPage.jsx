import { Link } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import logoIcon from '../assets/logo_icon.png';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-surface-900 bg-mesh flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">

      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[160px] opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(91,95,255,0.6) 0%, rgba(124,58,237,0.3) 50%, transparent 70%)' }}
        />
        <div
          className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full blur-[120px] opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.4) 0%, transparent 70%)' }}
        />
      </div>

      {/* Glassmorphism card */}
      <div
        className="relative z-10 w-full max-w-[560px] text-center rounded-3xl p-10 sm:p-14"
        style={{
          background: 'rgba(30, 41, 59, 0.55)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(91,95,255,0.06)',
        }}
      >
        {/* Brand header */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <img
            src={logoIcon}
            alt="Sprint Hive logo"
            className="w-9 h-9 object-contain"
            style={{ filter: 'drop-shadow(0 0 8px rgba(91,95,255,0.5))' }}
          />
          <span
            className="text-xl font-bold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #F8FAFC 0%, #94A3B8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Sprint Hive
          </span>
        </div>

        {/* Large gradient 404 */}
        <div className="mb-4 select-none">
          <span
            className="text-[7.5rem] sm:text-[9rem] leading-none font-black tracking-tighter"
            style={{
              background: 'linear-gradient(135deg, #5B5FFF 0%, #7C3AED 55%, #22D3EE 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 4px 24px rgba(91,95,255,0.35))',
            }}
          >
            404
          </span>
        </div>

        {/* Thin divider */}
        <div
          className="mx-auto mb-7 h-px w-16 rounded-full"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(91,95,255,0.5), transparent)' }}
        />

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">
          Page Not Found
        </h1>

        {/* Description */}
        <p className="text-surface-300 text-sm sm:text-base leading-relaxed max-w-sm mx-auto mb-10">
          The page you're looking for doesn't exist or may have been moved.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/app"
            className="btn-primary btn-lg w-full sm:w-auto"
          >
            <LayoutDashboard size={17} />
            Back to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn-ghost btn-lg w-full sm:w-auto"
          >
            <ArrowLeft size={17} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
