import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import api from '../../services/api';

const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  stepsToReproduce: z.string().optional()
});

const ReportBugForm = ({ projectId, onCancel, onSubmitted }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium' }
  });

  const onSubmit = async (data) => {
    try {
      const res = await api.post(`/projects/${projectId}/bugs`, data);
      toast.success('Bug reported successfully');
      onSubmitted(res.data?.data || res.data);
    } catch (err) {
      toast.error('Failed to report bug');
    }
  };

  return (
    <div className="bg-surface-800 p-6 rounded-xl border border-surface-700 mb-6">
      <h3 className="text-lg font-bold text-surface-50 mb-4">Report a Bug</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Title</label>
          <input {...register('title')} className={`input ${errors.title ? 'input-error' : ''}`} />
          {errors.title && <p className="error-msg">{errors.title.message}</p>}
        </div>
        <div>
          <label className="label">Description</label>
          <textarea {...register('description')} className={`input min-h-[100px] ${errors.description ? 'input-error' : ''}`} />
          {errors.description && <p className="error-msg">{errors.description.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Priority</label>
            <select {...register('priority')} className="input">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Steps to Reproduce</label>
          <textarea {...register('stepsToReproduce')} className="input min-h-[80px]" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn-danger">
            {isSubmitting ? 'Reporting...' : 'Report Bug'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportBugForm;
