const prisma = require('../config/db')
const { hasProjectAccess } = require('../utils/projectAccess')

async function listMessages(req, res) {
  const { projectId } = req.query

  if (!projectId) {
    return res.status(400).json({ success: false, message: 'projectId is required' })
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' })
  }

  const allowed = await hasProjectAccess(req.user, project)
  if (!allowed) {
    return res.status(403).json({ success: false, message: 'Forbidden: no access to this project' })
  }

  const messages = await prisma.message.findMany({ where: { projectId }, orderBy: { createdAt: 'asc' } })

  const senderIds = [...new Set(messages.map((m) => m.senderId))]
  const senders = await prisma.user.findMany({
    where: { id: { in: senderIds } },
    select: { id: true, name: true, role: true },
  })
  const senderMap = Object.fromEntries(senders.map((s) => [s.id, s]))

  res.status(200).json({
    success: true,
    messages: messages.map((m) => ({ ...m, sender: senderMap[m.senderId] || null })),
  })
}

async function createMessage(req, res) {
  const { projectId, content } = req.body

  if (!projectId || !content) {
    return res.status(400).json({ success: false, message: 'projectId and content are required' })
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' })
  }

  const allowed = await hasProjectAccess(req.user, project)
  if (!allowed) {
    return res.status(403).json({ success: false, message: 'Forbidden: no access to this project' })
  }

  const message = await prisma.message.create({
    data: { content, projectId, senderId: req.user.id },
  })

  res.status(201).json({
    success: true,
    message: { ...message, sender: { id: req.user.id, name: req.user.name, role: req.user.role } },
  })
}

module.exports = { listMessages, createMessage }
