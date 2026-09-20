const express = require('express')
const { recommendFreelancers, getProjectDelayRisk, getWorkloadAnalysis } = require('../controllers/aiController')
const { protect, authorize } = require('../middlewares/authMiddleware')

const router = express.Router()

router.use(protect, authorize('ADMIN'))

router.post('/projects/:id/recommend-freelancers', recommendFreelancers)
router.get('/projects/:id/delay-risk', getProjectDelayRisk)
router.get('/workload', getWorkloadAnalysis)

module.exports = router
