import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationService } from '../../services/notificationService';

export const fetchNotifications = createAsyncThunk('notification/fetchNotifications', async (_, { rejectWithValue }) => {
  try {
    const response = await notificationService.fetchNotifications();
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || err.message);
  }
});

export const fetchUnreadCount = createAsyncThunk('notification/fetchUnreadCount', async (_, { rejectWithValue }) => {
  try {
    const response = await notificationService.fetchUnreadCount();
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || err.message);
  }
});

export const markRead = createAsyncThunk('notification/markRead', async (id, { rejectWithValue }) => {
  try {
    await notificationService.markRead(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data || err.message);
  }
});

export const markAllRead = createAsyncThunk('notification/markAllRead', async (_, { rejectWithValue }) => {
  try {
    await notificationService.markAllRead();
    return true;
  } catch (err) {
    return rejectWithValue(err.response?.data || err.message);
  }
});

const notificationSlice = createSlice({
  name: 'notification',
  initialState: {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
  },
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchNotifications.fulfilled, (state, action) => { state.isLoading = false; state.notifications = action.payload.data || []; })
      .addCase(fetchNotifications.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      
      .addCase(fetchUnreadCount.fulfilled, (state, action) => { state.unreadCount = action.payload.data?.count || 0; })
      
      .addCase(markRead.fulfilled, (state, action) => {
        const notif = state.notifications.find(n => n._id === action.payload);
        if (notif && !notif.read) {
          notif.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      
      .addCase(markAllRead.fulfilled, (state) => {
        state.notifications.forEach(n => { n.read = true; });
        state.unreadCount = 0;
      });
  }
});

export const { addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
