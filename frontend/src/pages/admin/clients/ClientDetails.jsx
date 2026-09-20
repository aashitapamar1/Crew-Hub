import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as clientService from '../../../services/clientService'
import * as fileService from '../../../services/fileService'
import StatusBadge from '../../../components/StatusBadge'
import FileManager from '../../../components/FileManager'

function ClientDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')
  const [confirmingArchive, setConfirmingArchive] = useState(false)

  useEffect(() => {
    clientService
      .getClient(id)
      .then((res) => setClient(res.client))
      .catch(() => setError('Could not load client'))
    loadFiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function loadFiles() {
    fileService.listFiles({ clientId: id }).then((res) => setFiles(res.files))
  }

  async function handleUpload(file) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('clientId', id)
    await fileService.uploadFile(formData)
    loadFiles()
  }

  async function handleDeleteFile(fileId) {
    await fileService.deleteFile(fileId)
    loadFiles()
  }

  async function handleArchive() {
    try {
      await clientService.archiveClient(id)
      const res = await clientService.getClient(id)
      setClient(res.client)
      setConfirmingArchive(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not archive client')
    }
  }

  if (error) {
    return <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
  }

  if (!client) {
    return <p className="text-gray-500">Loading...</p>
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">{client.user.name}</h1>
          <p className="text-gray-500">{client.companyName || 'No company'}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={client.status} />
          {client.status !== 'ARCHIVED' && (
            <>
              <Link to={`/clients/${id}/edit`} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                Edit
              </Link>
              <button
                onClick={() => setConfirmingArchive(true)}
                className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                Archive
              </button>
            </>
          )}
        </div>
      </div>

      {confirmingArchive && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            Archiving deactivates this client's login access. Their project history is kept. Continue?
          </p>
          <div className="mt-3 flex gap-3">
            <button onClick={handleArchive} className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700">
              Yes, archive
            </button>
            <button onClick={() => setConfirmingArchive(false)} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-3 gap-4">
        <SummaryCard label="Total Projects" value={client.totalProjects} />
        <SummaryCard label="Active Projects" value={client.activeProjects} />
        <SummaryCard label="Completed Projects" value={client.completedProjects} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium text-gray-800">Contact</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Email" value={client.user.email} />
            <Row label="Phone" value={client.user.phone} />
            <Row label="Website" value={client.website} />
            <Row label="Industry" value={client.industry} />
          </dl>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium text-gray-800">Address</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Street" value={client.street} />
            <Row label="City" value={client.city} />
            <Row label="State" value={client.state} />
            <Row label="Country" value={client.country} />
            <Row label="Postal code" value={client.postalCode} />
          </dl>
        </section>
      </div>

      {client.companyDescription && (
        <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium text-gray-800">Company description</h2>
          <p className="mt-2 text-sm text-gray-600">{client.companyDescription}</p>
        </section>
      )}

      {client.internalNotes && (
        <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium text-gray-800">Internal notes</h2>
          <p className="text-xs text-gray-500">Not visible to the client.</p>
          <p className="mt-2 text-sm text-gray-600">{client.internalNotes}</p>
        </section>
      )}

      <div className="mt-6">
        <FileManager
          title="Documents"
          files={files}
          onUpload={handleUpload}
          onDelete={handleDeleteFile}
          emptyText="No documents uploaded yet."
        />
      </div>

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-medium text-gray-800">Upcoming deadlines</h2>
        {client.upcomingDeadlines.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No upcoming deadlines.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {client.upcomingDeadlines.map((p) => (
              <li key={p.id} className="flex justify-between">
                <span>{p.name}</span>
                <span className="text-gray-500">{new Date(p.deadline).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button onClick={() => navigate('/clients')} className="mt-6 text-sm text-blue-600 hover:underline">
        Back to clients
      </button>
    </div>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-800">{value}</p>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-800">{value || '-'}</dd>
    </div>
  )
}

export default ClientDetails
