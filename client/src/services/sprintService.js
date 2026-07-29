import api from './api';

export const sprintService = {
  fetchSprints: (projectId) => api.get(`/projects/${projectId}/sprints`),
  createSprint: (projectId, data) => api.post(`/projects/${projectId}/sprints`, data),
  updateSprint: (projectId, sprintId, data) =>
    api.patch(`/projects/${projectId}/sprints/${sprintId}`, data),
  deleteSprint: (projectId, sprintId) => api.delete(`/projects/${projectId}/sprints/${sprintId}`),
};
