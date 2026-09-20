const express = require('express')
const { getStats, getRecentActivity } = require('../controllers/dashboardController')
const { protect, authorize } = require('../middlewares/authMiddleware')

const router = express.Router()

router.use(protect, authorize('ADMIN'))

router.get('/stats', getStats)
router.get('/recent-activity', getRecentActivity)

module.exports = router
