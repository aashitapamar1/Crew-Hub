const prisma = require('../config/db')

async function recalculateProjectProgress(projectId) {
  const tasks = await prisma.task.findMany({ where: { projectId }, select: { status: true } })
  if (tasks.length === 0) return

  const completed = tasks.filter((t) => t.status === 'COMPLETED').length
  const progress = Math.round((completed / tasks.length) * 100)

  await prisma.project.update({ where: { id: projectId }, data: { progress } })
}

module.exports = recalculateProjectProgress
