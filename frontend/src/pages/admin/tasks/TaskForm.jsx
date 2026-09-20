import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import * as taskService from '../../../services/taskService'
import * as projectService from '../../../services/projectService'

const EMPTY_FORM = {
  title: '',
  description: '',
  projectId: '',
  freelancerId: '',
  priority: 'MEDIUM',
  dueDate: '',
}

function toDateInput(value) {
  return value ? value.slice(0, 10) : ''
}

function TaskForm() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState({ ...EMPTY_FORM, projectId: searchParams.get('projectId') || '' })
  const [projects, setProjects] = useState([])
  const [projectMembers, setProjectMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProjects = projectService.listProjects({ limit: 100 }).then((res) => setProjects(res.projects))
    const loadTask = isEdit
      ? taskService.getTask(id).then((res) => {
          const t = res.task
          setForm({
            title: t.title || '',
            description: t.description || '',
            projectId: t.project.id,
            freelancerId: t.freelancer?.id || '',
            priority: t.priority,
            dueDate: toDateInput(t.dueDate),
          })
        })
      : Promise.resolve()

    Promise.all([loadProjects, loadTask])
      .catch(() => setError('Could not load form data'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  useEffect(() => {
    if (!form.projectId) {
      setProjectMembers([])
      return
    }
    projectService
      .getProject(form.projectId)
      .then((res) => setProjectMembers(res.project.members))
      .catch(() => setProjectMembers([]))
  }, [form.projectId])

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const payload = { ...form, freelancerId: form.freelancerId || null }
      if (isEdit) {
        const { projectId, ...updatable } = payload
        const updated = await taskService.updateTask(id, updatable)
        navigate(`/tasks/${updated.task.id}`)
      } else {
        const created = await taskService.createTask(payload)
        navigate(`/tasks/${created.task.id}`)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save task')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="text-gray-500">Loading...</p>
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-800">{isEdit ? 'Edit Task' : 'Create Task'}</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              value={form.title}
              onChange={handleChange('title')}
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
            <label className="block text-sm font-medium text-gray-700">Project</label>
            <select
              value={form.projectId}
              onChange={handleChange('projectId')}
              required
              disabled={isEdit}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
            >
              <option value="">Select a project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Assign to</label>
            <select
              value={form.freelancerId}
              onChange={handleChange('freelancerId')}
              disabled={!form.projectId}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
            >
              <option value="">Unassigned</option>
              {projectMembers.map((m) => (
                <option key={m.freelancer.id} value={m.freelancer.id}>{m.freelancer.user.name}</option>
              ))}
            </select>
            {form.projectId && projectMembers.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">This project has no team members yet. Assign freelancers to the project first.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700">Due date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={handleChange('dueDate')}
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
          {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create task'}
        </button>
      </form>
    </div>
  )
}

export default TaskForm
