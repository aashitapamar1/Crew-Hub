import { useEffect, useState } from 'react'
import * as projectService from '../../services/projectService'
import * as aiService from '../../services/aiService'

const RISK_COLORS = {
  LOW: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-red-100 text-red-700',
}
const WORKLOAD_LABELS = {
  UNDER_UTILIZED: 'Under-utilized',
  NORMAL: 'Normal',
  OVERLOADED: 'Overloaded',
}
const WORKLOAD_COLORS = {
  UNDER_UTILIZED: 'bg-gray-100 text-gray-700',
  NORMAL: 'bg-green-100 text-green-700',
  OVERLOADED: 'bg-red-100 text-red-700',
}

function AIInsights() {
  const [projects, setProjects] = useState([])
  const [error, setError] = useState('')

  const [recProjectId, setRecProjectId] = useState('')
  const [requiredSkills, setRequiredSkills] = useState('')
  const [recommendations, setRecommendations] = useState(null)
  const [recLoading, setRecLoading] = useState(false)

  const [risks, setRisks] = useState({})

  const [workload, setWorkload] = useState(null)
  const [workloadError, setWorkloadError] = useState('')

  useEffect(() => {
    projectService.listProjects({ limit: 100 }).then((res) => setProjects(res.projects)).catch(() => setError('Could not load projects'))
    aiService
      .getWorkloadAnalysis()
      .then((res) => setWorkload(res.workload))
      .catch(() => setWorkloadError('AI service is unavailable'))
  }, [])

  async function handleGetRecommendations(e) {
    e.preventDefault()
    if (!recProjectId) return
    setRecLoading(true)
    setError('')
    try {
      const skillsArray = requiredSkills.split(',').map((s) => s.trim()).filter(Boolean)
      const res = await aiService.recommendFreelancers(recProjectId, skillsArray)
      setRecommendations(res.recommendations)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not get recommendations')
      setRecommendations(null)
    } finally {
      setRecLoading(false)
    }
  }

  async function handleCheckRisk(projectId) {
    setRisks((prev) => ({ ...prev, [projectId]: { loading: true } }))
    try {
      const res = await aiService.getProjectDelayRisk(projectId)
      setRisks((prev) => ({ ...prev, [projectId]: res.prediction }))
    } catch (err) {
      setRisks((prev) => ({ ...prev, [projectId]: { error: true } }))
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800">AI Insights</h1>
      <p className="mt-1 text-gray-500">
        AI-generated recommendations and predictions to support your decisions — not automatic actions.
      </p>

      {error && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {/* Freelancer recommendation */}
      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-medium text-gray-800">Freelancer recommendation</h2>
        <p className="mt-1 text-sm text-gray-500">Find the best-matching freelancers for a project based on skills and current workload.</p>

        <form onSubmit={handleGetRecommendations} className="mt-4 flex flex-wrap gap-2">
          <select
            value={recProjectId}
            onChange={(e) => setRecProjectId(e.target.value)}
            required
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select a project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input
            value={requiredSkills}
            onChange={(e) => setRequiredSkills(e.target.value)}
            placeholder="Required skills (comma-separated)"
            className="w-72 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={recLoading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {recLoading ? 'Analyzing...' : 'Get Recommendations'}
          </button>
        </form>

        {recommendations && (
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2">Freelancer</th>
                  <th className="px-4 py-2">Match Score</th>
                  <th className="px-4 py-2">Skill Match</th>
                  <th className="px-4 py-2">Workload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recommendations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-gray-500">No available freelancers.</td>
                  </tr>
                ) : (
                  recommendations.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-2 font-medium text-gray-800">{r.name}</td>
                      <td className="px-4 py-2 text-gray-600">{Math.round(r.score * 100)}%</td>
                      <td className="px-4 py-2 text-gray-600">{Math.round(r.skillMatch * 100)}%</td>
                      <td className="px-4 py-2 text-gray-600">{Math.round((1 - r.workloadPenalty) * 100)}% free</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Project delay risk */}
      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-medium text-gray-800">Project delay risk</h2>
        <p className="mt-1 text-sm text-gray-500">Predicted risk of missing the deadline, based on task completion rate and time elapsed.</p>

        <div className="mt-4 overflow-hidden rounded-lg border border-gray-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Project</th>
                <th className="px-4 py-2">Risk</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-center text-gray-500">No projects yet.</td>
                </tr>
              ) : (
                projects.map((p) => {
                  const risk = risks[p.id]
                  return (
                    <tr key={p.id}>
                      <td className="px-4 py-2 font-medium text-gray-800">{p.name}</td>
                      <td className="px-4 py-2">
                        {!risk ? (
                          <span className="text-gray-400">—</span>
                        ) : risk.loading ? (
                          <span className="text-gray-400">Checking...</span>
                        ) : risk.error ? (
                          <span className="text-red-500">Unavailable</span>
                        ) : (
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${RISK_COLORS[risk.riskLevel]}`}>
                            {risk.riskLevel} ({Math.round(risk.riskScore * 100)}%)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => handleCheckRisk(p.id)} className="text-sm text-blue-600 hover:underline">
                          Check risk
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Workload analysis */}
      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-medium text-gray-800">Workload analysis</h2>
        <p className="mt-1 text-sm text-gray-500">Freelancers clustered by pending workload to spot under-utilized or overloaded team members.</p>

        {workloadError ? (
          <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{workloadError}</div>
        ) : !workload ? (
          <p className="mt-4 text-sm text-gray-500">Loading...</p>
        ) : workload.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No freelancers yet.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2">Freelancer</th>
                  <th className="px-4 py-2">Pending Tasks</th>
                  <th className="px-4 py-2">Workload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {workload.map((w) => (
                  <tr key={w.id}>
                    <td className="px-4 py-2 font-medium text-gray-800">{w.name}</td>
                    <td className="px-4 py-2 text-gray-600">{w.pendingTasks}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${WORKLOAD_COLORS[w.workload]}`}>
                        {WORKLOAD_LABELS[w.workload]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default AIInsights
