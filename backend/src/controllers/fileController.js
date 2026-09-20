const prisma = require('../config/db')
const storeFile = require('../utils/storeFile')
const logActivity = require('../utils/logActivity')
const { notifyUser, notifyAdmins } = require('../utils/notify')

async function getOwnClientId(userId) {
  const client = await prisma.client.findUnique({ where: { userId }, select: { id: true } })
  return client?.id || null
}

async function getOwnFreelancerId(userId) {
  const freelancer = await prisma.freelancer.findUnique({ where: { userId }, select: { id: true } })
  return freelancer?.id || null
}

async function getOwnProjectIds(freelancerId) {
  const memberships = await prisma.projectMember.findMany({ where: { freelancerId }, select: { projectId: true } })
  return memberships.map((m) => m.projectId)
}

async function buildScopedWhere(req, requestedFilters) {
  const { clientId, projectId, taskId } = requestedFilters

  if (req.user.role === 'ADMIN') {
    return { ...(clientId && { clientId }), ...(projectId && { projectId }), ...(taskId && { taskId }) }
  }

  if (req.user.role === 'CLIENT') {
    const ownClientId = await getOwnClientId(req.user.id)
    if (!ownClientId) return { id: '__none__' }
    return { OR: [{ clientId: ownClientId }, { project: { clientId: ownClientId } }] }
  }

  // FREELANCER
  const ownFreelancerId = await getOwnFreelancerId(req.user.id)
  if (!ownFreelancerId) return { id: '__none__' }
  const projectIds = await getOwnProjectIds(ownFreelancerId)
  return {
    OR: [
      { task: { freelancerId: ownFreelancerId } },
      { projectId: { in: projectIds.length ? projectIds : ['__none__'] } },
    ],
  }
}

async function listFiles(req, res) {
  const { clientId, projectId, taskId } = req.query

  const where = await buildScopedWhere(req, { clientId, projectId, taskId })

  const files = await prisma.file.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { id: true, companyName: true } },
      project: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
    },
  })

  res.status(200).json({ success: true, files })
}

async function uploadFile(req, res) {
  const { clientId, projectId, taskId } = req.body

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'A file is required' })
  }
  if (!clientId && !projectId && !taskId) {
    return res.status(400).json({ success: false, message: 'A client, project, or task must be specified' })
  }

  if (req.user.role === 'FREELANCER') {
    const ownFreelancerId = await getOwnFreelancerId(req.user.id)

    if (clientId) {
      return res.status(403).json({ success: false, message: 'Forbidden: cannot upload directly to a client' })
    }
    if (taskId) {
      const task = await prisma.task.findUnique({ where: { id: taskId } })
      if (!task || task.freelancerId !== ownFreelancerId) {
        return res.status(403).json({ success: false, message: 'Forbidden: not your task' })
      }
    }
    if (projectId) {
      const isMember = await prisma.projectMember.findUnique({
        where: { projectId_freelancerId: { projectId, freelancerId: ownFreelancerId } },
      })
      if (!isMember) {
        return res.status(403).json({ success: false, message: 'Forbidden: not a member of this project' })
      }
    }
  }

  let targetClient = null
  let targetProject = null

  if (clientId) {
    targetClient = await prisma.client.findUnique({ where: { id: clientId } })
    if (!targetClient) return res.status(404).json({ success: false, message: 'Client not found' })
  }
  if (projectId) {
    targetProject = await prisma.project.findUnique({ where: { id: projectId }, include: { client: true } })
    if (!targetProject) return res.status(404).json({ success: false, message: 'Project not found' })
  }
  if (taskId) {
    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' })
  }

  const { url } = await storeFile(req.file.buffer, req.file.originalname)

  const file = await prisma.file.create({
    data: {
      fileName: req.file.originalname,
      fileUrl: url,
      fileType: req.file.mimetype,
      ...(clientId && { clientId }),
      ...(projectId && { projectId }),
      ...(taskId && { taskId }),
    },
  })

  await logActivity({ action: 'FILE_UPLOADED', entity: 'File', entityId: file.id, actorId: req.user.id })

  if (req.user.role === 'FREELANCER') {
    await notifyAdmins('New file uploaded', `${req.user.name} uploaded "${file.fileName}"`, req.user.id)
  } else if (req.user.role === 'ADMIN') {
    const clientUserId = targetClient?.userId || targetProject?.client?.userId
    await notifyUser(clientUserId, 'New file uploaded', `A new file "${file.fileName}" was added to your project`)
  }

  res.status(201).json({ success: true, file })
}

async function deleteFile(req, res) {
  const { id } = req.params

  const file = await prisma.file.findUnique({ where: { id } })
  if (!file) {
    return res.status(404).json({ success: false, message: 'File not found' })
  }

  await prisma.file.delete({ where: { id } })
  await logActivity({ action: 'FILE_DELETED', entity: 'File', entityId: id, actorId: req.user.id })

  res.status(200).json({ success: true, message: 'File deleted' })
}

module.exports = { listFiles, uploadFile, deleteFile }
