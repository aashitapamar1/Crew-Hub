import { useRef, useState } from 'react'
import { resolveFileUrl } from '../services/fileService'

function FileManager({ title = 'Files', files, onUpload, onDelete, emptyText = 'No files yet.' }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file || !onUpload) return
    setError('')
    setUploading(true)
    try {
      await onUpload(file)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not upload file')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-800">{title}</h2>
        {onUpload && (
          <label className="cursor-pointer rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            {uploading ? 'Uploading...' : 'Upload'}
            <input ref={inputRef} type="file" onChange={handleFileChange} disabled={uploading} className="hidden" />
          </label>
        )}
      </div>

      {error && <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {files.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">{emptyText}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {files.map((f) => (
            <li key={f.id} className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2 text-sm">
              <a
                href={resolveFileUrl(f.fileUrl)}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                {f.fileName}
              </a>
              <div className="flex items-center gap-3 text-gray-400">
                <span>{new Date(f.createdAt).toLocaleDateString()}</span>
                {onDelete && (
                  <button onClick={() => onDelete(f.id)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default FileManager
