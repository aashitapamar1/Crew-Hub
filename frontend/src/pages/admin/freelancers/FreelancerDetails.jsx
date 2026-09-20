import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as freelancerService from '../../../services/freelancerService'
import StatusBadge from '../../../components/StatusBadge'

function FreelancerDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [freelancer, setFreelancer] = useState(null)
  const [error, setError] = useState('')
  const [confirmingArchive, setConfirmingArchive] = useState(false)

  useEffect(() => {
    freelancerService
      .getFreelancer(id)
      .then((res) => setFreelancer(res.freelancer))
      .catch(() => setError('Could not load freelancer'))
  }, [id])

  async function handleArchive() {
    try {
      await freelancerService.archiveFreelancer(id)
      const res = await freelancerService.getFreelancer(id)
      setFreelancer(res.freelancer)
      setConfirmingArchive(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not archive freelancer')
    }
  }

  if (error) {
    return <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
  }

  if (!freelancer) {
    return <p className="text-gray-500">Loading...</p>
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">{freelancer.user.name}</h1>
          <p className="text-gray-500">{freelancer.title || 'No title'}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={freelancer.status} />
          {freelancer.status !== 'ARCHIVED' && (
            <>
              <Link to={`/freelancers/${id}/edit`} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
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
            Archiving deactivates this freelancer's login access. Their task history is kept. Continue?
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

      <div className="mt-6 grid grid-cols-4 gap-4">
        <SummaryCard label="Total Projects" value={freelancer.totalProjects} />
        <SummaryCard label="Total Tasks" value={freelancer.totalTasks} />
        <SummaryCard label="Completed Tasks" value={freelancer.completedTasks} />
        <SummaryCard label="Overdue Tasks" value={freelancer.overdueTasks} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium text-gray-800">Contact</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Email" value={freelancer.user.email} />
            <Row label="Phone" value={freelancer.user.phone} />
            <Row label="Portfolio" value={freelancer.portfolioUrl} />
            <Row label="Availability" value={freelancer.availability} />
          </dl>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium text-gray-800">Professional</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Experience" value={freelancer.experience} />
            <Row label="Hourly rate" value={freelancer.hourlyRate ? `$${freelancer.hourlyRate}/hr` : null} />
            <div>
              <dt className="text-gray-500">Skills</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {freelancer.skills.length === 0 ? (
                  <span className="text-gray-800">-</span>
                ) : (
                  freelancer.skills.map((skill) => (
                    <span key={skill} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700">
                      {skill}
                    </span>
                  ))
                )}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {freelancer.bio && (
        <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium text-gray-800">Bio</h2>
          <p className="mt-2 text-sm text-gray-600">{freelancer.bio}</p>
        </section>
      )}

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-medium text-gray-800">Assigned projects</h2>
        {freelancer.projectMembers.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">Not currently assigned to any project.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {freelancer.projectMembers.map((pm) => (
              <li key={pm.project.id} className="flex justify-between">
                <span>{pm.project.name}{pm.role ? ` (${pm.role})` : ''}</span>
                <StatusBadge status={pm.project.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <button onClick={() => navigate('/freelancers')} className="mt-6 text-sm text-blue-600 hover:underline">
        Back to freelancers
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

export default FreelancerDetails
