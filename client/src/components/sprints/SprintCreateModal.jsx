import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import api from '../../services/api';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  startDate: z.string().min(1, 'Required'),
  endDate: z.string().min(1, 'Required'),
  goal: z.string().optional()
}).refine(data => new Date(data.endDate) > new Date(data.startDate), {
  message: "End date must be after start date",
  path: ["endDate"]
});

const SprintCreateModal = ({ isOpen, onClose, projectId, onCreated }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema)
  });

  if (!isOpen) return null;

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const res = await api.post(`/projects/${projectId}/sprints`, data);
      toast.success('Sprint created');
      onCreated(res.data?.data || res.data);
      reset();
      onClose();
    } catch (err) {
      toast.error('Failed to create sprint');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-900 border border-surface-700 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-surface-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-surface-50">Create Sprint</h2>
          <button onClick={onClose} className="text-surface-400 hover:text-white">&times;</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="label">Sprint Name *</label>
            <input {...register('name')} className={`input ${errors.name ? 'input-error' : ''}`} />
            {errors.name && <p className="error-msg">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date *</label>
              <input type="date" {...register('startDate')} className={`input ${errors.startDate ? 'input-error' : ''}`} />
            </div>
            <div>
              <label className="label">End Date *</label>
              <input type="date" {...register('endDate')} className={`input ${errors.endDate ? 'input-error' : ''}`} />
            </div>
          </div>
          {errors.endDate && <p className="error-msg">{errors.endDate.message}</p>}
          <div>
            <label className="label">Sprint Goal</label>
            <textarea {...register('goal')} className="input min-h-[80px]" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-700">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Creating...' : 'Create Sprint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SprintCreateModal;
