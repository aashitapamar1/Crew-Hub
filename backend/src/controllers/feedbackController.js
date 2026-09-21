const prisma = require('../config/db')
const { hasProjectAccess, getOwnClientId } = require('../utils/projectAccess')
const { notifyAdmins } = require('../utils/notify')
const logActivity = require('../utils/logActivity')

async function listFeedback(req, res) {
  const { projectId } = req.query

  if (projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' })
    }

    const allowed = await hasProjectAccess(req.user, project)
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Forbidden: no access to this project' })
    }

    const feedback = await prisma.feedback.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' } })
    return res.status(200).json({ success: true, feedback })
  }

  if (req.user.role === 'CLIENT') {
    const ownClientId = await getOwnClientId(req.user.id)
    const feedback = await prisma.feedback.findMany({
      where: { project: { clientId: ownClientId || '__none__' } },
      orderBy: { createdAt: 'desc' },
      include: { project: { select: { id: true, name: true } } },
    })
    return res.status(200).json({ success: true, feedback })
  }

  return res.status(400).json({ success: false, message: 'projectId is required' })
}

async function createFeedback(req, res) {
  const { projectId, content, rating } = req.body

  if (!projectId || !content) {
    return res.status(400).json({ success: false, message: 'projectId and content are required' })
  }
  if (rating !== undefined && rating !== null && (rating < 1 || rating > 5)) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' })
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' })
  }

  const allowed = await hasProjectAccess(req.user, project)
  if (!allowed) {
    return res.status(403).json({ success: false, message: 'Forbidden: no access to this project' })
  }

  const feedback = await prisma.feedback.create({
    data: {
      projectId,
      content,
      ...(rating !== undefined && rating !== null && { rating: Number(rating) }),
    },
  })

  await logActivity({ action: 'FEEDBACK_SUBMITTED', entity: 'Feedback', entityId: feedback.id, actorId: req.user.id })
  await notifyAdmins('Client feedback received', `New feedback on "${project.name}"`)

  res.status(201).json({ success: true, feedback })
}

module.exports = { listFeedback, createFeedback }
