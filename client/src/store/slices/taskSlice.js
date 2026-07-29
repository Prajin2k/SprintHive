import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { taskService } from '../../services/taskService';

export const fetchTasks = createAsyncThunk('task/fetchTasks', async ({ projectId, filters }, { rejectWithValue }) => {
  try {
    const response = await taskService.fetchTasks(projectId, filters);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || err.message);
  }
});

export const createTask = createAsyncThunk('task/createTask', async ({ projectId, data }, { rejectWithValue }) => {
  try {
    const response = await taskService.createTask(projectId, data);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || err.message);
  }
});

export const updateTask = createAsyncThunk('task/updateTask', async ({ projectId, taskId, data }, { rejectWithValue }) => {
  try {
    const response = await taskService.updateTask(projectId, taskId, data);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || err.message);
  }
});

export const deleteTask = createAsyncThunk('task/deleteTask', async ({ projectId, taskId }, { rejectWithValue }) => {
  try {
    await taskService.deleteTask(projectId, taskId);
    return taskId;
  } catch (err) {
    return rejectWithValue(err.response?.data || err.message);
  }
});

export const setTaskStatus = createAsyncThunk('task/setTaskStatus', async ({ projectId, taskId, status }, { rejectWithValue }) => {
  try {
    const response = await taskService.setTaskStatus(projectId, taskId, status);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || err.message);
  }
});

const taskSlice = createSlice({
  name: 'task',
  initialState: {
    tasks: [],
    activeTask: null,
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchTasks.fulfilled, (state, action) => { state.isLoading = false; state.tasks = action.payload; })
      .addCase(fetchTasks.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      
      .addCase(createTask.fulfilled, (state, action) => { state.tasks.push(action.payload); })
      
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(t => t._id === action.payload._id);
        if (index !== -1) state.tasks[index] = action.payload;
      })
      .addCase(setTaskStatus.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(t => t._id === action.payload._id);
        if (index !== -1) state.tasks[index] = action.payload;
      })
      
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(t => t._id !== action.payload);
      });
  }
});

export const selectTasks = (state) => state.task?.tasks || [];
export const selectTaskLoading = (state) => state.task?.isLoading || false;

export const selectTasksByStatus = createSelector([selectTasks], (tasks) => {
  const grouped = {
    backlog: [],
    todo: [],
    'in-progress': [],
    'code-review': [],
    testing: [],
    completed: []
  };
  tasks.forEach(t => {
    if (grouped[t.status]) {
      grouped[t.status].push(t);
    } else {
      grouped.backlog.push(t);
    }
  });
  return grouped;
});

export default taskSlice.reducer;
