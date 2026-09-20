const prisma = require('../config/db')
const logActivity = require('../utils/logActivity')

async function createMilestone(req, res) {
  const { id: projectId } = req.params
  const { title, description, dueDate } = req.body

  if (!title) {
    return res.status(400).json({ success: false, message: 'Title is required' })
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' })
  }

  const milestone = await prisma.milestone.create({
    data: {
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : null,
      projectId,
    },
  })

  await logActivity({ action: 'MILESTONE_CREATED', entity: 'Milestone', entityId: milestone.id, actorId: req.user.id })

  res.status(201).json({ success: true, milestone })
}

async function toggleMilestone(req, res) {
  const { milestoneId } = req.params

  const milestone = await prisma.milestone.findUnique({ where: { id: milestoneId } })
  if (!milestone) {
    return res.status(404).json({ success: false, message: 'Milestone not found' })
  }

  const updated = await prisma.milestone.update({
    where: { id: milestoneId },
    data: { isCompleted: !milestone.isCompleted },
  })

  res.status(200).json({ success: true, milestone: updated })
}

async function deleteMilestone(req, res) {
  const { milestoneId } = req.params

  const milestone = await prisma.milestone.findUnique({ where: { id: milestoneId } })
  if (!milestone) {
    return res.status(404).json({ success: false, message: 'Milestone not found' })
  }

  await prisma.milestone.delete({ where: { id: milestoneId } })

  res.status(200).json({ success: true, message: 'Milestone deleted' })
}

module.exports = { createMilestone, toggleMilestone, deleteMilestone }
