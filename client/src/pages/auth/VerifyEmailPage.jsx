import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import authService from '../../services/authService';

const STATE = { loading: 'loading', success: 'success', error: 'error' };

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [state, setState] = useState(STATE.loading);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setState(STATE.error);
      setMessage('No verification token found in the URL.');
      return;
    }

    authService
      .verifyEmail(token)
      .then((data) => {
        setMessage(data.message);
        setState(STATE.success);
      })
      .catch((err) => {
        setMessage(
          err.response?.data?.message || 'Verification link is invalid or has expired.'
        );
        setState(STATE.error);
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-surface-900 bg-mesh flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center animate-fade-in">
        {/* Loading */}
        {state === STATE.loading && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-5xl animate-pulse-slow">🐝</div>
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Verifying your email…</p>
          </div>
        )}

        {/* Success */}
        {state === STATE.success && (
          <div className="card animate-slide-up">
            <div className="text-6xl mb-5">✅</div>
            <h1 className="text-2xl font-bold text-white mb-3">Email verified!</h1>
            <p className="text-slate-400 text-sm mb-8">{message}</p>
            <Link to="/login" id="verify-goto-login" className="btn-primary btn-lg">
              Sign In Now →
            </Link>
          </div>
        )}

        {/* Error */}
        {state === STATE.error && (
          <div className="card animate-slide-up">
            <div className="text-6xl mb-5">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-3">Verification failed</h1>
            <p className="text-slate-400 text-sm mb-8">{message}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/login" className="btn-secondary">
                Go to Login
              </Link>
              <Link to="/register" className="btn-ghost">
                Create Account
              </Link>
            </div>
            <p className="text-xs text-slate-600 mt-6">
              Still having issues? Log in and request a new verification link.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
