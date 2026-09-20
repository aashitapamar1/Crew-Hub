const bcrypt = require('bcrypt')
const request = require('supertest')
const app = require('../../src/app')
const { prisma } = require('./db')

async function createAdmin(email = 'admin@test.com', password = 'Admin@12345') {
  const hashed = await bcrypt.hash(password, 10)
  await prisma.user.create({ data: { email, password: hashed, role: 'ADMIN', name: 'Test Admin' } })
  return login(email, password)
}

async function login(email, password) {
  const res = await request(app).post('/api/auth/login').send({ email, password })
  return res.body.token
}

async function createClient(adminToken, overrides = {}) {
  const res = await request(app)
    .post('/api/clients')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Test Client', email: `client-${Date.now()}-${Math.random()}@test.com`, ...overrides })
  return res.body
}

async function createFreelancer(adminToken, overrides = {}) {
  const res = await request(app)
    .post('/api/freelancers')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Test Freelancer', email: `freelancer-${Date.now()}-${Math.random()}@test.com`, ...overrides })
  return res.body
}

async function createProject(adminToken, clientId, overrides = {}) {
  const res = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Test Project', clientId, ...overrides })
  return res.body
}

module.exports = { createAdmin, login, createClient, createFreelancer, createProject }
