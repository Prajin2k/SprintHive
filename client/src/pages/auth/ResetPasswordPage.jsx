import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import AuthLayout from '../../components/auth/AuthLayout';
import authService from '../../services/authService';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Must include an uppercase letter')
      .regex(/[a-z]/, 'Must include a lowercase letter')
      .regex(/[0-9]/, 'Must include a number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const getStrength = (pw) => {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};

const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-amber-400', 'bg-green-500', 'bg-emerald-400'];
const strengthLabels = ['', 'Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const password = watch('password', '');
  const strength = getStrength(password);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await authService.resetPassword(token, {
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      setDone(true);
      toast.success('Password reset! Please log in.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset link is invalid or expired.');
    } finally {
      setIsLoading(false);
    }
  };

  if (done) {
    return (
      <AuthLayout>
        <div className="text-center animate-fade-in">
          <div className="text-6xl mb-6">🔐</div>
          <h1 className="text-2xl font-bold text-white mb-3">Password reset!</h1>
          <p className="text-slate-400 text-sm mb-8">
            Your password has been updated. All active sessions were signed out for security.
          </p>
          <Link to="/login" className="btn-primary">
            Sign in with new password →
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Choose a strong new password for your account"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div>
          <label htmlFor="reset-password" className="label">New password</label>
          <div className="relative">
            <input
              id="reset-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Min. 8 chars, uppercase, number"
              className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {password.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      i <= strength ? strengthColors[strength] : 'bg-surface-600'
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs ${strength >= 4 ? 'text-green-400' : 'text-slate-500'}`}>
                {strengthLabels[strength]}
              </p>
            </div>
          )}
          {errors.password && <p className="error-msg">{errors.password.message}</p>}
        </div>

        <div>
          <label htmlFor="reset-confirm" className="label">Confirm new password</label>
          <input
            id="reset-confirm"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="error-msg">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          id="reset-submit"
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full btn-lg"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Resetting...
            </span>
          ) : (
            'Set New Password'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-slate-400 mt-6">
        <Link to="/login" className="text-brand-400 hover:text-brand-300 transition-colors">
          ← Back to Login
        </Link>
      </p>
    </AuthLayout>
  );
}
