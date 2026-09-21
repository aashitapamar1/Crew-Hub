import { useEffect, useState } from 'react'
import * as projectService from '../../services/projectService'
import * as feedbackService from '../../services/feedbackService'
import StarRating from '../../components/StarRating'

function Feedback() {
  const [projects, setProjects] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [projectId, setProjectId] = useState('')
  const [rating, setRating] = useState(0)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  function loadHistory() {
    feedbackService.listFeedback().then((res) => setHistory(res.feedback))
  }

  useEffect(() => {
    projectService
      .listProjects()
      .then((res) => setProjects(res.projects))
      .catch(() => setError('Could not load your projects'))
      .finally(() => setLoading(false))
    loadHistory()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!projectId || !content.trim()) return
    setError('')
    setMessage('')
    setSubmitting(true)
    try {
      await feedbackService.createFeedback(projectId, content.trim(), rating || undefined)
      setMessage('Thank you — your feedback has been sent.')
      setContent('')
      setRating(0)
      loadHistory()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="text-gray-500">Loading...</p>
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-800">Feedback</h1>
      <p className="mt-1 text-gray-500">Share how a project is going. Your agency team will see this.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {message && <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{message}</div>}

        {projects.length === 0 ? (
          <p className="text-sm text-gray-500">You don't have any projects yet.</p>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select a project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Rating (optional)</label>
              <div className="mt-1">
                <StarRating value={rating} onChange={setRating} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Your feedback</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={4}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Send Feedback'}
            </button>
          </>
        )}
      </form>

      <div className="mt-6">
        <h2 className="text-lg font-medium text-gray-800">Your feedback history</h2>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">You haven't submitted any feedback yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {history.map((f) => (
              <li key={f.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">{f.project?.name}</span>
                  {f.rating && <StarRating value={f.rating} readOnly />}
                </div>
                <p className="mt-2 text-sm text-gray-600">{f.content}</p>
                <p className="mt-1 text-xs text-gray-400">{new Date(f.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default Feedback
