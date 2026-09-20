const request = require('supertest')
const app = require('../src/app')
const { prisma, resetDb } = require('./helpers/db')
const { createAdmin, createClient, createFreelancer, createProject, login } = require('./helpers/factory')

beforeEach(resetDb)
afterAll(() => prisma.$disconnect())

describe('project and task workflow integrity', () => {
  test('cannot assign a task to a freelancer who is not on the project', async () => {
    const adminToken = await createAdmin()
    const client = await createClient(adminToken)
    const project = await createProject(adminToken, client.client.id)
    const freelancer = await createFreelancer(adminToken)

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Unassigned attempt', projectId: project.project.id, freelancerId: freelancer.freelancer.id })

    expect(res.status).toBe(400)
  })

  test('rejects adding the same freelancer to a project twice', async () => {
    const adminToken = await createAdmin()
    const client = await createClient(adminToken)
    const project = await createProject(adminToken, client.client.id)
    const freelancer = await createFreelancer(adminToken)

    await request(app)
      .post(`/api/projects/${project.project.id}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ freelancerId: freelancer.freelancer.id })

    const res = await request(app)
      .post(`/api/projects/${project.project.id}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ freelancerId: freelancer.freelancer.id })

    expect(res.status).toBe(409)
  })

  test('a freelancer cannot change the status of a task assigned to someone else', async () => {
    const adminToken = await createAdmin()
    const client = await createClient(adminToken)
    const project = await createProject(adminToken, client.client.id)
    const owner = await createFreelancer(adminToken, { email: 'owner@test.com' })
    const other = await createFreelancer(adminToken, { email: 'other@test.com' })

    await request(app)
      .post(`/api/projects/${project.project.id}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ freelancerId: owner.freelancer.id })

    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Owned task', projectId: project.project.id, freelancerId: owner.freelancer.id })

    const otherToken = await login('other@test.com', other.tempPassword)

    const res = await request(app)
      .patch(`/api/tasks/${taskRes.body.task.id}/status`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ status: 'COMPLETED' })

    expect(res.status).toBe(403)
  })

  test('project progress is derived from task completion, not set directly', async () => {
    const adminToken = await createAdmin()
    const client = await createClient(adminToken)
    const project = await createProject(adminToken, client.client.id)
    const freelancer = await createFreelancer(adminToken, { email: 'dev@test.com' })

    await request(app)
      .post(`/api/projects/${project.project.id}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ freelancerId: freelancer.freelancer.id })

    const task1 = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Task 1', projectId: project.project.id, freelancerId: freelancer.freelancer.id })
    const task2 = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Task 2', projectId: project.project.id, freelancerId: freelancer.freelancer.id })

    const freelancerToken = await login('dev@test.com', freelancer.tempPassword)

    await request(app)
      .patch(`/api/tasks/${task1.body.task.id}/status`)
      .set('Authorization', `Bearer ${freelancerToken}`)
      .send({ status: 'COMPLETED' })

    let projectRes = await request(app)
      .get(`/api/projects/${project.project.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(projectRes.body.project.progress).toBe(50)

    await request(app)
      .patch(`/api/tasks/${task2.body.task.id}/status`)
      .set('Authorization', `Bearer ${freelancerToken}`)
      .send({ status: 'COMPLETED' })

    projectRes = await request(app)
      .get(`/api/projects/${project.project.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(projectRes.body.project.progress).toBe(100)
  })

  test('a client only sees their own projects, never another client\'s', async () => {
    const adminToken = await createAdmin()
    const clientA = await createClient(adminToken, { email: 'clientA@test.com' })
    const clientB = await createClient(adminToken, { email: 'clientB@test.com' })
    await createProject(adminToken, clientA.client.id, { name: 'Project A' })
    await createProject(adminToken, clientB.client.id, { name: 'Project B' })

    const clientAToken = await login('clientA@test.com', clientA.tempPassword)

    const res = await request(app).get('/api/projects').set('Authorization', `Bearer ${clientAToken}`)

    expect(res.body.projects).toHaveLength(1)
    expect(res.body.projects[0].name).toBe('Project A')
  })
})
