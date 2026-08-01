import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Send, ArrowLeft, Mail } from 'lucide-react';

import AuthLayout from '../../components/auth/AuthLayout';
import authService from '../../services/authService';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email }) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch {
      // Always show success to prevent email enumeration
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthLayout>
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-brand-500/15 border border-brand-500/25 flex items-center justify-center mx-auto mb-6">
            <Mail size={36} className="text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Check your email</h1>
          <p className="text-surface-300 text-sm leading-relaxed mb-6">
            If an account exists for{' '}
            <span className="text-white font-semibold">{getValues('email')}</span>,
            we've sent a password reset link. It expires in{' '}
            <span className="text-white font-semibold">1 hour</span>.
          </p>
          <div className="rounded-2xl border border-surface-600 bg-surface-800/50 p-4 text-xs text-surface-400 mb-8">
            Don't see it? Check your spam folder.
          </div>
          <Link to="/login" className="btn-secondary">
            <ArrowLeft size={15} /> Back to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div>
          <label htmlFor="forgot-email" className="label">Email address</label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className={`input ${errors.email ? 'input-error' : ''}`}
            {...register('email')}
          />
          {errors.email && <p className="error-msg">{errors.email.message}</p>}
        </div>

        <button
          id="forgot-submit"
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full btn-lg"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="spinner-sm" />
              Sending…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send size={16} /> Send Reset Link
            </span>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-surface-300 mt-6">
        Remember it?{' '}
        <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
