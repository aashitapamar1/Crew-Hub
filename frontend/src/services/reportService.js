import api from './api'

export function getProjectReport() {
  return api.get('/reports/projects').then((res) => res.data)
}

export function getTaskReport() {
  return api.get('/reports/tasks').then((res) => res.data)
}

export function getFreelancerReport() {
  return api.get('/reports/freelancers').then((res) => res.data)
}

export function getClientReport() {
  return api.get('/reports/clients').then((res) => res.data)
}
