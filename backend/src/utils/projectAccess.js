const prisma = require('../config/db')

async function getOwnClientId(userId) {
  const client = await prisma.client.findUnique({ where: { userId }, select: { id: true } })
  return client?.id || null
}

async function getOwnFreelancerId(userId) {
  const freelancer = await prisma.freelancer.findUnique({ where: { userId }, select: { id: true } })
  return freelancer?.id || null
}

async function hasProjectAccess(user, project) {
  if (user.role === 'ADMIN') return true

  if (user.role === 'CLIENT') {
    const ownClientId = await getOwnClientId(user.id)
    return ownClientId === project.clientId
  }

  const ownFreelancerId = await getOwnFreelancerId(user.id)
  if (!ownFreelancerId) return false
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_freelancerId: { projectId: project.id, freelancerId: ownFreelancerId } },
  })
  return Boolean(membership)
}

module.exports = { getOwnClientId, getOwnFreelancerId, hasProjectAccess }
