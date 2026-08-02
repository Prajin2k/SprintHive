import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { projectService } from '../../services/projectService';

export const fetchProjects = createAsyncThunk(
  'project/fetchProjects',
  async (orgId, { rejectWithValue }) => {
    try {
      const response = await projectService.fetchProjects(orgId);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchProject = createAsyncThunk(
  'project/fetchProject',
  async (id, { rejectWithValue }) => {
    try {
      const response = await projectService.fetchProject(id);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const createProject = createAsyncThunk(
  'project/createProject',
  async (data, { rejectWithValue }) => {
    try {
      const response = await projectService.createProject(data);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateProject = createAsyncThunk(
  'project/updateProject',
  async ({ projectId, data }, { rejectWithValue }) => {
    try {
      const response = await projectService.updateProject(projectId, data);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const deleteProject = createAsyncThunk(
  'project/deleteProject',
  async (projectId, { rejectWithValue }) => {
    try {
      await projectService.deleteProject(projectId);
      return projectId;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const projectSlice = createSlice({
  name: 'project',
  initialState: {
    projects: [],
    activeProject: null,
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder

      // Fetch Projects
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload.data || [];
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch Single Project
      .addCase(fetchProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeProject = action.payload.data;
      })
      .addCase(fetchProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Create Project
      .addCase(createProject.fulfilled, (state, action) => {
        if (action.payload?.data) {
          state.projects.push(action.payload.data);
        }
      })

      // Update Project
      .addCase(updateProject.fulfilled, (state, action) => {
        const updated = action.payload.data;

        if (!updated) return;

        const index = state.projects.findIndex(
          (p) => p._id === updated._id
        );

        if (index !== -1) {
          state.projects[index] = updated;
        }

        if (state.activeProject?._id === updated._id) {
          state.activeProject = updated;
        }
      })

      // Delete Project
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter(
          (p) => p._id !== action.payload
        );

        if (state.activeProject?._id === action.payload) {
          state.activeProject = null;
        }
      });
  },
});

export const selectProjects = (state) => state.project?.projects || [];
export const selectActiveProject = (state) =>
  state.project?.activeProject || null;
export const selectProjectLoading = (state) =>
  state.project?.isLoading || false;

export default projectSlice.reducer;