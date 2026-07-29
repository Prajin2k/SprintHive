import React from 'react';
import { format } from 'date-fns';

const SprintCard = ({ sprint, onEdit, onDelete, canManage }) => {
  const { name, status, startDate, endDate, completedTasks, totalTasks } = sprint;
  
  const statusColors = {
    planned: 'badge-slate',
    active: 'badge-green',
    completed: 'badge-gray',
  };

  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="card card-hover">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-surface-50 text-lg">{name}</h3>
          <p className="text-sm text-surface-400 mt-1">
            {format(new Date(startDate), 'MMM d')} - {format(new Date(endDate), 'MMM d')}
          </p>
        </div>
        <span className={`badge ${statusColors[status] || 'badge-gray'}`}>{status}</span>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-surface-300 mb-1">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-surface-700 rounded-full h-2">
          <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-surface-400 mt-2">
          {completedTasks} tasks · {totalTasks - completedTasks} remaining
        </p>
      </div>

      {canManage && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-surface-700">
          <button onClick={onEdit} className="btn-ghost btn-sm flex-1">Edit</button>
          <button onClick={onDelete} className="text-red-400 hover:bg-red-500/10 px-3 py-1 rounded text-sm transition-colors flex-1 font-medium">Delete</button>
        </div>
      )}
    </div>
  );
};

export default SprintCard;
