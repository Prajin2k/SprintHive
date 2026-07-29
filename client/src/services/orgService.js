import api from './api';

const orgService = {
  createOrganization: async (data) => {
    const res = await api.post('/organizations', data);
    return res.data;
  },

  getMyOrganizations: async () => {
    const res = await api.get('/organizations');
    return res.data;
  },

  getOrganization: async (orgId) => {
    const res = await api.get(`/organizations/${orgId}`);
    return res.data;
  },

  inviteMember: async (orgId, data) => {
    const res = await api.post(`/organizations/${orgId}/invite`, data);
    return res.data;
  },

  removeMember: async (orgId, userId) => {
    const res = await api.delete(`/organizations/${orgId}/members/${userId}`);
    return res.data;
  },

  updateMemberRole: async (orgId, userId, data) => {
    const res = await api.patch(`/organizations/${orgId}/members/${userId}`, data);
    return res.data;
  },

  deleteOrganization: async (orgId) => {
    const res = await api.delete(`/organizations/${orgId}`);
    return res.data;
  },

  getPendingInvites: async (orgId) => {
    const res = await api.get(`/organizations/${orgId}/invites`);
    return res.data;
  },

  revokeInvite: async (orgId, inviteId) => {
    const res = await api.delete(`/organizations/${orgId}/invites/${inviteId}`);
    return res.data;
  },

  getInviteInfo: async (token) => {
    const res = await api.get(`/organizations/invites/${token}`);
    return res.data;
  },

  acceptInvite: async (token) => {
    const res = await api.post(`/organizations/invites/${token}/accept`);
    return res.data;
  },
};

export default orgService;
