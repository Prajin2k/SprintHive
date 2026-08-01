import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { CheckCircle, XCircle } from 'lucide-react';

import authService from '../../services/authService';
import { setCredentials } from '../../store/slices/authSlice';
import { fetchMyOrgs } from '../../store/slices/orgSlice';
import logoIcon from '../../assets/logo_icon.png';

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
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[140px]"
             style={{ background: 'radial-gradient(circle, rgba(91,95,255,0.12) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 w-full max-w-md text-center animate-fade-in">
        {/* Loading state */}
        {state === STATE.loading && (
          <div className="flex flex-col items-center gap-6">
            {/* Premium loading animation */}
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-2 border-brand-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-500 animate-spin" />
              <div className="absolute inset-3 rounded-full flex items-center justify-center">
                <img src={logoIcon} alt="Sprint Hive" className="w-10 h-10 object-contain" />
              </div>
            </div>
            <div>
              <p className="text-white font-semibold mb-1">Verifying your email…</p>
              <p className="text-surface-400 text-sm">Please wait a moment</p>
            </div>
          </div>
        )}

        {/* Success state */}
        {state === STATE.success && (
          <div className="card animate-slide-up p-8">
            <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Email verified!</h1>
            <p className="text-surface-300 text-sm mb-2">{message}</p>
            <p className="text-surface-500 text-xs">Redirecting you to your workspace shortly…</p>
            <div className="mt-6 flex justify-center">
              <div className="w-full max-w-[200px] h-1 bg-surface-700 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full animate-[shimmer_2s_ease-in-out_forwards]"
                     style={{ animation: 'width 2s linear forwards', width: '0%' }} />
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {state === STATE.error && (
          <div className="card animate-slide-up p-8">
            <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center mx-auto mb-5">
              <XCircle size={32} className="text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Verification failed</h1>
            <p className="text-surface-300 text-sm mb-8">{message}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/login" className="btn-secondary">Go to Login</Link>
              <Link to="/register" className="btn-ghost">Create Account</Link>
            </div>
            <p className="text-xs text-surface-500 mt-6">
              Still having issues? Log in and request a new verification link.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
