import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import * as dashboardService from '../../services/dashboardService'
import StatCard from '../../components/StatCard'

const ACTIVITY_LABELS = {
  CLIENT_CREATED: 'New client added',
  CLIENT_UPDATED: 'Client updated',
  CLIENT_ARCHIVED: 'Client archived',
  FREELANCER_CREATED: 'New freelancer added',
  FREELANCER_UPDATED: 'Freelancer updated',
  FREELANCER_ARCHIVED: 'Freelancer archived',
  PROJECT_CREATED: 'Project created',
  PROJECT_UPDATED: 'Project updated',
  PROJECT_STATUS_CHANGED: 'Project status updated',
  PROJECT_MEMBER_ADDED: 'Freelancer assigned to project',
  PROJECT_MEMBER_REMOVED: 'Freelancer removed from project',
  MILESTONE_CREATED: 'Milestone created',
}

function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [activities, setActivities] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([dashboardService.getStats(), dashboardService.getRecentActivity()])
      .then(([statsRes, activityRes]) => {
        setStats(statsRes.stats)
        setActivities(activityRes.activities)
      })
      .catch(() => setError('Could not load dashboard data'))
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800">Welcome, {user?.name}</h1>
      <p className="mt-1 text-gray-500">What is happening in your agency today?</p>

      {error && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="mt-6 flex gap-3">
        <Link to="/clients/new" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Add Client
        </Link>
      </div>

      {stats && (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Total Clients" value={stats.totalClients} />
          <StatCard label="Total Freelancers" value={stats.totalFreelancers} />
          <StatCard label="Active Projects" value={stats.activeProjects} />
          <StatCard label="Completed Projects" value={stats.completedProjects} />
          <StatCard label="Pending Tasks" value={stats.pendingTasks} />
          <StatCard label="Overdue Tasks" value={stats.overdueTasks} />
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-800">Recent activity</h2>
        <div className="mt-3 rounded-lg border border-gray-200 bg-white">
          {activities.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No recent activity yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {activities.map((activity) => (
                <li key={activity.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-gray-700">{ACTIVITY_LABELS[activity.action] || activity.action}</span>
                  <span className="text-gray-400">{new Date(activity.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
