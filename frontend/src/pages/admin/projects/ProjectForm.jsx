import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as projectService from '../../../services/projectService'
import * as clientService from '../../../services/clientService'

const EMPTY_FORM = {
  name: '',
  description: '',
  clientId: '',
  budget: '',
  startDate: '',
  deadline: '',
  priority: 'MEDIUM',
}

function toDateInput(value) {
  return value ? value.slice(0, 10) : ''
}

function ProjectForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_FORM)
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadClients = clientService.listClients({ status: 'ACTIVE', limit: 100 }).then((res) => setClients(res.clients))
    const loadProject = isEdit
      ? projectService.getProject(id).then((res) => {
          const p = res.project
          setForm({
            name: p.name || '',
            description: p.description || '',
            clientId: p.client.id,
            budget: p.budget ?? '',
            startDate: toDateInput(p.startDate),
            deadline: toDateInput(p.deadline),
            priority: p.priority,
          })
        })
      : Promise.resolve()

    Promise.all([loadClients, loadProject])
      .catch(() => setError('Could not load form data'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (isEdit) {
        const updated = await projectService.updateProject(id, form)
        navigate(`/projects/${updated.project.id}`)
      } else {
        const created = await projectService.createProject(form)
        navigate(`/projects/${created.project.id}`)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save project')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="text-gray-500">Loading...</p>
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-800">{isEdit ? 'Edit Project' : 'Create Project'}</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Project name</label>
            <input
              value={form.name}
              onChange={handleChange('name')}
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={form.description}
              onChange={handleChange('description')}
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Client</label>
            <select
              value={form.clientId}
              onChange={handleChange('clientId')}
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select a client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName || c.user.name} — {c.user.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Budget</label>
              <input
                type="number"
                value={form.budget}
                onChange={handleChange('budget')}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <select
                value={form.priority}
                onChange={handleChange('priority')}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={handleChange('startDate')}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={handleChange('deadline')}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create project'}
        </button>
      </form>
    </div>
  )
}

export default ProjectForm
