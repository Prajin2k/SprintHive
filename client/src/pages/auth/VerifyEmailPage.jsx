import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import authService from '../../services/authService';
import { setCredentials } from '../../store/slices/authSlice';
import { fetchMyOrgs } from '../../store/slices/orgSlice';

const STATE = { loading: 'loading', success: 'success', error: 'error' };

// Module-level set to avoid duplicate network requests across StrictMode remounts
const verifyingTokens = new Set();

export default function VerifyEmailPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Per-instance guards
  const hasVerified = useRef(false);
  const succeeded = useRef(false);
  const isMountedRef = useRef(true);

  const [state, setState] = useState(STATE.loading);
  const [message, setMessage] = useState('');

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setState(STATE.error);
      setMessage('No verification token found in the URL.');
      return;
    }

    // If already being/been verified in another mount, skip calling backend
    if (verifyingTokens.has(token)) {
      console.log('Duplicate verification skipped');
      // Optimistically show success and attempt to fetch orgs for redirect
      setState(STATE.success);
      setMessage('Email already verified. Redirecting…');
      (async () => {
        try {
          const result = await dispatch(fetchMyOrgs());
          const hasOrgs = result.payload?.orgs?.length > 0;
          if (isMountedRef.current) {
            window.setTimeout(() => {
              if (isMountedRef.current) navigate(hasOrgs ? '/app' : '/app/onboarding', { replace: true });
            }, 2000);
          }
        } catch (_) {}
      })();
      return;
    }

    if (hasVerified.current) {
      console.log('Duplicate verification skipped');
      return;
    }

    hasVerified.current = true;
    verifyingTokens.add(token);

    console.log('Verification started');

    authService
      .verifyEmail(token)
      .then(async (data) => {
        if (!isMountedRef.current) return;

        console.log('Verification succeeded');
        succeeded.current = true;

        setMessage(data.message);
        setState(STATE.success);

        // Update Redux credentials
        dispatch(setCredentials({ user: data.user, accessToken: data.accessToken }));

        try {
          const result = await dispatch(fetchMyOrgs());
          const hasOrgs = result.payload?.orgs?.length > 0;
          if (isMountedRef.current) {
            window.setTimeout(() => {
              if (!isMountedRef.current) return;
              navigate(hasOrgs ? '/app' : '/app/onboarding', { replace: true });
            }, 2000);
          }
        } catch (_) {}
      })
      .catch((err) => {
        // Ignore duplicate errors arriving after a success
        if (succeeded.current) {
          console.log('Ignoring duplicate error after success');
          return;
        }

        if (!isMountedRef.current) return;

        setMessage(err.response?.data?.message || 'Verification link is invalid or has expired.');
        setState(STATE.error);
      });
  }, [token, dispatch, navigate]);

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
            <div className="text-6xl mb-5 animate-bounce">✅</div>
            <h1 className="text-2xl font-bold text-white mb-3">Email verified successfully!</h1>
            <p className="text-slate-400 text-sm mb-8">{message}</p>
            <p className="text-slate-500 text-xs mb-4">Redirecting you to your workspace shortly…</p>
          </div>
        )}

        {/* Error */}
        {state === STATE.error && (
          <div className="card animate-slide-up">
            <div className="text-6xl mb-5">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-3">Verification failed</h1>
            <p className="text-slate-400 text-sm mb-8">{message}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/login" className="btn-secondary">Go to Login</Link>
              <Link to="/register" className="btn-ghost">Create Account</Link>
            </div>
            <p className="text-xs text-slate-600 mt-6">Still having issues? Log in and request a new verification link.</p>
          </div>
        )}
      </div>
    </div>
  );
}
