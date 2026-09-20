import api from './api'

export function listMessages(projectId) {
  return api.get('/messages', { params: { projectId } }).then((res) => res.data)
}

export function sendMessage(projectId, content) {
  return api.post('/messages', { projectId, content }).then((res) => res.data)
}
