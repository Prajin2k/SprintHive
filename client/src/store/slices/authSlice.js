import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';

// ── Initial state ───────────────────────────────────────────────
const initialState = {
  user: null,
  accessToken: null,      // in memory only — NOT localStorage
  isAuthenticated: false,
  isInitialized: false,   // true after first refresh check on mount
  isLoading: false,
  error: null,
};

// ─────────────────────────────────────────────────────────────────
// Async Thunks
// ─────────────────────────────────────────────────────────────────

/** Called on every app load to restore session from httpOnly cookie */
export const initAuth = createAsyncThunk('auth/initAuth', async (_, { rejectWithValue }) => {
  try {
    const data = await authService.refresh();
    return data;
  } catch {
    return rejectWithValue(null); // not an error — just no active session
  }
});

export const registerUser = createAsyncThunk(
  'auth/register',
  async (formData, { rejectWithValue }) => {
    try {
      return await authService.register(formData);
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Registration failed' });
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      return await authService.login(credentials);
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Login failed' });
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await authService.logout();
  } catch (_) {
    // Logout errors are non-fatal — always clear local state
  }
});

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (updates, { rejectWithValue }) => {
    try {
      return await authService.updateMe(updates);
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Update failed' });
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (data, { rejectWithValue }) => {
    try {
      return await authService.changePassword(data);
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Password change failed' });
    }
  }
);

export const uploadAvatar = createAsyncThunk(
  'auth/uploadAvatar',
  async (formData, { rejectWithValue }) => {
    try {
      return await authService.uploadAvatar(formData);
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Upload failed' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────
// Slice
// ─────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Synchronous credential update (used by axios interceptor after refresh)
    setCredentials(state, action) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
    },
    // Force clear (used by axios interceptor on unrecoverable 401)
    clearAuth(state) {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ── initAuth ─────────────────────────────────────────────────
    builder
      .addCase(initAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initAuth.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.isInitialized = true;
        state.isLoading = false;
      })
      .addCase(initAuth.rejected, (state) => {
        state.isInitialized = true; // even if no session, we're done initializing
        state.isLoading = false;
        state.isAuthenticated = false;
      });

    // ── login ────────────────────────────────────────────────────
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // ── register ─────────────────────────────────────────────────
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // ── logout ───────────────────────────────────────────────────
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        // Still clear state on logout error
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
      });

    // ── updateProfile ────────────────────────────────────────────
    builder
      .addCase(updateProfile.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isLoading = false;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // ── changePassword ───────────────────────────────────────────
    builder
      .addCase(changePassword.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(changePassword.fulfilled, (state) => {
        // Password changed — clear auth (force re-login)
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // ── uploadAvatar ─────────────────────────────────────────────
    builder
      .addCase(uploadAvatar.pending, (state) => { state.isLoading = true; })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        if (state.user) state.user = action.payload.user;
        state.isLoading = false;
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setCredentials, clearAuth, clearError } = authSlice.actions;

// ── Selectors ───────────────────────────────────────────────────
export const selectCurrentUser = (state) => state.auth.user;
export const selectAccessToken = (state) => state.auth.accessToken;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsInitialized = (state) => state.auth.isInitialized;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
