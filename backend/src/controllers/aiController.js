const prisma = require('../config/db')
const aiClient = require('../utils/aiClient')

function parseExperienceYears(experience) {
  if (!experience) return 0
  const match = experience.match(/(\d+(\.\d+)?)/)
  return match ? Number(match[1]) : 0
}

async function recommendFreelancers(req, res) {
  const { id: projectId } = req.params
  const { requiredSkills = [] } = req.body

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' })
  }

  const freelancers = await prisma.freelancer.findMany({
    where: { status: { in: ['AVAILABLE', 'BUSY'] } },
    select: {
      id: true,
      skills: true,
      experience: true,
      user: { select: { name: true } },
      tasks: { select: { status: true } },
    },
  })

  const candidates = freelancers.map((f) => ({
    id: f.id,
    name: f.user.name,
    skills: f.skills,
    experienceYears: parseExperienceYears(f.experience),
    pendingTasks: f.tasks.filter((t) => t.status !== 'COMPLETED').length,
  }))

  try {
    const { data } = await aiClient.post('/ai/recommend-freelancers', { requiredSkills, candidates })
    res.status(200).json({ success: true, recommendations: data })
  } catch (err) {
    res.status(502).json({ success: false, message: 'AI service is unavailable' })
  }
}

async function getProjectDelayRisk(req, res) {
  const { id } = req.params

  const project = await prisma.project.findUnique({
    where: { id },
    include: { tasks: { select: { status: true, dueDate: true } } },
  })
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' })
  }

  const totalTasks = project.tasks.length
  const completedTasks = project.tasks.filter((t) => t.status === 'COMPLETED').length
  const overdueTasks = project.tasks.filter(
    (t) => t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) < new Date(),
  ).length

  const now = new Date()
  const start = project.startDate || project.createdAt
  const daysElapsed = Math.max(0, (now - new Date(start)) / (1000 * 60 * 60 * 24))
  const daysRemaining = project.deadline
    ? Math.max(0, (new Date(project.deadline) - now) / (1000 * 60 * 60 * 24))
    : 30

  try {
    const { data } = await aiClient.post('/ai/project-delay', {
      totalTasks,
      completedTasks,
      overdueTasks,
      daysElapsed,
      daysRemaining,
    })
    res.status(200).json({ success: true, prediction: data })
  } catch (err) {
    res.status(502).json({ success: false, message: 'AI service is unavailable' })
  }
}

async function getWorkloadAnalysis(req, res) {
  const freelancers = await prisma.freelancer.findMany({
    where: { status: { not: 'ARCHIVED' } },
    select: {
      id: true,
      user: { select: { name: true } },
      tasks: { select: { status: true } },
    },
  })

  const payload = {
    freelancers: freelancers.map((f) => ({
      id: f.id,
      name: f.user.name,
      assignedTasks: f.tasks.length,
      completedTasks: f.tasks.filter((t) => t.status === 'COMPLETED').length,
      pendingTasks: f.tasks.filter((t) => t.status !== 'COMPLETED').length,
    })),
  }

  try {
    const { data } = await aiClient.post('/ai/workload', payload)
    res.status(200).json({ success: true, workload: data })
  } catch (err) {
    res.status(502).json({ success: false, message: 'AI service is unavailable' })
  }
}

module.exports = { recommendFreelancers, getProjectDelayRisk, getWorkloadAnalysis }
