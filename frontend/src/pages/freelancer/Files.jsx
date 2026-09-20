import { useEffect, useState } from 'react'
import * as fileService from '../../services/fileService'
import * as taskService from '../../services/taskService'
import FileManager from '../../components/FileManager'

function Files() {
  const [files, setFiles] = useState([])
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [error, setError] = useState('')

  function loadFiles() {
    fileService.listFiles().then((res) => setFiles(res.files))
  }

  useEffect(() => {
    loadFiles()
    taskService.listTasks().then((res) => {
      const uniqueProjects = Array.from(
        new Map(res.tasks.map((t) => [t.project.id, t.project])).values(),
      )
      setProjects(uniqueProjects)
    })
  }, [])

  async function handleUpload(file) {
    if (!selectedProjectId) {
      setError('Select a project to upload this file to')
      return
    }
    setError('')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('projectId', selectedProjectId)
    await fileService.uploadFile(formData)
    loadFiles()
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800">Files</h1>
      <p className="mt-1 text-gray-500">Files from your assigned projects and tasks.</p>

      {projects.length > 0 && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Upload to project</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="mt-1 w-64 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select a project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {error && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="mt-4">
        <FileManager
          title="All files"
          files={files}
          onUpload={projects.length > 0 ? handleUpload : undefined}
          emptyText="No files yet."
        />
      </div>
    </div>
  )
}

export default Files
