require('dotenv').config()
const bcrypt = require('bcrypt')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@crewhub.com'
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345'

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`Admin account already exists: ${email}`)
    return
  }

  const hashed = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      email,
      password: hashed,
      role: 'ADMIN',
      name: 'Agency Admin',
    },
  })

  console.log(`Admin account created: ${email} / ${password}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
