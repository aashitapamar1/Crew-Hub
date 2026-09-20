import api from './api'

export function listFiles(params) {
  return api.get('/files', { params }).then((res) => res.data)
}

export function uploadFile(formData) {
  return api.post('/files', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((res) => res.data)
}

export function deleteFile(id) {
  return api.delete(`/files/${id}`).then((res) => res.data)
}

export function resolveFileUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//.test(url)) return url
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')
  return `${base}${url}`
}
