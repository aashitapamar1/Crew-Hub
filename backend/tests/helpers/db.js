const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function resetDb() {
  await prisma.activity.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.message.deleteMany()
  await prisma.feedback.deleteMany()
  await prisma.file.deleteMany()
  await prisma.milestone.deleteMany()
  await prisma.projectMember.deleteMany()
  await prisma.task.deleteMany()
  await prisma.project.deleteMany()
  await prisma.freelancer.deleteMany()
  await prisma.client.deleteMany()
  await prisma.passwordResetToken.deleteMany()
  await prisma.user.deleteMany()
}

module.exports = { prisma, resetDb }
