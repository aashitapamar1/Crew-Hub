const request = require('supertest')
const app = require('../src/app')
const { prisma, resetDb } = require('./helpers/db')
const { createAdmin, createFreelancer, createClient, login } = require('./helpers/factory')

beforeEach(resetDb)
afterAll(() => prisma.$disconnect())

describe('role-based access control', () => {
  test('a freelancer cannot access admin-only client management routes', async () => {
    const adminToken = await createAdmin()
    const freelancer = await createFreelancer(adminToken, { email: 'dev@test.com' })
    const freelancerToken = await login('dev@test.com', freelancer.tempPassword)

    const res = await request(app).get('/api/clients').set('Authorization', `Bearer ${freelancerToken}`)

    expect(res.status).toBe(403)
  })

  test('a freelancer can still reach shared auth routes', async () => {
    const adminToken = await createAdmin()
    const freelancer = await createFreelancer(adminToken, { email: 'dev@test.com' })
    const freelancerToken = await login('dev@test.com', freelancer.tempPassword)

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${freelancerToken}`)

    expect(res.status).toBe(200)
    expect(res.body.user.role).toBe('FREELANCER')
  })

  test('a client cannot access admin-only freelancer management routes', async () => {
    const adminToken = await createAdmin()
    const client = await createClient(adminToken, { email: 'client@test.com' })
    const clientToken = await login('client@test.com', client.tempPassword)

    const res = await request(app).get('/api/freelancers').set('Authorization', `Bearer ${clientToken}`)

    expect(res.status).toBe(403)
  })

  test('requests without a token are rejected before role is even checked', async () => {
    const res = await request(app).get('/api/projects')
    expect(res.status).toBe(401)
  })
})
