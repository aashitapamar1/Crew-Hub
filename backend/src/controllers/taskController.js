const prisma = require('../config/db')
const logActivity = require('../utils/logActivity')
const recalculateProjectProgress = require('../utils/recalculateProjectProgress')

const TASK_SELECT = {
  id: true,
  title: true,
  description: true,
  priority: true,
  status: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
  project: { select: { id: true, name: true, clientId: true } },
  freelancer: { select: { id: true, title: true, user: { select: { name: true } } } },
}

async function getOwnFreelancerId(userId) {
  const freelancer = await prisma.freelancer.findUnique({ where: { userId }, select: { id: true } })
  return freelancer?.id || null
}

async function listTasks(req, res) {
  const { projectId, freelancerId, status, priority, search, page = 1, limit = 20 } = req.query

  const where = {
    ...(projectId && { projectId }),
    ...(status && { status }),
    ...(priority && { priority }),
    ...(search && { title: { contains: search, mode: 'insensitive' } }),
  }

  if (req.user.role === 'FREELANCER') {
    const ownFreelancerId = await getOwnFreelancerId(req.user.id)
    where.freelancerId = ownFreelancerId || '__none__'
  } else if (freelancerId) {
    where.freelancerId = freelancerId
  }

  const take = Math.min(Number(limit) || 20, 100)
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      select: TASK_SELECT,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.task.count({ where }),
  ])

  res.status(200).json({
    success: true,
    tasks,
    pagination: { total, page: Number(page) || 1, limit: take, totalPages: Math.ceil(total / take) },
  })
}

async function createTask(req, res) {
  const { title, description, projectId, freelancerId, priority, dueDate } = req.body

  if (!title || !projectId) {
    return res.status(400).json({ success: false, message: 'Title and project are required' })
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' })
  }

  if (freelancerId) {
    const isMember = await prisma.projectMember.findUnique({
      where: { projectId_freelancerId: { projectId, freelancerId } },
    })
    if (!isMember) {
      return res.status(400).json({ success: false, message: 'Freelancer must be assigned to the project before being given a task' })
    }
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      projectId,
      freelancerId: freelancerId || null,
      ...(priority && { priority }),
      dueDate: dueDate ? new Date(dueDate) : null,
    },
    select: TASK_SELECT,
  })

  await recalculateProjectProgress(projectId)
  await logActivity({ action: 'TASK_CREATED', entity: 'Task', entityId: task.id, actorId: req.user.id })

  res.status(201).json({ success: true, task })
}

async function getTask(req, res) {
  const { id } = req.params

  const task = await prisma.task.findUnique({ where: { id }, select: TASK_SELECT })
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' })
  }

  if (req.user.role === 'FREELANCER') {
    const ownFreelancerId = await getOwnFreelancerId(req.user.id)
    if (task.freelancer?.id !== ownFreelancerId) {
      return res.status(403).json({ success: false, message: 'Forbidden: not your task' })
    }
  }

  res.status(200).json({ success: true, task })
}

async function updateTask(req, res) {
  const { id } = req.params
  const { title, description, freelancerId, priority, dueDate } = req.body

  const task = await prisma.task.findUnique({ where: { id } })
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' })
  }

  if (freelancerId) {
    const isMember = await prisma.projectMember.findUnique({
      where: { projectId_freelancerId: { projectId: task.projectId, freelancerId } },
    })
    if (!isMember) {
      return res.status(400).json({ success: false, message: 'Freelancer must be assigned to the project before being given a task' })
    }
  }

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(freelancerId !== undefined && { freelancerId: freelancerId || null }),
      ...(priority !== undefined && { priority }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
    },
    select: TASK_SELECT,
  })

  await logActivity({ action: 'TASK_UPDATED', entity: 'Task', entityId: id, actorId: req.user.id })

  res.status(200).json({ success: true, task: updated })
}

async function updateTaskStatus(req, res) {
  const { id } = req.params
  const { status } = req.body

  const validStatuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED']
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' })
  }

  const task = await prisma.task.findUnique({ where: { id } })
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' })
  }

  if (req.user.role === 'FREELANCER') {
    const ownFreelancerId = await getOwnFreelancerId(req.user.id)
    if (task.freelancerId !== ownFreelancerId) {
      return res.status(403).json({ success: false, message: 'Forbidden: not your task' })
    }
  }

  const updated = await prisma.task.update({
    where: { id },
    data: { status },
    select: TASK_SELECT,
  })

  await recalculateProjectProgress(task.projectId)
  await logActivity({ action: 'TASK_STATUS_CHANGED', entity: 'Task', entityId: id, actorId: req.user.id })

  res.status(200).json({ success: true, task: updated })
}

async function deleteTask(req, res) {
  const { id } = req.params

  const task = await prisma.task.findUnique({ where: { id } })
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' })
  }

  await prisma.task.delete({ where: { id } })
  await recalculateProjectProgress(task.projectId)
  await logActivity({ action: 'TASK_DELETED', entity: 'Task', entityId: id, actorId: req.user.id })

  res.status(200).json({ success: true, message: 'Task deleted' })
}

module.exports = { listTasks, createTask, getTask, updateTask, updateTaskStatus, deleteTask }
