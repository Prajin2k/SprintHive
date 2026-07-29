import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isPast } from 'date-fns';

const KanbanCard = ({ task, isOverlay = false }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const priorityColors = {
    low: 'border-l-blue-500',
    medium: 'border-l-amber-500',
    high: 'border-l-orange-500',
    critical: 'border-l-red-500',
  };

  const isOverdue = task.deadline && isPast(new Date(task.deadline));

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`glass card-hover rounded-lg p-3 text-sm flex flex-col gap-2 cursor-grab active:cursor-grabbing border-l-4 ${priorityColors[task.priority] || 'border-l-surface-600'} ${isOverlay ? 'shadow-2xl scale-105 rotate-2' : ''}`}
    >
      <div className="flex justify-between items-start gap-2">
        <p className="text-surface-50 font-medium line-clamp-2 leading-snug flex-1">
          {task.title}
        </p>
        <span className="text-[10px] text-surface-400 font-mono shrink-0 bg-surface-800 px-1.5 rounded">
          {task.taskNumber || `SH-${task._id.substring(0, 4)}`}
        </span>
      </div>

      <div className="flex flex-wrap gap-1 mt-1">
        {task.labels?.slice(0, 2).map((label, idx) => (
          <span key={idx} className="text-[10px] bg-surface-700 text-surface-300 px-1.5 py-0.5 rounded">
            {label}
          </span>
        ))}
      </div>

      <div className="flex justify-between items-center mt-2 pt-2 border-t border-surface-700/50">
        <div className="flex items-center gap-2">
          {task.assignee ? (
            <div className="w-6 h-6 rounded-full bg-surface-600 border border-surface-700 overflow-hidden" title={task.assignee.name}>
              {task.assignee.avatar ? (
                <img src={task.assignee.avatar} alt="assignee" className="w-full h-full object-cover" />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-[10px] font-bold">
                  {task.assignee.initials || 'U'}
                </span>
              )}
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full border border-dashed border-surface-600 flex items-center justify-center text-surface-500 text-xs" title="Unassigned">
              ?
            </div>
          )}
        </div>
        
        {task.deadline && (
          <span className={`text-[10px] ${isOverdue ? 'text-red-400 font-bold' : 'text-surface-400'}`}>
            {format(new Date(task.deadline), 'MMM d')}
          </span>
        )}
      </div>
    </div>
  );
};

export default KanbanCard;
