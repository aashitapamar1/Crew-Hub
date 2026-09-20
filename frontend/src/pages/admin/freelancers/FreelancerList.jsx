import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as freelancerService from '../../../services/freelancerService'
import StatusBadge from '../../../components/StatusBadge'

function FreelancerList() {
  const [freelancers, setFreelancers] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function loadFreelancers() {
    setLoading(true)
    setError('')
    freelancerService
      .listFreelancers({ search: search || undefined, status: status || undefined })
      .then((res) => setFreelancers(res.freelancers))
      .catch(() => setError('Could not load freelancers'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const timeout = setTimeout(loadFreelancers, 300)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status])

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Freelancers</h1>
        <Link to="/freelancers/new" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Add Freelancer
        </Link>
      </div>

      <div className="mt-4 flex gap-3">
        <input
          type="text"
          placeholder="Search by name, title, or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="BUSY">Busy</option>
          <option value="INACTIVE">Inactive</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {error && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Freelancer</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Skills</th>
              <th className="px-4 py-3">Rate</th>
              <th className="px-4 py-3">Tasks</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">Loading...</td>
              </tr>
            ) : freelancers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">No freelancers found.</td>
              </tr>
            ) : (
              freelancers.map((freelancer) => (
                <tr key={freelancer.id}>
                  <td className="px-4 py-3 font-medium text-gray-800">{freelancer.user.name}</td>
                  <td className="px-4 py-3 text-gray-600">{freelancer.title || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{freelancer.skills.join(', ') || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{freelancer.hourlyRate ? `$${freelancer.hourlyRate}/hr` : '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{freelancer._count.tasks}</td>
                  <td className="px-4 py-3"><StatusBadge status={freelancer.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/freelancers/${freelancer.id}`} className="text-sm text-blue-600 hover:underline">
                      View
                    </Link>
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

export default FreelancerList
