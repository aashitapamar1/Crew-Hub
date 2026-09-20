import api from './api'

export function listFreelancers(params) {
  return api.get('/freelancers', { params }).then((res) => res.data)
}

export function getFreelancer(id) {
  return api.get(`/freelancers/${id}`).then((res) => res.data)
}

export function createFreelancer(data) {
  return api.post('/freelancers', data).then((res) => res.data)
}

export function updateFreelancer(id, data) {
  return api.put(`/freelancers/${id}`, data).then((res) => res.data)
}

export function archiveFreelancer(id) {
  return api.patch(`/freelancers/${id}/archive`).then((res) => res.data)
}
