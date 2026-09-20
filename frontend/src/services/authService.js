import api from './api'

export function login(email, password) {
  return api.post('/auth/login', { email, password }).then((res) => res.data)
}

export function getMe() {
  return api.get('/auth/me').then((res) => res.data)
}

export function updateProfile(data) {
  return api.put('/auth/profile', data).then((res) => res.data)
}

export function changePassword(currentPassword, newPassword) {
  return api.put('/auth/change-password', { currentPassword, newPassword }).then((res) => res.data)
}

export function forgotPassword(email) {
  return api.post('/auth/forgot-password', { email }).then((res) => res.data)
}

export function resetPassword(token, newPassword) {
  return api.post(`/auth/reset-password/${token}`, { newPassword }).then((res) => res.data)
}
