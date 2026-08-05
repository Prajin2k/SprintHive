import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn, AlertTriangle, RefreshCw } from 'lucide-react';

import AuthLayout from '../../components/auth/AuthLayout';
import { loginUser } from '../../store/slices/authSlice';
import { fetchMyOrgs } from '../../store/slices/orgSlice';
import authService from '../../services/authService';
import useAuth from '../../hooks/useAuth';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [resending, setResending] = useState(false);

  const from = location.state?.from?.pathname || '/app';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    const result = await dispatch(loginUser(data));

    if (loginUser.fulfilled.match(result)) {
      toast.success('Welcome back!');

      try {
        const orgsResult = await dispatch(fetchMyOrgs()).unwrap();
        const orgs = orgsResult?.orgs || [];
        navigate(orgs.length ? '/app' : '/app/onboarding', { replace: true });
      } catch (err) {
        console.error('Failed to load organizations after login:', err);
        navigate(from, { replace: true });
      }
    } else {
      const payload = result.payload;
      if (payload?.errorCode === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(data.email);
      } else {
        toast.error(payload?.message || 'Login failed. Please try again.');
      }
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setResending(true);
    try {
      await authService.resendVerification(unverifiedEmail);
      toast.success('Verification email sent! Check your inbox.');
      setUnverifiedEmail(null);
    } catch {
      toast.error('Could not resend email. Try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Sprint Hive workspace"
    >
      {/* Email not verified banner */}
      {unverifiedEmail && (
        <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 animate-slide-down">
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 text-sm font-semibold mb-1">Email not verified</p>
              <p className="text-amber-200/70 text-xs mb-3">
                Please verify <strong>{unverifiedEmail}</strong> before logging in.
              </p>
              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="flex items-center gap-1.5 text-xs text-amber-300 underline underline-offset-2 hover:text-amber-200 transition-colors disabled:opacity-50"
              >
                {resending ? <><RefreshCw size={11} className="animate-spin" /> Sending...</> : 'Resend verification email →'}
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Email */}
        <div>
          <label htmlFor="login-email" className="label">Email address</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className={`input ${errors.email ? 'input-error' : ''}`}
            {...register('email')}
          />
          {errors.email && <p className="error-msg">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="label mb-0">Password</label>
            <Link
              to="/forgot-password"
              className="text-xs text-brand-400 hover:text-brand-300 transition-colors font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className={`input pr-11 ${errors.password ? 'input-error' : ''}`}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-200 transition-colors"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="error-msg">{errors.password.message}</p>}
        </div>

        {/* Submit */}
        <button
          id="login-submit"
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full btn-lg mt-2"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="spinner-sm" />
              Signing in…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <LogIn size={17} /> Sign In
            </span>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-surface-300 mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
          Create one free
        </Link>
      </p>
    </AuthLayout>
  );
}
