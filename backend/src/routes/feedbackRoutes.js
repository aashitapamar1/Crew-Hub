const express = require('express')
const { listFeedback, createFeedback } = require('../controllers/feedbackController')
const { protect, authorize } = require('../middlewares/authMiddleware')

const router = express.Router()

router.use(protect, authorize('ADMIN', 'CLIENT'))

router.get('/', listFeedback)
router.post('/', authorize('CLIENT'), createFeedback)

module.exports = router
