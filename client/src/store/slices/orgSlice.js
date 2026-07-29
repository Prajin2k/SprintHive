import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import orgService from '../../services/orgService';

const ACTIVE_ORG_KEY = 'sh_active_org_id';

// ── Initial state ───────────────────────────────────────────────
const initialState = {
  myOrgs: [],               // all orgs user belongs to (each has .userRole)
  activeOrg: null,          // full org object currently selected
  activeOrgId: localStorage.getItem(ACTIVE_ORG_KEY) || null,
  userOrgRole: null,        // current user's role in activeOrg
  pendingInvites: [],       // pending invites for activeOrg (owner/manager view)
  isLoading: false,
  isMembersLoading: false,
  error: null,
};

// ── Helpers ─────────────────────────────────────────────────────
const persistActiveOrg = (orgId) => {
  if (orgId) localStorage.setItem(ACTIVE_ORG_KEY, orgId);
  else localStorage.removeItem(ACTIVE_ORG_KEY);
};

// ── Thunks ──────────────────────────────────────────────────────

/** Fetch all orgs the user belongs to, then restore or set the active one */
export const fetchMyOrgs = createAsyncThunk(
  'org/fetchMyOrgs',
  async (_, { getState, rejectWithValue }) => {
    try {
      const data = await orgService.getMyOrganizations();
      return { orgs: data.organizations, savedOrgId: getState().org.activeOrgId };
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to load organizations' });
    }
  }
);

export const createOrganization = createAsyncThunk(
  'org/create',
  async (formData, { rejectWithValue }) => {
    try {
      return await orgService.createOrganization(formData);
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to create organization' });
    }
  }
);

export const fetchOrgDetails = createAsyncThunk(
  'org/fetchDetails',
  async (orgId, { rejectWithValue }) => {
    try {
      return await orgService.getOrganization(orgId);
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to load organization' });
    }
  }
);

export const inviteMember = createAsyncThunk(
  'org/inviteMember',
  async ({ orgId, email, role }, { rejectWithValue }) => {
    try {
      return await orgService.inviteMember(orgId, { email, role });
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Invite failed' });
    }
  }
);

export const removeMember = createAsyncThunk(
  'org/removeMember',
  async ({ orgId, userId }, { rejectWithValue }) => {
    try {
      await orgService.removeMember(orgId, userId);
      return userId;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Remove failed' });
    }
  }
);

export const updateMemberRole = createAsyncThunk(
  'org/updateMemberRole',
  async ({ orgId, userId, role }, { rejectWithValue }) => {
    try {
      await orgService.updateMemberRole(orgId, userId, { role });
      return { userId, role };
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Role update failed' });
    }
  }
);

export const deleteOrganization = createAsyncThunk(
  'org/delete',
  async (orgId, { rejectWithValue }) => {
    try {
      await orgService.deleteOrganization(orgId);
      return orgId;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Delete failed' });
    }
  }
);

export const fetchPendingInvites = createAsyncThunk(
  'org/fetchPendingInvites',
  async (orgId, { rejectWithValue }) => {
    try {
      const data = await orgService.getPendingInvites(orgId);
      return data.invites;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to load invites' });
    }
  }
);

export const revokeInvite = createAsyncThunk(
  'org/revokeInvite',
  async ({ orgId, inviteId }, { rejectWithValue }) => {
    try {
      await orgService.revokeInvite(orgId, inviteId);
      return inviteId;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Revoke failed' });
    }
  }
);

