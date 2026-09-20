import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as projectService from '../../services/projectService'
import * as fileService from '../../services/fileService'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import FileManager from '../../components/FileManager'
import ProjectMessages from '../../components/ProjectMessages'

function ProjectDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    projectService
      .getProject(id)
      .then((res) => setProject(res.project))
      .catch(() => setError('Could not load project'))
    fileService.listFiles({ projectId: id }).then((res) => setFiles(res.files))
  }, [id])

  if (error) {
    return <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
  }

  if (!project) {
    return <p className="text-gray-500">Loading...</p>
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">{project.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <PriorityBadge priority={project.priority} />
          <StatusBadge status={project.status} />
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Progress</span>
          <span>{project.progress}%</span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div className="h-full rounded-full bg-blue-600" style={{ width: `${project.progress}%` }} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <SummaryCard label="Deadline" value={project.deadline ? new Date(project.deadline).toLocaleDateString() : '-'} />
        <SummaryCard label="Tasks completed" value={`${project.completedTasks} / ${project.totalTasks}`} />
      </div>

      {project.description && (
        <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium text-gray-800">Description</h2>
          <p className="mt-2 text-sm text-gray-600">{project.description}</p>
        </section>
      )}

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-medium text-gray-800">Project team</h2>
        {project.members.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No team members assigned yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {project.members.map((m) => (
              <li key={m.id} className="flex justify-between">
                <span className="text-gray-800">{m.freelancer.user.name}</span>
                <span className="text-gray-500">{m.role || m.freelancer.title || 'Team member'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-medium text-gray-800">Milestones</h2>
        {project.milestones.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No milestones yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {project.milestones.map((m) => (
              <li key={m.id} className="flex items-center gap-2">
                <span className={m.isCompleted ? 'text-green-600' : 'text-gray-400'}>
                  {m.isCompleted ? '✓' : '○'}
                </span>
                <span className={m.isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}>{m.title}</span>
                {m.dueDate && <span className="text-gray-400">({new Date(m.dueDate).toLocaleDateString()})</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6">
        <FileManager title="Files" files={files} emptyText="No files shared yet." />
      </div>

      <div className="mt-6">
        <ProjectMessages projectId={id} />
      </div>

      <button onClick={() => navigate('/client/projects')} className="mt-6 text-sm text-blue-600 hover:underline">
        Back to my projects
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
