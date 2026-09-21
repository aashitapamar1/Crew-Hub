const request = require('supertest')
const app = require('../src/app')
const { prisma, resetDb } = require('./helpers/db')
const { createAdmin, createClient, createProject, login } = require('./helpers/factory')

beforeEach(resetDb)
afterAll(() => prisma.$disconnect())

describe('client feedback', () => {
  test('a client can submit feedback on their own project', async () => {
    const adminToken = await createAdmin()
    const client = await createClient(adminToken, { email: 'client@test.com' })
    const project = await createProject(adminToken, client.client.id)
    const clientToken = await login('client@test.com', client.tempPassword)

    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ projectId: project.project.id, content: 'Great work', rating: 5 })

    expect(res.status).toBe(201)
    expect(res.body.feedback.rating).toBe(5)
  })

  test('a client cannot submit feedback on a project that is not theirs', async () => {
    const adminToken = await createAdmin()
    const owner = await createClient(adminToken, { email: 'owner@test.com' })
    const outsider = await createClient(adminToken, { email: 'outsider@test.com' })
    const project = await createProject(adminToken, owner.client.id)
    const outsiderToken = await login('outsider@test.com', outsider.tempPassword)

    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({ projectId: project.project.id, content: 'sneaky' })

    expect(res.status).toBe(403)
  })

  test('rejects a rating outside 1-5', async () => {
    const adminToken = await createAdmin()
    const client = await createClient(adminToken, { email: 'client@test.com' })
    const project = await createProject(adminToken, client.client.id)
    const clientToken = await login('client@test.com', client.tempPassword)

    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ projectId: project.project.id, content: 'bad rating', rating: 9 })

    expect(res.status).toBe(400)
  })

  test('an admin can view feedback for a project but cannot submit it', async () => {
    const adminToken = await createAdmin()
    const client = await createClient(adminToken, { email: 'client@test.com' })
    const project = await createProject(adminToken, client.client.id)
    const clientToken = await login('client@test.com', client.tempPassword)

    await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ projectId: project.project.id, content: 'Good progress' })

    const viewRes = await request(app)
      .get('/api/feedback')
      .query({ projectId: project.project.id })
      .set('Authorization', `Bearer ${adminToken}`)
    expect(viewRes.body.feedback).toHaveLength(1)

    const submitRes = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ projectId: project.project.id, content: 'admin trying' })
    expect(submitRes.status).toBe(403)
  })

  test("a client's aggregate feedback view never includes another client's feedback", async () => {
    const adminToken = await createAdmin()
    const clientA = await createClient(adminToken, { email: 'clientA@test.com' })
    const clientB = await createClient(adminToken, { email: 'clientB@test.com' })
    const projectA = await createProject(adminToken, clientA.client.id)
    const projectB = await createProject(adminToken, clientB.client.id)

    const clientAToken = await login('clientA@test.com', clientA.tempPassword)
    const clientBToken = await login('clientB@test.com', clientB.tempPassword)

    await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${clientAToken}`)
      .send({ projectId: projectA.project.id, content: 'From client A' })
    await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${clientBToken}`)
      .send({ projectId: projectB.project.id, content: 'From client B' })

    const res = await request(app).get('/api/feedback').set('Authorization', `Bearer ${clientAToken}`)

    expect(res.body.feedback).toHaveLength(1)
    expect(res.body.feedback[0].content).toBe('From client A')
  })
})
