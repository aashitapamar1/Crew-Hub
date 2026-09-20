const bcrypt = require('bcrypt')
const prisma = require('../config/db')
const generateTempPassword = require('../utils/generatePassword')
const sendEmail = require('../utils/sendEmail')
const logActivity = require('../utils/logActivity')

const FREELANCER_LIST_SELECT = {
  id: true,
  status: true,
  title: true,
  skills: true,
  availability: true,
  hourlyRate: true,
  createdAt: true,
  user: { select: { id: true, name: true, email: true, phone: true } },
  _count: { select: { projectMembers: true, tasks: true } },
}

async function listFreelancers(req, res) {
  const { search, status, skill, availability, page = 1, limit = 20 } = req.query

  const where = {
    ...(status && { status }),
    ...(availability && { availability }),
    ...(skill && { skills: { has: skill } }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { phone: { contains: search, mode: 'insensitive' } } },
      ],
    }),
  }

  const take = Math.min(Number(limit) || 20, 100)
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take

  const [freelancers, total] = await Promise.all([
    prisma.freelancer.findMany({
      where,
      select: FREELANCER_LIST_SELECT,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.freelancer.count({ where }),
  ])

  res.status(200).json({
    success: true,
    freelancers,
    pagination: { total, page: Number(page) || 1, limit: take, totalPages: Math.ceil(total / take) },
  })
}

async function createFreelancer(req, res) {
  const {
    name,
    email,
    phone,
    title,
    skills,
    experience,
    bio,
    portfolioUrl,
    hourlyRate,
    availability,
  } = req.body

  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Name and email are required' })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return res.status(409).json({ success: false, message: 'A user with this email already exists' })
  }

  const tempPassword = generateTempPassword()
  const hashedPassword = await bcrypt.hash(tempPassword, 10)

  const freelancer = await prisma.freelancer.create({
    data: {
      title,
      skills: Array.isArray(skills) ? skills : [],
      experience,
      bio,
      portfolioUrl,
      hourlyRate: hourlyRate !== undefined && hourlyRate !== '' ? Number(hourlyRate) : null,
      availability,
      user: {
        create: {
          name,
          email,
          phone,
          password: hashedPassword,
          role: 'FREELANCER',
        },
      },
    },
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  })

  await sendEmail({
    to: email,
    subject: 'Your Crew Hub account',
    html: `<p>Hi ${name},</p><p>An account has been created for you on Crew Hub.</p><p>Email: ${email}<br/>Temporary password: ${tempPassword}</p><p>Please log in and change your password.</p>`,
  })

  await logActivity({ action: 'FREELANCER_CREATED', entity: 'Freelancer', entityId: freelancer.id, actorId: req.user.id })

  res.status(201).json({ success: true, freelancer, tempPassword })
}

async function getFreelancer(req, res) {
  const { id } = req.params

  const freelancer = await prisma.freelancer.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, profilePicture: true } },
      projectMembers: {
        select: { role: true, project: { select: { id: true, name: true, status: true, deadline: true } } },
      },
      tasks: {
        select: { id: true, title: true, status: true, dueDate: true, priority: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!freelancer) {
    return res.status(404).json({ success: false, message: 'Freelancer not found' })
  }

  const totalTasks = freelancer.tasks.length
  const completedTasks = freelancer.tasks.filter((t) => t.status === 'COMPLETED').length
  const pendingTasks = freelancer.tasks.filter((t) => t.status !== 'COMPLETED').length
  const overdueTasks = freelancer.tasks.filter(
    (t) => t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) < new Date(),
  ).length

  res.status(200).json({
    success: true,
    freelancer: {
      ...freelancer,
      totalProjects: freelancer.projectMembers.length,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
    },
  })
}

async function updateFreelancer(req, res) {
  const { id } = req.params
  const {
    name,
    phone,
    profilePicture,
    title,
    skills,
    experience,
    bio,
    portfolioUrl,
    hourlyRate,
    availability,
    status,
  } = req.body

  const freelancer = await prisma.freelancer.findUnique({ where: { id } })
  if (!freelancer) {
    return res.status(404).json({ success: false, message: 'Freelancer not found' })
  }

  const updated = await prisma.freelancer.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(skills !== undefined && { skills: Array.isArray(skills) ? skills : [] }),
      ...(experience !== undefined && { experience }),
      ...(bio !== undefined && { bio }),
      ...(portfolioUrl !== undefined && { portfolioUrl }),
      ...(hourlyRate !== undefined && { hourlyRate: hourlyRate === '' ? null : Number(hourlyRate) }),
      ...(availability !== undefined && { availability }),
      ...(status !== undefined && { status }),
      user: {
        update: {
          ...(name !== undefined && { name }),
          ...(phone !== undefined && { phone }),
          ...(profilePicture !== undefined && { profilePicture }),
        },
      },
    },
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  })

  await logActivity({ action: 'FREELANCER_UPDATED', entity: 'Freelancer', entityId: id, actorId: req.user.id })

  res.status(200).json({ success: true, freelancer: updated })
}

async function archiveFreelancer(req, res) {
  const { id } = req.params

  const freelancer = await prisma.freelancer.findUnique({ where: { id } })
  if (!freelancer) {
    return res.status(404).json({ success: false, message: 'Freelancer not found' })
  }

  const updated = await prisma.freelancer.update({
    where: { id },
    data: {
      status: 'ARCHIVED',
      user: { update: { isActive: false } },
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  await logActivity({ action: 'FREELANCER_ARCHIVED', entity: 'Freelancer', entityId: id, actorId: req.user.id })

  res.status(200).json({ success: true, freelancer: updated })
}

module.exports = { listFreelancers, createFreelancer, getFreelancer, updateFreelancer, archiveFreelancer }
