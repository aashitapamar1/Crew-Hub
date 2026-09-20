const bcrypt = require('bcrypt')
const prisma = require('../config/db')
const generateTempPassword = require('../utils/generatePassword')
const sendEmail = require('../utils/sendEmail')
const logActivity = require('../utils/logActivity')

const CLIENT_LIST_SELECT = {
  id: true,
  status: true,
  companyName: true,
  industry: true,
  country: true,
  createdAt: true,
  user: { select: { id: true, name: true, email: true, phone: true } },
  _count: { select: { projects: true } },
}

async function listClients(req, res) {
  const { search, status, industry, country, page = 1, limit = 20 } = req.query

  const where = {
    ...(status && { status }),
    ...(industry && { industry }),
    ...(country && { country }),
    ...(search && {
      OR: [
        { companyName: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { phone: { contains: search, mode: 'insensitive' } } },
      ],
    }),
  }

  const take = Math.min(Number(limit) || 20, 100)
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      select: CLIENT_LIST_SELECT,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.client.count({ where }),
  ])

  res.status(200).json({
    success: true,
    clients,
    pagination: { total, page: Number(page) || 1, limit: take, totalPages: Math.ceil(total / take) },
  })
}

async function createClient(req, res) {
  const {
    name,
    email,
    phone,
    companyName,
    industry,
    website,
    companyDescription,
    street,
    city,
    state,
    country,
    postalCode,
    internalNotes,
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

  const client = await prisma.client.create({
    data: {
      companyName,
      industry,
      website,
      companyDescription,
      street,
      city,
      state,
      country,
      postalCode,
      internalNotes,
      user: {
        create: {
          name,
          email,
          phone,
          password: hashedPassword,
          role: 'CLIENT',
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

  await logActivity({ action: 'CLIENT_CREATED', entity: 'Client', entityId: client.id, actorId: req.user.id })

  res.status(201).json({ success: true, client, tempPassword })
}

async function getClient(req, res) {
  const { id } = req.params

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, profilePicture: true } },
      projects: {
        select: { id: true, name: true, status: true, deadline: true, progress: true },
        orderBy: { createdAt: 'desc' },
      },
      files: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!client) {
    return res.status(404).json({ success: false, message: 'Client not found' })
  }

  const activeProjects = client.projects.filter((p) => p.status === 'IN_PROGRESS').length
  const completedProjects = client.projects.filter((p) => p.status === 'COMPLETED').length
  const upcomingDeadlines = client.projects
    .filter((p) => p.deadline && p.status !== 'COMPLETED' && p.status !== 'CANCELLED')
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5)

  res.status(200).json({
    success: true,
    client: {
      ...client,
      totalProjects: client.projects.length,
      activeProjects,
      completedProjects,
      upcomingDeadlines,
    },
  })
}

async function updateClient(req, res) {
  const { id } = req.params
  const {
    name,
    phone,
    profilePicture,
    companyName,
    industry,
    website,
    companyDescription,
    street,
    city,
    state,
    country,
    postalCode,
    internalNotes,
    status,
  } = req.body

  const client = await prisma.client.findUnique({ where: { id } })
  if (!client) {
    return res.status(404).json({ success: false, message: 'Client not found' })
  }

  const updated = await prisma.client.update({
    where: { id },
    data: {
      ...(companyName !== undefined && { companyName }),
      ...(industry !== undefined && { industry }),
      ...(website !== undefined && { website }),
      ...(companyDescription !== undefined && { companyDescription }),
      ...(street !== undefined && { street }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
      ...(country !== undefined && { country }),
      ...(postalCode !== undefined && { postalCode }),
      ...(internalNotes !== undefined && { internalNotes }),
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

  await logActivity({ action: 'CLIENT_UPDATED', entity: 'Client', entityId: id, actorId: req.user.id })

  res.status(200).json({ success: true, client: updated })
}

async function archiveClient(req, res) {
  const { id } = req.params

  const client = await prisma.client.findUnique({ where: { id } })
  if (!client) {
    return res.status(404).json({ success: false, message: 'Client not found' })
  }

  const updated = await prisma.client.update({
    where: { id },
    data: {
      status: 'ARCHIVED',
      user: { update: { isActive: false } },
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  await logActivity({ action: 'CLIENT_ARCHIVED', entity: 'Client', entityId: id, actorId: req.user.id })

  res.status(200).json({ success: true, client: updated })
}

module.exports = { listClients, createClient, getClient, updateClient, archiveClient }