// ── Slice ────────────────────────────────────────────────────────
const orgSlice = createSlice({
  name: 'org',
  initialState,
  reducers: {
    /**
     * Synchronously switch active org.
     * Called from OrgSwitcher component when user picks a different org.
     */
    switchActiveOrg(state, action) {
      const org = action.payload; // full org object
      state.activeOrg = org;
      state.activeOrgId = org._id;
      state.userOrgRole = org.userRole || null;
      persistActiveOrg(org._id);
    },
    clearOrgState(state) {
      state.myOrgs = [];
      state.activeOrg = null;
      state.activeOrgId = null;
      state.userOrgRole = null;
      persistActiveOrg(null);
    },
  },
  extraReducers: (builder) => {
    // ── fetchMyOrgs ──────────────────────────────────────────────
    builder
      .addCase(fetchMyOrgs.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchMyOrgs.fulfilled, (state, action) => {
        const { orgs, savedOrgId } = action.payload;
        state.myOrgs = orgs;
        state.isLoading = false;

        if (orgs.length === 0) {
          state.activeOrg = null;
          state.activeOrgId = null;
          state.userOrgRole = null;
          persistActiveOrg(null);
          return;
        }

        // Restore the previously selected org (or fall back to first)
        const saved = savedOrgId ? orgs.find((o) => o._id === savedOrgId) : null;
        const toActivate = saved || orgs[0];
        state.activeOrg = toActivate;
        state.activeOrgId = toActivate._id;
        state.userOrgRole = toActivate.userRole || null;
        persistActiveOrg(toActivate._id);
      })
      .addCase(fetchMyOrgs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // ── createOrganization ───────────────────────────────────────
    builder
      .addCase(createOrganization.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(createOrganization.fulfilled, (state, action) => {
        const newOrg = action.payload.organization;
        state.myOrgs.unshift(newOrg);
        state.activeOrg = newOrg;
        state.activeOrgId = newOrg._id;
        state.userOrgRole = 'owner';
        persistActiveOrg(newOrg._id);
        state.isLoading = false;
      })
      .addCase(createOrganization.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // ── fetchOrgDetails ──────────────────────────────────────────
    builder
      .addCase(fetchOrgDetails.pending, (state) => { state.isMembersLoading = true; })
      .addCase(fetchOrgDetails.fulfilled, (state, action) => {
        const org = action.payload.organization;
        state.activeOrg = org;
        state.userOrgRole = org.userRole || state.userOrgRole;
        state.isMembersLoading = false;
      })
      .addCase(fetchOrgDetails.rejected, (state) => { state.isMembersLoading = false; });

    // ── removeMember ─────────────────────────────────────────────
    builder
      .addCase(removeMember.fulfilled, (state, action) => {
        const removedUserId = action.payload;
        if (state.activeOrg?.members) {
          state.activeOrg.members = state.activeOrg.members.filter(
            (m) => m.user._id !== removedUserId && m.user !== removedUserId
          );
        }
      });

    // ── updateMemberRole ─────────────────────────────────────────
    builder
      .addCase(updateMemberRole.fulfilled, (state, action) => {
        const { userId, role } = action.payload;
        if (state.activeOrg?.members) {
          const member = state.activeOrg.members.find(
            (m) => (m.user._id || m.user) === userId
          );
          if (member) member.role = role;
        }
      });

    // ── deleteOrganization ───────────────────────────────────────
    builder
      .addCase(deleteOrganization.fulfilled, (state, action) => {
        const deletedId = action.payload;
        state.myOrgs = state.myOrgs.filter((o) => o._id !== deletedId);
        if (state.activeOrgId === deletedId) {
          const next = state.myOrgs[0] || null;
          state.activeOrg = next;
          state.activeOrgId = next?._id || null;
          state.userOrgRole = next?.userRole || null;
          persistActiveOrg(next?._id || null);
        }
      });

    // ── fetchPendingInvites ──────────────────────────────────────
    builder
      .addCase(fetchPendingInvites.fulfilled, (state, action) => {
        state.pendingInvites = action.payload;
      });

    // ── revokeInvite ─────────────────────────────────────────────
    builder
      .addCase(revokeInvite.fulfilled, (state, action) => {
        state.pendingInvites = state.pendingInvites.filter((i) => i._id !== action.payload);
      });
  },
});

export const { switchActiveOrg, clearOrgState } = orgSlice.actions;

// ── Selectors ────────────────────────────────────────────────────
export const selectMyOrgs = (state) => state.org.myOrgs;
export const selectActiveOrg = (state) => state.org.activeOrg;
export const selectUserOrgRole = (state) => state.org.userOrgRole;
export const selectOrgLoading = (state) => state.org.isLoading;
export const selectOrgMembersLoading = (state) => state.org.isMembersLoading;
export const selectPendingInvites = (state) => state.org.pendingInvites;
export const selectHasOrgs = (state) => state.org.myOrgs.length > 0;

export default orgSlice.reducer;
