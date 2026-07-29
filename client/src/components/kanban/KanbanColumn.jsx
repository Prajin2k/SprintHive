import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';

const KanbanColumn = ({ id, title, color, tasks }) => {
  const { setNodeRef } = useDroppable({ id });

  const bgColors = {
    slate: 'bg-slate-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
    green: 'bg-green-500',
  };

  return (
    <div className="w-80 shrink-0 flex flex-col h-full bg-surface-800/80 rounded-xl border border-surface-700/50">
      <div className="p-3 border-b border-surface-700 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${bgColors[color] || 'bg-gray-500'}`} />
          <h3 className="font-semibold text-surface-100">{title}</h3>
        </div>
        <span className="bg-surface-700 text-surface-300 text-xs px-2 py-0.5 rounded-full font-medium">
          {tasks.length}
        </span>
      </div>

      <div 
        ref={setNodeRef}
        className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar"
      >
        <SortableContext 
          items={tasks.map(t => t._id)} 
          strategy={verticalListSortingStrategy}
        >
          {tasks.map(task => (
            <KanbanCard key={task._id} task={task} />
          ))}
        </SortableContext>
        
        <button className="w-full py-2 text-sm text-surface-400 hover:text-surface-200 hover:bg-surface-700 rounded-lg transition-colors border border-dashed border-surface-600 flex justify-center items-center gap-1">
          <span>+</span> Add Task
        </button>
      </div>
    </div>
  );
};

export default KanbanColumn;
