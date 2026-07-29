import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sprintService } from '../../services/sprintService';

export const fetchSprints = createAsyncThunk('sprint/fetchSprints', async (projectId, { rejectWithValue }) => {
  try {
    const response = await sprintService.fetchSprints(projectId);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || err.message);
  }
});

export const createSprint = createAsyncThunk('sprint/createSprint', async ({ projectId, data }, { rejectWithValue }) => {
  try {
    const response = await sprintService.createSprint(projectId, data);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || err.message);
  }
});

export const updateSprint = createAsyncThunk('sprint/updateSprint', async ({ projectId, sprintId, data }, { rejectWithValue }) => {
  try {
    const response = await sprintService.updateSprint(projectId, sprintId, data);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || err.message);
  }
});

export const deleteSprint = createAsyncThunk('sprint/deleteSprint', async ({ projectId, sprintId }, { rejectWithValue }) => {
  try {
    await sprintService.deleteSprint(projectId, sprintId);
    return sprintId;
  } catch (err) {
    return rejectWithValue(err.response?.data || err.message);
  }
});

const sprintSlice = createSlice({
  name: 'sprint',
  initialState: {
    sprints: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSprints.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchSprints.fulfilled, (state, action) => { state.isLoading = false; state.sprints = action.payload; })
      .addCase(fetchSprints.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      
      .addCase(createSprint.fulfilled, (state, action) => { state.sprints.push(action.payload); })
      
      .addCase(updateSprint.fulfilled, (state, action) => {
        const index = state.sprints.findIndex(s => s._id === action.payload._id);
        if (index !== -1) state.sprints[index] = action.payload;
      })
      
      .addCase(deleteSprint.fulfilled, (state, action) => {
        state.sprints = state.sprints.filter(s => s._id !== action.payload);
      });
  }
});

export default sprintSlice.reducer;
