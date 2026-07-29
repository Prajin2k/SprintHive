import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../hooks/useTask';
import { useOrg } from '../../hooks/useOrg';
import useAuth from '../../hooks/useAuth';
import CommentThread from './CommentThread';
import FileUploadZone from './FileUploadZone';

const TaskDetailModal = ({ isOpen, onClose, task, projectId }) => {
  const { updateTaskStatus, editTask } = useTask();
  const { userOrgRole } = useOrg();
  const { user } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        estimatedTime: task.estimatedTime,
        actualTime: task.actualTime,
      });
    }
  }, [task, reset]);

  if (!isOpen || !task) return null;

  const assigneeId = task.assignedTo?._id || task.assignedTo;
  const isReadOnly =
    userOrgRole === 'developer' &&
    assigneeId &&
    String(assigneeId) !== String(user?._id || user?.id);

  const onSubmit = async (data) => {
    try {
      await editTask(projectId, task._id, data);
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-4xl bg-surface-900 shadow-2xl border-l border-surface-700 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-surface-700">
          <div className="flex items-center gap-3">
            <span className="badge badge-orange font-mono">SH-{task._id.substring(0, 4)}</span>
            <span className="text-surface-400 text-sm">Project &gt; Task</span>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-white text-2xl">&times;</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto flex">
          {/* Left Column */}
          <div className="w-2/3 p-6 border-r border-surface-700 flex flex-col gap-6">
            <form id="task-detail-form" onBlur={handleSubmit(onSubmit)} className="space-y-6">
              <input 
                {...register('title')} 
                className="text-2xl font-bold bg-transparent border-none focus:ring-0 text-white w-full px-0"
                disabled={isReadOnly}
              />
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-surface-400">Description</label>
                <textarea 
                  {...register('description')} 
                  className="input min-h-[150px] resize-y bg-surface-800"
                  disabled={isReadOnly}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-surface-400">Status</label>
                  <select {...register('status')} className="input mt-1" disabled={isReadOnly}>
                    <option value="backlog">Backlog</option>
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="code-review">Code Review</option>
                    <option value="testing">Testing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-surface-400">Priority</label>
                  <select {...register('priority')} className="input mt-1" disabled={isReadOnly}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column */}
          <div className="w-1/3 p-6 flex flex-col gap-6 bg-surface-800/30">
            <div>
              <h3 className="font-semibold text-surface-100 mb-4 border-b border-surface-700 pb-2">Activity</h3>
              <CommentThread taskId={task._id} projectId={projectId} />
            </div>
            <div>
              <h3 className="font-semibold text-surface-100 mb-4 border-b border-surface-700 pb-2">Attachments</h3>
              <FileUploadZone taskId={task._id} projectId={projectId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
