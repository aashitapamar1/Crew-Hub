import api from './api'

export function listClients(params) {
  return api.get('/clients', { params }).then((res) => res.data)
}

export function getClient(id) {
  return api.get(`/clients/${id}`).then((res) => res.data)
}

export function createClient(data) {
  return api.post('/clients', data).then((res) => res.data)
}

export function updateClient(id, data) {
  return api.put(`/clients/${id}`, data).then((res) => res.data)
}

export function archiveClient(id) {
  return api.patch(`/clients/${id}/archive`).then((res) => res.data)
}
