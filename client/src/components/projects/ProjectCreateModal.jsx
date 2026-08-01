import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { useProject } from '../../hooks/useProject';
import { useOrg } from '../../hooks/useOrg';

const schema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  deadline: z.string().optional(),
  coverColor: z.string().optional(),
  tags: z.string().optional(),
});

const PRESET_COLORS = [
  '#5B5FFF', '#ef4444', '#10b981', '#3b82f6', 
  '#8b5cf6', '#ec4899', '#f59e0b', '#64748b'
];

const ProjectCreateModal = ({ isOpen, onClose }) => {
  const { addProject } = useProject();
  const { activeOrg } = useOrg();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, control, formState: { errors }, reset, setValue } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      priority: 'medium',
      coverColor: '#5B5FFF',
    }
  });

  if (!isOpen) return null;

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      await addProject({
        ...data,
        tags: tagsArray,
        organizationId: activeOrg._id
      }).unwrap();
      
      toast.success('Project created successfully');
      reset();
      onClose();
    } catch (err) {
      toast.error(err || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-900 border border-surface-700 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-surface-700 flex justify-between items-center bg-surface-800">
          <h2 className="text-xl font-bold text-surface-50">New Project</h2>
          <button onClick={onClose} className="text-surface-400 hover:text-white">&times;</button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <form id="project-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Project Name *</label>
              <input type="text" className={`input ${errors.name ? 'input-error' : ''}`} {...register('name')} />
              {errors.name && <p className="error-msg">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label">Description</label>
              <textarea className="input min-h-[100px] resize-none" {...register('description')}></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Priority</label>
                <select className="input" {...register('priority')}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="label">Deadline</label>
                <input type="date" className="input" {...register('deadline')} />
              </div>
            </div>

            <div>
              <label className="label">Tags (comma separated)</label>
              <input type="text" className="input" placeholder="frontend, mvp, design" {...register('tags')} />
            </div>

            <div>
              <label className="label">Cover Color</label>
              <Controller
                name="coverColor"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-2">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${field.value === color ? 'border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => field.onChange(color)}
                      />
                    ))}
                  </div>
                )}
              />
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-surface-700 flex justify-end gap-3 bg-surface-800">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" form="project-form" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCreateModal;
