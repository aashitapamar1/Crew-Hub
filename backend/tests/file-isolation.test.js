const request = require('supertest')
const app = require('../src/app')
const { prisma, resetDb } = require('./helpers/db')
const { createAdmin, createClient, createFreelancer, createProject, login } = require('./helpers/factory')

beforeEach(resetDb)
afterAll(() => prisma.$disconnect())

describe('file access isolation', () => {
  test('a client never sees a file belonging to another client', async () => {
    const adminToken = await createAdmin()
    const clientA = await createClient(adminToken, { email: 'clientA@test.com' })
    const clientB = await createClient(adminToken, { email: 'clientB@test.com' })

    await request(app)
      .post('/api/files')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('clientId', clientA.client.id)
      .attach('file', Buffer.from('confidential'), 'doc.txt')

    const clientBToken = await login('clientB@test.com', clientB.tempPassword)

    const res = await request(app).get('/api/files').set('Authorization', `Bearer ${clientBToken}`)

    expect(res.body.files).toHaveLength(0)
  })

  test('a freelancer not on a project cannot upload to it', async () => {
    const adminToken = await createAdmin()
    const client = await createClient(adminToken)
    const project = await createProject(adminToken, client.client.id)
    const outsider = await createFreelancer(adminToken, { email: 'outsider@test.com' })

    const outsiderToken = await login('outsider@test.com', outsider.tempPassword)

    const res = await request(app)
      .post('/api/files')
      .set('Authorization', `Bearer ${outsiderToken}`)
      .field('projectId', project.project.id)
      .attach('file', Buffer.from('data'), 'file.txt')

    expect(res.status).toBe(403)
  })

  test('a client cannot upload files at all', async () => {
    const adminToken = await createAdmin()
    const client = await createClient(adminToken, { email: 'client@test.com' })
    const clientToken = await login('client@test.com', client.tempPassword)

    const res = await request(app)
      .post('/api/files')
      .set('Authorization', `Bearer ${clientToken}`)
      .field('clientId', client.client.id)
      .attach('file', Buffer.from('data'), 'file.txt')

    expect(res.status).toBe(403)
  })
})
