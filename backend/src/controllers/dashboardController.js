const prisma = require('../config/db')

async function getStats(req, res) {
  const [
    totalClients,
    totalFreelancers,
    activeProjects,
    completedProjects,
    pendingTasks,
    overdueTasks,
  ] = await Promise.all([
    prisma.client.count({ where: { status: { not: 'ARCHIVED' } } }),
    prisma.freelancer.count({ where: { status: { not: 'ARCHIVED' } } }),
    prisma.project.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.project.count({ where: { status: 'COMPLETED' } }),
    prisma.task.count({ where: { status: { notIn: ['COMPLETED'] } } }),
    prisma.task.count({
      where: {
        status: { notIn: ['COMPLETED'] },
        dueDate: { lt: new Date() },
      },
    }),
  ])

  res.status(200).json({
    success: true,
    stats: {
      totalClients,
      totalFreelancers,
      activeProjects,
      completedProjects,
      pendingTasks,
      overdueTasks,
    },
  })
}

async function getRecentActivity(req, res) {
  const activities = await prisma.activity.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  res.status(200).json({ success: true, activities })
}

module.exports = { getStats, getRecentActivity }
