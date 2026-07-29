import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import { createOrganization } from '../../store/slices/orgSlice';
import useOrg from '../../hooks/useOrg';
import useAuth from '../../hooks/useAuth';

const schema = z.object({
  name: z
    .string()
    .min(2, 'At least 2 characters')
    .max(80, 'Maximum 80 characters')
    .trim(),
  description: z.string().max(500, 'Maximum 500 characters').optional(),
});

export default function OnboardingPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isLoading } = useOrg();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    const result = await dispatch(createOrganization(data));

    if (createOrganization.fulfilled.match(result)) {
      toast.success(`"${data.name}" created! Let's build something.`);
      navigate('/app');
    } else {
      toast.error(result.payload?.message || 'Failed to create organization.');
    }
  };

  return (
    <div className="min-h-screen bg-surface-900 bg-mesh flex items-center justify-center px-6">
      <div className="w-full max-w-lg animate-fade-in">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🐝</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-slate-400">
            Create your first organization to get started. You can invite your team after.
          </p>
        </div>

        {/* Create org card */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-white mb-6">Create an Organization</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="org-name" className="label">Organization name</label>
              <input
                id="org-name"
                type="text"
                placeholder="Organization name"
                className={`input ${errors.name ? 'input-error' : ''}`}
                {...register('name')}
              />
              {errors.name && <p className="error-msg">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="org-desc" className="label">
                Description <span className="text-slate-600">(optional)</span>
              </label>
              <textarea
                id="org-desc"
                placeholder="What does your organization build?"
                rows={3}
                className={`input resize-none ${errors.description ? 'input-error' : ''}`}
                {...register('description')}
              />
              {errors.description && <p className="error-msg">{errors.description.message}</p>}
            </div>

            <button
              id="create-org-submit"
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full btn-lg"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating…
                </span>
              ) : (
                'Create Organization →'
              )}
            </button>
          </form>
        </div>

        {/* Waiting for invite */}
        <div className="card text-center border-dashed border-surface-500">
          <div className="text-2xl mb-3">📨</div>
          <h3 className="text-white font-medium mb-1">Waiting for an invite?</h3>
          <p className="text-slate-500 text-sm">
            Ask your team owner to invite you. Once they send the invite,
            check your email for the acceptance link.
          </p>
        </div>
      </div>
    </div>
  );
}
