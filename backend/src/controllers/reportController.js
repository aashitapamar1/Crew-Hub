const prisma = require('../config/db')

const PROJECT_STATUSES = ['PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']
const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED']

async function getProjectReport(req, res) {
  const grouped = await prisma.project.groupBy({ by: ['status'], _count: true })
  const countByStatus = Object.fromEntries(grouped.map((g) => [g.status, g._count]))

  const byStatus = PROJECT_STATUSES.map((status) => ({ status, count: countByStatus[status] || 0 }))
  const total = byStatus.reduce((sum, s) => sum + s.count, 0)

  res.status(200).json({
    success: true,
    report: {
      byStatus,
      total,
      active: countByStatus.IN_PROGRESS || 0,
      completed: countByStatus.COMPLETED || 0,
    },
  })
}

async function getTaskReport(req, res) {
  const grouped = await prisma.task.groupBy({ by: ['status'], _count: true })
  const countByStatus = Object.fromEntries(grouped.map((g) => [g.status, g._count]))

  const byStatus = TASK_STATUSES.map((status) => ({ status, count: countByStatus[status] || 0 }))
  const total = byStatus.reduce((sum, s) => sum + s.count, 0)
  const completed = countByStatus.COMPLETED || 0
  const pending = total - completed

  const overdue = await prisma.task.count({
    where: { status: { not: 'COMPLETED' }, dueDate: { lt: new Date() } },
  })

  res.status(200).json({
    success: true,
    report: { byStatus, total, pending, completed, overdue },
  })
}

async function getFreelancerReport(req, res) {
  const freelancers = await prisma.freelancer.findMany({
    where: { status: { not: 'ARCHIVED' } },
    select: {
      id: true,
      user: { select: { name: true } },
      tasks: { select: { status: true } },
    },
  })

  const report = freelancers.map((f) => {
    const assignedTasks = f.tasks.length
    const completedTasks = f.tasks.filter((t) => t.status === 'COMPLETED').length
    const pendingTasks = assignedTasks - completedTasks

    let workload = 'UNDER_UTILIZED'
    if (pendingTasks >= 5) workload = 'OVERLOADED'
    else if (pendingTasks >= 1) workload = 'NORMAL'

    return {
      id: f.id,
      name: f.user.name,
      assignedTasks,
      completedTasks,
      pendingTasks,
      workload,
    }
  })

  res.status(200).json({ success: true, report })
}

async function getClientReport(req, res) {
  const [totalClients, activeClients, clients] = await Promise.all([
    prisma.client.count({ where: { status: { not: 'ARCHIVED' } } }),
    prisma.client.count({ where: { status: 'ACTIVE' } }),
    prisma.client.findMany({
      where: { status: { not: 'ARCHIVED' } },
      select: {
        id: true,
        companyName: true,
        user: { select: { name: true } },
        _count: { select: { projects: true } },
      },
    }),
  ])

  const projectsPerClient = clients.map((c) => ({
    clientId: c.id,
    name: c.companyName || c.user.name,
    projectCount: c._count.projects,
  }))

  res.status(200).json({
    success: true,
    report: { totalClients, activeClients, projectsPerClient },
  })
}

module.exports = { getProjectReport, getTaskReport, getFreelancerReport, getClientReport }
