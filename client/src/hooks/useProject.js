import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import {
  fetchProjects,
  fetchProject,
  createProject,
  updateProject,
  deleteProject,
  selectProjects,
  selectActiveProject,
  selectProjectLoading
} from '../store/slices/projectSlice';

export const useProject = () => {
  const dispatch = useDispatch();
  const projects = useSelector(selectProjects);
  const activeProject = useSelector(selectActiveProject);
  const isLoading = useSelector(selectProjectLoading);
  const error = useSelector(state => state.project?.error);

  const loadProjects = useCallback((orgId) => dispatch(fetchProjects(orgId)), [dispatch]);
  const loadProject = useCallback((id) => dispatch(fetchProject(id)), [dispatch]);
  const addProject = useCallback((data) => dispatch(createProject(data)), [dispatch]);
  const editProject = useCallback((projectId, data) => dispatch(updateProject({ projectId, data })), [dispatch]);
  const removeProject = useCallback((id) => dispatch(deleteProject(id)), [dispatch]);

  return {
    projects,
    activeProject,
    isLoading,
    error,
    loadProjects,
    loadProject,
    addProject,
    editProject,
    removeProject
  };
};
