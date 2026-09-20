import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as projectService from '../../../services/projectService'
import * as freelancerService from '../../../services/freelancerService'
import * as fileService from '../../../services/fileService'
import StatusBadge from '../../../components/StatusBadge'
import PriorityBadge from '../../../components/PriorityBadge'
import FileManager from '../../../components/FileManager'
import ProjectMessages from '../../../components/ProjectMessages'

const STATUS_OPTIONS = ['PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']

function ProjectDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [freelancers, setFreelancers] = useState([])
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')

  const [newMemberId, setNewMemberId] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('')

  const [milestoneTitle, setMilestoneTitle] = useState('')
  const [milestoneDueDate, setMilestoneDueDate] = useState('')

  function loadProject() {
    return projectService.getProject(id).then((res) => setProject(res.project))
  }

  useEffect(() => {
    Promise.all([loadProject(), freelancerService.listFreelancers({ limit: 100 })])
      .then(([, freelancerRes]) => setFreelancers(freelancerRes.freelancers))
      .catch(() => setError('Could not load project'))
    loadFiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function loadFiles() {
    fileService.listFiles({ projectId: id }).then((res) => setFiles(res.files))
  }

  async function handleUploadFile(file) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('projectId', id)
    await fileService.uploadFile(formData)
    loadFiles()
  }

  async function handleDeleteFile(fileId) {
    await fileService.deleteFile(fileId)
    loadFiles()
  }

  async function handleStatusChange(e) {
    try {
      await projectService.updateProjectStatus(id, e.target.value)
      await loadProject()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update status')
    }
  }

  async function handleAddMember(e) {
    e.preventDefault()
    if (!newMemberId) return
    try {
      await projectService.addMember(id, { freelancerId: newMemberId, role: newMemberRole || undefined })
      setNewMemberId('')
      setNewMemberRole('')
      await loadProject()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add team member')
    }
  }

  async function handleRemoveMember(memberId) {
    try {
      await projectService.removeMember(id, memberId)
      await loadProject()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove team member')
    }
  }

  async function handleAddMilestone(e) {
    e.preventDefault()
    if (!milestoneTitle) return
    try {
      await projectService.createMilestone(id, { title: milestoneTitle, dueDate: milestoneDueDate || undefined })
      setMilestoneTitle('')
      setMilestoneDueDate('')
      await loadProject()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add milestone')
    }
  }

  async function handleToggleMilestone(milestoneId) {
    try {
      await projectService.toggleMilestone(milestoneId)
      await loadProject()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update milestone')
    }
  }

  async function handleDeleteMilestone(milestoneId) {
    try {
      await projectService.deleteMilestone(milestoneId)
      await loadProject()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete milestone')
    }
  }

  if (!project) {
    return error ? (
      <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
    ) : (
      <p className="text-gray-500">Loading...</p>
    )
  }

  const assignedFreelancerIds = new Set(project.members.map((m) => m.freelancer.id))
  const availableToAssign = freelancers.filter((f) => !assignedFreelancerIds.has(f.id) && f.status !== 'ARCHIVED')

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">{project.name}</h1>
          <p className="text-gray-500">
            {project.client.companyName || project.client.user.name} · {project.client.user.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PriorityBadge priority={project.priority} />
          <select
            value={project.status}
            onChange={handleStatusChange}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
          <Link to={`/projects/${id}/edit`} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
            Edit
          </Link>
        </div>
      </div>

      {error && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="mt-6">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Progress</span>
          <span>{project.progress}%</span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div className="h-full rounded-full bg-blue-600" style={{ width: `${project.progress}%` }} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-4">
        <SummaryCard label="Budget" value={project.budget ? `₹${project.budget.toLocaleString()}` : '-'} />
        <SummaryCard label="Deadline" value={project.deadline ? new Date(project.deadline).toLocaleDateString() : '-'} />
        <SummaryCard label="Total Tasks" value={project.totalTasks} />
        <SummaryCard label="Completed Tasks" value={project.completedTasks} />
      </div>

      {project.description && (
        <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium text-gray-800">Description</h2>
          <p className="mt-2 text-sm text-gray-600">{project.description}</p>
        </section>
      )}

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-medium text-gray-800">Team</h2>

        {project.members.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No freelancers assigned yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {project.members.map((m) => (
              <li key={m.id} className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2 text-sm">
                <span>
                  <span className="font-medium text-gray-800">{m.freelancer.user.name}</span>
                  <span className="text-gray-500"> — {m.role || m.freelancer.title || 'Team member'}</span>
                </span>
                <button onClick={() => handleRemoveMember(m.id)} className="text-red-600 hover:underline">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAddMember} className="mt-4 flex gap-2">
          <select
            value={newMemberId}
            onChange={(e) => setNewMemberId(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select a freelancer</option>
            {availableToAssign.map((f) => (
              <option key={f.id} value={f.id}>{f.user.name} {f.title ? `(${f.title})` : ''}</option>
            ))}
          </select>
          <input
            placeholder="Role (optional)"
            value={newMemberRole}
            onChange={(e) => setNewMemberRole(e.target.value)}
            className="w-40 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Assign
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-800">Tasks</h2>
          <Link to={`/tasks/new?projectId=${id}`} className="text-sm text-blue-600 hover:underline">
            Add Task
          </Link>
        </div>

        {project.tasks.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No tasks yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {project.tasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2 text-sm">
                <Link to={`/tasks/${t.id}`} className="text-gray-800 hover:underline">{t.title}</Link>
                <StatusBadge status={t.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6">
        <FileManager
          title="Files"
          files={files}
          onUpload={handleUploadFile}
          onDelete={handleDeleteFile}
          emptyText="No files uploaded yet."
        />
      </div>

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-medium text-gray-800">Milestones</h2>

        {project.milestones.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No milestones yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {project.milestones.map((m) => (
              <li key={m.id} className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={m.isCompleted} onChange={() => handleToggleMilestone(m.id)} />
                  <span className={m.isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}>{m.title}</span>
                  {m.dueDate && <span className="text-gray-400">({new Date(m.dueDate).toLocaleDateString()})</span>}
                </label>
                <button onClick={() => handleDeleteMilestone(m.id)} className="text-red-600 hover:underline">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAddMilestone} className="mt-4 flex gap-2">
          <input
            placeholder="Milestone title"
            value={milestoneTitle}
            onChange={(e) => setMilestoneTitle(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <input
            type="date"
            value={milestoneDueDate}
            onChange={(e) => setMilestoneDueDate(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Add
          </button>
        </form>
      </section>

      <div className="mt-6">
        <ProjectMessages projectId={id} />
      </div>

      <button onClick={() => navigate('/projects')} className="mt-6 text-sm text-blue-600 hover:underline">
        Back to projects
      </button>
    </div>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-gray-800">{value}</p>
    </div>
  )
}

export default ProjectDetails
