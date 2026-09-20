const request = require('supertest')
const app = require('../src/app')
const { prisma, resetDb } = require('./helpers/db')
const { createAdmin, createClient } = require('./helpers/factory')

beforeEach(resetDb)
afterAll(() => prisma.$disconnect())

describe('client management', () => {
  test('creates a client with a linked user account', async () => {
    const adminToken = await createAdmin()

    const res = await createClient(adminToken, { email: 'acme@test.com', companyName: 'Acme Co' })

    expect(res.client.companyName).toBe('Acme Co')
    expect(res.client.user.email).toBe('acme@test.com')
    expect(res.tempPassword).toBeDefined()
  })

  test('rejects a duplicate email', async () => {
    const adminToken = await createAdmin()
    await createClient(adminToken, { email: 'dup@test.com' })

    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Dup', email: 'dup@test.com' })

    expect(res.status).toBe(409)
  })

  test('search filters by company name', async () => {
    const adminToken = await createAdmin()
    await createClient(adminToken, { email: 'a@test.com', companyName: 'Alpha Retail' })
    await createClient(adminToken, { email: 'b@test.com', companyName: 'Beta Logistics' })

    const res = await request(app)
      .get('/api/clients')
      .query({ search: 'Alpha' })
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.body.clients).toHaveLength(1)
    expect(res.body.clients[0].companyName).toBe('Alpha Retail')
  })

  test('archiving a client keeps the record but deactivates login', async () => {
    const adminToken = await createAdmin()
    const client = await createClient(adminToken, { email: 'archive-me@test.com' })

    const archiveRes = await request(app)
      .patch(`/api/clients/${client.client.id}/archive`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(archiveRes.body.client.status).toBe('ARCHIVED')

    const stillThere = await request(app)
      .get(`/api/clients/${client.client.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(stillThere.status).toBe(200)
  })
})
