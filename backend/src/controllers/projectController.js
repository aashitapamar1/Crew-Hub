const prisma = require('../config/db')
const logActivity = require('../utils/logActivity')
const { getOwnClientId, getOwnFreelancerId, hasProjectAccess } = require('../utils/projectAccess')
const { notifyUser, notifyUsers } = require('../utils/notify')

const PROJECT_LIST_SELECT = {
  id: true,
  name: true,
  budget: true,
  deadline: true,
  priority: true,
  status: true,
  progress: true,
  createdAt: true,
  client: { select: { id: true, companyName: true, user: { select: { name: true } } } },
  _count: { select: { members: true, tasks: true } },
}

async function listProjects(req, res) {
  const { search, status, priority, clientId, page = 1, limit = 20 } = req.query

  const where = {
    ...(status && { status }),
    ...(priority && { priority }),
    ...(search && { name: { contains: search, mode: 'insensitive' } }),
  }

  if (req.user.role === 'CLIENT') {
    const ownClientId = await getOwnClientId(req.user.id)
    where.clientId = ownClientId || '__none__'
  } else if (req.user.role === 'FREELANCER') {
    const ownFreelancerId = await getOwnFreelancerId(req.user.id)
    where.members = { some: { freelancerId: ownFreelancerId || '__none__' } }
  } else if (clientId) {
    where.clientId = clientId
  }

  const take = Math.min(Number(limit) || 20, 100)
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      select: PROJECT_LIST_SELECT,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.project.count({ where }),
  ])

  res.status(200).json({
    success: true,
    projects,
    pagination: { total, page: Number(page) || 1, limit: take, totalPages: Math.ceil(total / take) },
  })
}

async function createProject(req, res) {
  const { name, description, clientId, budget, startDate, deadline, priority } = req.body

  if (!name || !clientId) {
    return res.status(400).json({ success: false, message: 'Name and client are required' })
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } })
  if (!client) {
    return res.status(404).json({ success: false, message: 'Client not found' })
  }

  const project = await prisma.project.create({
    data: {
      name,
      description,
      clientId,
      budget: budget !== undefined && budget !== '' ? Number(budget) : null,
      startDate: startDate ? new Date(startDate) : null,
      deadline: deadline ? new Date(deadline) : null,
      ...(priority && { priority }),
    },
    include: { client: { select: { id: true, companyName: true, user: { select: { name: true } } } } },
  })

  await logActivity({ action: 'PROJECT_CREATED', entity: 'Project', entityId: project.id, actorId: req.user.id })

  res.status(201).json({ success: true, project })
}

async function getProject(req, res) {
  const { id } = req.params

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, companyName: true, user: { select: { name: true, email: true } } } },
      members: {
        select: {
          id: true,
          role: true,
          freelancer: { select: { id: true, title: true, user: { select: { name: true, email: true } } } },
        },
      },
      tasks: { select: { id: true, title: true, status: true, dueDate: true } },
      milestones: { orderBy: { dueDate: 'asc' } },
    },
  })

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' })
  }

  const allowed = await hasProjectAccess(req.user, project)
  if (!allowed) {
    return res.status(403).json({ success: false, message: 'Forbidden: no access to this project' })
  }

  const totalTasks = project.tasks.length
  const completedTasks = project.tasks.filter((t) => t.status === 'COMPLETED').length

  res.status(200).json({
    success: true,
    project: { ...project, totalTasks, completedTasks },
  })
}

async function updateProject(req, res) {
  const { id } = req.params
  const { name, description, clientId, budget, startDate, deadline, priority, progress } = req.body

  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' })
  }

  if (clientId) {
    const client = await prisma.client.findUnique({ where: { id: clientId } })
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' })
    }
  }

  const updated = await prisma.project.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(clientId !== undefined && { clientId }),
      ...(budget !== undefined && { budget: budget === '' ? null : Number(budget) }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
      ...(priority !== undefined && { priority }),
      ...(progress !== undefined && { progress: Math.max(0, Math.min(100, Number(progress))) }),
    },
    include: { client: { select: { id: true, companyName: true, user: { select: { name: true } } } } },
  })

  await logActivity({ action: 'PROJECT_UPDATED', entity: 'Project', entityId: id, actorId: req.user.id })

  res.status(200).json({ success: true, project: updated })
}

async function updateProjectStatus(req, res) {
  const { id } = req.params
  const { status } = req.body

  const validStatuses = ['PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' })
  }

  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' })
  }

  const updated = await prisma.project.update({
    where: { id },
    data: {
      status,
      ...(status === 'COMPLETED' && { progress: 100 }),
    },
  })

  await logActivity({ action: 'PROJECT_STATUS_CHANGED', entity: 'Project', entityId: id, actorId: req.user.id })

  const client = await prisma.client.findUnique({ where: { id: project.clientId }, select: { userId: true } })
  const members = await prisma.projectMember.findMany({
    where: { projectId: id },
    select: { freelancer: { select: { userId: true } } },
  })
  const recipientIds = [client?.userId, ...members.map((m) => m.freelancer.userId)].filter((uid) => uid !== req.user.id)
  await notifyUsers(recipientIds, 'Project status updated', `"${project.name}" status changed to ${status.replace('_', ' ')}`)

  res.status(200).json({ success: true, project: updated })
}

async function addMember(req, res) {
  const { id } = req.params
  const { freelancerId, role } = req.body

  if (!freelancerId) {
    return res.status(400).json({ success: false, message: 'freelancerId is required' })
  }

  const [project, freelancer] = await Promise.all([
    prisma.project.findUnique({ where: { id } }),
    prisma.freelancer.findUnique({ where: { id: freelancerId } }),
  ])

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' })
  }
  if (!freelancer) {
    return res.status(404).json({ success: false, message: 'Freelancer not found' })
  }

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_freelancerId: { projectId: id, freelancerId } },
  })
  if (existing) {
    return res.status(409).json({ success: false, message: 'Freelancer is already on this project' })
  }

  const member = await prisma.projectMember.create({
    data: { projectId: id, freelancerId, role },
    include: { freelancer: { select: { id: true, title: true, user: { select: { name: true } } } } },
  })

  await logActivity({ action: 'PROJECT_MEMBER_ADDED', entity: 'Project', entityId: id, actorId: req.user.id })
  await notifyUser(freelancer.userId, 'New project assigned', `You have been added to the project "${project.name}"`)

  res.status(201).json({ success: true, member })
}

async function removeMember(req, res) {
  const { id, memberId } = req.params

  const member = await prisma.projectMember.findUnique({ where: { id: memberId } })
  if (!member || member.projectId !== id) {
    return res.status(404).json({ success: false, message: 'Project member not found' })
  }

  await prisma.projectMember.delete({ where: { id: memberId } })

  await logActivity({ action: 'PROJECT_MEMBER_REMOVED', entity: 'Project', entityId: id, actorId: req.user.id })

  res.status(200).json({ success: true, message: 'Member removed from project' })
}

module.exports = {
  listProjects,
  createProject,
  getProject,
  updateProject,
  updateProjectStatus,
  addMember,
  removeMember,
}
