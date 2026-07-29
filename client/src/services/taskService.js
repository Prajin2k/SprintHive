import api from './api';

export const taskService = {
  fetchTasks: (projectId, filters) => api.get(`/projects/${projectId}/tasks`, { params: filters }),
  createTask: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  updateTask: (projectId, taskId, data) => api.patch(`/projects/${projectId}/tasks/${taskId}`, data),
  deleteTask: (projectId, taskId) => api.delete(`/projects/${projectId}/tasks/${taskId}`),
  setTaskStatus: (projectId, taskId, status) =>
    api.patch(`/projects/${projectId}/tasks/${taskId}`, { status }),
};
