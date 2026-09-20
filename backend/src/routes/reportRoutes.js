const express = require('express')
const {
  getProjectReport,
  getTaskReport,
  getFreelancerReport,
  getClientReport,
} = require('../controllers/reportController')
const { protect, authorize } = require('../middlewares/authMiddleware')

const router = express.Router()

router.use(protect, authorize('ADMIN'))

router.get('/projects', getProjectReport)
router.get('/tasks', getTaskReport)
router.get('/freelancers', getFreelancerReport)
router.get('/clients', getClientReport)

module.exports = router
