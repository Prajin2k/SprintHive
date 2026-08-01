import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { Eye, EyeOff, UserPlus, Mail } from 'lucide-react';

import AuthLayout from '../../components/auth/AuthLayout';
import { registerUser } from '../../store/slices/authSlice';
import useAuth from '../../hooks/useAuth';

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(80),
    email: z.string().email('Enter a valid email address'),
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

// Password strength meter
const getStrength = (pw) => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
};

const strengthLabels = ['', 'Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-amber-400', 'bg-green-500', 'bg-emerald-400'];
const strengthTextColors = ['', 'text-red-400', 'text-orange-400', 'text-amber-400', 'text-green-400', 'text-emerald-400'];

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const password = watch('password', '');
  const strength = getStrength(password);

  const onSubmit = async (data) => {
    const result = await dispatch(registerUser(data));
    if (registerUser.fulfilled.match(result)) {
      setRegisteredEmail(data.email);
      setRegistered(true);
    } else {
      const payload = result.payload;
      toast.error(payload?.message || 'Registration failed. Please try again.');
    }
  };

  // Success screen
  if (registered) {
    return (
      <AuthLayout>
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-brand-500/15 border border-brand-500/25 flex items-center justify-center mx-auto mb-6">
            <Mail size={36} className="text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Check your inbox!</h1>
          <p className="text-surface-300 text-sm leading-relaxed mb-6">
            We sent a verification link to{' '}
            <span className="text-white font-semibold">{registeredEmail}</span>.
            <br />
            Click the link to activate your account.
          </p>
          <div className="rounded-2xl border border-surface-600 bg-surface-800/50 p-4 text-xs text-surface-400 mb-8">
            Didn't receive it? Check your spam folder or{' '}
            <Link to="/login" className="text-brand-400 underline hover:text-brand-300 transition-colors">
              try logging in to resend
            </Link>
            .
          </div>
          <Link to="/login" className="btn-primary">
            Go to Login →
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start shipping faster — it's free"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Name */}
        <div>
          <label htmlFor="reg-name" className="label">Full name</label>
          <input
            id="reg-name"
            type="text"
            autoComplete="name"
            placeholder="Jane Smith"
            className={`input ${errors.name ? 'input-error' : ''}`}
            {...register('name')}
          />
          {errors.name && <p className="error-msg">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="reg-email" className="label">Work email</label>
          <input
            id="reg-email"
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
          <label htmlFor="reg-password" className="label">Password</label>
          <div className="relative">
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Min. 8 chars, uppercase, number"
              className={`input pr-11 ${errors.password ? 'input-error' : ''}`}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-200 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {/* Strength meter */}
          {password.length > 0 && (
            <div className="mt-2.5">
              <div className="flex gap-1 mb-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      i <= strength ? strengthColors[strength] : 'bg-surface-600'
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs font-medium ${strengthTextColors[strength]}`}>
                {strengthLabels[strength]}
              </p>
            </div>
          )}
          {errors.password && <p className="error-msg">{errors.password.message}</p>}
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="reg-confirm" className="label">Confirm password</label>
          <input
            id="reg-confirm"
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
          id="register-submit"
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full btn-lg mt-2"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="spinner-sm" />
              Creating account…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <UserPlus size={17} /> Create Account
            </span>
          )}
        </button>

        <p className="text-center text-xs text-surface-400 mt-2">
          By signing up you agree to our{' '}
          <a href="#" className="text-surface-300 underline hover:text-white transition-colors">Terms</a>{' '}
          and{' '}
          <a href="#" className="text-surface-300 underline hover:text-white transition-colors">Privacy Policy</a>.
        </p>
      </form>

      <p className="text-center text-sm text-surface-300 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
