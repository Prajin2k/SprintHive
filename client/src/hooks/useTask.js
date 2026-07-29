import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  setTaskStatus,
  selectTasks,
  selectTaskLoading,
  selectTasksByStatus
} from '../store/slices/taskSlice';

export const useTask = () => {
  const dispatch = useDispatch();
  const tasks = useSelector(selectTasks);
  const isLoading = useSelector(selectTaskLoading);
  const error = useSelector(state => state.task?.error);
  const tasksByStatus = useSelector(selectTasksByStatus);

  const loadTasks = useCallback((projectId, filters) => dispatch(fetchTasks({ projectId, filters })), [dispatch]);
  const addTask = useCallback((projectId, data) => dispatch(createTask({ projectId, data })), [dispatch]);
  const editTask = useCallback((projectId, taskId, data) => dispatch(updateTask({ projectId, taskId, data })), [dispatch]);
  const removeTask = useCallback((projectId, taskId) => dispatch(deleteTask({ projectId, taskId })), [dispatch]);
  const updateTaskStatus = useCallback((projectId, taskId, status) => dispatch(setTaskStatus({ projectId, taskId, status })), [dispatch]);

  return {
    tasks,
    tasksByStatus,
    isLoading,
    error,
    loadTasks,
    addTask,
    editTask,
    removeTask,
    updateTaskStatus
  };
};
