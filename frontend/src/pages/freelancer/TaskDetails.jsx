import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as taskService from '../../services/taskService'
import * as fileService from '../../services/fileService'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import FileManager from '../../components/FileManager'

const STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED']

function TaskDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [task, setTask] = useState(null)
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    taskService
      .getTask(id)
      .then((res) => setTask(res.task))
      .catch(() => setError('Could not load task'))
    loadFiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function loadFiles() {
    fileService.listFiles({ taskId: id }).then((res) => setFiles(res.files))
  }

  async function handleStatusChange(e) {
    try {
      const res = await taskService.updateTaskStatus(id, e.target.value)
      setTask(res.task)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update status')
    }
  }

  async function handleUploadFile(file) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('taskId', id)
    await fileService.uploadFile(formData)
    loadFiles()
  }

  if (!task) {
    return error ? (
      <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
    ) : (
      <p className="text-gray-500">Loading...</p>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">{task.title}</h1>
          <p className="text-gray-500">{task.project.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <PriorityBadge priority={task.priority} />
          <select
            value={task.status}
            onChange={handleStatusChange}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <dl className="space-y-2 text-sm">
          <Row label="Due date" value={task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'} />
          <Row label="Status">
            <StatusBadge status={task.status} />
          </Row>
        </dl>
      </section>

      {task.description && (
        <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium text-gray-800">Description</h2>
          <p className="mt-2 text-sm text-gray-600">{task.description}</p>
        </section>
      )}

      <div className="mt-6">
        <FileManager
          title="Deliverables"
          files={files}
          onUpload={handleUploadFile}
          emptyText="No deliverables uploaded yet."
        />
      </div>

      <button onClick={() => navigate('/freelancer/tasks')} className="mt-6 text-sm text-blue-600 hover:underline">
        Back to my tasks
      </button>
    </div>
  )
}

function Row({ label, value, children }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-800">{children || value}</dd>
    </div>
  )
}

export default TaskDetails
