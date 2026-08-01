import { Link } from 'react-router-dom';
import notFoundImg from '../assets/not_found.png';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-surface-900 bg-mesh flex flex-col items-center justify-center text-center px-6 py-20">
      {/* Decorative glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[150px] opacity-20"
             style={{ background: 'radial-gradient(circle, rgba(91,95,255,0.5) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 max-w-md w-full animate-fade-in">
        {/* Illustration */}
        <div className="mb-8 flex items-center justify-center">
          <img
            src={notFoundImg}
            alt="Page not found"
            className="w-auto h-auto max-w-[280px] max-h-[220px] object-contain mx-auto block"
            style={{ filter: 'drop-shadow(0 20px 40px rgba(91,95,255,0.2))' }}
          />
        </div>

        {/* Text */}
        <div className="mb-3">
          <span className="text-7xl font-black text-gradient">404</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Page not found</h1>
        <p className="text-surface-300 mb-10 text-sm leading-relaxed max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/" className="btn-primary">
            <Home size={16} /> Back to Home
          </Link>
          <button onClick={() => window.history.back()} className="btn-ghost">
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
