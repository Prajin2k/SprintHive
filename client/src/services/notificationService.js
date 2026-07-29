import api from './api';

export const notificationService = {
  fetchNotifications: () => api.get('/notifications'),
  fetchUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};
