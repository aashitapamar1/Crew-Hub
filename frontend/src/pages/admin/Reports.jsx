import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import * as reportService from '../../services/reportService'
import StatCard from '../../components/StatCard'

// Fixed-order categorical palette (never cycled) — see dataviz skill reference palette.
const CATEGORICAL = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4']
const GRID_COLOR = '#e1e0d9'
const AXIS_COLOR = '#898781'

const WORKLOAD_LABELS = {
  UNDER_UTILIZED: 'Under-utilized',
  NORMAL: 'Normal',
  OVERLOADED: 'Overloaded',
}
const WORKLOAD_COLORS = {
  UNDER_UTILIZED: 'bg-gray-100 text-gray-700',
  NORMAL: 'bg-green-100 text-green-700',
  OVERLOADED: 'bg-red-100 text-red-700',
}

function label(status) {
  return status.replace('_', ' ')
}

function Reports() {
  const [projectReport, setProjectReport] = useState(null)
  const [taskReport, setTaskReport] = useState(null)
  const [freelancerReport, setFreelancerReport] = useState([])
  const [clientReport, setClientReport] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      reportService.getProjectReport(),
      reportService.getTaskReport(),
      reportService.getFreelancerReport(),
      reportService.getClientReport(),
    ])
      .then(([projects, tasks, freelancers, clients]) => {
        setProjectReport(projects.report)
        setTaskReport(tasks.report)
        setFreelancerReport(freelancers.report)
        setClientReport(clients.report)
      })
      .catch(() => setError('Could not load reports'))
  }, [])

  if (error) {
    return <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
  }

  if (!projectReport || !taskReport || !clientReport) {
    return <p className="text-gray-500">Loading...</p>
  }

  const projectPieData = projectReport.byStatus.map((s) => ({ name: label(s.status), value: s.count }))
  const taskBarData = taskReport.byStatus.map((s) => ({ name: label(s.status), count: s.count }))
  const workloadBarData = freelancerReport.map((f) => ({
    name: f.name,
    Assigned: f.assignedTasks,
    Completed: f.completedTasks,
  }))
  const clientBarData = clientReport.projectsPerClient.map((c) => ({ name: c.name, projects: c.projectCount }))

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800">Reports</h1>
      <p className="mt-1 text-gray-500">Agency-wide statistics across projects, tasks, freelancers, and clients.</p>

      {/* Project statistics */}
      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-medium text-gray-800">Project statistics</h2>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <StatCard label="Active Projects" value={projectReport.active} />
          <StatCard label="Completed Projects" value={projectReport.completed} />
          <StatCard label="Total Projects" value={projectReport.total} />
        </div>
        <div className="mt-4 flex justify-center">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={projectPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {projectPieData.map((entry, index) => (
                  <Cell key={entry.name} fill={CATEGORICAL[index % CATEGORICAL.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Task statistics */}
      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-medium text-gray-800">Task statistics</h2>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <StatCard label="Pending Tasks" value={taskReport.pending} />
          <StatCard label="Completed Tasks" value={taskReport.completed} />
          <StatCard label="Overdue Tasks" value={taskReport.overdue} />
        </div>
        <div className="mt-4">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={taskBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: AXIS_COLOR, fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: AXIS_COLOR, fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill={CATEGORICAL[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Freelancer statistics */}
      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-medium text-gray-800">Freelancer statistics</h2>
        {freelancerReport.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">No freelancers yet.</p>
        ) : (
          <>
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={workloadBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: AXIS_COLOR, fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: AXIS_COLOR, fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Assigned" fill={CATEGORICAL[0]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Completed" fill={CATEGORICAL[1]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-gray-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-2">Freelancer</th>
                    <th className="px-4 py-2">Assigned</th>
                    <th className="px-4 py-2">Completed</th>
                    <th className="px-4 py-2">Pending</th>
                    <th className="px-4 py-2">Workload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {freelancerReport.map((f) => (
                    <tr key={f.id}>
                      <td className="px-4 py-2 font-medium text-gray-800">{f.name}</td>
                      <td className="px-4 py-2 text-gray-600">{f.assignedTasks}</td>
                      <td className="px-4 py-2 text-gray-600">{f.completedTasks}</td>
                      <td className="px-4 py-2 text-gray-600">{f.pendingTasks}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${WORKLOAD_COLORS[f.workload]}`}>
                          {WORKLOAD_LABELS[f.workload]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Client statistics */}
      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-medium text-gray-800">Client statistics</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <StatCard label="Total Clients" value={clientReport.totalClients} />
          <StatCard label="Active Clients" value={clientReport.activeClients} />
        </div>
        {clientBarData.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">No clients yet.</p>
        ) : (
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={clientBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: AXIS_COLOR, fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: AXIS_COLOR, fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="projects" fill={CATEGORICAL[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  )
}

export default Reports
