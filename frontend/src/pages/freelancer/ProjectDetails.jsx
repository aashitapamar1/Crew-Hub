import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as projectService from '../../services/projectService'
import * as taskService from '../../services/taskService'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import ProjectMessages from '../../components/ProjectMessages'

function ProjectDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [myTasks, setMyTasks] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    projectService
      .getProject(id)
      .then((res) => setProject(res.project))
      .catch(() => setError('Could not load project'))
    taskService.listTasks({ projectId: id }).then((res) => setMyTasks(res.tasks))
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
          <p className="text-gray-500">{project.client.companyName || project.client.user.name}</p>
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

      {project.description && (
        <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium text-gray-800">Description</h2>
          <p className="mt-2 text-sm text-gray-600">{project.description}</p>
        </section>
      )}

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-800">My tasks on this project</h2>
          <Link to="/freelancer/tasks" className="text-sm text-blue-600 hover:underline">View all my tasks</Link>
        </div>
        {myTasks.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No tasks assigned to you on this project yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {myTasks.map((t) => (
              <li key={t.id} className="flex justify-between">
                <Link to={`/freelancer/tasks/${t.id}`} className="text-blue-600 hover:underline">{t.title}</Link>
                <StatusBadge status={t.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-medium text-gray-800">Team</h2>
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

      <div className="mt-6">
        <ProjectMessages projectId={id} />
      </div>

      <button onClick={() => navigate('/freelancer/projects')} className="mt-6 text-sm text-blue-600 hover:underline">
        Back to my projects
      </button>
    </div>
  )
}

export default ProjectDetails
