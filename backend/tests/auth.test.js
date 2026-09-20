const request = require('supertest')
const app = require('../src/app')
const { prisma, resetDb } = require('./helpers/db')
const { createAdmin } = require('./helpers/factory')

beforeEach(resetDb)
afterAll(() => prisma.$disconnect())

describe('auth', () => {
  test('rejects login with wrong password', async () => {
    await createAdmin('admin@test.com', 'Correct@123')

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Wrong@123' })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  test('logs in with correct credentials and returns a token', async () => {
    await createAdmin('admin@test.com', 'Correct@123')

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Correct@123' })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe('admin@test.com')
    expect(res.body.user.password).toBeUndefined()
  })

  test('rejects /me without a token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  test('returns the current user for a valid token', async () => {
    const token = await createAdmin('admin@test.com', 'Correct@123')

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('admin@test.com')
    expect(res.body.user.role).toBe('ADMIN')
  })

  test('rejects a login for a deactivated (archived) account', async () => {
    const adminToken = await createAdmin('admin@test.com', 'Correct@123')

    const clientRes = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Archived Client', email: 'archived@test.com' })
    const tempPassword = clientRes.body.tempPassword

    await request(app)
      .patch(`/api/clients/${clientRes.body.client.id}/archive`)
      .set('Authorization', `Bearer ${adminToken}`)

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'archived@test.com', password: tempPassword })

    expect(loginRes.status).toBe(401)
  })
})
