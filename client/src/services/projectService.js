import api from './api';

export const projectService = {
  fetchProjects: (orgId) => api.get('/projects', { params: { orgId } }),
  fetchProject: (id) => api.get(`/projects/${id}`),
  createProject: (data) => api.post('/projects', data),
  updateProject: (id, data) => api.patch(`/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/projects/${id}`),
};
