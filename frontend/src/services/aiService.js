import api from './api'

export function recommendFreelancers(projectId, requiredSkills) {
  return api.post(`/ai/projects/${projectId}/recommend-freelancers`, { requiredSkills }).then((res) => res.data)
}

export function getProjectDelayRisk(projectId) {
  return api.get(`/ai/projects/${projectId}/delay-risk`).then((res) => res.data)
}

export function getWorkloadAnalysis() {
  return api.get('/ai/workload').then((res) => res.data)
}
