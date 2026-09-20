const express = require('express')
const {
  listProjects,
  createProject,
  getProject,
  updateProject,
  updateProjectStatus,
  addMember,
  removeMember,
} = require('../controllers/projectController')
const { createMilestone, toggleMilestone, deleteMilestone } = require('../controllers/milestoneController')
const { protect, authorize } = require('../middlewares/authMiddleware')

const router = express.Router()

router.use(protect, authorize('ADMIN'))

router.get('/', listProjects)
router.post('/', createProject)
router.get('/:id', getProject)
router.put('/:id', updateProject)
router.patch('/:id/status', updateProjectStatus)

router.post('/:id/members', addMember)
router.delete('/:id/members/:memberId', removeMember)

router.post('/:id/milestones', createMilestone)
router.patch('/milestones/:milestoneId/toggle', toggleMilestone)
router.delete('/milestones/:milestoneId', deleteMilestone)

module.exports = router
