import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTask } from '../../hooks/useTask';
import toast from 'react-hot-toast';

const schema = z.object({
  title: z.string().min(1, 'Required'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  deadline: z.string().optional(),
  estimatedTime: z.string().optional()
});

const TaskCreateForm = ({ projectId, columnStatus, onCancel }) => {
  const { addTask } = useTask();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium' }
  });

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      await addTask(projectId, { ...data, status: columnStatus }).unwrap();
      toast.success('Task added');
      onCancel();
    } catch (err) {
      toast.error('Failed to add task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface-800 p-3 rounded-lg border border-surface-600 mt-2">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <input 
          {...register('title')} 
          placeholder="Task title..." 
          className="input input-sm w-full" autoFocus 
        />
        <div className="flex gap-2">
          <select {...register('priority')} className="input input-sm flex-1">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <input type="date" {...register('deadline')} className="input input-sm flex-1" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCancel} className="text-xs text-surface-400 hover:text-white">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary btn-sm text-xs py-1 px-3">
            {isSubmitting ? '...' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskCreateForm;
