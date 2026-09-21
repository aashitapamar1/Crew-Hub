import api from './api'

export function listFeedback(projectId) {
  return api.get('/feedback', { params: projectId ? { projectId } : {} }).then((res) => res.data)
}

export function createFeedback(projectId, content, rating) {
  return api.post('/feedback', { projectId, content, rating }).then((res) => res.data)
}
