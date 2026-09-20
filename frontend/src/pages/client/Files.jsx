import { useEffect, useState } from 'react'
import * as fileService from '../../services/fileService'

function Files() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fileService
      .listFiles()
      .then((res) => setFiles(res.files))
      .catch(() => setError('Could not load files'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800">Files</h1>
      <p className="mt-1 text-gray-500">Documents shared with you and files from your projects.</p>

      {error && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3">Related to</th>
              <th className="px-4 py-3">Uploaded</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-500">Loading...</td>
              </tr>
            ) : files.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-500">No files yet.</td>
              </tr>
            ) : (
              files.map((f) => (
                <tr key={f.id}>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    <a href={fileService.resolveFileUrl(f.fileUrl)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                      {f.fileName}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{f.project?.name || f.client?.companyName || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(f.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Files
