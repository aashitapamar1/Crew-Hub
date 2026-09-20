const prisma = require('../config/db')

async function notifyUser(userId, title, message) {
  if (!userId) return
  await prisma.notification.create({ data: { userId, title, message } })
}

async function notifyUsers(userIds, title, message) {
  const unique = [...new Set(userIds.filter(Boolean))]
  if (unique.length === 0) return
  await prisma.notification.createMany({ data: unique.map((userId) => ({ userId, title, message })) })
}

async function notifyAdmins(title, message, excludeUserId) {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', ...(excludeUserId && { id: { not: excludeUserId } }) },
    select: { id: true },
  })
  await notifyUsers(admins.map((a) => a.id), title, message)
}

module.exports = { notifyUser, notifyUsers, notifyAdmins }
