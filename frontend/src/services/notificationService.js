import api from './api'

export function listNotifications() {
  return api.get('/notifications').then((res) => res.data)
}

export function markAsRead(id) {
  return api.patch(`/notifications/${id}/read`).then((res) => res.data)
}

export function markAllAsRead() {
  return api.patch('/notifications/read-all').then((res) => res.data)
}
