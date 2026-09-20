import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as taskService from '../../services/taskService'
import PriorityBadge from '../../components/PriorityBadge'

const STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED']

function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function loadTasks() {
    setLoading(true)
    taskService
      .listTasks()
      .then((res) => setTasks(res.tasks))
      .catch(() => setError('Could not load tasks'))
      .finally(() => setLoading(false))
  }

  useEffect(loadTasks, [])

  async function handleStatusChange(taskId, status) {
    try {
      await taskService.updateTaskStatus(taskId, status)
      loadTasks()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update task status')
    }
  }

  const isOverdue = (task) =>
    task.dueDate && task.status !== 'COMPLETED' && new Date(task.dueDate) < new Date()

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800">My Tasks</h1>
      <p className="mt-1 text-gray-500">Tasks assigned to you across all projects.</p>

      {error && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Task</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Due date</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">Loading...</td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">No tasks assigned to you yet.</td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.id}>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    <Link to={`/freelancer/tasks/${task.id}`} className="text-blue-600 hover:underline">
                      {task.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{task.project.name}</td>
                  <td className={`px-4 py-3 ${isOverdue(task) ? 'font-medium text-red-600' : 'text-gray-600'}`}>
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                    {isOverdue(task) && ' (overdue)'}
                  </td>
                  <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                  <td className="px-4 py-3">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Tasks
