import api from './api'

export function listTasks(params) {
  return api.get('/tasks', { params }).then((res) => res.data)
}

export function getTask(id) {
  return api.get(`/tasks/${id}`).then((res) => res.data)
}

export function createTask(data) {
  return api.post('/tasks', data).then((res) => res.data)
}

export function updateTask(id, data) {
  return api.put(`/tasks/${id}`, data).then((res) => res.data)
}

export function updateTaskStatus(id, status) {
  return api.patch(`/tasks/${id}/status`, { status }).then((res) => res.data)
}

export function deleteTask(id) {
  return api.delete(`/tasks/${id}`).then((res) => res.data)
}
