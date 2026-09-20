import api from './api'

export function getStats() {
  return api.get('/dashboard/stats').then((res) => res.data)
}

export function getRecentActivity() {
  return api.get('/dashboard/recent-activity').then((res) => res.data)
}
