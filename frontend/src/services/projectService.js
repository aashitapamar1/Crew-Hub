import api from './api'

export function listProjects(params) {
  return api.get('/projects', { params }).then((res) => res.data)
}

export function getProject(id) {
  return api.get(`/projects/${id}`).then((res) => res.data)
}

export function createProject(data) {
  return api.post('/projects', data).then((res) => res.data)
}

export function updateProject(id, data) {
  return api.put(`/projects/${id}`, data).then((res) => res.data)
}

export function updateProjectStatus(id, status) {
  return api.patch(`/projects/${id}/status`, { status }).then((res) => res.data)
}

export function addMember(id, data) {
  return api.post(`/projects/${id}/members`, data).then((res) => res.data)
}

export function removeMember(id, memberId) {
  return api.delete(`/projects/${id}/members/${memberId}`).then((res) => res.data)
}

export function createMilestone(id, data) {
  return api.post(`/projects/${id}/milestones`, data).then((res) => res.data)
}

export function toggleMilestone(milestoneId) {
  return api.patch(`/projects/milestones/${milestoneId}/toggle`).then((res) => res.data)
}

export function deleteMilestone(milestoneId) {
  return api.delete(`/projects/milestones/${milestoneId}`).then((res) => res.data)
}
