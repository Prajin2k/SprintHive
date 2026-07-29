import React from 'react';
import { DndContext, closestCorners, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useTask } from '../../hooks/useTask';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';

const COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: 'slate' },
  { id: 'todo', title: 'To Do', color: 'blue' },
  { id: 'in-progress', title: 'In Progress', color: 'orange' },
  { id: 'code-review', title: 'Code Review', color: 'purple' },
  { id: 'testing', title: 'Testing', color: 'amber' },
  { id: 'completed', title: 'Completed', color: 'green' }
];

const KanbanBoard = ({ projectId }) => {
  const { tasksByStatus, updateTaskStatus } = useTask();
  const [activeTask, setActiveTask] = React.useState(null);

  const handleDragStart = (event) => {
    const { active } = event;
    const task = Object.values(tasksByStatus).flat().find(t => t._id === active.id);
    setActiveTask(task);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    
    // Find source and destination columns
    const activeId = active.id;
    const overId = over.id; // column id or another task id

    // Simplified: Just update status if dropping over a column or a task in a column
    // The precise logic for reordering within the column is skipped for brevity
    // But we extract the destination column ID
    let destinationColId = COLUMNS.find(c => c.id === overId)?.id;
    if (!destinationColId) {
      // It might be a task, let's find which column it belongs to
      const targetTask = Object.values(tasksByStatus).flat().find(t => t._id === overId);
      if (targetTask) {
        destinationColId = targetTask.status;
      }
    }

    if (destinationColId && activeTask && activeTask.status !== destinationColId) {
      updateTaskStatus(projectId, activeTask._id, destinationColId);
    }
    
    setActiveTask(null);
  };

  return (
    <div className="h-full w-full overflow-x-auto p-6 bg-surface-900/50">
      <DndContext 
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-full gap-4 min-w-max">
          {COLUMNS.map(col => (
            <KanbanColumn 
              key={col.id} 
              id={col.id} 
              title={col.title} 
              color={col.color}
              tasks={tasksByStatus[col.id] || []}
            />
          ))}
        </div>
        
        <DragOverlay>
          {activeTask ? <KanbanCard task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;
