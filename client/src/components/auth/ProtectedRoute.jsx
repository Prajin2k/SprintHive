import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import logoIcon from '../../assets/logo_icon.png';

/**
 * ProtectedRoute — wraps routes that require authentication.
 * Shows a branded loading state while auth is initializing (on page load/refresh).
 * Redirects to /login with returnTo state if not authenticated.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isInitialized } = useAuth();
  const location = useLocation();

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-surface-900 bg-mesh flex items-center justify-center p-6"
           aria-live="polite"
           aria-busy="true">
        <div className="flex flex-col items-center justify-center gap-6 text-center animate-fade-in">
          {/* Premium loading animation with logo_icon */}
          <div className="relative w-20 h-20">
            {/* Outer spinning gradient ring */}
            <div className="absolute inset-0 rounded-full border-2 border-brand-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-500 animate-spin" />
            <div className="absolute inset-3 rounded-full flex items-center justify-center">
              <img
                src={logoIcon}
                alt="Sprint Hive Logo"
                className="w-10 h-10 object-contain animate-pulse-slow mx-auto"
              />
            </div>
          </div>
          <div>
            <p className="text-white font-bold text-base mb-1 tracking-tight">Sprint Hive</p>
            <p className="text-surface-400 text-xs font-medium tracking-wide uppercase">Initializing workspace…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
